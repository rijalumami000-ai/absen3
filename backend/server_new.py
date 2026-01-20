from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import Response, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
import logging
import uuid
import qrcode
import io
import base64
import aiohttp
import pandas as pd
from pathlib import Path
import re

# ==================== SETUP ====================
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'absensi_sholat')]

SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-this-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

app = FastAPI(title="Absensi Sholat API")
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class Admin(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    nama: str
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AdminCreate(BaseModel):
    username: str
    nama: str
    password: str

class AdminResponse(BaseModel):
    id: str
    username: str
    nama: str
    created_at: datetime

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: AdminResponse

# Asrama Models
class Asrama(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nama: str
    gender: Literal["putra", "putri"]
    kapasitas: int
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AsramaCreate(BaseModel):
    nama: str
    gender: Literal["putra", "putri"]
    kapasitas: int

class AsramaUpdate(BaseModel):
    nama: Optional[str] = None
    gender: Optional[Literal["putra", "putri"]] = None
    kapasitas: Optional[int] = None

# REVISED: Santri Models - dengan data wali inline
class Santri(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nama: str
    nis: str
    gender: Literal["putra", "putri"]
    asrama_id: str
    # Data wali inline
    nama_wali: str
    nomor_hp_wali: str
    email_wali: Optional[str] = None
    qr_code: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SantriCreate(BaseModel):
    nama: str
    nis: str
    gender: Literal["putra", "putri"]
    asrama_id: str
    nama_wali: str
    nomor_hp_wali: str
    email_wali: Optional[str] = None

class SantriUpdate(BaseModel):
    nama: Optional[str] = None
    nis: Optional[str] = None
    gender: Optional[Literal["putra", "putri"]] = None
    asrama_id: Optional[str] = None
    nama_wali: Optional[str] = None
    nomor_hp_wali: Optional[str] = None
    email_wali: Optional[str] = None

class SantriResponse(BaseModel):
    id: str
    nama: str
    nis: str
    gender: str
    asrama_id: str
    nama_wali: str
    nomor_hp_wali: str
    email_wali: Optional[str]
    created_at: datetime
    updated_at: datetime

# Wali Santri Models - AUTO GENERATED
class WaliSantri(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    nama: str
    username: str
    password_hash: str
    nomor_hp: str
    email: Optional[str] = None
    jumlah_anak: int = 0
    nama_anak: List[str] = []
    created_at: datetime
    updated_at: datetime

class WaliSantriUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None

class WaliSantriResponse(BaseModel):
    id: str
    nama: str
    username: str
    nomor_hp: str
    email: Optional[str]
    jumlah_anak: int
    nama_anak: List[str]
    created_at: datetime
    updated_at: datetime

# REVISED: Pengabsen Models - multi asrama
class Pengabsen(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nama: str
    email_atau_hp: str  # Changed from nip
    username: str
    password_hash: str
    asrama_ids: List[str] = []  # Changed to array
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PengabsenCreate(BaseModel):
    nama: str
    email_atau_hp: str
    username: str
    password: str
    asrama_ids: List[str]

class PengabsenUpdate(BaseModel):
    nama: Optional[str] = None
    email_atau_hp: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    asrama_ids: Optional[List[str]] = None

class PengabsenResponse(BaseModel):
    id: str
    nama: str
    email_atau_hp: str
    username: str
    asrama_ids: List[str]
    created_at: datetime

# REVISED: Pembimbing Models - tambah kontak
class Pembimbing(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nama: str
    username: str
    password_hash: str
    email_atau_hp: str  # NEW
    asrama_ids: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PembimbingCreate(BaseModel):
    nama: str
    username: str
    password: str
    email_atau_hp: str
    asrama_ids: List[str] = []

class PembimbingUpdate(BaseModel):
    nama: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    email_atau_hp: Optional[str] = None
    asrama_ids: Optional[List[str]] = None

class PembimbingResponse(BaseModel):
    id: str
    nama: str
    username: str
    email_atau_hp: str
    asrama_ids: List[str]
    created_at: datetime

# Absensi Models
class Absensi(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    santri_id: str
    waktu_sholat: Literal["subuh", "dzuhur", "ashar", "maghrib", "isya"]
    status: Literal["hadir", "alfa", "sakit", "izin", "haid", "istihadhoh"]
    tanggal: str
    waktu_absen: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    pengabsen_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AbsensiResponse(BaseModel):
    id: str
    santri_id: str
    waktu_sholat: str
    status: str
    tanggal: str
    waktu_absen: datetime
    pengabsen_id: Optional[str]
    created_at: datetime

# Waktu Sholat Models
class WaktuSholat(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tanggal: str
    subuh: str
    dzuhur: str
    ashar: str
    maghrib: str
    isya: str
    lokasi: str = "Lampung Selatan"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WaktuSholatResponse(BaseModel):
    id: str
    tanggal: str
    subuh: str
    dzuhur: str
    ashar: str
    maghrib: str
    isya: str
    lokasi: str

# ==================== UTILITY FUNCTIONS ====================

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        admin_id: str = payload.get("sub")
        if admin_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        admin = await db.admins.find_one({"id": admin_id}, {"_id": 0})
        if admin is None:
            raise HTTPException(status_code=401, detail="Admin not found")
        
        return admin
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def generate_qr_code(data: dict) -> str:
    import json
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(json.dumps(data))
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return img_str

def generate_username(nama: str, nomor_hp: str) -> str:
    """Generate username dari nama dan nomor HP"""
    # Ambil nama depan dan bersihkan
    nama_clean = re.sub(r'[^a-zA-Z]', '', nama.split()[0].lower())
    # Ambil 4 digit terakhir HP
    hp_suffix = nomor_hp[-4:] if len(nomor_hp) >= 4 else nomor_hp
    return f"{nama_clean}{hp_suffix}"

async def sync_wali_santri():
    """Sinkronisasi data wali dari santri"""
    # Aggregate santri by wali
    pipeline = [
        {
            "$group": {
                "_id": {
                    "nama_wali": "$nama_wali",
                    "nomor_hp_wali": "$nomor_hp_wali"
                },
                "email_wali": {"$first": "$email_wali"},
                "nama_anak": {"$push": "$nama"},
                "jumlah_anak": {"$sum": 1},
                "first_created": {"$min": "$created_at"}
            }
        }
    ]
    
    wali_groups = await db.santri.aggregate(pipeline).to_list(1000)
    
    for group in wali_groups:
        nama_wali = group["_id"]["nama_wali"]
        nomor_hp = group["_id"]["nomor_hp_wali"]
        email = group.get("email_wali")
        
        # Check if wali exists
        wali_id = f"wali_{nomor_hp}"
        existing_wali = await db.wali_santri.find_one({"id": wali_id}, {"_id": 0})
        
        if existing_wali:
            # Update existing
            await db.wali_santri.update_one(
                {"id": wali_id},
                {
                    "$set": {
                        "nama": nama_wali,
                        "nomor_hp": nomor_hp,
                        "email": email,
                        "jumlah_anak": group["jumlah_anak"],
                        "nama_anak": group["nama_anak"],
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }
                }
            )
        else:
            # Create new
            username = generate_username(nama_wali, nomor_hp)
            # Check username uniqueness
            counter = 1
            original_username = username
            while await db.wali_santri.find_one({"username": username}):
                username = f"{original_username}{counter}"
                counter += 1
            
            wali_doc = {
                "id": wali_id,
                "nama": nama_wali,
                "username": username,
                "password_hash": hash_password("password123"),  # default password
                "nomor_hp": nomor_hp,
                "email": email,
                "jumlah_anak": group["jumlah_anak"],
                "nama_anak": group["nama_anak"],
                "created_at": group["first_created"],
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await db.wali_santri.insert_one(wali_doc)

async def fetch_prayer_times(date: str) -> Optional[dict]:
    try:
        url = "http://api.aladhan.com/v1/timingsByAddress"
        params = {
            "address": "Desa Cintamulya, Candipuro, Lampung Selatan, Lampung, Indonesia",
            "method": 2,
            "date": date
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.get(url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    timings = data['data']['timings']
                    return {
                        'subuh': timings['Fajr'],
                        'dzuhur': timings['Dhuhr'],
                        'ashar': timings['Asr'],
                        'maghrib': timings['Maghrib'],
                        'isya': timings['Isha']
                    }
        return None
    except Exception as e:
        logging.error(f"Error fetching prayer times: {e}")
        return None
# ==================== AUTHENTICATION ENDPOINTS ====================

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    admin = await db.admins.find_one({"username": request.username}, {"_id": 0})
    
    if not admin or not verify_password(request.password, admin['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah"
        )
    
    access_token = create_access_token(data={"sub": admin['id']})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": AdminResponse(**admin)
    }

@api_router.get("/auth/me", response_model=AdminResponse)
async def get_me(current_admin: dict = Depends(get_current_admin)):
    return AdminResponse(**current_admin)

@api_router.post("/auth/logout")
async def logout(current_admin: dict = Depends(get_current_admin)):
    return {"message": "Logout berhasil"}

# ==================== ASRAMA ENDPOINTS ====================

@api_router.get("/asrama", response_model=List[Asrama])
async def get_asrama(gender: Optional[str] = None, _: dict = Depends(get_current_admin)):
    query = {}
    if gender:
        query['gender'] = gender
    
    asrama_list = await db.asrama.find(query, {"_id": 0}).to_list(1000)
    return asrama_list

@api_router.post("/asrama", response_model=Asrama)
async def create_asrama(data: AsramaCreate, _: dict = Depends(get_current_admin)):
    asrama_obj = Asrama(**data.model_dump())
    doc = asrama_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.asrama.insert_one(doc)
    return asrama_obj

@api_router.put("/asrama/{asrama_id}", response_model=Asrama)
async def update_asrama(asrama_id: str, data: AsramaUpdate, _: dict = Depends(get_current_admin)):
    asrama = await db.asrama.find_one({"id": asrama_id}, {"_id": 0})
    if not asrama:
        raise HTTPException(status_code=404, detail="Asrama tidak ditemukan")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.asrama.update_one({"id": asrama_id}, {"$set": update_data})
        asrama.update(update_data)
    
    if isinstance(asrama['created_at'], str):
        asrama['created_at'] = datetime.fromisoformat(asrama['created_at'])
    
    return Asrama(**asrama)

@api_router.delete("/asrama/{asrama_id}")
async def delete_asrama(asrama_id: str, _: dict = Depends(get_current_admin)):
    result = await db.asrama.delete_one({"id": asrama_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Asrama tidak ditemukan")
    return {"message": "Asrama berhasil dihapus"}

# ==================== SANTRI ENDPOINTS (REVISED) ====================

@api_router.get("/santri", response_model=List[SantriResponse])
async def get_santri(
    gender: Optional[str] = None,
    asrama_id: Optional[str] = None,
    _: dict = Depends(get_current_admin)
):
    query = {}
    if gender:
        query['gender'] = gender
    if asrama_id:
        query['asrama_id'] = asrama_id
    
    santri_list = await db.santri.find(query, {"_id": 0, "qr_code": 0}).to_list(1000)
    
    for santri in santri_list:
        if isinstance(santri['created_at'], str):
            santri['created_at'] = datetime.fromisoformat(santri['created_at'])
        if isinstance(santri['updated_at'], str):
            santri['updated_at'] = datetime.fromisoformat(santri['updated_at'])
    
    return santri_list

@api_router.post("/santri", response_model=SantriResponse)
async def create_santri(data: SantriCreate, _: dict = Depends(get_current_admin)):
    # Check if NIS already exists
    existing = await db.santri.find_one({"nis": data.nis})
    if existing:
        raise HTTPException(status_code=400, detail="NIS sudah digunakan")
    
    # Verify asrama exists
    asrama = await db.asrama.find_one({"id": data.asrama_id})
    if not asrama:
        raise HTTPException(status_code=404, detail="Asrama tidak ditemukan")
    
    santri_id = str(uuid.uuid4())
    
    # Generate QR code
    qr_data = {
        "santri_id": santri_id,
        "nama": data.nama,
        "nis": data.nis
    }
    qr_code = generate_qr_code(qr_data)
    
    santri_dict = data.model_dump()
    santri_dict['id'] = santri_id
    santri_dict['qr_code'] = qr_code
    santri_dict['created_at'] = datetime.now(timezone.utc)
    santri_dict['updated_at'] = datetime.now(timezone.utc)
    
    santri_obj = Santri(**santri_dict)
    doc = santri_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.santri.insert_one(doc)
    
    # Sync wali santri
    await sync_wali_santri()
    
    return SantriResponse(**{k: v for k, v in santri_obj.model_dump().items() if k != 'qr_code'})

@api_router.get("/santri/{santri_id}/qr-code")
async def get_santri_qr_code(santri_id: str, _: dict = Depends(get_current_admin)):
    santri = await db.santri.find_one({"id": santri_id}, {"_id": 0})
    if not santri:
        raise HTTPException(status_code=404, detail="Santri tidak ditemukan")
    
    img_data = base64.b64decode(santri['qr_code'])
    return Response(content=img_data, media_type="image/png")

@api_router.put("/santri/{santri_id}", response_model=SantriResponse)
async def update_santri(santri_id: str, data: SantriUpdate, _: dict = Depends(get_current_admin)):
    santri = await db.santri.find_one({"id": santri_id}, {"_id": 0})
    if not santri:
        raise HTTPException(status_code=404, detail="Santri tidak ditemukan")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    if 'asrama_id' in update_data:
        asrama = await db.asrama.find_one({"id": update_data['asrama_id']})
        if not asrama:
            raise HTTPException(status_code=404, detail="Asrama tidak ditemukan")
    
    if update_data:
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        await db.santri.update_one({"id": santri_id}, {"$set": update_data})
        santri.update(update_data)
    
    # Sync wali if wali data changed
    if any(k in update_data for k in ['nama_wali', 'nomor_hp_wali', 'email_wali']):
        await sync_wali_santri()
    
    if isinstance(santri['created_at'], str):
        santri['created_at'] = datetime.fromisoformat(santri['created_at'])
    if isinstance(santri['updated_at'], str):
        santri['updated_at'] = datetime.fromisoformat(santri['updated_at'])
    
    return SantriResponse(**{k: v for k, v in santri.items() if k != 'qr_code'})

@api_router.delete("/santri/{santri_id}")
async def delete_santri(santri_id: str, _: dict = Depends(get_current_admin)):
    result = await db.santri.delete_one({"id": santri_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Santri tidak ditemukan")
    
    # Sync wali after deletion
    await sync_wali_santri()
    
    return {"message": "Santri berhasil dihapus"}

# EXCEL IMPORT/EXPORT
@api_router.get("/santri/template/download")
async def download_santri_template(_: dict = Depends(get_current_admin)):
    """Download Excel template untuk import santri"""
    # Create template DataFrame
    template_data = {
        'nama': ['Muhammad Zaki', 'Fatimah Azzahra'],
        'nis': ['001', '002'],
        'gender': ['putra', 'putri'],
        'asrama_id': ['<ID_ASRAMA>', '<ID_ASRAMA>'],
        'nama_wali': ['Ahmad Hidayat', 'Ahmad Hidayat'],
        'nomor_hp_wali': ['081234567890', '081234567890'],
        'email_wali': ['ahmad@email.com', 'ahmad@email.com']
    }
    
    df = pd.DataFrame(template_data)
    
    # Create Excel file in memory
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Template Santri')
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename=template_santri.xlsx'}
    )

@api_router.post("/santri/import")
async def import_santri(file: UploadFile = File(...), _: dict = Depends(get_current_admin)):
    """Import santri dari Excel"""
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        required_columns = ['nama', 'nis', 'gender', 'asrama_id', 'nama_wali', 'nomor_hp_wali']
        if not all(col in df.columns for col in required_columns):
            raise HTTPException(status_code=400, detail="Format Excel tidak sesuai template")
        
        success_count = 0
        error_list = []
        
        for idx, row in df.iterrows():
            try:
                # Check if NIS exists
                existing = await db.santri.find_one({"nis": str(row['nis'])})
                if existing:
                    error_list.append(f"Baris {idx+2}: NIS {row['nis']} sudah ada")
                    continue
                
                # Verify asrama
                asrama = await db.asrama.find_one({"id": str(row['asrama_id'])})
                if not asrama:
                    error_list.append(f"Baris {idx+2}: Asrama ID tidak ditemukan")
                    continue
                
                santri_id = str(uuid.uuid4())
                qr_data = {"santri_id": santri_id, "nama": str(row['nama']), "nis": str(row['nis'])}
                qr_code = generate_qr_code(qr_data)
                
                santri_doc = {
                    'id': santri_id,
                    'nama': str(row['nama']),
                    'nis': str(row['nis']),
                    'gender': str(row['gender']),
                    'asrama_id': str(row['asrama_id']),
                    'nama_wali': str(row['nama_wali']),
                    'nomor_hp_wali': str(row['nomor_hp_wali']),
                    'email_wali': str(row.get('email_wali', '')),
                    'qr_code': qr_code,
                    'created_at': datetime.now(timezone.utc).isoformat(),
                    'updated_at': datetime.now(timezone.utc).isoformat()
                }
                
                await db.santri.insert_one(santri_doc)
                success_count += 1
                
            except Exception as e:
                error_list.append(f"Baris {idx+2}: {str(e)}")
        
        # Sync wali after import
        await sync_wali_santri()
        
        return {
            "message": f"Import selesai",
            "success": success_count,
            "errors": error_list
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error processing file: {str(e)}")

@api_router.get("/santri/export")
async def export_santri(_: dict = Depends(get_current_admin)):
    """Export semua santri ke Excel"""
    santri_list = await db.santri.find({}, {"_id": 0, "qr_code": 0}).to_list(10000)
    
    if not santri_list:
        raise HTTPException(status_code=404, detail="Tidak ada data santri")
    
    df = pd.DataFrame(santri_list)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Data Santri')
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename=data_santri.xlsx'}
    )

# ==================== WALI SANTRI ENDPOINTS (AUTO-GENERATED) ====================

@api_router.get("/wali", response_model=List[WaliSantriResponse])
async def get_wali(_: dict = Depends(get_current_admin)):
    """Get all wali santri (auto-generated from santri data)"""
    # Trigger sync first
    await sync_wali_santri()
    
    wali_list = await db.wali_santri.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    for wali in wali_list:
        if isinstance(wali['created_at'], str):
            wali['created_at'] = datetime.fromisoformat(wali['created_at'])
        if isinstance(wali['updated_at'], str):
            wali['updated_at'] = datetime.fromisoformat(wali['updated_at'])
    
    return wali_list

@api_router.put("/wali/{wali_id}", response_model=WaliSantriResponse)
async def update_wali(wali_id: str, data: WaliSantriUpdate, _: dict = Depends(get_current_admin)):
    """Update wali (only username and password)"""
    wali = await db.wali_santri.find_one({"id": wali_id}, {"_id": 0})
    if not wali:
        raise HTTPException(status_code=404, detail="Wali santri tidak ditemukan")
    
    update_data = {}
    if data.username:
        # Check username uniqueness
        existing = await db.wali_santri.find_one({"username": data.username, "id": {"$ne": wali_id}})
        if existing:
            raise HTTPException(status_code=400, detail="Username sudah digunakan")
        update_data['username'] = data.username
    
    if data.password:
        update_data['password_hash'] = hash_password(data.password)
    
    if update_data:
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        await db.wali_santri.update_one({"id": wali_id}, {"$set": update_data})
        wali.update(update_data)
    
    if isinstance(wali['created_at'], str):
        wali['created_at'] = datetime.fromisoformat(wali['created_at'])
    if isinstance(wali['updated_at'], str):
        wali['updated_at'] = datetime.fromisoformat(wali['updated_at'])
    
    return WaliSantriResponse(**{k: v for k, v in wali.items() if k != 'password_hash'})

@api_router.get("/wali/{wali_id}/whatsapp-message")
async def get_wali_whatsapp_message(wali_id: str, _: dict = Depends(get_current_admin)):
    """Generate WhatsApp message for wali"""
    wali = await db.wali_santri.find_one({"id": wali_id}, {"_id": 0})
    if not wali:
        raise HTTPException(status_code=404, detail="Wali santri tidak ditemukan")
    
    message = f"""Assalamu'alaikum Bapak/Ibu {wali['nama']}

Berikut informasi akun Wali Santri Anda:

👤 Nama: {wali['nama']}
📱 Username: {wali['username']}
🔑 Password: password123
📞 Nomor HP: {wali['nomor_hp']}
📧 Email: {wali.get('email', '-')}

👨‍👩‍👧‍👦 Anak Anda ({wali['jumlah_anak']} orang):
{chr(10).join(f"- {nama}" for nama in wali['nama_anak'])}

Silakan login ke aplikasi Wali Santri untuk melihat absensi sholat anak Anda.

⚠️ Harap ganti password setelah login pertama kali.

Terima kasih
Pondok Pesantren"""
    
    # WhatsApp link
    nomor_wa = wali['nomor_hp'].replace('+', '').replace('-', '').replace(' ', '')
    if nomor_wa.startswith('0'):
        nomor_wa = '62' + nomor_wa[1:]
    
    wa_link = f"https://wa.me/{nomor_wa}?text={message.replace(' ', '%20').replace('\n', '%0A')}"
    
    return {
        "message": message,
        "whatsapp_link": wa_link,
        "nomor_whatsapp": nomor_wa
    }

