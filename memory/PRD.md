# Absensi Sholat - Prayer Attendance Application

## Original Problem Statement
Build a comprehensive prayer attendance application for a school (Pesantren). The system includes:
- **Admin Web App**: Manage all entities (students, dormitories, staff), generate QR codes, and view attendance history
- **Attendant App (Pengabsen PWA)**: Scan student QR codes to record attendance
- **Guardian App (Wali Santri PWA)**: View their child's attendance and receive real-time notifications
- **Supervisor App (Pembimbing PWA)**: Monitor attendance for managed asrama

## User Personas
1. **Admin**: School administrator who manages the system
2. **Pengabsen (Attendant)**: Staff responsible for recording prayer attendance
3. **Wali Santri (Guardian)**: Parents/guardians who want to monitor their child's attendance
4. **Pembimbing (Supervisor)**: Teachers/mentors who oversee students in specific dormitories

## Core Requirements

### Phase 1 - Admin Web App ✅ COMPLETED
- [x] Authentication system (JWT-based)
- [x] CRUD for Asrama (Dormitories)
- [x] CRUD for Santri (Students) with QR code generation
- [x] CRUD for Wali Santri (Guardians) - auto-generated from Santri data
- [x] CRUD for Pengabsen (Attendants)
- [x] CRUD for Pembimbing (Supervisors) with kode_akses management
- [x] Attendance history view with filters
- [x] Prayer times integration (Al-Adhan API)
- [x] Excel import/export for Santri data
- [x] WhatsApp message generation for Wali credentials

### Phase 2 - Pengabsen PWA ✅ COMPLETED
- [x] Login authentication
- [x] QR code scanning with @yudiel/react-qr-scanner
- [x] Manual status update (hadir, alfa, sakit, izin, haid, istihadhoh)
- [x] History view for recorded attendance
- [x] Students grouped by dormitory

### Phase 3 - Wali Santri PWA ✅ COMPLETED
- [x] Login with default password (12345)
- [x] Dashboard showing current day's attendance status
- [x] Historical view with calendar grid UI
- [x] "Dicatat oleh" (recorded by) information displayed

### Phase 4 - Push Notifications ✅ COMPLETED (Jan 21, 2026)
- [x] Firebase Cloud Messaging (FCM) integration
- [x] Backend: firebase-admin SDK v7.1 with send_each()
- [x] Frontend: Firebase Web SDK for token generation
- [x] Service worker for background notifications
- [x] FCM token registration endpoint
- [x] Notification triggered on attendance update
- [x] Admin settings page for notification templates
- [x] Customizable message templates with {nama} and {waktu} placeholders
- **Status**: Ready to use on real devices

### Phase 5 - Pembimbing PWA ✅ COMPLETED (Jan 21, 2026)
- [x] Login with username and kode_akses (9-digit access code)
- [x] Dashboard with today's attendance statistics
- [x] Santri list grouped by asrama
- [x] Filter by waktu sholat (subuh, dzuhur, ashar, maghrib, isya)
- [x] History tab with month/day picker
- [x] Admin can view and regenerate kode_akses
- [x] Read-only access (cannot modify attendance)

## Tech Stack
- **Backend**: FastAPI, Python 3.11, Motor (async MongoDB), firebase-admin
- **Frontend**: React 19, React Router, Axios, Tailwind CSS, Shadcn/UI
- **Database**: MongoDB
- **External APIs**: Al-Adhan (prayer times), Firebase Cloud Messaging

## API Endpoints Summary

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/pengabsen/login` - Pengabsen login
- `POST /api/wali/login` - Wali login
- `POST /api/pembimbing/login` - Pembimbing login (username + kode_akses)

### Admin Resources
- `/api/asrama` - CRUD for dormitories
- `/api/santri` - CRUD for students
- `/api/wali` - Read/Update for guardians
- `/api/pengabsen` - CRUD for attendants
- `/api/pembimbing` - CRUD for supervisors (includes kode_akses)
- `/api/pembimbing/{id}/regenerate-kode-akses` - Regenerate access code
- `/api/absensi` - Attendance records
- `/api/waktu-sholat` - Prayer times
- `/api/settings/wali-notifikasi` - Notification templates

### PWA Endpoints
- `/api/pengabsen/absensi` - Record attendance (triggers FCM)
- `/api/pengabsen/santri-absensi-hari-ini` - Get today's attendance
- `/api/pengabsen/riwayat` - Attendance history
- `/api/wali/anak-absensi-hari-ini` - Get child's today attendance
- `/api/wali/anak-absensi-riwayat` - Get child's attendance history
- `/api/wali/fcm-token` - Register FCM token
- `/api/pembimbing/me` - Get pembimbing info
- `/api/pembimbing/santri-absensi-hari-ini` - Get santri attendance
- `/api/pembimbing/absensi-riwayat` - Get historical attendance
- `/api/pembimbing/statistik` - Get attendance statistics

## Database Collections
- `admins` - Admin users
- `asrama` - Dormitories
- `santri` - Students (with QR codes, wali info)
- `wali_santri` - Guardians (auto-synced, includes fcm_tokens)
- `pengabsen` - Attendants
- `pembimbing` - Supervisors (with kode_akses instead of password)
- `absensi` - Attendance records
- `waktu_sholat` - Prayer times cache
- `settings` - App settings (notification templates)

## PWA URLs
- `/pengabsen-app` - Pengabsen PWA
- `/wali-app` - Wali Santri PWA
- `/pembimbing-app` - Pembimbing PWA

## Test Credentials
- **Admin**: admin / admin123
- **Wali Santri**: vvvvvvvv / 12345 (or any wali username)
- **Pengabsen**: anwar / password123
- **Pembimbing**: Wafa / 258064095 (kode_akses may change if regenerated)

## Backlog / Future Tasks
1. [ ] Offline support for PWAs
2. [ ] Push notification delivery confirmation/tracking
3. [ ] Monthly/weekly attendance reports
4. [ ] Attendance statistics and analytics dashboard
5. [ ] Multi-language support (Arabic, English)
6. [ ] Bulk attendance recording feature
7. [ ] Export attendance report to PDF

## Notes
- FCM notifications work when Wali PWA is installed on real devices
- Pembimbing uses kode_akses (9-digit) instead of password for easier sharing
- Default wali password is "12345" for all guardians
- kode_akses can be regenerated by admin at any time
