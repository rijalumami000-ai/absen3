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

import firebase_admin
from firebase_admin import credentials, messaging

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
# Initialize Firebase Admin for FCM
firebase_cred_path = ROOT_DIR / 'firebase_config.json'
if firebase_cred_path.exists():
    try:
        firebase_cred = credentials.Certificate(str(firebase_cred_path))
        if not firebase_admin._apps:
            firebase_app = firebase_admin.initialize_app(firebase_cred)
    except Exception as e:
        logging.error(f"Failed to initialize Firebase Admin: {e}")
else:
    logging.warning("Firebase config file not found; FCM notifications will be disabled.")


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
class PengabsenLoginRequest(BaseModel):
    username: str
    password: str

class PengabsenMeResponse(BaseModel):
    id: str
    nama: str
    username: str
    email_atau_hp: str
    asrama_ids: List[str]
    created_at: datetime

class PengabsenTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: PengabsenMeResponse



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


async def send_wali_push_notification(wali: dict, title: str, body: str):
    """Send FCM push notification to all tokens of a wali (if configured)."""
    try:
        tokens: list[str] = wali.get("fcm_tokens", []) or []
        if not tokens:
            return

        message = messaging.MulticastMessage(
            tokens=tokens,
            notification=messaging.Notification(title=title, body=body),
        )
        response = messaging.send_multicast(message)
        logging.info(f"Sent FCM to wali {wali.get('id')} count={len(tokens)} success={response.success_count}")
    except Exception as e:
        logging.error(f"Failed to send FCM notification: {e}")


async def get_current_pengabsen(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        pengabsen_id: str = payload.get("sub")
        if pengabsen_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")

        pengabsen = await db.pengabsen.find_one({"id": pengabsen_id}, {"_id": 0})
        if pengabsen is None:
            raise HTTPException(status_code=401, detail="Pengabsen not found")

        return pengabsen
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")


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
                "anak_ids": {"$push": "$id"},
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
        anak_ids = group.get("anak_ids", [])
        
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
                        "anak_ids": anak_ids,
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
                "password_hash": hash_password("12345"),  # default password
                "nomor_hp": nomor_hp,
                "email": email,
                "jumlah_anak": group["jumlah_anak"],
                "nama_anak": group["nama_anak"],
                "anak_ids": anak_ids,
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


# ==================== AUTHENTIKASI PENGABSEN (PWA) ====================

@api_router.post("/pengabsen/login", response_model=PengabsenTokenResponse)
async def login_pengabsen(request: PengabsenLoginRequest):
    pengabsen = await db.pengabsen.find_one({"username": request.username}, {"_id": 0})

    if not pengabsen or not verify_password(request.password, pengabsen['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah"
        )

    access_token = create_access_token(data={"sub": pengabsen['id'], "role": "pengabsen"})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": PengabsenMeResponse(**{k: v for k, v in pengabsen.items() if k != 'password_hash'})
    }


@api_router.get("/pengabsen/me", response_model=PengabsenMeResponse)
async def get_pengabsen_me(current_pengabsen: dict = Depends(get_current_pengabsen)):
    return PengabsenMeResponse(**{k: v for k, v in current_pengabsen.items() if k != 'password_hash'})


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
            "message": "Import selesai",
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


class WaliLoginRequest(BaseModel):
    username: str
    password: str


class WaliMeResponse(BaseModel):
    id: str
    nama: str
    username: str
    nomor_hp: str
    email: Optional[str]
    anak_ids: List[str]


class WaliTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: WaliMeResponse


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


async def get_current_wali(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        wali_id: str = payload.get("sub")
        if wali_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")

        wali = await db.wali_santri.find_one({"id": wali_id}, {"_id": 0})
        if wali is None:
            raise HTTPException(status_code=401, detail="Wali tidak ditemukan")

        return wali
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")


class WaliFcmTokenRequest(BaseModel):
    token: str


@api_router.post("/wali/fcm-token")
async def register_wali_fcm_token(payload: WaliFcmTokenRequest, current_wali: dict = Depends(get_current_wali)):
    token = payload.token.strip()
    if not token:
        raise HTTPException(status_code=400, detail="Token tidak boleh kosong")

    wali_id = current_wali["id"]
    wali = await db.wali_santri.find_one({"id": wali_id}, {"_id": 0})
    if not wali:
        raise HTTPException(status_code=404, detail="Wali tidak ditemukan")

    tokens: list[str] = wali.get("fcm_tokens", []) or []
    if token not in tokens:
        tokens.append(token)
        await db.wali_santri.update_one({"id": wali_id}, {"$set": {"fcm_tokens": tokens}})

    return {"status": "ok"}


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


@api_router.post("/wali/login", response_model=WaliTokenResponse)
async def login_wali(request: WaliLoginRequest):
    # Pastikan data wali dan anak_ids sudah tersinkron dari data santri
    await sync_wali_santri()

    # Temukan wali berdasarkan username
    wali = await db.wali_santri.find_one({"username": request.username}, {"_id": 0})

    if not wali:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Username atau password salah")

    # Password default untuk SEMUA wali: "12345".
    # Jika wali sudah punya password_hash khusus, ia juga boleh login dengan password tersebut.
    password_hash = wali.get("password_hash")
    default_password = "12345"

    if request.password == default_password:
        # Selalu terima password default, terlepas dari ada/tidaknya password_hash khusus
        pass
    elif password_hash:
        if not verify_password(request.password, password_hash):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Username atau password salah")
    else:
        # Tidak pakai default dan belum ada password tersimpan
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Username atau password salah")

    access_token = create_access_token(data={"sub": wali["id"], "role": "wali"})

    user_data = WaliMeResponse(
        id=wali["id"],
        nama=wali["nama"],
        username=wali["username"],
        nomor_hp=wali["nomor_hp"],
        email=wali.get("email"),
        anak_ids=wali.get("anak_ids", []),
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_data,
    }


@api_router.get("/wali/anak-absensi-hari-ini")
async def get_wali_anak_absensi_hari_ini(current_wali: dict = Depends(get_current_wali)):
    today = datetime.now(timezone.utc).astimezone().date().isoformat()
    anak_ids: List[str] = current_wali.get("anak_ids", [])
    if not anak_ids:
        return {"tanggal": today, "data": []}

    santri_list = await db.santri.find({"id": {"$in": anak_ids}}, {"_id": 0}).to_list(100)
    santri_by_id = {s["id"]: s for s in santri_list}

    asrama_map = {a["id"]: a["nama"] for a in await db.asrama.find({}, {"_id": 0}).to_list(1000)}

    absensi_list = await db.absensi.find(
        {"tanggal": today, "santri_id": {"$in": list(santri_by_id.keys())}}, {"_id": 0}
    ).to_list(1000)

    status_by_santri: dict = {sid: {} for sid in santri_by_id.keys()}
    for a in absensi_list:
        sid = a["santri_id"]
        waktu_sholat = a["waktu_sholat"]
        status_val = a["status"]
        if sid in status_by_santri:
            status_by_santri[sid][waktu_sholat] = status_val

    # Map pengabsen_id -> nama untuk referensi
    pengabsen_map = {
        p["id"]: p.get("nama", "-")
        for p in await db.pengabsen.find({}, {"_id": 0, "id": 1, "nama": 1}).to_list(1000)
    }

    # Hitung pengabsen "utama" per santri (mis. entry terakhir hari itu)
    pengabsen_by_santri: dict[str, Optional[str]] = {}
    for a in absensi_list:
        sid = a["santri_id"]
        pid = a.get("pengabsen_id")
        if sid in santri_by_id and pid:
            pengabsen_by_santri[sid] = pengabsen_map.get(pid, "-")

    result = []
    for sid, santri in santri_by_id.items():
        result.append(
            {
                "santri_id": sid,
                "nama": santri["nama"],
                "nis": santri["nis"],
                "asrama_id": santri["asrama_id"],
                "nama_asrama": asrama_map.get(santri["asrama_id"], "-"),
                "status": status_by_santri.get(sid, {}),
                "pengabsen_nama": pengabsen_by_santri.get(sid),
            }
        )

    return {"tanggal": today, "data": result}


@api_router.get("/wali/anak-absensi-riwayat")
async def get_wali_anak_absensi_riwayat(tanggal: str, current_wali: dict = Depends(get_current_wali)):
    anak_ids: List[str] = current_wali.get("anak_ids", [])
    if not anak_ids:
        return {"tanggal": tanggal, "data": []}

    santri_list = await db.santri.find({"id": {"$in": anak_ids}}, {"_id": 0}).to_list(100)
    santri_by_id = {s["id"]: s for s in santri_list}

    asrama_map = {a["id"]: a["nama"] for a in await db.asrama.find({}, {"_id": 0}).to_list(1000)}

    absensi_list = await db.absensi.find(
        {"tanggal": tanggal, "santri_id": {"$in": list(santri_by_id.keys())}}, {"_id": 0}
    ).to_list(1000)

    status_by_santri: dict = {sid: {} for sid in santri_by_id.keys()}
    for a in absensi_list:
        sid = a["santri_id"]
        waktu_sholat = a["waktu_sholat"]
        status_val = a["status"]
        if sid in status_by_santri:
            status_by_santri[sid][waktu_sholat] = status_val

    # Map pengabsen_id -> nama untuk referensi
    pengabsen_map = {
        p["id"]: p.get("nama", "-")
        for p in await db.pengabsen.find({}, {"_id": 0, "id": 1, "nama": 1}).to_list(1000)
    }

    pengabsen_by_santri: dict[str, Optional[str]] = {}
    for a in absensi_list:
        sid = a["santri_id"]
        pid = a.get("pengabsen_id")
        if sid in santri_by_id and pid:
            pengabsen_by_santri[sid] = pengabsen_map.get(pid, "-")

    result = []
    for sid, santri in santri_by_id.items():
        result.append(
            {
                "santri_id": sid,
                "nama": santri["nama"],
                "nis": santri["nis"],
                "asrama_id": santri["asrama_id"],
                "nama_asrama": asrama_map.get(santri["asrama_id"], "-"),
                "status": status_by_santri.get(sid, {}),
                "pengabsen_nama": pengabsen_by_santri.get(sid),
            }
        )

    return {"tanggal": tanggal, "data": result}


@api_router.get("/wali/me", response_model=WaliMeResponse)
async def get_wali_me(current_wali: dict = Depends(get_current_wali)):
    return WaliMeResponse(
        id=current_wali["id"],
        nama=current_wali["nama"],
        username=current_wali["username"],
        nomor_hp=current_wali["nomor_hp"],
        email=current_wali.get("email"),
        anak_ids=current_wali.get("anak_ids", []),
    )


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
🔑 Password: 12345
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
    
    # URL encode message
    import urllib.parse
    encoded_message = urllib.parse.quote(message)
    wa_link = f"https://wa.me/{nomor_wa}?text={encoded_message}"
    
    return {
        "message": message,
        "whatsapp_link": wa_link,
        "nomor_whatsapp": nomor_wa
    }


# ==================== PENGABSEN ENDPOINTS (REVISED - Multi Asrama) ====================

@api_router.get("/pengabsen", response_model=List[PengabsenResponse])
async def get_pengabsen(_: dict = Depends(get_current_admin)):
    raw_list = await db.pengabsen.find({}, {"_id": 0}).to_list(1000)

    normalized: List[PengabsenResponse] = []
    for pengabsen in raw_list:
        # Backward compatibility untuk data lama yang masih pakai field nip/asrama_id tunggal
        if 'email_atau_hp' not in pengabsen:
            pengabsen['email_atau_hp'] = pengabsen.get('nip', '')
        if 'asrama_ids' not in pengabsen:
            if 'asrama_id' in pengabsen:
                pengabsen['asrama_ids'] = [pengabsen['asrama_id']]
            else:
                pengabsen['asrama_ids'] = []

        if isinstance(pengabsen.get('created_at'), str):
            pengabsen['created_at'] = datetime.fromisoformat(pengabsen['created_at'])

        # Pastikan password_hash tidak ikut ter-serialize
        data = {k: v for k, v in pengabsen.items() if k != 'password_hash'}
        normalized.append(PengabsenResponse(**data))

    return normalized

@api_router.post("/pengabsen", response_model=PengabsenResponse)
async def create_pengabsen(data: PengabsenCreate, _: dict = Depends(get_current_admin)):
    # Check if username already exists
    existing = await db.pengabsen.find_one({"username": data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username sudah digunakan")
    
    # Verify all asrama exist
    for asrama_id in data.asrama_ids:
        asrama = await db.asrama.find_one({"id": asrama_id})
        if not asrama:
            raise HTTPException(status_code=404, detail=f"Asrama {asrama_id} tidak ditemukan")
    
    pengabsen_dict = data.model_dump()
    password = pengabsen_dict.pop('password')
    pengabsen_dict['password_hash'] = hash_password(password)
    
    pengabsen_obj = Pengabsen(**pengabsen_dict)
    doc = pengabsen_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.pengabsen.insert_one(doc)
    
    return PengabsenResponse(**pengabsen_obj.model_dump())

@api_router.put("/pengabsen/{pengabsen_id}", response_model=PengabsenResponse)
async def update_pengabsen(pengabsen_id: str, data: PengabsenUpdate, _: dict = Depends(get_current_admin)):
    pengabsen = await db.pengabsen.find_one({"id": pengabsen_id}, {"_id": 0})
    if not pengabsen:
        raise HTTPException(status_code=404, detail="Pengabsen tidak ditemukan")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    if 'asrama_ids' in update_data:
        for asrama_id in update_data['asrama_ids']:
            asrama = await db.asrama.find_one({"id": asrama_id})
            if not asrama:
                raise HTTPException(status_code=404, detail=f"Asrama {asrama_id} tidak ditemukan")
    
    if 'password' in update_data:
        update_data['password_hash'] = hash_password(update_data.pop('password'))
    
    if update_data:
        await db.pengabsen.update_one({"id": pengabsen_id}, {"$set": update_data})
        pengabsen.update(update_data)
    
    if isinstance(pengabsen.get('created_at'), str):
        pengabsen['created_at'] = datetime.fromisoformat(pengabsen['created_at'])
    
    return PengabsenResponse(**{k: v for k, v in pengabsen.items() if k != 'password_hash'})


@api_router.post("/pengabsen/absensi")
async def upsert_absensi_pengabsen(
    santri_id: str,
    waktu_sholat: Literal["subuh", "dzuhur", "ashar", "maghrib", "isya"],
    status_absen: Literal["hadir", "alfa", "sakit", "izin", "haid", "istihadhoh"] = "hadir",
    current_pengabsen: dict = Depends(get_current_pengabsen)
):
    today = datetime.now(timezone.utc).astimezone().date().isoformat()

    santri = await db.santri.find_one({"id": santri_id}, {"_id": 0})
    if not santri:
        raise HTTPException(status_code=404, detail="Santri tidak ditemukan")

    if santri['asrama_id'] not in current_pengabsen.get('asrama_ids', []):
        raise HTTPException(status_code=403, detail="Santri bukan asrama yang Anda kelola")

    existing = await db.absensi.find_one({
        "santri_id": santri_id,
        "waktu_sholat": waktu_sholat,
        "tanggal": today
    })

    doc = {
        "santri_id": santri_id,
        "waktu_sholat": waktu_sholat,
        "status": status_absen,
        "tanggal": today,
        "pengabsen_id": current_pengabsen['id'],
        "waktu_absen": datetime.now(timezone.utc).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }

    if existing:
        await db.absensi.update_one({"id": existing.get("id")}, {"$set": doc})
    else:
        doc["id"] = str(uuid.uuid4())
        await db.absensi.insert_one(doc)

    # Kirim notifikasi ke wali terkait
    try:
        # Cari wali yang memiliki santri ini
        wali_list = await db.wali_santri.find({"anak_ids": santri_id}, {"_id": 0}).to_list(100)
        if wali_list:
            # Ambil template notifikasi dari settings (fallback ke default jika belum di-set)
            settings_doc = await db.settings.find_one({"id": "wali_notifikasi"}, {"_id": 0}) or {}
            templates = {
                "hadir": settings_doc.get(
                    "hadir",
                    "{nama} hadir pada waktu sholat {waktu} hari ini, alhamdulillah (hadir)",
                ),
                "alfa": settings_doc.get(
                    "alfa",
                    "{nama} tidak mengikuti/membolos sholat {waktu} pada hari ini (alfa)",
                ),
                "sakit": settings_doc.get(
                    "sakit",
                    "{nama} tidak mengikuti sholat {waktu} pada hari ini karena sedang sakit (sakit)",
                ),
                "izin": settings_doc.get(
                    "izin",
                    "{nama} tidak mengikuti sholat {waktu} pada hari ini karena izin (izin)",
                ),
                "haid": settings_doc.get(
                    "haid",
                    "{nama} tidak mengikuti sholat {waktu} pada hari ini karena sedang haid (haid)",
                ),
                "istihadhoh": settings_doc.get(
                    "istihadhoh",
                    "{nama} tidak mengikuti sholat {waktu} pada hari ini karena sedang istihadhoh (istihadhoh)",
                ),
            }

            waktu_label_map = {
                "subuh": "subuh",
                "dzuhur": "dzuhur",
                "ashar": "ashar",
                "maghrib": "maghrib",
                "isya": "isya",
            }

            template = templates.get(status_absen)
            if template:
                body = template.format(nama=santri["nama"], waktu=waktu_label_map.get(waktu_sholat, waktu_sholat))
                title = f"Absensi Sholat {waktu_label_map.get(waktu_sholat, waktu_sholat).capitalize()}"
                for wali in wali_list:
                    await send_wali_push_notification(wali, title=title, body=body)
    except Exception as e:
        logging.error(f"Failed to send wali notification: {e}")

    return {"message": "Absensi tersimpan", "tanggal": today}


@api_router.delete("/pengabsen/absensi")
async def delete_absensi_pengabsen(
    santri_id: str,
    waktu_sholat: Literal["subuh", "dzuhur", "ashar", "maghrib", "isya"],
    current_pengabsen: dict = Depends(get_current_pengabsen)
):
    today = datetime.now(timezone.utc).astimezone().date().isoformat()

    santri = await db.santri.find_one({"id": santri_id}, {"_id": 0})
    if not santri:
        raise HTTPException(status_code=404, detail="Santri tidak ditemukan")

    if santri['asrama_id'] not in current_pengabsen.get('asrama_ids', []):
        raise HTTPException(status_code=403, detail="Santri bukan asrama yang Anda kelola")

    result = await db.absensi.delete_one({
        "santri_id": santri_id,
        "waktu_sholat": waktu_sholat,
        "tanggal": today
    })

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Data absensi tidak ditemukan")

    return {"message": "Absensi dihapus", "tanggal": today}


@api_router.get("/pengabsen/santri-absensi-hari-ini")
async def get_santri_absensi_hari_ini(
    waktu_sholat: Literal["subuh", "dzuhur", "ashar", "maghrib", "isya"],
    current_pengabsen: dict = Depends(get_current_pengabsen)
):
    today = datetime.now(timezone.utc).astimezone().date().isoformat()

    asrama_ids = current_pengabsen.get('asrama_ids', [])
    santri_list = await db.santri.find({"asrama_id": {"$in": asrama_ids}}, {"_id": 0}).to_list(10000)
    santri_by_id = {s['id']: s for s in santri_list}

    absensi_list = await db.absensi.find({
        "tanggal": today,
        "waktu_sholat": waktu_sholat,
        "santri_id": {"$in": list(santri_by_id.keys())}
    }, {"_id": 0}).to_list(10000)

    absensi_by_santri = {a['santri_id']: a for a in absensi_list}

    asrama_map = {a['id']: a['nama'] for a in await db.asrama.find({}, {"_id": 0}).to_list(10000)}

    result = []
    for sid, santri in santri_by_id.items():
        absensi = absensi_by_santri.get(sid)
        status_val = absensi['status'] if absensi else None
        result.append({
            "santri_id": sid,
            "nama": santri['nama'],
            "nis": santri['nis'],
            "asrama_id": santri['asrama_id'],
            "nama_asrama": asrama_map.get(santri['asrama_id'], "-"),
            "status": status_val
        })

    return {"tanggal": today, "waktu_sholat": waktu_sholat, "data": result}



@api_router.get("/pengabsen/riwayat-detail")
async def get_pengabsen_riwayat_detail(
    tanggal: str,
    waktu_sholat: Literal["subuh", "dzuhur", "ashar", "maghrib", "isya"],
    asrama_id: Optional[str] = None,
    current_pengabsen: dict = Depends(get_current_pengabsen),
):
    """Detail santri untuk satu kombinasi tanggal/waktu_sholat/asrama yang dicatat oleh pengabsen saat ini."""
    query = {
        "pengabsen_id": current_pengabsen["id"],
        "tanggal": tanggal,
        "waktu_sholat": waktu_sholat,
    }
    absensi_list = await db.absensi.find(query, {"_id": 0}).to_list(10000)

    if not absensi_list:
        return {"tanggal": tanggal, "waktu_sholat": waktu_sholat, "data": []}

    santri_ids = list({a["santri_id"] for a in absensi_list})
    santri_docs = await db.santri.find({"id": {"$in": santri_ids}}, {"_id": 0}).to_list(10000)
    santri_by_id = {s["id"]: s for s in santri_docs}

    items = []
    for a in absensi_list:
        sid = a.get("santri_id")
        santri = santri_by_id.get(sid)
        if not santri:
            continue

        # Pastikan hanya asrama yang dikelola pengabsen
        asrama_santri = santri.get("asrama_id")
        if asrama_santri not in current_pengabsen.get("asrama_ids", []):
            continue

        if asrama_id and asrama_santri != asrama_id:
            continue

        items.append(
            {
                "santri_id": sid,
                "nama": santri["nama"],
                "nis": santri["nis"],
                "asrama_id": asrama_santri,
                "status": a.get("status"),
            }
        )

    return {"tanggal": tanggal, "waktu_sholat": waktu_sholat, "data": items}


@api_router.delete("/pengabsen/{pengabsen_id}")


@api_router.get("/pengabsen/riwayat")
async def get_pengabsen_riwayat(
    tanggal_start: str,
    tanggal_end: Optional[str] = None,
    asrama_id: Optional[str] = None,
    current_pengabsen: dict = Depends(get_current_pengabsen),
):
    """Riwayat absensi yang dicatat oleh pengabsen tertentu (ringkasan per tanggal/waktu/asrama)."""
    if not tanggal_end:
      tanggal_end = tanggal_start

    # Ambil semua absensi milik pengabsen dalam rentang tanggal
    query = {
        "pengabsen_id": current_pengabsen["id"],
        "tanggal": {"$gte": tanggal_start, "$lte": tanggal_end},
    }
    absensi_list = await db.absensi.find(query, {"_id": 0}).to_list(10000)

    if not absensi_list:
        return {"items": []}

    santri_ids = list({a["santri_id"] for a in absensi_list})
    santri_docs = await db.santri.find({"id": {"$in": santri_ids}}, {"_id": 0}).to_list(10000)
    santri_by_id = {s["id"]: s for s in santri_docs}

    asrama_docs = await db.asrama.find({}, {"_id": 0}).to_list(1000)
    asrama_map = {a["id"]: a["nama"] for a in asrama_docs}

    # Grouping: (tanggal, asrama_id, waktu_sholat) -> counts per status
    groups: dict = {}
    for a in absensi_list:
        sid = a.get("santri_id")
        santri = santri_by_id.get(sid)
        if not santri:
            continue

        asrama_santri = santri.get("asrama_id")
        # Batasi hanya asrama yang dikelola pengabsen
        if asrama_santri not in current_pengabsen.get("asrama_ids", []):
            continue

        # Filter asrama jika diminta
        if asrama_id and asrama_santri != asrama_id:
            continue

        key = (a["tanggal"], asrama_santri, a["waktu_sholat"])
        if key not in groups:
            groups[key] = {
                "tanggal": a["tanggal"],
                "asrama_id": asrama_santri,
                "nama_asrama": asrama_map.get(asrama_santri, "-"),
                "waktu_sholat": a["waktu_sholat"],
                "hadir": 0,
                "alfa": 0,
                "sakit": 0,
                "izin": 0,
                "haid": 0,
                "istihadhoh": 0,
            }

        status_val = a.get("status")
        if status_val in ["hadir", "alfa", "sakit", "izin", "haid", "istihadhoh"]:
            groups[key][status_val] += 1

    items = list(groups.values())
    # Urutkan berdasarkan tanggal lalu waktu sholat
    items.sort(key=lambda x: (x["tanggal"], x["waktu_sholat"]))

    return {"items": items}

async def delete_pengabsen(pengabsen_id: str, _: dict = Depends(get_current_admin)):
    result = await db.pengabsen.delete_one({"id": pengabsen_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pengabsen tidak ditemukan")
    return {"message": "Pengabsen berhasil dihapus"}

# ==================== PEMBIMBING ENDPOINTS (REVISED - Add Contact) ====================

@api_router.get("/pembimbing", response_model=List[PembimbingResponse])
async def get_pembimbing(_: dict = Depends(get_current_admin)):
    raw_list = await db.pembimbing.find({}, {"_id": 0}).to_list(1000)

    normalized: List[PembimbingResponse] = []
    for pembimbing in raw_list:
        # Backward compatibility untuk data lama yang belum punya email_atau_hp / asrama_ids
        if 'email_atau_hp' not in pembimbing:
            pembimbing['email_atau_hp'] = ''
        if 'asrama_ids' not in pembimbing:
            if 'asrama_id' in pembimbing:
                pembimbing['asrama_ids'] = [pembimbing['asrama_id']]
            else:
                pembimbing['asrama_ids'] = []

        if isinstance(pembimbing.get('created_at'), str):
            pembimbing['created_at'] = datetime.fromisoformat(pembimbing['created_at'])

        data = {k: v for k, v in pembimbing.items() if k != 'password_hash'}
        normalized.append(PembimbingResponse(**data))

    return normalized

@api_router.post("/pembimbing", response_model=PembimbingResponse)
async def create_pembimbing(data: PembimbingCreate, _: dict = Depends(get_current_admin)):
    existing = await db.pembimbing.find_one({"username": data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username sudah digunakan")
    
    pembimbing_dict = data.model_dump()
    password = pembimbing_dict.pop('password')
    pembimbing_dict['password_hash'] = hash_password(password)
    
    pembimbing_obj = Pembimbing(**pembimbing_dict)
    doc = pembimbing_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.pembimbing.insert_one(doc)
    
    return PembimbingResponse(**pembimbing_obj.model_dump())

@api_router.put("/pembimbing/{pembimbing_id}", response_model=PembimbingResponse)
async def update_pembimbing(pembimbing_id: str, data: PembimbingUpdate, _: dict = Depends(get_current_admin)):
    pembimbing = await db.pembimbing.find_one({"id": pembimbing_id}, {"_id": 0})
    if not pembimbing:
        raise HTTPException(status_code=404, detail="Pembimbing tidak ditemukan")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    if 'password' in update_data:
        update_data['password_hash'] = hash_password(update_data.pop('password'))
    
    if update_data:
        await db.pembimbing.update_one({"id": pembimbing_id}, {"$set": update_data})
        pembimbing.update(update_data)
    
    if isinstance(pembimbing['created_at'], str):
        pembimbing['created_at'] = datetime.fromisoformat(pembimbing['created_at'])
    
    return PembimbingResponse(**{k: v for k, v in pembimbing.items() if k != 'password_hash'})

@api_router.delete("/pembimbing/{pembimbing_id}")
async def delete_pembimbing(pembimbing_id: str, _: dict = Depends(get_current_admin)):
    result = await db.pembimbing.delete_one({"id": pembimbing_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pembimbing tidak ditemukan")
    return {"message": "Pembimbing berhasil dihapus"}

# ==================== ABSENSI ENDPOINTS (REVISED) ====================

@api_router.get("/absensi", response_model=List[AbsensiResponse])
async def get_absensi(
    tanggal_start: Optional[str] = None,
    tanggal_end: Optional[str] = None,
    santri_id: Optional[str] = None,
    waktu_sholat: Optional[str] = None,
    asrama_id: Optional[str] = None,
    gender: Optional[str] = None,
    _: dict = Depends(get_current_admin)
):
    """Get absensi with advanced filters"""
    query = {}
    
    # Date range filter
    if tanggal_start and tanggal_end:
        query['tanggal'] = {"$gte": tanggal_start, "$lte": tanggal_end}
    elif tanggal_start:
        query['tanggal'] = tanggal_start
    
    if santri_id:
        query['santri_id'] = santri_id
    if waktu_sholat:
        query['waktu_sholat'] = waktu_sholat
    
    absensi_list = await db.absensi.find(query, {"_id": 0}).to_list(10000)
    
    # Filter by asrama or gender if needed
    if asrama_id or gender:
        santri_query = {}
        if asrama_id:
            santri_query['asrama_id'] = asrama_id
        if gender:
            santri_query['gender'] = gender
        
        santri_ids = [s['id'] for s in await db.santri.find(santri_query, {"_id": 0, "id": 1}).to_list(10000)]
        absensi_list = [a for a in absensi_list if a['santri_id'] in santri_ids]
    
    for absensi in absensi_list:
        if isinstance(absensi['waktu_absen'], str):
            absensi['waktu_absen'] = datetime.fromisoformat(absensi['waktu_absen'])
        if isinstance(absensi['created_at'], str):
            absensi['created_at'] = datetime.fromisoformat(absensi['created_at'])
    
    return absensi_list

@api_router.get("/absensi/stats")
async def get_absensi_stats(
    tanggal_start: Optional[str] = None,
    tanggal_end: Optional[str] = None,
    asrama_id: Optional[str] = None,
    gender: Optional[str] = None,
    _: dict = Depends(get_current_admin)
):
    """Get absensi statistics with filters"""
    query = {}
    
    if tanggal_start and tanggal_end:
        query['tanggal'] = {"$gte": tanggal_start, "$lte": tanggal_end}
    elif tanggal_start:
        query['tanggal'] = tanggal_start
    
    # Filter by asrama or gender
    if asrama_id or gender:
        santri_query = {}
        if asrama_id:
            santri_query['asrama_id'] = asrama_id
        if gender:
            santri_query['gender'] = gender
        
        santri_ids = [s['id'] for s in await db.santri.find(santri_query, {"_id": 0, "id": 1}).to_list(10000)]
        query['santri_id'] = {"$in": santri_ids}
    
    total = await db.absensi.count_documents(query)
    hadir = await db.absensi.count_documents({**query, "status": "hadir"})
    alfa = await db.absensi.count_documents({**query, "status": "alfa"})
    sakit = await db.absensi.count_documents({**query, "status": "sakit"})
    izin = await db.absensi.count_documents({**query, "status": "izin"})
    haid = await db.absensi.count_documents({**query, "status": "haid"})
    istihadhoh = await db.absensi.count_documents({**query, "status": "istihadhoh"})
    
    return {
        "total": total,
        "hadir": hadir,
        "alfa": alfa,
        "sakit": sakit,
        "izin": izin,
        "haid": haid,
        "istihadhoh": istihadhoh
    }

@api_router.get("/absensi/detail")
async def get_absensi_detail(
    tanggal: str,
    asrama_id: Optional[str] = None,
    gender: Optional[str] = None,
    _: dict = Depends(get_current_admin)
):
    """Get detailed absensi per waktu sholat for specific date"""
    # Get all santri with filters
    santri_query = {}
    if asrama_id:
        santri_query['asrama_id'] = asrama_id
    if gender:
        santri_query['gender'] = gender
    
    all_santri = await db.santri.find(santri_query, {"_id": 0}).to_list(10000)
    santri_dict = {s['id']: s for s in all_santri}
    
    # Get absensi for the date
    absensi_list = await db.absensi.find({"tanggal": tanggal}, {"_id": 0}).to_list(10000)

    # Map pengabsen_id -> nama
    pengabsen_map = {
        p["id"]: p.get("nama", "-")
        for p in await db.pengabsen.find({}, {"_id": 0, "id": 1, "nama": 1}).to_list(1000)
    }
    
    # Organize by waktu sholat and status
    waktu_sholat_list = ["subuh", "dzuhur", "ashar", "maghrib", "isya"]
    status_list = ["hadir", "alfa", "sakit", "izin", "haid", "istihadhoh"]
    
    result = {}
    for waktu in waktu_sholat_list:
        result[waktu] = {}
        for st in status_list:
            items = []
            for a in absensi_list:
                if (
                    a.get("waktu_sholat") == waktu
                    and a.get("status") == st
                    and a.get("santri_id") in santri_dict
                ):
                    sid = a["santri_id"]
                    pengabsen_id = a.get("pengabsen_id")
                    items.append(
                        {
                            "santri_id": sid,
                            "nama": santri_dict[sid]["nama"],
                            "nis": santri_dict[sid]["nis"],
                            "asrama_id": santri_dict[sid]["asrama_id"],
                            "pengabsen_id": pengabsen_id,
                            "pengabsen_nama": pengabsen_map.get(pengabsen_id, "-") if pengabsen_id else "-",
                        }
                    )
            result[waktu][st] = items
    
    return result

@api_router.delete("/absensi/{absensi_id}")
async def delete_absensi(absensi_id: str, _: dict = Depends(get_current_admin)):
    result = await db.absensi.delete_one({"id": absensi_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Data absensi tidak ditemukan")
    return {"message": "Data absensi berhasil dihapus"}

# ==================== WAKTU SHOLAT ENDPOINTS ====================

@api_router.get("/waktu-sholat", response_model=WaktuSholatResponse)
async def get_waktu_sholat(tanggal: str, _: dict = Depends(get_current_admin)):
    waktu = await db.waktu_sholat.find_one({"tanggal": tanggal}, {"_id": 0})
    
    if waktu:
        if isinstance(waktu['created_at'], str):
            waktu['created_at'] = datetime.fromisoformat(waktu['created_at'])
        return WaktuSholatResponse(**waktu)
    
    # Fetch from API
    date_parts = tanggal.split('-')
    api_date = f"{date_parts[2]}-{date_parts[1]}-{date_parts[0]}"
    
    prayer_times = await fetch_prayer_times(api_date)
    if not prayer_times:
        raise HTTPException(status_code=500, detail="Gagal mengambil data waktu sholat")
    
    waktu_obj = WaktuSholat(tanggal=tanggal, **prayer_times)
    doc = waktu_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.waktu_sholat.insert_one(doc)
    
    return WaktuSholatResponse(**waktu_obj.model_dump())

@api_router.post("/waktu-sholat/sync")
async def sync_waktu_sholat(tanggal: str, _: dict = Depends(get_current_admin)):
    date_parts = tanggal.split('-')
    api_date = f"{date_parts[2]}-{date_parts[1]}-{date_parts[0]}"
    
    prayer_times = await fetch_prayer_times(api_date)
    if not prayer_times:
        raise HTTPException(status_code=500, detail="Gagal mengambil data waktu sholat dari API")
    
    await db.waktu_sholat.delete_one({"tanggal": tanggal})
    
    waktu_obj = WaktuSholat(tanggal=tanggal, **prayer_times)
    doc = waktu_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.waktu_sholat.insert_one(doc)
    
    return WaktuSholatResponse(**waktu_obj.model_dump())

# ==================== INITIALIZATION ====================

@api_router.get("/")
async def root():
    return {"message": "Absensi Sholat API - Admin Panel v2"}

@api_router.post("/init/admin")
async def initialize_admin():
    existing = await db.admins.find_one({})
    if existing:
        raise HTTPException(status_code=400, detail="Admin sudah ada")
    
    admin = Admin(
        username="admin",
        nama="Administrator",
        password_hash=hash_password("admin123")
    )
    
    doc = admin.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.admins.insert_one(doc)
    
    return {"message": "Admin default berhasil dibuat", "username": "admin", "password": "admin123"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
