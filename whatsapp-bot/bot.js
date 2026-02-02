// WhatsApp Daily Report Bot
// Menggunakan @whiskeysockets/baileys untuk mengontrol WhatsApp Web
// Bot ini menerima payload rekap harian dari backend FastAPI dan mengirim
// 1 pesan per wali berisi ringkasan absensi 5 waktu sholat.

const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
require('dotenv').config();

const PORT = process.env.WHATSAPP_BOT_PORT || 4000;

let sock = null;
let isConnected = false;

async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

  sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: ['PesantrenAbsensiBot', 'Chrome', '1.0.0'],
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('=== QR baru, silakan scan dengan WhatsApp di HP Anda ===');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      isConnected = true;
      console.log('WhatsApp terhubung sebagai', sock.user.id);
    } else if (connection === 'close') {
      isConnected = false;
      const shouldReconnect =
        (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Koneksi WhatsApp terputus, reconnect =', shouldReconnect);
      if (shouldReconnect) {
        startWhatsApp().catch((err) => console.error('Gagal reconnect WA:', err));
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

/**
 * Bangun teks pesan rekap harian dari satu DailyWaliReport
 * Struktur report (dari backend):
 * {
 *   wali_nama, wali_nomor, tanggal,
 *   anak: [ { nama, kelas, subuh, dzuhur, ashar, maghrib, isya }, ... ]
 * }
 */
function buildMessage(report) {
  const { wali_nama, tanggal, anak } = report;
  const lines = [];

  lines.push(`Assalamu'alaikum, Bapak/Ibu ${wali_nama}.`);
  lines.push(`Rekap absensi sholat hari ini (${tanggal}):`);
  lines.push('');

  (anak || []).forEach((a, idx) => {
    lines.push(`${idx + 1}) ${a.nama} (${a.kelas || '-'})`);
    lines.push(`   - Subuh   : ${a.subuh}`);
    lines.push(`   - Dzuhur  : ${a.dzuhur}`);
    lines.push(`   - Ashar   : ${a.ashar}`);
    lines.push(`   - Maghrib : ${a.maghrib}`);
    lines.push(`   - Isya    : ${a.isya}`);
    lines.push('');
  });

  lines.push('Terima kasih.');
  return lines.join('\n');
}

function normalizePhoneToJid(phone) {
  if (!phone) return null;
  // Hilangkan spasi dan karakter non-digit kecuali leading +
  let cleaned = phone.toString().trim();
  if (cleaned.startsWith('0')) {
    // Asumsi Indonesia: ganti 0 -> +62
    cleaned = '+62' + cleaned.slice(1);
  }
  cleaned = cleaned.replace(/[^\d+]/g, '');
  if (!cleaned) return null;
  if (cleaned.endsWith('@s.whatsapp.net')) return cleaned;
  return `${cleaned}@s.whatsapp.net`;
}

async function sendReportBatch(batch) {
  if (!sock || !isConnected) {
    throw new Error('WhatsApp belum terhubung. Jalankan bot dan scan QR terlebih dahulu.');
  }

  const reports = batch.reports || [];
  for (const rep of reports) {
    const jid = normalizePhoneToJid(rep.wali_nomor);
    if (!jid) {
      console.warn('Nomor wali tidak valid, dilewati:', rep.wali_nomor);
      continue;
    }

    const text = buildMessage(rep);
    console.log('Mengirim pesan ke', jid);
    await sock.sendMessage(jid, { text });
  }

  return { sent: reports.length };
}

// ---------------------- Express HTTP API ----------------------

const app = express();
app.use(cors());
app.use(express.json());

// Cek status bot
app.get('/status', (req, res) => {
  res.json({
    connected: isConnected,
    user: sock?.user || null,
  });
});

// Endpoint yang dipanggil backend FastAPI
// Payload mengikuti DailyWaliReportBatch dari backend
app.post('/api/send-daily-report', async (req, res) => {
  try {
    const batch = req.body;
    if (!batch || !Array.isArray(batch.reports)) {
      return res.status(400).json({ ok: false, error: 'Payload tidak valid' });
    }

    const result = await sendReportBatch(batch);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error('Gagal mengirim batch WA:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`WhatsApp Daily Report Bot listening on port ${PORT}`);
  startWhatsApp().catch((err) => console.error('Gagal start WhatsApp:', err));
});
