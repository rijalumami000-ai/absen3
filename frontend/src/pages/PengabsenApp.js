import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePengabsenAuth } from '@/contexts/PengabsenAuthContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { pengabsenAppAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Sunrise, Sun, CloudSun, Sunset, MoonStar, History, ChevronDown, ChevronRight } from 'lucide-react';

const WAKTU_OPTIONS = [
  { value: 'subuh', label: 'Subuh' },
  { value: 'dzuhur', label: 'Dzuhur' },
  { value: 'ashar', label: 'Ashar' },
  { value: 'maghrib', label: 'Maghrib' },
  { value: 'isya', label: 'Isya' },
];

const WAKTU_MENU = [
  { value: 'subuh', label: 'Subuh', icon: Sunrise },
  { value: 'dzuhur', label: 'Dzuhur', icon: Sun },
  { value: 'ashar', label: 'Ashar', icon: CloudSun },
  { value: 'maghrib', label: 'Maghrib', icon: Sunset },
  { value: 'isya', label: 'Isya', icon: MoonStar },
];

const STATUS_OPTIONS = [
  { value: 'null', label: 'Belum' },
  { value: 'hadir', label: 'Hadir' },
  { value: 'alfa', label: 'Alfa' },
  { value: 'sakit', label: 'Sakit' },
  { value: 'izin', label: 'Izin' },
  { value: 'haid', label: 'Haid' },
  { value: 'istihadhoh', label: 'Istihadhoh' },
  { value: 'masbuq', label: 'Masbuq' },
];

const PengabsenApp = () => {
  const { user, loading, logout } = usePengabsenAuth();
  const { appSettings } = useAppSettings();
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'history'
  const [searchQuery, setSearchQuery] = useState('');
  const [waktu, setWaktu] = useState('maghrib');
  const [data, setData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [inputMode, setInputMode] = useState('qr');
  const [nfcValue, setNfcValue] = useState('');
  const [nfcSupported, setNfcSupported] = useState(false);
  const [nfcScanning, setNfcScanning] = useState(false);
  const [nfcStatus, setNfcStatus] = useState('');
  const nfcInputRef = useRef(null);
  const nfcReaderRef = useRef(null);
  const [lastScan, setLastScan] = useState(null);
  const [lastScanAt, setLastScanAt] = useState(0);
  const [showScanSuccess, setShowScanSuccess] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyWaktuFilter, setHistoryWaktuFilter] = useState('all'); // all | subuh | dzuhur | ashar | maghrib | isya
  const getTodayLocalYMD = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  const [historyStart, setHistoryStart] = useState(() => getTodayLocalYMD());
  const [historyEnd, setHistoryEnd] = useState(() => getTodayLocalYMD());
  const [historyDetail, setHistoryDetail] = useState(null);
  const [loadingHistoryDetail, setLoadingHistoryDetail] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/pengabsen-portal');
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    setNfcSupported(typeof window !== 'undefined' && 'NDEFReader' in window);
  }, []);

  const loadData = async (waktuSholat) => {
    try {
      setLoadingData(true);
      const resp = await pengabsenAppAPI.listHariIni({ waktu_sholat: waktuSholat });
      setData(resp.data.data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat data absensi',
        variant: 'destructive',
      });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData(waktu);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, waktu]);

  const handleStatusChange = async (santriId, status) => {
    try {
      if (status === 'null') {
        await pengabsenAppAPI.deleteAbsensi({ santri_id: santriId, waktu_sholat: waktu });
      } else {
        await pengabsenAppAPI.upsertAbsensi({
          santri_id: santriId,
          waktu_sholat: waktu,
          status_absen: status,
        });
      }
      await loadData(waktu);
      toast({ title: 'Sukses', description: 'Status absensi diperbarui' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Gagal memperbarui status',
        variant: 'destructive',
      });
    }
  };

  const normalizeNfcUid = (raw) => {
    if (!raw) return '';
    const value = raw.toString().trim();

    // Jika hanya berisi angka, anggap ini format decimal langsung dari reader USB
    if (/^\d+$/.test(value)) {
      return value;
    }

    // Selain itu, anggap sebagai representasi hex (misalnya "c1:dd:23:e2")
    const hex = value.toUpperCase().replace(/[^0-9A-F]/g, '');
    if (!hex) return '';

    // Bagi menjadi byte (2 digit), lalu balik urutan byte untuk samakan dengan reader USB
    const bytes = hex.match(/.{1,2}/g) || [hex];
    const reversedHex = bytes.reverse().join('');

    // Konversi ke decimal string
    try {
      const dec = BigInt('0x' + reversedHex).toString();
      return dec;
    } catch (e) {
      console.error('Gagal mengonversi UID hex ke desimal', e, { hex, reversedHex });
      return '';
    }
  };

  const handleNfcSubmit = async (rawValue) => {
    const raw = (rawValue || '').trim();
    const nfcUid = normalizeNfcUid(raw);
    if (!nfcUid) {
      toast({ title: 'NFC kosong', description: 'Tempelkan kartu NFC terlebih dahulu.', variant: 'destructive' });
      return;
    }
    try {
      await pengabsenAppAPI.nfcAbsensi({
        nfc_uid: nfcUid,
        waktu_sholat: waktu,
        status: 'hadir',
      });
      setNfcValue('');
      await loadData(waktu);
      setNfcStatus(`UID terbaca & cocok: ${nfcUid}`);
      toast({ title: 'NFC berhasil', description: 'Absensi tercatat dari kartu NFC.' });
    } catch (error) {
      console.error('NFC submit error', error);
      setNfcStatus('Gagal mencocokkan UID dengan data santri.');
      toast({
        title: 'NFC gagal',
        description: error.response?.data?.detail || 'Gagal mencatat absensi NFC. Pastikan kartu sudah didaftarkan.',
        variant: 'destructive',
      });
    }
  };

  const startNfcScan = async () => {
    if (!nfcSupported) {
      toast({ title: 'NFC tidak tersedia', description: 'Perangkat ini belum mendukung Web NFC.', variant: 'destructive' });
      return;
    }
    try {
      setNfcScanning(true);
      const reader = new window.NDEFReader();
      nfcReaderRef.current = reader;
      await reader.scan();
      setNfcStatus('Menunggu kartu NFC...');
      toast({ title: 'NFC aktif', description: 'Tempelkan kartu NFC ke perangkat.' });
      reader.onreading = (event) => {
        try {
          console.log('NFC onreading event', event);
          // 1) Prioritas: gunakan serialNumber (UID kartu) bila tersedia
          const serial = event.serialNumber || '';
          if (serial) {
            setNfcStatus(`UID terbaca: ${serial}`);
            handleNfcSubmit(serial);
            setNfcScanning(false);
            return;
          }

          // 2) Kalau tidak ada serial, coba baca seluruh record NDEF sebagai teks
          if (event.message?.records?.length) {
            for (const record of event.message.records) {
              if (record.recordType === 'text') {
                const textDecoder = new TextDecoder(record.encoding || 'utf-8');
                const text = textDecoder.decode(record.data || new ArrayBuffer(0));
                if (text) {
                  setNfcStatus(`Data NDEF terbaca: ${text}`);
                  handleNfcSubmit(text);
                  setNfcScanning(false);
                  return;
                }
              }
            }
          }

          // 3) Kalau tetap tidak ada data yang bisa dipakai
          setNfcStatus('Kartu NFC tidak berisi UID / teks yang bisa dibaca.');
          toast({
            title: 'NFC tidak terbaca',
            description: 'Pastikan kartu NFC berisi UID yang didukung atau data teks (NDEF).',
            variant: 'destructive',
          });
        } catch (err) {
          console.error('Error saat memproses NFC event', err);
          setNfcStatus('Terjadi kesalahan saat membaca NFC.');
          toast({
            title: 'NFC gagal',
            description: 'Terjadi kesalahan saat memproses data NFC.',
            variant: 'destructive',
          });
        } finally {
          setNfcScanning(false);
        }
      };
      reader.onreadingerror = (ev) => {
        console.warn('NFC reading error', ev);
        setNfcStatus('Gagal membaca kartu NFC.');
        toast({ title: 'NFC gagal', description: 'Tidak bisa membaca kartu NFC.', variant: 'destructive' });
        setNfcScanning(false);
      };
    } catch (error) {
      console.error('Gagal mengaktifkan NFC', error);
      setNfcStatus('Tidak bisa mengaktifkan NFC.');
      toast({
        title: 'NFC gagal',
        description: error?.message || 'Tidak bisa mengaktifkan NFC di perangkat ini.',
        variant: 'destructive',
      });
      setNfcScanning(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Memuat...</div>
      </div>
    );
  }

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const resp = await pengabsenAppAPI.riwayat({ tanggal_start: historyStart, tanggal_end: historyEnd });
      const items = resp.data.items || [];
      setHistoryItems(items);
      if (items.length > 0) {
        // otomatis tampilkan detail kartu pertama
        await loadHistoryDetail(items[0]);
      } else {
        setHistoryDetail(null);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat riwayat absensi',
        variant: 'destructive',
      });
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadHistoryDetail = async (item) => {
    try {
      setLoadingHistoryDetail(true);
      const resp = await pengabsenAppAPI.riwayatDetail({
        tanggal: item.tanggal,
        waktu_sholat: item.waktu_sholat,
        asrama_id: item.asrama_id,
      });
      setHistoryDetail(resp.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat detail riwayat',
        variant: 'destructive',
      });
    } finally {
      setLoadingHistoryDetail(false);
    }
  };

  const totalSantri = data.length;
  const hadirCount = data.filter((row) => row.status === 'hadir').length;
  const belumCount = data.filter((row) => row.status == null).length;

  // Filter data by search query
  const filteredData = data.filter((row) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return row.nama?.toLowerCase().includes(query);
  });

  // Group filtered data by asrama
  const groupedByAsrama = filteredData.reduce((acc, row) => {
    const key = row.asrama_id || 'tanpa-asrama';
    if (!acc[key]) {
      acc[key] = {
        asramaId: row.asrama_id,
        namaAsrama: row.nama_asrama || 'Tanpa Asrama',
        items: [],
      };
    }
    acc[key].items.push(row);
    return acc;
  }, {});

  const groupedList = Object.values(groupedByAsrama);

  const handleOpenHistory = async () => {
    setActiveTab('history');
    await loadHistory();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" data-testid="pengabsen-app-page">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">{appSettings.pengabsen_title || 'Pengabsen Sholat Ponpes Al-Hamid'}</h1>
          <p className="text-xs text-gray-500">{user.nama} (@{user.username})</p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          Logout
        </Button>
      </header>

      <main className="flex-1 p-4 space-y-4 max-w-4xl mx-auto w-full pb-36">
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            data-testid="pengabsen-tab-today"
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              activeTab === 'today'
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Absensi Hari Ini
          </button>
          <button
            type="button"
            onClick={handleOpenHistory}
            data-testid="pengabsen-tab-history"
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              activeTab === 'history'
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Riwayat Saya
          </button>
        </div>

        {activeTab === 'today' && (
          <>
            <section className="bg-white rounded-lg shadow p-4" data-testid="pengabsen-mode-section">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Mode Input Absen</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setInputMode('qr');
                    setScanning(false);
                  }}
                  data-testid="pengabsen-mode-qr"
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    inputMode === 'qr'
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  QR Scan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setInputMode('nfc');
                    setScanning(false);
                    setTimeout(() => nfcInputRef.current?.focus(), 150);
                  }}
                  data-testid="pengabsen-mode-nfc"
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    inputMode === 'nfc'
                      ? 'bg-emerald-500 text-white border-emerald-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  NFC
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Pilih QR untuk scan kamera, atau NFC untuk tempel kartu (USB reader / Android NFC).
              </p>
            </section>

            {inputMode === 'qr' && (
              <section className="bg-white rounded-lg shadow p-4" data-testid="pengabsen-qr-section">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700">Scan QR Santri</h2>
                  <Button
                    variant={scanning ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => setScanning((prev) => !prev)}
                    data-testid="pengabsen-qr-toggle"
                  >
                    {scanning ? 'Stop Kamera' : 'Mulai Scan'}
                  </Button>
                </div>

                {!scanning ? (
                  <p className="text-xs text-gray-500">
                    Tekan tombol <span className="font-semibold">Mulai Scan</span> untuk mengaktifkan kamera dan scan QR
                    santri. Pastikan Anda mengizinkan akses kamera di browser.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div
                      className={`aspect-video max-w-md mx-auto overflow-hidden rounded-xl border bg-black transition-colors duration-300 ${
                        showScanSuccess ? 'border-emerald-500' : 'border-gray-300'
                      }`}
                    >
                      <Scanner
                        onScan={async (detected) => {
                          try {
                            if (!detected || detected.length === 0) return;
                            const code = detected[0];
                            const text = code.rawValue || '';
                            if (!text) return;

                            const parsed = JSON.parse(text);
                            if (!parsed.santri_id) {
                              throw new Error('QR tidak berisi santri_id');
                            }

                            const now = Date.now();
                            if (now - lastScanAt < 1500) {
                              return;
                            }

                            setLastScanAt(now);
                            setShowScanSuccess(true);
                            setTimeout(() => setShowScanSuccess(false), 1000);

                            setLastScan({ raw: text, parsed, waktu });
                            await pengabsenAppAPI.upsertAbsensi({
                              santri_id: parsed.santri_id,
                              waktu_sholat: waktu,
                              status_absen: 'hadir',
                            });
                            await loadData(waktu);
                            toast({
                              title: 'Scan Berhasil',
                              description: `Hadir: ${parsed.nama || 'Santri'} (${parsed.nis || '-'})`,
                            });
                          } catch (e) {
                            console.error(e);
                            toast({
                              title: 'QR tidak valid',
                              description: 'Pastikan QR berasal dari sistem ini.',
                              variant: 'destructive',
                            });
                          }
                        }}
                        onError={(error) => {
                          console.warn(error);
                        }}
                        components={{
                          audio: false,
                        }}
                        styles={{
                          container: { width: '100%', height: '100%' },
                          video: { width: '100%', height: '100%', objectFit: 'cover' },
                        }}
                      />
                    </div>

                    {showScanSuccess && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-emerald-500/80 text-white px-6 py-3 rounded-full text-lg font-bold shadow-lg">
                          HADIR
                        </div>
                      </div>
                    )}

                    {lastScan && (
                      <div className="text-xs text-gray-600 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                        <div className="font-semibold mb-1">Scan terakhir:</div>
                        <div>Nama: {lastScan.parsed.nama}</div>
                        <div>NIS: {lastScan.parsed.nis}</div>
                        <div>Waktu Sholat: {WAKTU_OPTIONS.find((w) => w.value === lastScan.waktu)?.label}</div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {inputMode === 'nfc' && (
              <section className="bg-white rounded-lg shadow p-4" data-testid="pengabsen-nfc-section">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700">Scan NFC Santri</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => nfcInputRef.current?.focus()}
                    data-testid="pengabsen-nfc-focus"
                  >
                    Fokus Input
                  </Button>
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                  <input
                    ref={nfcInputRef}
                    value={nfcValue}
                    onChange={(e) => setNfcValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleNfcSubmit(nfcValue);
                      }
                    }}
                    placeholder="Tempel kartu NFC di reader..."
                    className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                    data-testid="pengabsen-nfc-input"
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={startNfcScan}
                    disabled={!nfcSupported || nfcScanning}
                    data-testid="pengabsen-nfc-start"
                  >
                    {nfcSupported ? (nfcScanning ? 'NFC aktif...' : 'Aktifkan NFC (Android)') : 'NFC tidak tersedia'}
                  </Button>
                  {nfcStatus && (
                    <span className="text-xs text-emerald-700" data-testid="pengabsen-nfc-status">
                      {nfcStatus}
                    </span>
                  )}
                </div>
              </section>
            )}

            <section className="bg-white rounded-lg shadow p-4">
              <div className="flex flex-col gap-3 mb-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-700">Daftar Santri & Status</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Total: <span className="font-semibold">{totalSantri}</span> santri &mdash; Hadir:{' '}
                    <span className="text-emerald-600 font-semibold">{hadirCount}</span> &mdash; Belum:{' '}
                    <span className="text-amber-600 font-semibold">{belumCount}</span>
                  </p>
                </div>
                <div className="w-full md:w-64">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama santri..."
                    className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

          {loadingData ? (
            <div className="py-6 text-center text-gray-500">Memuat data...</div>
          ) : data.length === 0 ? (
            <div className="py-6 text-center text-gray-500 text-sm">
              Belum ada santri untuk asrama yang Anda kelola.
            </div>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto space-y-4 pb-16" data-testid="pengabsen-santri-list">
              {groupedList.map((group) => {
                const groupId = group.asramaId || 'tanpa-asrama';
                const isCollapsed = collapsedGroups[groupId] ?? true;
                return (
                <div key={groupId} className="border rounded-lg overflow-hidden bg-white">
                  <div 
                    className="px-3 py-2 bg-gray-50 border-b flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => setCollapsedGroups(prev => ({...prev, [groupId]: !isCollapsed}))}
                  >
                    <div className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                        {group.namaAsrama?.[0] || 'A'}
                      </span>
                      <span>{group.namaAsrama}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-[10px] text-gray-500">
                        {group.items.length} santri
                      </div>
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                  </div>
                  {!isCollapsed && (
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b text-xs text-gray-500">
                        <tr>
                          <th className="px-3 py-2 text-left">Nama</th>
                          <th className="px-3 py-2 text-left">NIS</th>
                          <th className="px-3 py-2 text-left">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {group.items.map((row) => (
                          <tr key={row.santri_id}>
                            <td className="px-3 py-2 text-gray-800">{row.nama}</td>
                            <td className="px-3 py-2 text-gray-600">{row.nis}</td>
                            <td className="px-3 py-2">
                              <Select
                                value={row.status ?? 'null'}
                                onValueChange={(val) => handleStatusChange(row.santri_id, val)}
                              >
                                <SelectTrigger className="w-32 h-8 text-xs">
                                  <SelectValue placeholder="Pilih status" />
                                </SelectTrigger>
                                <SelectContent>
                                  {STATUS_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </section>
          </>
        )}

        {activeTab === 'history' && (
          <section className="bg-white rounded-lg shadow p-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-sm font-semibold text-gray-700">Riwayat Absensi Saya</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Ringkasan absensi berdasarkan tanggal dan asrama yang Anda kelola.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 text-xs">
                  <div className="flex gap-2">
                    <div>
                      <span className="block mb-1 text-[11px] text-gray-500">Tanggal Mulai</span>
                      <input
                        type="date"
                        value={historyStart}
                        onChange={(e) => setHistoryStart(e.target.value)}
                        className="border rounded px-2 py-1 text-xs"
                      />
                    </div>
                    <div>
                      <span className="block mb-1 text-[11px] text-gray-500">Tanggal Akhir</span>
                      <input
                        type="date"
                        value={historyEnd}
                        onChange={(e) => setHistoryEnd(e.target.value)}
                        className="border rounded px-2 py-1 text-xs"
                      />
                    </div>
                  </div>
                  <Button variant="outline" size="xs" onClick={loadHistory} disabled={loadingHistory}>
                    {loadingHistory ? 'Memuat...' : 'Terapkan Filter'}
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {['all','subuh','dzuhur','ashar','maghrib','isya'].map((w) => (
                  <Button
                    key={w}
                    type="button"
                    size="xs"
                    variant={historyWaktuFilter === w ? 'default' : 'outline'}
                    onClick={() => setHistoryWaktuFilter(w)}
                  >
                    {w === 'all' ? 'Semua Waktu' : w.charAt(0).toUpperCase() + w.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {loadingHistory ? (
              <div className="py-6 text-center text-gray-500 text-sm">Memuat riwayat...</div>
            ) : historyItems.length === 0 ? (
              <div className="py-6 text-center text-gray-500 text-sm">
                Belum ada data absensi untuk rentang tanggal ini.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {historyItems
                  .filter((item) =>
                    historyWaktuFilter === 'all'
                      ? true
                      : item.waktu_sholat === historyWaktuFilter
                  )
                  .map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => loadHistoryDetail(item)}
                    className={`border rounded-lg p-3 text-xs flex flex-col gap-1 cursor-pointer transition-colors ${
                      historyDetail &&
                      item.tanggal === historyDetail.tanggal &&
                      item.waktu_sholat === historyDetail.waktu_sholat &&
                      item.asrama_id === historyDetail.asrama_id
                        ? 'bg-emerald-50 border-emerald-400'
                        : 'bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-800">{item.tanggal}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                        {item.waktu_sholat.charAt(0).toUpperCase() + item.waktu_sholat.slice(1)}
                      </span>
                    </div>
                    <div className="text-gray-600 mb-1">Asrama: {item.nama_asrama}</div>
                    <div className="flex flex-wrap gap-1 mt-1 mb-2">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        Hadir: {item.hadir}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        Alfa: {item.alfa}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-700">
                        Sakit: {item.sakit}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        Izin: {item.izin}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        Haid: {item.haid}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                        Istihadhoh: {item.istihadhoh}
                      </span>
                      {'masbuq' in item && (
                        <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                          Masbuq: {item.masbuq}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {historyDetail && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-[80vh] overflow-hidden p-4 text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">
                      Detail {historyDetail.tanggal} -{' '}
                      {historyDetail.waktu_sholat.charAt(0).toUpperCase() +
                        historyDetail.waktu_sholat.slice(1)}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setHistoryDetail(null)}
                      className="text-[11px] text-gray-500 hover:text-gray-700"
                    >
                      Tutup
                    </button>
                  </div>
                  {historyDetail.data.length === 0 ? (
                    <p className="text-gray-500">Tidak ada data santri.</p>
                  ) : (
                    <div className="max-h-[60vh] overflow-y-auto space-y-1 border rounded-md p-2 bg-slate-50">
                      {historyDetail.data.map((s) => (
                        <div
                          key={s.santri_id}
                          className="p-2 bg-white rounded border flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="font-medium text-gray-800">{s.nama}</div>
                            <div className="text-gray-500">NIS: {s.nis}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              value={s.status || ''}
                              onChange={async (e) => {
                                const newStatus = e.target.value || null;
                                try {
                                  if (!newStatus) {
                                    await pengabsenAppAPI.deleteAbsensi({
                                      santri_id: s.santri_id,
                                      waktu_sholat: historyDetail.waktu_sholat,
                                    });
                                  } else {
                                    await pengabsenAppAPI.upsertAbsensi({
                                      santri_id: s.santri_id,
                                      waktu_sholat: historyDetail.waktu_sholat,
                                      status_absen: newStatus,
                                    });
                                  }
                                  // refresh detail dan ringkasan
                                  await loadHistory();
                                  await loadHistoryDetail({
                                    tanggal: historyDetail.tanggal,
                                    waktu_sholat: historyDetail.waktu_sholat,
                                    asrama_id: historyDetail.asrama_id,
                                  });
                                  // sinkronkan juga tampilan "Absensi Hari Ini" jika waktunya sama
                                  await loadData(waktu);
                                } catch (error) {
                                  toast({
                                    title: 'Error',
                                    description:
                                      error.response?.data?.detail || 'Gagal mengubah status absensi',
                                    variant: 'destructive',
                                  });
                                }
                              }}
                              className="border border-gray-300 rounded-md px-2 py-1 text-[11px] bg-white"
                            >
                              <option value="">-</option>
                              <option value="hadir">Hadir</option>
                              <option value="alfa">Alfa</option>
                              <option value="sakit">Sakit</option>
                              <option value="izin">Izin</option>
                              <option value="haid">Haid</option>
                              <option value="istihadhoh">Istihadhoh</option>
                              <option value="masbuq">Masbuq</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
        )}

      </main>

      <div
        className="border-t bg-white px-4 py-2 flex items-center justify-between gap-2 fixed bottom-12 left-0 right-0 max-w-4xl mx-auto z-40"
        data-testid="pengabsen-waktu-bottom-nav"
      >
        <div className="flex gap-2 overflow-x-auto flex-1 pr-2">
          {WAKTU_MENU.map((menu) => {
            const Icon = menu.icon;
            const isActive = waktu === menu.value;
            return (
              <button
                key={menu.value}
                type="button"
                onClick={() => {
                  setWaktu(menu.value);
                  setActiveTab('today');
                }}
                data-testid={`pengabsen-waktu-tab-${menu.value}`}
                className={`flex flex-col items-center justify-center min-w-[70px] px-2 py-1 rounded-xl border text-[11px] transition-colors ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 mb-0.5" />
                <span>{menu.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col items-center pl-2 border-l border-slate-200 ml-2">
          <button
            type="button"
            onClick={handleOpenHistory}
            data-testid="pengabsen-history-tab-button"
            className={`flex flex-col items-center justify-center w-[60px] px-2 py-1 rounded-xl border text-[11px] transition-colors ${
              activeTab === 'history'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <History className="w-4 h-4 mb-0.5" />
            <span>Riwayat</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PengabsenApp;
