import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePengabsenKelasAuth } from '@/contexts/PengabsenKelasAuthContext';
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

const PengabsenKelasApp = () => {
  const { user, logout } = usePengabsenKelasAuth();
  const navigate = useNavigate();
  const [view, setView] = useState('scan'); // 'scan' or 'grid'
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [gridData, setGridData] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [scanning, setScanning] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    loadKelas();
  }, []);

  useEffect(() => {
    if (view === 'grid' && selectedKelas) {
      loadGridData();
    }
  }, [view, selectedKelas, currentMonth]);

  const loadKelas = async () => {
    try {
      const token = localStorage.getItem('pengabsen_kelas_token');
      const response = await axios.get(`${API_URL}/api/kelas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter only kelas that user has access to
      const accessibleKelas = response.data.filter(kelas => 
        user.kelas_ids.includes(kelas.id)
      );
      setKelasList(accessibleKelas);
      
      if (accessibleKelas.length > 0) {
        setSelectedKelas(accessibleKelas[0].id);
      }
    } catch (error) {
      toast.error('Gagal memuat data kelas');
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
      } catch {
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

  const createManualAbsensi = async (siswaId, tanggal, status) => {
    try {
      const token = localStorage.getItem('pengabsen_kelas_token');
      await axios.post(
        `${API_URL}/api/absensi-kelas/manual`,
        { siswa_id: siswaId, kelas_id: selectedKelas, tanggal, status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Absensi dicatat');
      loadGridData();
    } catch (error) {
      toast.error('Gagal mencatat absensi');
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
      default:
        return 'bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary-700 text-white px-4 py-4 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold">Pengabsen Kelas</h1>
            <p className="text-sm text-primary-100">{user?.nama}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Keluar
          </Button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setView('scan')}
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
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
              className={`px-4 py-3 font-medium transition-colors border-b-2 ${
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
          /* Scan View */
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
                  <div className="mb-4">
                    <Scanner
                      onScan={(result) => {
                        if (result && result[0]) {
                          handleScanQR(result[0].rawValue);
                        }
                      }}
                      onError={(error) => console.log(error?.message)}
                      constraints={{
                        facingMode: 'environment'
                      }}
                      styles={{
                        container: {
                          width: '100%',
                          paddingTop: '100%',
                          position: 'relative',
                          overflow: 'hidden',
                          borderRadius: '12px'
                        }
                      }}
                    />
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
        ) : (
          /* Grid View */
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Pilih Kelas</label>
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

            {/* Grid Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold sticky left-0 bg-muted">Nama Siswa</th>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
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
                        {siswa.absensi.map((abs, idx) => (
                          <td
                            key={idx}
                            className={`px-2 py-2 text-center ${getStatusBgColor(abs.status)}`}
                          >
                            <select
                              value={abs.status || ''}
                              onChange={(e) => {
                                const newStatus = e.target.value;
                                if (abs.absensi_id) {
                                  updateAbsensiStatus(abs.absensi_id, newStatus);
                                } else {
                                  createManualAbsensi(siswa.siswa_id, abs.tanggal, newStatus);
                                }
                              }}
                              className="w-full bg-transparent border-none text-xs cursor-pointer"
                            >
                              <option value="">-</option>
                              <option value="hadir">✓</option>
                              <option value="alfa">✗</option>
                              <option value="izin">I</option>
                              <option value="sakit">S</option>
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
