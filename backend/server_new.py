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