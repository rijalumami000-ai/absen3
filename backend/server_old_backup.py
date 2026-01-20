from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, ConfigDict, EmailStr
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
from pathlib import Path

# ==================== SETUP ====================
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'absensi_sholat')]

# JWT Configuration
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-this-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(title="Absensi Sholat API")
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

# Auth Models
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

# Wali Santri Models
class WaliSantri(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nama: str
    username: str
    password_hash: str
    nomor_hp: str
    email: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class WaliSantriCreate(BaseModel):
    nama: str
    username: str
    password: str
    nomor_hp: str
    email: Optional[str] = None

class WaliSantriUpdate(BaseModel):
    nama: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    nomor_hp: Optional[str] = None
    email: Optional[str] = None

class WaliSantriResponse(BaseModel):
    id: str
    nama: str
    username: str
    nomor_hp: str
    email: Optional[str]
    created_at: datetime

# Santri Models
class Santri(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nama: str
    nis: str
    gender: Literal["putra", "putri"]
    asrama_id: str
    wali_id: Optional[str] = None
    qr_code: str  # base64 encoded image
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SantriCreate(BaseModel):
    nama: str
    nis: str
    gender: Literal["putra", "putri"]
    asrama_id: str
    wali_id: Optional[str] = None

class SantriUpdate(BaseModel):
    nama: Optional[str] = None
    nis: Optional[str] = None
    gender: Optional[Literal["putra", "putri"]] = None
    asrama_id: Optional[str] = None
    wali_id: Optional[str] = None

class SantriResponse(BaseModel):
    id: str
    nama: str
    nis: str
    gender: str
    asrama_id: str
    wali_id: Optional[str]
    created_at: datetime
    updated_at: datetime

# Pengabsen Models
class Pengabsen(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nama: str
    nip: str
    username: str
    password_hash: str
    asrama_id: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PengabsenCreate(BaseModel):
    nama: str
    nip: str
    username: str
    password: str
    asrama_id: str

class PengabsenUpdate(BaseModel):
    nama: Optional[str] = None
    nip: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    asrama_id: Optional[str] = None

class PengabsenResponse(BaseModel):
    id: str
    nama: str
    nip: str
    username: str
    asrama_id: str
    created_at: datetime

# Pembimbing Models
class Pembimbing(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    nama: str
    username: str
    password_hash: str
    asrama_ids: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PembimbingCreate(BaseModel):
    nama: str
    username: str
    password: str
    asrama_ids: List[str] = []

class PembimbingUpdate(BaseModel):
    nama: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    asrama_ids: Optional[List[str]] = None

class PembimbingResponse(BaseModel):
    id: str
    nama: str
    username: str
    asrama_ids: List[str]
    created_at: datetime

# Absensi Models
class Absensi(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    santri_id: str
    waktu_sholat: Literal["subuh", "dzuhur", "ashar", "maghrib", "isya"]
    status: Literal["hadir", "alfa", "sakit", "izin", "haid", "istihadhoh"]
    tanggal: str  # YYYY-MM-DD
    waktu_absen: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    pengabsen_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AbsensiCreate(BaseModel):
    santri_id: str
    waktu_sholat: Literal["subuh", "dzuhur", "ashar", "maghrib", "isya"]
    status: Literal["hadir", "alfa", "sakit", "izin", "haid", "istihadhoh"]
    tanggal: str
    pengabsen_id: Optional[str] = None

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
    tanggal: str  # YYYY-MM-DD
    subuh: str  # HH:MM
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
    """Hash password menggunakan bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current authenticated admin from JWT token"""
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        admin_id: str = payload.get("sub")
        if admin_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        # Get admin from database
        admin = await db.admins.find_one({"id": admin_id}, {"_id": 0})
        if admin is None:
            raise HTTPException(status_code=401, detail="Admin not found")
        
        return admin
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

def generate_qr_code(data: dict) -> str:
    """Generate QR code dan return base64 string"""
    import json
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(json.dumps(data))
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return img_str

async def fetch_prayer_times(date: str) -> Optional[dict]:
    """Fetch prayer times from Aladhan API for Lampung Selatan"""
    try:
        url = "http://api.aladhan.com/v1/timingsByAddress"
        params = {
            "address": "Desa Cintamulya, Candipuro, Lampung Selatan, Lampung, Indonesia",
            "method": 2,  # Islamic Society of North America
            "date": date  # DD-MM-YYYY
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
    """Login admin"""
    # Find admin by username
    admin = await db.admins.find_one({"username": request.username}, {"_id": 0})
    
    if not admin or not verify_password(request.password, admin['password_hash']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah"
        )
    
    # Create access token
    access_token = create_access_token(data={"sub": admin['id']})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": AdminResponse(**admin)
    }

@api_router.get("/auth/me", response_model=AdminResponse)
async def get_me(current_admin: dict = Depends(get_current_admin)):
    """Get current admin info"""
    return AdminResponse(**current_admin)

@api_router.post("/auth/logout")
async def logout(current_admin: dict = Depends(get_current_admin)):
    """Logout (client should delete token)"""
    return {"message": "Logout berhasil"}

# ==================== ASRAMA ENDPOINTS ====================

@api_router.get("/asrama", response_model=List[Asrama])
async def get_asrama(gender: Optional[str] = None, _: dict = Depends(get_current_admin)):
    """Get all asrama with optional gender filter"""
    query = {}
    if gender:
        query['gender'] = gender
    
    asrama_list = await db.asrama.find(query, {"_id": 0}).to_list(1000)
    return asrama_list

@api_router.post("/asrama", response_model=Asrama)
async def create_asrama(data: AsramaCreate, _: dict = Depends(get_current_admin)):
    """Create new asrama"""
    asrama_obj = Asrama(**data.model_dump())
    doc = asrama_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.asrama.insert_one(doc)
    return asrama_obj

@api_router.put("/asrama/{asrama_id}", response_model=Asrama)
async def update_asrama(asrama_id: str, data: AsramaUpdate, _: dict = Depends(get_current_admin)):
    """Update asrama"""
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
    """Delete asrama"""
    result = await db.asrama.delete_one({"id": asrama_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Asrama tidak ditemukan")
    return {"message": "Asrama berhasil dihapus"}

# ==================== WALI SANTRI ENDPOINTS ====================

@api_router.get("/wali", response_model=List[WaliSantriResponse])
async def get_wali(_: dict = Depends(get_current_admin)):
    """Get all wali santri"""
    wali_list = await db.wali_santri.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    for wali in wali_list:
        if isinstance(wali['created_at'], str):
            wali['created_at'] = datetime.fromisoformat(wali['created_at'])
    
    return wali_list

@api_router.post("/wali", response_model=WaliSantriResponse)
async def create_wali(data: WaliSantriCreate, _: dict = Depends(get_current_admin)):
    """Create new wali santri"""
    # Check if username already exists
    existing = await db.wali_santri.find_one({"username": data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username sudah digunakan")
    
    wali_dict = data.model_dump()
    password = wali_dict.pop('password')
    wali_dict['password_hash'] = hash_password(password)
    
    wali_obj = WaliSantri(**wali_dict)
    doc = wali_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.wali_santri.insert_one(doc)
    
    return WaliSantriResponse(**wali_obj.model_dump())

@api_router.put("/wali/{wali_id}", response_model=WaliSantriResponse)
async def update_wali(wali_id: str, data: WaliSantriUpdate, _: dict = Depends(get_current_admin)):
    """Update wali santri"""
    wali = await db.wali_santri.find_one({"id": wali_id}, {"_id": 0})
    if not wali:
        raise HTTPException(status_code=404, detail="Wali santri tidak ditemukan")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    # Hash password if provided
    if 'password' in update_data:
        update_data['password_hash'] = hash_password(update_data.pop('password'))
    
    if update_data:
        await db.wali_santri.update_one({"id": wali_id}, {"$set": update_data})
        wali.update(update_data)
    
    if isinstance(wali['created_at'], str):
        wali['created_at'] = datetime.fromisoformat(wali['created_at'])
    
    return WaliSantriResponse(**{k: v for k, v in wali.items() if k != 'password_hash'})

@api_router.delete("/wali/{wali_id}")
async def delete_wali(wali_id: str, _: dict = Depends(get_current_admin)):
    """Delete wali santri"""
    result = await db.wali_santri.delete_one({"id": wali_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Wali santri tidak ditemukan")
    return {"message": "Wali santri berhasil dihapus"}

# ==================== SANTRI ENDPOINTS ====================

@api_router.get("/santri", response_model=List[SantriResponse])
async def get_santri(
    gender: Optional[str] = None,
    asrama_id: Optional[str] = None,
    _: dict = Depends(get_current_admin)
):
    """Get all santri with optional filters"""
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
    """Create new santri with QR code"""
    # Check if NIS already exists
    existing = await db.santri.find_one({"nis": data.nis})
    if existing:
        raise HTTPException(status_code=400, detail="NIS sudah digunakan")
    
    # Verify asrama exists
    asrama = await db.asrama.find_one({"id": data.asrama_id})
    if not asrama:
        raise HTTPException(status_code=404, detail="Asrama tidak ditemukan")
    
    # Verify wali if provided
    if data.wali_id:
        wali = await db.wali_santri.find_one({"id": data.wali_id})
        if not wali:
            raise HTTPException(status_code=404, detail="Wali santri tidak ditemukan")
    
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
    
    return SantriResponse(**{k: v for k, v in santri_obj.model_dump().items() if k != 'qr_code'})

@api_router.get("/santri/{santri_id}/qr-code")
async def get_santri_qr_code(santri_id: str, _: dict = Depends(get_current_admin)):
    """Get santri QR code as image"""
    santri = await db.santri.find_one({"id": santri_id}, {"_id": 0})
    if not santri:
        raise HTTPException(status_code=404, detail="Santri tidak ditemukan")
    
    # Decode base64 to image
    img_data = base64.b64decode(santri['qr_code'])
    
    return Response(content=img_data, media_type="image/png")

@api_router.put("/santri/{santri_id}", response_model=SantriResponse)
async def update_santri(santri_id: str, data: SantriUpdate, _: dict = Depends(get_current_admin)):
    """Update santri"""
    santri = await db.santri.find_one({"id": santri_id}, {"_id": 0})
    if not santri:
        raise HTTPException(status_code=404, detail="Santri tidak ditemukan")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    # Verify asrama if provided
    if 'asrama_id' in update_data:
        asrama = await db.asrama.find_one({"id": update_data['asrama_id']})
        if not asrama:
            raise HTTPException(status_code=404, detail="Asrama tidak ditemukan")
    
    # Verify wali if provided
    if 'wali_id' in update_data:
        wali = await db.wali_santri.find_one({"id": update_data['wali_id']})
        if not wali:
            raise HTTPException(status_code=404, detail="Wali santri tidak ditemukan")
    
    if update_data:
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        await db.santri.update_one({"id": santri_id}, {"$set": update_data})
        santri.update(update_data)
    
    if isinstance(santri['created_at'], str):
        santri['created_at'] = datetime.fromisoformat(santri['created_at'])
    if isinstance(santri['updated_at'], str):
        santri['updated_at'] = datetime.fromisoformat(santri['updated_at'])
    
    return SantriResponse(**{k: v for k, v in santri.items() if k != 'qr_code'})

@api_router.delete("/santri/{santri_id}")
async def delete_santri(santri_id: str, _: dict = Depends(get_current_admin)):
    """Delete santri"""
    result = await db.santri.delete_one({"id": santri_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Santri tidak ditemukan")
    return {"message": "Santri berhasil dihapus"}

# ==================== PENGABSEN ENDPOINTS ====================

@api_router.get("/pengabsen", response_model=List[PengabsenResponse])
async def get_pengabsen(_: dict = Depends(get_current_admin)):
    """Get all pengabsen"""
    pengabsen_list = await db.pengabsen.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    for pengabsen in pengabsen_list:
        if isinstance(pengabsen['created_at'], str):
            pengabsen['created_at'] = datetime.fromisoformat(pengabsen['created_at'])
    
    return pengabsen_list

@api_router.post("/pengabsen", response_model=PengabsenResponse)
async def create_pengabsen(data: PengabsenCreate, _: dict = Depends(get_current_admin)):
    """Create new pengabsen"""
    # Check if username or NIP already exists
    existing = await db.pengabsen.find_one({"$or": [{"username": data.username}, {"nip": data.nip}]})
    if existing:
        raise HTTPException(status_code=400, detail="Username atau NIP sudah digunakan")
    
    # Verify asrama exists
    asrama = await db.asrama.find_one({"id": data.asrama_id})
    if not asrama:
        raise HTTPException(status_code=404, detail="Asrama tidak ditemukan")
    
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
    """Update pengabsen"""
    pengabsen = await db.pengabsen.find_one({"id": pengabsen_id}, {"_id": 0})
    if not pengabsen:
        raise HTTPException(status_code=404, detail="Pengabsen tidak ditemukan")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    # Verify asrama if provided
    if 'asrama_id' in update_data:
        asrama = await db.asrama.find_one({"id": update_data['asrama_id']})
        if not asrama:
            raise HTTPException(status_code=404, detail="Asrama tidak ditemukan")
    
    # Hash password if provided
    if 'password' in update_data:
        update_data['password_hash'] = hash_password(update_data.pop('password'))
    
    if update_data:
        await db.pengabsen.update_one({"id": pengabsen_id}, {"$set": update_data})
        pengabsen.update(update_data)
    
    if isinstance(pengabsen['created_at'], str):
        pengabsen['created_at'] = datetime.fromisoformat(pengabsen['created_at'])
    
    return PengabsenResponse(**{k: v for k, v in pengabsen.items() if k != 'password_hash'})

@api_router.delete("/pengabsen/{pengabsen_id}")
async def delete_pengabsen(pengabsen_id: str, _: dict = Depends(get_current_admin)):
    """Delete pengabsen"""
    result = await db.pengabsen.delete_one({"id": pengabsen_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pengabsen tidak ditemukan")
    return {"message": "Pengabsen berhasil dihapus"}

# ==================== PEMBIMBING ENDPOINTS ====================

@api_router.get("/pembimbing", response_model=List[PembimbingResponse])
async def get_pembimbing(_: dict = Depends(get_current_admin)):
    """Get all pembimbing"""
    pembimbing_list = await db.pembimbing.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    for pembimbing in pembimbing_list:
        if isinstance(pembimbing['created_at'], str):
            pembimbing['created_at'] = datetime.fromisoformat(pembimbing['created_at'])
    
    return pembimbing_list

@api_router.post("/pembimbing", response_model=PembimbingResponse)
async def create_pembimbing(data: PembimbingCreate, _: dict = Depends(get_current_admin)):
    """Create new pembimbing"""
    # Check if username already exists
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
    """Update pembimbing"""
    pembimbing = await db.pembimbing.find_one({"id": pembimbing_id}, {"_id": 0})
    if not pembimbing:
        raise HTTPException(status_code=404, detail="Pembimbing tidak ditemukan")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    # Hash password if provided
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
    """Delete pembimbing"""
    result = await db.pembimbing.delete_one({"id": pembimbing_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pembimbing tidak ditemukan")
    return {"message": "Pembimbing berhasil dihapus"}

# ==================== ABSENSI ENDPOINTS ====================

@api_router.get("/absensi", response_model=List[AbsensiResponse])
async def get_absensi(
    tanggal: Optional[str] = None,
    santri_id: Optional[str] = None,
    waktu_sholat: Optional[str] = None,
    _: dict = Depends(get_current_admin)
):
    """Get absensi with optional filters"""
    query = {}
    if tanggal:
        query['tanggal'] = tanggal
    if santri_id:
        query['santri_id'] = santri_id
    if waktu_sholat:
        query['waktu_sholat'] = waktu_sholat
    
    absensi_list = await db.absensi.find(query, {"_id": 0}).to_list(10000)
    
    for absensi in absensi_list:
        if isinstance(absensi['waktu_absen'], str):
            absensi['waktu_absen'] = datetime.fromisoformat(absensi['waktu_absen'])
        if isinstance(absensi['created_at'], str):
            absensi['created_at'] = datetime.fromisoformat(absensi['created_at'])
    
    return absensi_list

@api_router.get("/absensi/stats")
async def get_absensi_stats(
    tanggal: Optional[str] = None,
    _: dict = Depends(get_current_admin)
):
    """Get absensi statistics"""
    query = {}
    if tanggal:
        query['tanggal'] = tanggal
    
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

@api_router.delete("/absensi/{absensi_id}")
async def delete_absensi(absensi_id: str, _: dict = Depends(get_current_admin)):
    """Delete absensi record"""
    result = await db.absensi.delete_one({"id": absensi_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Data absensi tidak ditemukan")
    return {"message": "Data absensi berhasil dihapus"}

# ==================== WAKTU SHOLAT ENDPOINTS ====================

@api_router.get("/waktu-sholat", response_model=WaktuSholatResponse)
async def get_waktu_sholat(tanggal: str, _: dict = Depends(get_current_admin)):
    """Get waktu sholat untuk tanggal tertentu (YYYY-MM-DD)"""
    # Check if exists in database
    waktu = await db.waktu_sholat.find_one({"tanggal": tanggal}, {"_id": 0})
    
    if waktu:
        if isinstance(waktu['created_at'], str):
            waktu['created_at'] = datetime.fromisoformat(waktu['created_at'])
        return WaktuSholatResponse(**waktu)
    
    # If not exists, fetch from API
    # Convert YYYY-MM-DD to DD-MM-YYYY for API
    date_parts = tanggal.split('-')
    api_date = f"{date_parts[2]}-{date_parts[1]}-{date_parts[0]}"
    
    prayer_times = await fetch_prayer_times(api_date)
    if not prayer_times:
        raise HTTPException(status_code=500, detail="Gagal mengambil data waktu sholat")
    
    # Save to database
    waktu_obj = WaktuSholat(
        tanggal=tanggal,
        **prayer_times
    )
    doc = waktu_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.waktu_sholat.insert_one(doc)
    
    return WaktuSholatResponse(**waktu_obj.model_dump())

@api_router.post("/waktu-sholat/sync")
async def sync_waktu_sholat(tanggal: str, _: dict = Depends(get_current_admin)):
    """Sync waktu sholat dari API untuk tanggal tertentu"""
    # Convert YYYY-MM-DD to DD-MM-YYYY for API
    date_parts = tanggal.split('-')
    api_date = f"{date_parts[2]}-{date_parts[1]}-{date_parts[0]}"
    
    prayer_times = await fetch_prayer_times(api_date)
    if not prayer_times:
        raise HTTPException(status_code=500, detail="Gagal mengambil data waktu sholat dari API")
    
    # Delete existing and insert new
    await db.waktu_sholat.delete_one({"tanggal": tanggal})
    
    waktu_obj = WaktuSholat(
        tanggal=tanggal,
        **prayer_times
    )
    doc = waktu_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.waktu_sholat.insert_one(doc)
    
    return WaktuSholatResponse(**waktu_obj.model_dump())

# ==================== SETUP & INITIALIZATION ====================

@api_router.get("/")
async def root():
    return {"message": "Absensi Sholat API - Admin Panel"}

@api_router.post("/init/admin")
async def initialize_admin():
    """Initialize default admin (hanya untuk setup awal)"""
    # Check if admin already exists
    existing = await db.admins.find_one({})
    if existing:
        raise HTTPException(status_code=400, detail="Admin sudah ada")
    
    # Create default admin
    admin = Admin(
        username="admin",
        nama="Administrator",
        password_hash=hash_password("admin123")
    )
    
    doc = admin.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.admins.insert_one(doc)
    
    return {"message": "Admin default berhasil dibuat", "username": "admin", "password": "admin123"}

# Include the router in the main app
app.include_router(api_router)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
