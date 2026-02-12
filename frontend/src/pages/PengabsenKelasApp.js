import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePengabsenKelasAuth } from '@/contexts/PengabsenKelasAuthContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { Scanner } from '@yudiel/react-qr-scanner';
import { 
  QrCode, 
  LogOut, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Heart,
  X
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const getTodayLocalYMD = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const PengabsenKelasApp = () => {
  const { user, logout } = usePengabsenKelasAuth();
  const { appSettings } = useAppSettings();
  const navigate = useNavigate();
  const [view, setView] = useState('scan'); // 'scan' or 'grid'
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [gridData, setGridData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const today = getTodayLocalYMD();
    return today.slice(0, 7); // YYYY-MM
  });
  const [scanning, setScanning] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [manualStudents, setManualStudents] = useState([]);
  const [manualSearch, setManualSearch] = useState('');
  const [manualStatusMap, setManualStatusMap] = useState({});
  const firstHalfDays = Array.from({ length: 15 }, (_, i) => i + 1);
  const secondHalfDays = Array.from({ length: 16 }, (_, i) => i + 16);

  const [inputMode, setInputMode] = useState('qr');
  const [nfcValue, setNfcValue] = useState('');
  const nfcInputRef = useRef(null);



  useEffect(() => {
    loadKelas();
    loadManualStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (view === 'grid' && selectedKelas) {
      loadGridData();
    }
  }, [view, selectedKelas, currentMonth]);

  const loadKelas = async () => {
    try {
      const token = localStorage.getItem('pengabsen_kelas_token');
      const response = await axios.get(`${API_URL}/api/pengabsen-kelas/kelas-saya`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const accessibleKelas = response.data;
      setKelasList(accessibleKelas);

      // Auto-select first kelas if not selected yet
      if (accessibleKelas.length > 0 && !selectedKelas) {
        setSelectedKelas(accessibleKelas[0].id);
      }
    } catch (error) {
      toast.error('Gagal memuat data kelas');
    }
  };

  const loadManualStudents = async () => {
    try {
      const token = localStorage.getItem('pengabsen_kelas_token');
      const siswaResp = await axios.get(`${API_URL}/api/pengabsen-kelas/siswa-saya`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setManualStudents(siswaResp.data || []);

      // Ambil status absensi hari ini supaya dropdown manual tetap sinkron setelah refresh
      const today = getTodayLocalYMD();
      const riwayatResp = await axios.get(
        `${API_URL}/api/absensi-kelas/riwayat?tanggal_start=${today}&tanggal_end=${today}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const map = {};
      (riwayatResp.data || []).forEach((item) => {
        map[item.siswa_id] = item.status;
      });
      setManualStatusMap(map);
    } catch (error) {
      toast.error('Gagal memuat daftar siswa');
    }
  };

  const loadGridData = async () => {
    try {
      const token = localStorage.getItem('pengabsen_kelas_token');
      const response = await axios.get(
        `${API_URL}/api/absensi-kelas/grid?bulan=${currentMonth}&kelas_id=${selectedKelas}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGridData(response.data);
    } catch (error) {
      toast.error('Gagal memuat data grid');
    }
  };

  const handleScanQR = async (result) => {
    if (scanning) return; // Prevent double scan

    setScanning(true);

    try {
      let parsedData;
      try {
        parsedData = JSON.parse(result);
      } catch (error) {
        // If not JSON, assume it's just an ID
        parsedData = { id: result, type: 'santri' };
      }

      const token = localStorage.getItem('pengabsen_kelas_token');
      const response = await axios.post(
        `${API_URL}/api/absensi-kelas/scan`,
        parsedData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(response.data.message || 'Absensi berhasil dicatat');
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 1200);

      // Stop scanning after success
      setIsScanning(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal mencatat absensi');
    } finally {
      setTimeout(() => setScanning(false), 2000); // Prevent rapid re-scan
    }
  };

  const updateAbsensiStatus = async (absensiId, status) => {
    try {
      const token = localStorage.getItem('pengabsen_kelas_token');
      await axios.put(
        `${API_URL}/api/absensi-kelas/${absensiId}`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Status absensi diupdate');
      loadGridData();
    } catch (error) {
      toast.error('Gagal update status');
    }
  };
  const deleteAbsensi = async (absensiId) => {
    try {
      const token = localStorage.getItem('pengabsen_kelas_token');
      await axios.delete(`${API_URL}/api/absensi-kelas/${absensiId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success('Absensi dihapus');
      loadGridData();
  const handleNfcSubmit = async (rawValue) => {
    const nfcUid = (rawValue || '').trim();
    if (!nfcUid) {
      toast.error('NFC kosong, tempelkan kartu terlebih dahulu');
      return;
    }
    try {
      const token = localStorage.getItem('pengabsen_kelas_token');
      await axios.post(
        `${API_URL}/api/absensi-kelas/nfc`,
        { nfc_uid: nfcUid },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNfcValue('');
      toast.success('Absensi NFC berhasil dicatat');
      // refresh manual list & grid agar sinkron
      loadManualStudents();
      if (view === 'grid' && selectedKelas) {
        loadGridData();
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal mencatat absensi NFC');
    }
  };

    } catch (error) {
      toast.error('Gagal menghapus absensi');
    }
  };



  const handleManualStatusChange = async (siswaId, kelasId, status) => {
    setManualStatusMap((prev) => ({ ...prev, [siswaId]: status }));
    if (!status) return;
    const today = getTodayLocalYMD();
    await createManualAbsensi(siswaId, kelasId, today, status);
  };

  const createManualAbsensi = async (siswaId, kelasId, tanggal, status) => {
    try {
      const token = localStorage.getItem('pengabsen_kelas_token');
      await axios.post(
        `${API_URL}/api/absensi-kelas/manual`,
        { siswa_id: siswaId, kelas_id: kelasId, tanggal, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Absensi dicatat');
      loadGridData();
    } catch (error) {
      toast.error('Gagal mencatat absensi');
    } finally {
      // Setelah absensi manual berhasil/gagal, muat ulang grid dan status manual dari server
      loadGridData();
      loadManualStudents();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/pengabsen-kelas-app/login');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'hadir':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'alfa':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'izin':
        return <AlertCircle className="w-4 h-4 text-blue-600" />;
      case 'sakit':
        return <Heart className="w-4 h-4 text-orange-600" />;
      default:
        return null;
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'hadir':
        return 'bg-green-100';
      case 'alfa':
        return 'bg-red-100';
      case 'izin':
        return 'bg-blue-100';
      case 'sakit':
        return 'bg-orange-100';
      case 'telat':
        return 'bg-yellow-100';
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-background animate-fade-in">
      {/* Header */}
      <header className="bg-gradient-to-r from-primary-700 to-primary-600 text-white px-4 py-4 shadow-lg animate-slide-in-left">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">{appSettings.pengabsen_kelas_title || 'Pengabsen Kelas Madin'}</h1>
              <p className="text-sm text-primary-100">{user?.nama}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 active-scale transition-smooth"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Keluar
          </Button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-border bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setView('scan')}
              className={`px-4 py-3 font-medium transition-smooth border-b-2 ${
                view === 'scan'
                  ? 'border-primary-700 text-primary-700'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <QrCode className="w-4 h-4 inline mr-2" />
              Scan QR
            </button>
            <button
              onClick={() => setView('grid')}
              className={`px-4 py-3 font-medium transition-smooth border-b-2 ${
                view === 'grid'
                  ? 'border-primary-700 text-primary-700'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Riwayat
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4">
        {view === 'scan' ? (
          <React.Fragment>
            {/* Scan View */}
            <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-card rounded-2xl shadow-lg p-8 max-w-md w-full">
              {!isScanning ? (
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-6 bg-primary-100 rounded-full flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-primary-700" />
                  </div>
                  <h2 className="text-2xl font-display font-bold mb-2">Scan QR Code</h2>
                  <p className="text-muted-foreground mb-6">
                    Scan QR code siswa untuk mencatat kehadiran hari ini
                  </p>
                  <Button
                    onClick={() => setIsScanning(true)}
                    size="lg"
                    className="w-full"
                    disabled={scanning}
                  >
                    Mulai Scan
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="mb-4 w-full">
                    <Scanner
                      onScan={(result) => {
                        if (result && result[0]) {
                          handleScanQR(result[0].rawValue);
                        }
                      }}
                      onError={(error) => console.log(error?.message)}
                      constraints={{
                        facingMode: 'environment',
                      }}
                    />
                    {scanSuccess && (
                      <div className="mt-3 text-center text-sm font-semibold text-emerald-600">
                        Scan berhasil!
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => setIsScanning(false)}
                    variant="outline"
                    size="lg"
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Batal
                  </Button>
                  <p className="text-xs text-muted-foreground mt-4 text-center">
                    Arahkan kamera ke QR Code siswa
                  </p>
                </div>
              )}
            </div>
            </div>

            {/* Manual attendance list */}
            <div className="mt-8 max-w-5xl mx-auto w-full">
            <div className="bg-card rounded-xl border border-border p-4 mb-4 flex flex-col gap-3">
              <div>
                <h3 className="text-sm font-semibold">Absensi Manual</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Pilih kelas terlebih dahulu, kemudian atur status kehadiran siswa di kelas tersebut.
                  Gunakan untuk mencatat Alfa (a), Izin (i), Sakit (s), atau Telat (t) jika tidak melalui scan QR.
                </p>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="w-full md:w-64">
                  <label className="text-xs font-medium mb-1 block">Kelas</label>
                  {kelasList.length === 0 ? (
                    <div className="px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground text-sm">
                      Tidak ada kelas tersedia
                    </div>
                  ) : (
                    <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        {kelasList.map((kelas) => (
                          <SelectItem key={kelas.id} value={kelas.id}>
                            {kelas.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="w-full md:w-64">
                  <label className="text-xs font-medium mb-1 block">Cari Siswa</label>
                  <input
                    type="text"
                    value={manualSearch}
                    onChange={(e) => setManualSearch(e.target.value)}
                    placeholder="Cari nama siswa..."
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {manualStudents
                .filter((s) =>
                  (selectedKelas ? s.kelas_id === selectedKelas : true) &&
                  (manualSearch
                    ? s.siswa_nama.toLowerCase().includes(manualSearch.toLowerCase())
                    : true)
                )
                .map((s) => (
                  <div
                    key={s.siswa_id}
                    className="flex items-center justify-between bg-card rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <div>
                      <div className="font-medium text-foreground">{s.siswa_nama}</div>
                      <div className="text-xs text-muted-foreground">Kelas: {s.kelas_nama || '-'}</div>
                    </div>
                    <select
                      value={manualStatusMap[s.siswa_id] || ''}
                      onChange={(e) =>
                        handleManualStatusChange(s.siswa_id, s.kelas_id, e.target.value)
                      }
                      className="border border-border rounded-md px-2 py-1 text-xs bg-background cursor-pointer"
                    >
                      <option value="">-</option>
                      <option value="hadir">✓ Hadir</option>
                      <option value="alfa">a Alfa</option>
                      <option value="izin">i Izin</option>
                      <option value="sakit">s Sakit</option>
                      <option value="telat">t Telat</option>
                    </select>
                  </div>
                ))}

              {manualStudents.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  Belum ada data siswa untuk kelas yang Anda kelola.
                </p>
              )}
            </div>
          </div>
          </React.Fragment>
        ) : (
          /* Grid View */
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Pilih Kelas</label>
                  {kelasList.length === 0 ? (
                    <div className="px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground text-sm">
                      Tidak ada kelas tersedia
                    </div>
                  ) : (
                    <Select value={selectedKelas} onValueChange={setSelectedKelas}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kelas" />
                      </SelectTrigger>
                      <SelectContent>
                        {kelasList.map(kelas => (
                          <SelectItem key={kelas.id} value={kelas.id}>
                            {kelas.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Bulan</label>
                  <input
                    type="month"
                    value={currentMonth}
                    onChange={(e) => setCurrentMonth(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Grid Table: 1-15 */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold sticky left-0 bg-muted">Nama Siswa</th>
                      {firstHalfDays.map((day) => (
                        <th key={day} className="px-2 py-3 text-center font-semibold min-w-[40px]">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gridData.map((siswa) => (
                      <tr key={siswa.siswa_id} className="border-t border-border hover:bg-muted/50">
                        <td className="px-4 py-2 font-medium sticky left-0 bg-card">
                          {siswa.siswa_nama}
                        </td>
                        {siswa.absensi
                          .filter((_, idx) => idx < 15)
                          .map((abs, idx) => (
                          <td
                            key={idx}
                            className={`px-2 py-2 text-center ${getStatusBgColor(abs.status)}`}
                          >
                            <select
                              value={abs.status || ''}
                              onChange={(e) => {
                                const newStatus = e.target.value;
                                if (newStatus === '') {
                                  if (abs.absensi_id) {
                                    deleteAbsensi(abs.absensi_id);
                                  }
                                  return;
                                }

                                if (abs.absensi_id) {
                                  updateAbsensiStatus(abs.absensi_id, newStatus);
                                } else {
                                  createManualAbsensi(siswa.siswa_id, siswa.kelas_id, abs.tanggal, newStatus);
                                }
                              }}
                              className="w-full bg-transparent border-none text-xs cursor-pointer"
                            >
                              <option value="">-</option>
                              <option value="hadir">✓</option>
                              <option value="alfa">a</option>
                              <option value="izin">i</option>
                              <option value="sakit">s</option>
                              <option value="telat">t</option>
                            </select>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Grid Table: 16-31 */}
            <div className="bg-card rounded-xl border border-border overflow-hidden mt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold sticky left-0 bg-muted">Nama Siswa</th>
                      {secondHalfDays.map((day) => (
                        <th key={day} className="px-2 py-3 text-center font-semibold min-w-[40px]">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gridData.map((siswa) => (
                      <tr key={siswa.siswa_id} className="border-t border-border hover:bg-muted/50">
                        <td className="px-4 py-2 font-medium sticky left-0 bg-card">
                          {siswa.siswa_nama}
                        </td>
                        {siswa.absensi
                          .filter((_, idx) => idx >= 15)
                          .map((abs, idx) => (
                            <td
                              key={idx}
                              className={`px-2 py-2 text-center ${getStatusBgColor(abs.status)}`}
                            >
                              <select
                                value={abs.status || ''}
                                onChange={(e) => {
                                  const newStatus = e.target.value;
                                if (newStatus === '') {
                                  if (abs.absensi_id) {
                                    deleteAbsensi(abs.absensi_id);
                                  }
                                  return;
                                }

                                if (abs.absensi_id) {
                                  updateAbsensiStatus(abs.absensi_id, newStatus);
                                } else {
                                  createManualAbsensi(
                                    siswa.siswa_id,
                                    siswa.kelas_id,
                                    abs.tanggal,
                                    newStatus
                                  );
                                }
                                }}
                                className="w-full bg-transparent border-none text-xs cursor-pointer"
                              >
                                <option value="">-</option>
                                <option value="hadir"></option>
                                <option value="alfa">a</option>
                                <option value="izin">i</option>
                                <option value="sakit">s</option>
                                <option value="telat">t</option>
                              </select>
                            </td>
                          ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>


            {/* Legend */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-3">Keterangan:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center text-xs">✓</div>
                  <span className="text-sm">Hadir</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center text-xs">✗</div>
                  <span className="text-sm">Alfa</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center text-xs">I</div>
                  <span className="text-sm">Izin</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-orange-100 rounded flex items-center justify-center text-xs">S</div>
                  <span className="text-sm">Sakit</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PengabsenKelasApp;
