# WhatsApp Daily Report Bot (Baileys)

Bot ini menggunakan **@whiskeysockets/baileys** untuk mengontrol WhatsApp Web dan
mengirim **rekap absensi sholat harian** ke wali santri.

Bot DIJALANKAN TERPISAH dari backend FastAPI, tetapi sudah berada di repo yang sama
(direktori `whatsapp-bot/`). Backend akan mengirim payload harian ke bot ini.

> PERHATIAN: Pendekatan ini menggunakan WhatsApp Web secara tidak resmi (bukan
> WhatsApp Business API). Ada risiko akun diblokir jika dianggap spam oleh WhatsApp.
> Disarankan memakai nomor khusus yang hanya untuk bot.

---

## 1. Struktur integrasi dengan backend

Backend FastAPI sudah menyediakan endpoint:

```http
POST /api/notifications/whatsapp/daily-report
```

Endpoint tersebut akan membangun payload dengan struktur:

```json
{
  "tanggal": "YYYY-MM-DD",
  "reports": [
    {
      "wali_nama": "Bapak Ahmad",
      "wali_nomor": "+62812xxxx",
      "tanggal": "YYYY-MM-DD",
      "anak": [
        {
          "nama": "Rizki",
          "kelas": "Asrama A / XI IPA 1",
          "subuh": "hadir",
          "dzuhur": "hadir",
          "ashar": "alfa",
          "maghrib": "hadir",
          "isya": "hadir"
        }
      ]
    }
  ]
}
```

Bot ini expose HTTP endpoint:

```http
POST /api/send-daily-report
```

Backend harus mengisi ENV berikut di `backend/.env`:

```env
WHATSAPP_BOT_URL=http://localhost:4000/api/send-daily-report
```

Sehingga ketika admin memanggil `/api/notifications/whatsapp/daily-report`, backend
akan mengirim payload di atas ke bot ini.

---

## 2. Cara menjalankan bot (lokal)

1. Pastikan **Node.js 18+** sudah terinstal di mesin ini.

2. Masuk ke folder bot:

```bash
cd whatsapp-bot
```

3. Install dependencies (gunakan **yarn**, jangan npm):

```bash
yarn install
```

4. Jalankan bot:

```bash
yarn start
```

5. Di terminal akan muncul QR code. Scan QR tersebut menggunakan WhatsApp di HP
   untuk login:
   - Buka WhatsApp → Setelan/Settings → Perangkat tertaut / Linked Devices → Tautkan
     perangkat / Link a Device → scan QR di terminal.

6. Jika berhasil, di terminal akan muncul pesan seperti:

```text
WhatsApp terhubung sebagai 62812xxxx@s.whatsapp.net
```

Bot sekarang siap menerima payload dari backend.

---

## 3. Format pesan yang dikirim ke wali

Untuk setiap wali, bot akan mengirim pesan teks seperti:

```text
Assalamu'alaikum, Bapak/Ibu {wali_nama}.
Rekap absensi sholat hari ini ({tanggal}):

1) {nama_anak} ({kelas})
   - Subuh   : {status_subuh}
   - Dzuhur  : {status_dzuhur}
   - Ashar   : {status_ashar}
   - Maghrib : {status_maghrib}
   - Isya    : {status_isya}

2) ...

Terima kasih.
```

Semua status (hadir/alfa/izin/sakit/...) akan ditampilkan apa adanya sesuai data di backend.

---

## 4. Alur penggunaan harian (manual)

1. Jalankan backend & frontend seperti biasa (via supervisor di lingkungan Emergent).
2. Jalankan bot WhatsApp (sekali saja) dan pastikan status **connected**.
3. Dari sisi admin (sementara via curl/Postman):

   ```bash
   # Ganti TOKEN_ADMIN dengan token JWT admin
   API_URL=<REACT_APP_BACKEND_URL dari frontend/.env>

   curl -X POST "$API_URL/api/notifications/whatsapp/daily-report" \
     -H "Authorization: Bearer TOKEN_ADMIN" \
     -H "Content-Type: application/json"
   ```

4. Backend akan menyusun rekap untuk tanggal hari ini dan memanggil bot di
   `WHATSAPP_BOT_URL`. Bot kemudian mengirimkan 1 pesan per wali.

Nanti bisa ditambahkan tombol di halaman admin untuk memicu endpoint tersebut.

---

## 5. Catatan penting & keterbatasan

- Bot menggunakan **WhatsApp Web** (Baileys), **BUKAN** API resmi WhatsApp Business.
  - Resiko: akun bisa dibatasi/blokir jika dianggap spam.
  - Solusi: gunakan nomor khusus, batasi frekuensi (misal 1 pesan per wali per hari).
- Session login disimpan di folder `auth_info/` di dalam `whatsapp-bot/`. Jangan commit
  folder ini ke Git publik.
- Bot harus terus berjalan (terminal tidak ditutup) agar tetap terhubung ke WhatsApp.
- Jika koneksi terputus, bot akan mencoba reconnect otomatis. Jika login kadaluarsa,
  terminal akan menampilkan QR lagi untuk di-scan ulang.

---

Dengan setup ini, seluruh logika kompleks WhatsApp (Baileys) sudah berada dalam repo
ini, tapi tetap terpisah dari backend FastAPI sehingga backend Anda tetap bersih dan
mudah di-maintain.
