import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePembimbingKelasAuth } from '@/contexts/PembimbingKelasAuthContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  LogOut, 
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Heart,
  TrendingUp,
  Calendar,
  BarChart
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MonitoringKelasApp = () => {
  const { user, logout } = usePembimbingKelasAuth();
  const { appSettings } = useAppSettings();
  const navigate = useNavigate();
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'history'
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [kelasList, setKelasList] = useState([]); // Add kelas list state
  const [selectedKelas, setSelectedKelas] = useState('all');
  const [selectedKelasDetail, setSelectedKelasDetail] = useState(null); // { id, nama }
  const [kelasDetailData, setKelasDetailData] = useState([]);
  const [kelasDetailSearch, setKelasDetailSearch] = useState('');
  const [kelasDetailStatus, setKelasDetailStatus] = useState('all');
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatus, setHistoryStatus] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10)
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (view === 'dashboard') {
      loadStatistik();
    }
    loadKelasList(); // Load kelas list for both views
  }, [view]);

  useEffect(() => {
    if (view === 'history') {
      loadHistory();
    }
  }, [view, selectedKelas, dateRange]);

  const loadStatistik = async () => {
    try {
      const token = localStorage.getItem('pembimbing_kelas_token');
      const response = await axios.get(
        `${API_URL}/api/pembimbing-kelas/statistik`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStats(response.data);
    } catch (error) {
      toast.error('Gagal memuat statistik');
    } finally {
      setLoading(false);
    }
  };

  const loadKelasList = async () => {
    try {
      const token = localStorage.getItem('pembimbing_kelas_token');
      const response = await axios.get(
        `${API_URL}/api/pembimbing-kelas/kelas-saya`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setKelasList(response.data || []);
    } catch (error) {
      console.error('Failed to load kelas list');
    }
  };

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem('pembimbing_kelas_token');
      const params = new URLSearchParams({
        tanggal_start: dateRange.start,
        tanggal_end: dateRange.end
      });
      
      if (selectedKelas) {
        params.append('kelas_id', selectedKelas);
      }

      const response = await axios.get(
        `${API_URL}/api/pembimbing-kelas/absensi-riwayat?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHistory(response.data);
    } catch (error) {
      toast.error('Gagal memuat riwayat');
    }
  };

  const loadKelasDetail = async (kelasId, kelasNama) => {
    try {
      setLoadingDetail(true);
      setSelectedKelasDetail({ id: kelasId, nama: kelasNama });
      setKelasDetailSearch('');
      setKelasDetailStatus('all');

      const token = localStorage.getItem('pembimbing_kelas_token');
      const today = new Date().toISOString().slice(0, 10);
      const params = new URLSearchParams({
        tanggal_start: today,
        tanggal_end: today,
        kelas_id: kelasId,
      });

      const response = await axios.get(
        `${API_URL}/api/pembimbing-kelas/absensi-riwayat?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setKelasDetailData(response.data || []);
    } catch (error) {
      toast.error('Gagal memuat detail kelas');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/monitoring-kelas-app/login');
  };

  const getStatusBadge = (status) => {
    const configs = {
      hadir: { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: 'Hadir' },
      alfa: { icon: XCircle, color: 'text-red-600 bg-red-100', label: 'Alfa' },
      izin: { icon: AlertCircle, color: 'text-blue-600 bg-blue-100', label: 'Izin' },
      sakit: { icon: Heart, color: 'text-orange-600 bg-orange-100', label: 'Sakit' },
      telat: { icon: AlertCircle, color: 'text-yellow-600 bg-yellow-100', label: 'Telat' },
    };
    
    const config = configs[status] || configs.hadir;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${config.color}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background animate-fade-in">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-700 to-emerald-600 text-white px-4 py-4 shadow-lg animate-slide-in-left">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <BarChart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold">{appSettings.monitoring_kelas_title || 'Monitoring Kelas Madin'}</h1>
              <p className="text-sm text-green-100">{user?.nama}</p>
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
              onClick={() => setView('dashboard')}
              className={`px-4 py-3 font-medium transition-smooth border-b-2 ${
                view === 'dashboard'
                  ? 'border-green-700 text-green-700'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart className="w-4 h-4 inline mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => setView('history')}
              className={`px-4 py-3 font-medium transition-smooth border-b-2 ${
                view === 'history'
                  ? 'border-green-700 text-green-700'
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
        {view === 'dashboard' ? (
          /* Dashboard View */
          loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Memuat data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card rounded-xl border border-border p-6 shadow-card hover-lift transition-smooth animate-scale-in">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.total_siswa || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Siswa</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.hari_ini?.hadir || 0}</p>
                      <p className="text-sm text-muted-foreground">Hadir Hari Ini</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <XCircle className="w-6 h-6 text-red-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.hari_ini?.alfa || 0}</p>
                      <p className="text-sm text-muted-foreground">Alfa Hari Ini</p>
                    </div>
                  </div>
                </div>

                <div className="bg-card rounded-xl border border-border p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-orange-700" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats?.total_kelas || 0}</p>
                      <p className="text-sm text-muted-foreground">Total Kelas</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Per Kelas Stats */}
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display font-bold text-lg">Statistik Per Kelas</h2>
                    <p className="text-xs text-muted-foreground">Klik salah satu baris kelas untuk melihat daftar siswa dan status kehadiran hari ini.</p>
                  </div>
                  {selectedKelasDetail && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedKelasDetail(null);
                        setKelasDetailData([]);
                      }}
                    >
                      Tutup Detail
                    </Button>
                  )}
                </div>
                <div className="p-6 space-y-6">
                  <div className="space-y-3">
                    {stats?.per_kelas?.map((kelas) => (
                      <button
                        key={kelas.kelas_id}
                        type="button"
                        onClick={() => loadKelasDetail(kelas.kelas_id, kelas.kelas_nama)}
                        className={`w-full flex items-center justify-between p-4 rounded-lg border transition-smooth text-left ${
                          selectedKelasDetail?.id === kelas.kelas_id
                            ? 'border-green-600 bg-emerald-50'
                            : 'border-border bg-muted hover:bg-muted/70'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-foreground">{kelas.kelas_nama}</p>
                          <p className="text-xs text-muted-foreground">
                            {kelas.total_siswa} siswa &bull; Sudah absen: {kelas.sudah_absen} &bull; Belum:{' '}
                            {kelas.belum_absen}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <div className="text-center">
                            <p className="font-bold text-green-700">{kelas.sudah_absen}</p>
                            <p className="text-xs text-muted-foreground">Sudah</p>
                          </div>
                          <div className="text-center">
                            <p className="font-bold text-orange-700">{kelas.belum_absen}</p>
                            <p className="text-xs text-muted-foreground">Belum</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {selectedKelasDetail && (
                    <div className="border-t border-border pt-4 mt-2">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">
                            Detail Kehadiran Kelas {selectedKelasDetail.nama}
                          </h3>
                          <p className="text-xs text-muted-foreground">Menampilkan daftar siswa dan status kehadiran hari ini.</p>
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                          <input
                            type="text"
                            value={kelasDetailSearch}
                            onChange={(e) => setKelasDetailSearch(e.target.value)}
                            placeholder="Cari nama siswa..."
                            className="px-3 py-1.5 border border-border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <select
                            value={kelasDetailStatus}
                            onChange={(e) => setKelasDetailStatus(e.target.value)}
                            className="px-2 py-1.5 border border-border rounded-lg text-xs bg-background"
                          >
                            <option value="all">Semua Status</option>
                            <option value="hadir">Hadir</option>
                            <option value="alfa">Alfa</option>
                            <option value="izin">Izin</option>
                            <option value="sakit">Sakit</option>
                            <option value="telat">Telat</option>
                          </select>
                        </div>
                      </div>

                      {loadingDetail ? (
                        <div className="py-4 text-sm text-muted-foreground">Memuat detail...</div>
                      ) : (
                        <div className="max-h-80 overflow-y-auto border border-border rounded-lg">
                          <table className="w-full text-xs">
                            <thead className="bg-muted sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left font-semibold">Nama Siswa</th>
                                <th className="px-3 py-2 text-left font-semibold">Tanggal</th>
                                <th className="px-3 py-2 text-left font-semibold">Status</th>
                                <th className="px-3 py-2 text-left font-semibold">Waktu</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-card">
                              {kelasDetailData
                                .filter((row) => {
                                  const q = kelasDetailSearch.toLowerCase();
                                  const matchNama = !q || row.siswa_nama.toLowerCase().includes(q);
                                  const matchStatus = kelasDetailStatus === 'all' || row.status === kelasDetailStatus;
                                  return matchNama && matchStatus;
                                })
                                .map((row) => (
                                  <tr key={row.id} className="hover:bg-muted/60">
                                    <td className="px-3 py-2 font-medium text-foreground">{row.siswa_nama}</td>
                                    <td className="px-3 py-2 text-muted-foreground">{row.tanggal}</td>
                                    <td className="px-3 py-2">{getStatusBadge(row.status)}</td>
                                    <td className="px-3 py-2 text-muted-foreground">
                                      {row.waktu_absen
                                        ? new Date(row.waktu_absen).toLocaleTimeString('id-ID', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })
                                        : '-'}
                                    </td>
                                  </tr>
                                ))}
                              {kelasDetailData.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="px-3 py-4 text-center text-xs text-muted-foreground">
                                    Belum ada data kehadiran untuk hari ini.
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        ) : (
          /* History View */
          <div className="space-y-4">
            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Tanggal Akhir</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Filter Kelas</label>
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
              </div>
            </div>

            {/* History Filters (Search + Status) */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Cari nama siswa atau kelas..."
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm pl-3"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mr-2">Filter Status:</label>
                <select
                  value={historyStatus}
                  onChange={(e) => setHistoryStatus(e.target.value)}
                  className="px-3 py-2 border border-border rounded-lg text-sm bg-background"
                >
                  <option value="all">Semua</option>
                  <option value="hadir">Hadir</option>
                  <option value="alfa">Alfa</option>
                  <option value="izin">Izin</option>
                  <option value="sakit">Sakit</option>
                  <option value="telat">Telat</option>
                </select>
              </div>
            </div>

            {/* History Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Tanggal</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Siswa</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Kelas</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">Waktu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {history.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                          Tidak ada data riwayat
                        </td>
                      </tr>
                    ) : (
                      history
                        .filter((item) => {
                          const q = historySearch.toLowerCase();
                          const matchSearch =
                            !q ||
                            item.siswa_nama.toLowerCase().includes(q) ||
                            item.kelas_nama.toLowerCase().includes(q);
                          const matchStatus =
                            historyStatus === 'all' || item.status === historyStatus;
                          return matchSearch && matchStatus;
                        })
                        .map((item) => (
                          <tr key={item.id} className="hover:bg-muted/50">
                            <td className="px-6 py-4 text-sm">{item.tanggal}</td>
                            <td className="px-6 py-4 text-sm font-medium">{item.siswa_nama}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">{item.kelas_nama}</td>
                            <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                            <td className="px-6 py-4 text-sm text-muted-foreground">
                              {item.waktu_absen
                                ? new Date(item.waktu_absen).toLocaleTimeString('id-ID', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '-'}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MonitoringKelasApp;
