# 🕌 Aplikasi Absensi Sholat 5 Waktu

Sistem absensi sholat berbasis QR Code untuk Pondok Pesantren/Sekolah dengan fitur lengkap manajemen santri, pengabsen, wali santri, dan pembimbing.

## 📋 Fitur Utama

### Admin Web (Dashboard)
✅ **Login & Autentikasi** - JWT-based authentication  
✅ **Dashboard** - Statistik absensi real-time  
✅ **Kelola Asrama** - CRUD asrama putra & putri  
✅ **Kelola Santri** - CRUD santri + Generate QR Code otomatis  
✅ **Kelola Wali Santri** - Manajemen akun wali santri  
✅ **Kelola Pengabsen** - Manajemen akun pengabsen per asrama  
✅ **Kelola Pembimbing** - Manajemen pembimbing multi-asrama  
✅ **Riwayat Absensi** - View & filter data absensi  
✅ **Waktu Sholat** - Integrasi API waktu sholat Lampung Selatan  

## 🚀 Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **MongoDB** - NoSQL database with Motor (async driver)
- **JWT** - Token-based authentication
- **QRCode** - QR code generation
- **Aladhan API** - Prayer times integration
- **Bcrypt** - Password hashing

### Frontend
- **React 19** - UI framework
- **React Router** - Navigation
- **Axios** - HTTP client
- **Radix UI** - Component library
- **Tailwind CSS** - Styling
- **Lucide React** - Icons

## 📦 Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- MongoDB
- Yarn

### Backend Setup
```bash
cd /app/backend
pip install -r requirements.txt
```

### Frontend Setup
```bash
cd /app/frontend
yarn install
```

## 🔧 Configuration

### Backend Environment (.env)
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="absensi_sholat"
CORS_ORIGINS="*"
JWT_SECRET_KEY="your-secret-key-here"
```

### Frontend Environment (.env)
```env
REACT_APP_BACKEND_URL=https://your-backend-url.com
WDS_SOCKET_PORT=443
ENABLE_HEALTH_CHECK=false
```

## 🎯 Running the Application

### Start Backend
```bash
sudo supervisorctl restart backend
```

### Start Frontend
```bash
sudo supervisorctl restart frontend
```

### Check Status
```bash
sudo supervisorctl status
```

## 👤 Default Admin Credentials

**Username:** `admin`  
**Password:** `admin123`

⚠️ **Penting:** Ganti password default setelah login pertama kali!

## 📱 API Endpoints

### Authentication
- `POST /api/auth/login` - Login admin
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout
- `POST /api/init/admin` - Initialize default admin (first time only)

### Asrama
- `GET /api/asrama` - Get all asrama
- `POST /api/asrama` - Create asrama
- `PUT /api/asrama/{id}` - Update asrama
- `DELETE /api/asrama/{id}` - Delete asrama

### Santri
- `GET /api/santri` - Get all santri (with filters)
- `POST /api/santri` - Create santri (auto-generate QR)
- `GET /api/santri/{id}/qr-code` - Get QR code image
- `PUT /api/santri/{id}` - Update santri
- `DELETE /api/santri/{id}` - Delete santri

### Wali Santri
- `GET /api/wali` - Get all wali santri
- `POST /api/wali` - Create wali santri
- `PUT /api/wali/{id}` - Update wali santri
- `DELETE /api/wali/{id}` - Delete wali santri

### Pengabsen
- `GET /api/pengabsen` - Get all pengabsen
- `POST /api/pengabsen` - Create pengabsen
- `PUT /api/pengabsen/{id}` - Update pengabsen
- `DELETE /api/pengabsen/{id}` - Delete pengabsen

### Pembimbing
- `GET /api/pembimbing` - Get all pembimbing
- `POST /api/pembimbing` - Create pembimbing
- `PUT /api/pembimbing/{id}` - Update pembimbing
- `DELETE /api/pembimbing/{id}` - Delete pembimbing

### Absensi
- `GET /api/absensi` - Get absensi records (with filters)
- `GET /api/absensi/stats` - Get absensi statistics
- `DELETE /api/absensi/{id}` - Delete absensi record

### Waktu Sholat
- `GET /api/waktu-sholat?tanggal=YYYY-MM-DD` - Get prayer times
- `POST /api/waktu-sholat/sync?tanggal=YYYY-MM-DD` - Sync from API

## 🎨 Features Detail

### QR Code System
- Setiap santri mendapat QR code unik saat dibuat
- QR code berformat JSON: `{santri_id, nama, nis}`
- QR code dapat didownload sebagai PNG
- QR code bersifat permanen (tidak berubah)

### Status Absensi
- **Hadir** - Santri hadir tepat waktu
- **Alfa** - Tidak hadir tanpa keterangan
- **Sakit** - Tidak hadir karena sakit
- **Izin** - Tidak hadir dengan izin
- **Haid** - Khusus santri putri
- **Istihadhoh** - Khusus santri putri

### Waktu Sholat
- Data dari Aladhan API
- Lokasi: Desa Cintamulya, Candipuro, Lampung Selatan
- Auto-sync saat pertama dibuka
- Manual sync tersedia

### Role Management
1. **Admin** - Full access ke semua fitur
2. **Pengabsen** - Scan QR & absen santri (per asrama)
3. **Wali Santri** - View absensi anak
4. **Pembimbing** - View absensi multi-asrama

## 🗃️ Database Schema

### Collections

**admins**
```json
{
  "id": "uuid",
  "username": "string",
  "nama": "string",
  "password_hash": "string",
  "created_at": "datetime"
}
```

**santri**
```json
{
  "id": "uuid",
  "nama": "string",
  "nis": "string",
  "gender": "putra|putri",
  "asrama_id": "uuid",
  "wali_id": "uuid (optional)",
  "qr_code": "base64_string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

**asrama**
```json
{
  "id": "uuid",
  "nama": "string",
  "gender": "putra|putri",
  "kapasitas": "integer",
  "created_at": "datetime"
}
```

**wali_santri**
```json
{
  "id": "uuid",
  "nama": "string",
  "username": "string",
  "password_hash": "string",
  "nomor_hp": "string",
  "email": "string (optional)",
  "created_at": "datetime"
}
```

**pengabsen**
```json
{
  "id": "uuid",
  "nama": "string",
  "nip": "string",
  "username": "string",
  "password_hash": "string",
  "asrama_id": "uuid",
  "created_at": "datetime"
}
```

**pembimbing**
```json
{
  "id": "uuid",
  "nama": "string",
  "username": "string",
  "password_hash": "string",
  "asrama_ids": ["uuid"],
  "created_at": "datetime"
}
```

**absensi**
```json
{
  "id": "uuid",
  "santri_id": "uuid",
  "waktu_sholat": "subuh|dzuhur|ashar|maghrib|isya",
  "status": "hadir|alfa|sakit|izin|haid|istihadhoh",
  "tanggal": "YYYY-MM-DD",
  "waktu_absen": "datetime",
  "pengabsen_id": "uuid (optional)",
  "created_at": "datetime"
}
```

**waktu_sholat**
```json
{
  "id": "uuid",
  "tanggal": "YYYY-MM-DD",
  "subuh": "HH:MM",
  "dzuhur": "HH:MM",
  "ashar": "HH:MM",
  "maghrib": "HH:MM",
  "isya": "HH:MM",
  "lokasi": "Lampung Selatan",
  "created_at": "datetime"
}
```

## 🧪 Testing

### Test API Endpoints
```bash
# Login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Get Santri
curl http://localhost:8001/api/santri \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Access Frontend
```
http://localhost:3000
```

## 📊 Current Status

✅ **Backend** - Fully functional dengan 20+ endpoints  
✅ **Frontend** - Admin Web complete dengan 8 pages  
✅ **Authentication** - JWT working  
✅ **QR Generation** - Working  
✅ **Prayer Times API** - Integrated  
✅ **Database** - MongoDB connected  

## 🔮 Roadmap (Phase 2 & Beyond)

### Aplikasi Pengabsen (Mobile PWA)
- [ ] Login pengabsen
- [ ] QR Scanner
- [ ] Absen santri real-time
- [ ] Offline capability

### Aplikasi Wali Santri (Mobile PWA)
- [ ] Login wali
- [ ] View absensi harian/bulanan
- [ ] Push notifications
- [ ] Export laporan

### Aplikasi Pembimbing (Mobile PWA)
- [ ] Login pembimbing
- [ ] View absensi per asrama
- [ ] Notifikasi alfa
- [ ] Dashboard statistik

### Additional Features
- [ ] Export Excel/PDF
- [ ] Email notifications
- [ ] WhatsApp integration
- [ ] Advanced analytics
- [ ] Mobile app (React Native)

## 🛠️ Troubleshooting

### Backend tidak start
```bash
# Check logs
tail -f /var/log/supervisor/backend.err.log

# Restart
sudo supervisorctl restart backend
```

### Frontend tidak load
```bash
# Check logs
tail -f /var/log/supervisor/frontend.err.log

# Restart
sudo supervisorctl restart frontend
```

### Database connection error
```bash
# Check MongoDB
sudo systemctl status mongod

# Start MongoDB
sudo systemctl start mongod
```

## 👨‍💻 Development

### Add New Feature
1. Backend: Add endpoint di `server.py`
2. Frontend: Add API call di `lib/api.js`
3. Frontend: Create/update component/page
4. Test dengan curl atau Postman
5. Test UI di browser

### Code Structure
```
/app/
├── backend/
│   ├── server.py           # Main FastAPI app
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Backend config
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Route pages
│   │   ├── contexts/      # React contexts
│   │   ├── lib/           # Utilities & API
│   │   └── hooks/         # Custom hooks
│   ├── package.json       # Node dependencies
│   └── .env              # Frontend config
└── README.md
```

## 📝 License

This project is for educational purposes.

## 🤝 Support

Untuk bantuan atau pertanyaan:
- Create issue di repository
- Contact: [your-email]

---

**Made with ❤️ for Islamic Education**

الحمد لله
