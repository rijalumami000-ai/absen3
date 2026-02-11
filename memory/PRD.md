# Absensi Pesantren - Multi-Module Attendance System

## Original Problem Statement
Bangun sistem absensi terpadu untuk pesantren yang mencakup absensi sholat, Madrasah Diniyah (Madin), Madrasah Aliyah, dan Pendidikan Murottilil Qur'an (PMQ). Sistem harus menyediakan admin panel untuk manajemen data serta beberapa PWA untuk pengabsen, wali santri, dan pembimbing.

## User Personas
1. **Super Admin/Admin**: Mengelola semua data dan konfigurasi.
2. **Pengabsen Sholat**: Petugas absensi sholat berbasis QR.
3. **Wali Santri**: Orang tua/wali memantau kehadiran.
4. **Pembimbing**: Monitoring statistik absensi sholat (read-only).
5. **Pengabsen Kelas Madin**: Petugas absensi Madrasah Diniyah.
6. **Pengabsen Aliyah**: Petugas absensi Madrasah Aliyah.
7. **Monitoring Aliyah**: Pengawas kehadiran Aliyah.
8. **Pengabsen PMQ**: Petugas absensi PMQ (QR + manual).

## Core Requirements
### Admin Web App
- Auth berbasis JWT dengan role: `superadmin`, `pesantren`, `madin`, `aliyah`, `pmq`.
- CRUD Santri + QR Code.
- Manajemen Asrama, Pengabsen, Pembimbing.
- Madrasah Diniyah: Kelas, Siswa, Riwayat Absensi.
- Madrasah Aliyah: Kelas, Siswa, Pengabsen, Monitoring, Riwayat.
- PMQ: Tingkatan, Kelompok, Siswa, Pengabsen, Riwayat, Setting Waktu.
- Export PDF untuk laporan/daftar tertentu.

### PWA
- **Pengabsen Sholat**: Scan QR, update status manual, riwayat.
- **Wali Santri**: Dashboard kehadiran, riwayat kalender, notifikasi.
- **Pembimbing**: Statistik kehadiran, filter waktu sholat.
- **Pengabsen Kelas Madin**: Absensi kelas Madin.
- **Pengabsen Aliyah**: Absensi pagi/dzuhur + riwayat.
- **Monitoring Aliyah**: Monitoring read-only.
- **Pengabsen PMQ**: Bottom navigation, scan QR, manual status, riwayat.

### Notifikasi
- FCM untuk wali santri (template dapat diatur admin).

## Tech Stack
- **Backend**: FastAPI, Python 3.11, Motor (MongoDB)
- **Frontend**: React 19, React Router, Axios, Tailwind CSS, Shadcn/UI
- **Database**: MongoDB
- **External APIs**: Al-Adhan (waktu sholat), Firebase Cloud Messaging

## Key Endpoints (High-Level)
- Auth: `/api/auth/login`, `/api/init/admin`
- PMQ: `/api/pmq/tingkatan`, `/api/pmq/kelompok`, `/api/pmq/siswa`, `/api/pmq/pengabsen`, `/api/pmq/absensi/riwayat`
- PWA PMQ: `/api/pmq/pengabsen/absensi-hari-ini`, `/api/pmq/pengabsen/absensi`, `/api/pmq/pengabsen/absensi/scan`, `/api/pmq/pengabsen/riwayat`

## Database Collections (High-Level)
- `admins`, `asrama`, `santri`, `wali_santri`, `pengabsen`, `pembimbing`
- `kelas`, `siswa_madrasah`, `siswa_aliyah`, `siswa_pmq`
- `pmq_kelompok`, `pengabsen_pmq`, `absensi_pmq`, `absensi_aliyah`, `absensi_madrasah`
- `settings`

## What's Implemented (Latest)
- **2026-02-05**: Perbaikan QR scan PMQ (tanggal mengikuti pilihan user) + uji endpoint scan berhasil.
- **2026-02-05**: Perbaikan input manual PMQ (normalisasi kelompok tanpa ID + notifikasi error/sukses).
- **2026-02-05**: Portal login pengabsen terpusat (/pengabsen-portal) + redirect dari semua login PWA pengabsen.
- **2026-02-05**: Penambahan logo institusi pada portal pengabsen & branding admin (Master Absensi).
- **2026-02-05**: Logo ditambahkan ke kartu dashboard + menu waktu sholat pengabsen menjadi bottom nav berikon.
- **2026-02-05**: Dashboard menampilkan logo tiap institusi + navigasi waktu sholat pengabsen menggunakan icon menu bawah.
- **2026-02-05**: Menu waktu sholat dipindah ke bawah (offset) + tombol Riwayat di sisi kanan.
- **2026-02-05**: Batas tinggi daftar santri diperketat agar tidak menabrak menu bawah.
- **2026-02-05**: Halaman rekap WhatsApp wali + template pesan WhatsApp.
- **2026-02-05**: History WhatsApp + pencatatan kirim otomatis; daftar rekap mengecualikan yang sudah dikirim.
- **2026-02-05**: History WhatsApp kini bisa kirim ulang + tombol kembali ke rekap.
- **2026-02-05**: Login admin diperbarui (judul/subjudul) + logo institusi.
- **2026-02-05**: Logo login diperbesar + transparansi logo Al-Hamid diperkuat; history WA bisa kirim ulang.
- **2026-02-05**: Resend WhatsApp history diperbaiki + logo login diperbesar & di-crop agar lebih transparan.
- **2026-02-05**: Mode NFC untuk absensi sholat (backend + PWA) + registrasi NFC di Database Santri.
- **2026-02-05**: Perbaikan resend WhatsApp popup + UX NFC Android (status & NDEF info) + perbaikan blend logo.
- **2026-02-05**: Layout Kelas Aliyah disamakan dengan Kelas Madrasah Diniyah (card grid).
- **2026-02-05**: Edit Kelompok PMQ (UI + endpoint PUT /pmq/kelompok/{id}).
- **2026-02-05**: Filter status Riwayat PMQ dipindah ke atas tabel (seperti Aliyah).
- **2026-02-05**: Verifikasi halaman Siswa Aliyah tidak error (screenshot).

## Prioritized Backlog
### P0
- Verifikasi ulang riwayat absensi PWA Aliyah (isu lama, data kadang tidak tampil).

### P1
- Konversi PWA menjadi aplikasi Android native.
- Dark mode global.

### P2
- WhatsApp notification (parked).
- NFC/RFID attendance (parked).

## Next Action Items
- Minta user memverifikasi portal login pengabsen baru.
- Validasi apakah riwayat PWA Aliyah tampil konsisten setelah pengisian absensi.

## Notes
- Endpoint `/api/init/admin` perlu dipanggil di environment deployment untuk seed akun admin multi-role.
- Token PWA disimpan per role (contoh: `pengabsen_pmq_token`).
