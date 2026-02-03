import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePengabsenAliyahAuth } from '@/contexts/PengabsenAliyahAuthContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { pengabsenAliyahAppAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Sun, CloudSun, History } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'null', label: 'Belum' },
  { value: 'hadir', label: 'Hadir' },
  { value: 'alfa', label: 'Alfa' },
  { value: 'sakit', label: 'Sakit' },
  { value: 'izin', label: 'Izin' },
  { value: 'dispensasi', label: 'Dispensasi' },
  { value: 'bolos', label: 'Bolos' },
];

const getTodayLocalYMD = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const PengabsenAliyahApp = () => {
  const { user, loading, logout } = usePengabsenAliyahAuth();
  const { appSettings } = useAppSettings();
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'history'
  const [jenis, setJenis] = useState('pagi'); // 'pagi' | 'dzuhur'
  const [searchQuery, setSearchQuery] = useState('');
  const [tanggal, setTanggal] = useState(getTodayLocalYMD());
  const [data, setData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [historyJenis, setHistoryJenis] = useState('pagi');
  const [historyStart, setHistoryStart] = useState(getTodayLocalYMD());
  const [historyEnd, setHistoryEnd] = useState(getTodayLocalYMD());
  const [historyItems, setHistoryItems] = useState([]);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [kelasList, setKelasList] = useState([]);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [selectedMenu, setSelectedMenu] = useState('pagi'); // 'pagi' | 'dzuhur' | 'history'

  const [collapsedHistoryGroups, setCollapsedHistoryGroups] = useState({});


  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/pengabsen-aliyah-app/login');
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    const loadKelas = async () => {
      try {
        const resp = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/aliyah/kelas`);
        const json = await resp.json();
        setKelasList(json || []);
      } catch (e) {
        // ignore error load kelas untuk PWA
      }
    };
    loadKelas();
  }, []);

  useEffect(() => {
    if (user) {
      loadData(jenis, tanggal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, jenis, tanggal]);

  useEffect(() => {
    if (selectedMenu === 'pagi' || selectedMenu === 'dzuhur') {
      setActiveTab('today');
      setJenis(selectedMenu);
    } else if (selectedMenu === 'history') {
      setActiveTab('history');
    }
  }, [selectedMenu]);

  const loadData = async (jenisAbsensi, tgl) => {
    try {
      setLoadingData(true);
      const resp = await pengabsenAliyahAppAPI.absensiHariIni({ jenis: jenisAbsensi, tanggal: tgl });
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

  const handleStatusChange = async (siswaId, kelasId, status) => {
    try {
      const newStatus = status === 'null' ? null : status;
      await pengabsenAliyahAppAPI.upsertAbsensi({
        siswa_id: siswaId,
        kelas_id: kelasId,
        tanggal,
        jenis,
        status: newStatus,
      });
      await loadData(jenis, tanggal);
      toast({ title: 'Sukses', description: 'Status absensi diperbarui' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Gagal memperbarui status',
        variant: 'destructive',
      });
    }
  };

  const handleScanResult = async (detected) => {
    try {
      if (!detected || detected.length === 0) return;
      const code = detected[0];
      const text = code.rawValue || '';

      let payload;
      try {
        payload = JSON.parse(text);
      } catch (e) {
        payload = { id: text, type: 'santri' };
      }

      await pengabsenAliyahAppAPI.scanAbsensi(payload, { jenis });
      toast({ title: 'Sukses', description: 'Absensi berhasil dicatat' });
      await loadData(jenis, tanggal);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Gagal mencatat absensi',
        variant: 'destructive',
      });
    }
  };

  const filteredData = data.filter((row) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return row.nama?.toLowerCase().includes(q);
  });

  // Map urutan kelas dari data kelas Aliyah (mengikuti urutan di admin)
  const kelasOrderMap = new Map((kelasList || []).map((k, index) => [k.id, index]));

  // Group data siswa berdasarkan kelas
  const groupedData = Object.values(
    filteredData.reduce((acc, row) => {
      const kId = row.kelas_id || 'unknown';
      const kNama = row.kelas_nama || 'Tanpa Kelas';
      if (!acc[kId]) {
        acc[kId] = { kelas_id: kId, kelas_nama: kNama, items: [] };
      }
      acc[kId].items.push(row);
      return acc;
    }, {})
  )
    .map((group) => ({
      ...group,
      // Urutkan siswa berdasarkan nama (A-Z)
      items: [...group.items].sort((a, b) =>
        (a.nama || '').localeCompare(b.nama || '', 'id', { sensitivity: 'base' })
      ),
    }))
    .sort((a, b) => {
      // Urutkan kelas mengikuti urutan kelasList, fallback nama kelas
      const idxA = kelasOrderMap.has(a.kelas_id) ? kelasOrderMap.get(a.kelas_id) : Infinity;
      const idxB = kelasOrderMap.has(b.kelas_id) ? kelasOrderMap.get(b.kelas_id) : Infinity;
      if (idxA !== idxB) return idxA - idxB;
      return (a.kelas_nama || '').localeCompare(b.kelas_nama || '', 'id', { sensitivity: 'base' });
    });
  const historyFiltered = historyItems.filter((row) => {
    if (!historySearchQuery) return true;
    const q = historySearchQuery.toLowerCase();
    return (
      (row.siswa_nama || '').toLowerCase().includes(q) ||
      (row.kelas_nama || '').toLowerCase().includes(q)
    );
  });

  const historyKelasOrderMap = new Map((kelasList || []).map((k, index) => [k.id, index]));

  const filteredHistoryGroups = Object.values(
    historyFiltered.reduce((acc, row) => {
      const kId = row.kelas_id || 'unknown';
      const kNama = row.kelas_nama || 'Tanpa Kelas';
      if (!acc[kId]) {
        acc[kId] = { kelas_id: kId, kelas_nama: kNama, items: [] };
      }
      acc[kId].items.push(row);
      return acc;
    }, {})
  ).sort((a, b) => {
    const idxA = historyKelasOrderMap.has(a.kelas_id) ? historyKelasOrderMap.get(a.kelas_id) : Infinity;
    const idxB = historyKelasOrderMap.has(b.kelas_id) ? historyKelasOrderMap.get(b.kelas_id) : Infinity;
    if (idxA !== idxB) return idxA - idxB;
    return (a.kelas_nama || '').localeCompare(b.kelas_nama || '', 'id', { sensitivity: 'base' });
  });



  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Memuat...</div>
      </div>
    );
  }

  const totalSiswa = data.length;
  const hadirCount = data.filter((row) => row.status === 'hadir').length;
  const belumCount = data.filter((row) => !row.status).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" data-testid="pengabsen-aliyah-app-page">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">
            {appSettings.pengabsen_aliyah_title || 'Pengabsen Kelas Aliyah'}
          </h1>
          <p className="text-xs text-gray-500">{user.nama} (@{user.username})</p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          Logout
        </Button>
      </header>

      <main className="flex-1 p-4 space-y-4 max-w-4xl mx-auto w-full pb-24">
        {activeTab === 'today' && (
          <>
            <section className="bg-white rounded-lg shadow p-4 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Jenis Absensi</p>
                  <p className="text-sm font-medium text-gray-800">
                    {jenis === 'pagi' ? 'Kehadiran Siswa Pagi Hari' : 'Kehadiran Sholat Dhuhur'}
                  </p>
                </div>
                <div className="flex gap-2 items-end">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tanggal</p>
                    <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Cari Nama</p>
                    <Input
                      placeholder="Cari nama siswa..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg py-2">
                  <p className="text-emerald-700 font-semibold">Total Siswa</p>
                  <p className="text-lg font-bold text-emerald-800">{totalSiswa}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg py-2">
                  <p className="text-blue-700 font-semibold">Hadir</p>
                  <p className="text-lg font-bold text-blue-800">{hadirCount}</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg py-2">
                  <p className="text-amber-700 font-semibold">Belum Absen</p>
                  <p className="text-lg font-bold text-amber-800">{belumCount}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-700">Scan QR Siswa</h2>
                <Button
                  variant={scanning ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => setScanning((prev) => !prev)}
                >
                  {scanning ? 'Stop Kamera' : 'Mulai Scan'}
                </Button>
              </div>

              {scanning ? (
                <div className="aspect-video max-w-md mx-auto overflow-hidden rounded-xl border bg-black">
                  <Scanner
                    onScan={handleScanResult}
                    allowMultiple={false}
                    styles={{ container: { width: '100%' } }}
                  />
                </div>
              ) : (
                <p className="text-xs text-gray-500">
                  Tekan tombol <span className="font-semibold">Mulai Scan</span> untuk mengaktifkan kamera dan scan QR siswa.
                </p>
              )}

              <div className="mt-4">
                {loadingData ? (
                  <div className="text-center text-xs text-gray-500 py-4">Memuat data...</div>
                ) : groupedData.length === 0 ? (
                  <div className="text-center text-xs text-gray-500 py-4">Tidak ada data siswa</div>
                ) : (
                  <div className="space-y-4 max-h-[360px] overflow-y-auto">
                    {groupedData.map((group) => {
                      const count = group.items.length;
                      const key = group.kelas_id || group.kelas_nama;
                      const isCollapsed = collapsedGroups[key];
                      return (
                        <div key={key}>
                          <button
                            type="button"
                            className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 mb-2 bg-slate-100 hover:bg-slate-200 rounded px-3 py-2"
                            onClick={() =>
                              setCollapsedGroups((prev) => ({
                                ...prev,
                                [key]: !isCollapsed,
                              }))
                            }
                          >
                            <span>
                              {group.kelas_nama || 'Tanpa Kelas'} ({count} siswa)
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {isCollapsed ? 'Tampilkan' : 'Sembunyikan'}
                            </span>
                          </button>

                          {!isCollapsed && (
                            <div className="space-y-2">
                              {group.items.map((row) => (
                                <div
                                  key={row.siswa_id}
                                  className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                                >
                                  <div>
                                    <p className="text-sm font-medium text-gray-800">{row.nama}</p>
                                    <p className="text-xs text-gray-500">
                                      {row.kelas_nama} • {row.gender === 'putra' ? 'Laki-laki' : row.gender === 'putri' ? 'Perempuan' : '-'}
                                    </p>
                                  </div>
                                  <div className="w-32">
                                    <Select
                                      value={row.status || 'null'}
                                      onValueChange={(val) => handleStatusChange(row.siswa_id, row.kelas_id, val)}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {STATUS_OPTIONS.map((opt) => (
                                          <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                            {opt.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        {activeTab === 'history' && (
          <section className="bg-white rounded-lg shadow p-4 space-y-4">
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs text-gray-500">Jenis Riwayat</p>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <Button
                    type="button"
                    size="sm"
                    variant={historyJenis === 'pagi' ? 'default' : 'outline'}
                    onClick={() => setHistoryJenis('pagi')}
                  >
                    Riwayat Kehadiran Pagi
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={historyJenis === 'dzuhur' ? 'default' : 'outline'}
                    onClick={() => setHistoryJenis('dzuhur')}
                  >
                    Riwayat Sholat Dhuhur
                  </Button>
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="w-full md:w-64">
                  <p className="text-xs text-gray-500 mb-1">Cari Nama / Kelas</p>
                  <Input
                    placeholder="Cari di riwayat..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 items-end">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tanggal Mulai</p>
                    <Input type="date" value={historyStart} onChange={(e) => setHistoryStart(e.target.value)} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tanggal Akhir</p>
                    <Input type="date" value={historyEnd} onChange={(e) => setHistoryEnd(e.target.value)} />
                    <div className="mt-2">
                      <Button
                        type="button"
                        size="sm"
                        className="w-full md:w-auto"
                        onClick={async () => {
                          try {
                            setLoadingHistory(true);
                            const resp = await pengabsenAliyahAppAPI.riwayat({
                              jenis: historyJenis,
                              tanggal_start: historyStart,
                              tanggal_end: historyEnd,
                            });
                            setHistoryItems(resp.data.detail || []);
                            setCollapsedHistoryGroups({});
                          } catch (error) {
                            toast({
                              title: 'Error',
                              description: 'Gagal memuat riwayat',
                              variant: 'destructive',
                            });
                          } finally {
                            setLoadingHistory(false);
                          }
                        }}
                      >
                        Tampilkan
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {loadingHistory ? (
              <div className="text-center text-xs text-gray-500 py-4">Memuat riwayat...</div>
            ) : filteredHistoryGroups.length === 0 ? (
              <div className="text-center text-xs text-gray-500 py-4">Tidak ada riwayat</div>
            ) : (
              <div className="space-y-4 max-h-[420px] overflow-y-auto">
                {filteredHistoryGroups.map((group) => {
                  const count = group.items.length;
                  const key = group.kelas_id || group.kelas_nama;
                  const isCollapsed = collapsedHistoryGroups[key];
                  return (
                    <div key={key}>
                      <button
                        type="button"
                        className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 mb-2 bg-slate-100 hover:bg-slate-200 rounded px-3 py-2"
                        onClick={() =>
                          setCollapsedHistoryGroups((prev) => ({
                            ...prev,
                            [key]: !isCollapsed,
                          }))
                        }
                      >
                        <span>
                          {group.kelas_nama || 'Tanpa Kelas'} ({count} data)
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {isCollapsed ? 'Tampilkan' : 'Sembunyikan'}
                        </span>
                      </button>

                      {!isCollapsed && (
                        <div className="space-y-2">
                          {group.items.map((row) => (
                            <div
                              key={row.id || `${row.siswa_id}-${row.tanggal}-${row.status}`}
                              className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-800">{row.siswa_nama}</p>
                                <p className="text-xs text-gray-500">
                                  {row.kelas_nama} • {row.tanggal}
                                </p>
                              </div>
                              <div className="w-32">
                                <Select
                                  value={row.status || 'null'}
                                  onValueChange={async (val) => {
                                    const newStatus = val === 'null' ? null : val;
                                    try {
                                      await pengabsenAliyahAppAPI.upsertAbsensi({
                                        siswa_id: row.siswa_id,
                                        kelas_id: row.kelas_id,
                                        tanggal: row.tanggal,
                                        jenis: historyJenis,
                                        status: newStatus,
                                      });
                                      toast({ title: 'Sukses', description: 'Status riwayat diperbarui' });
                                    } catch (error) {
                                      toast({
                                        title: 'Error',
                                        description: error.response?.data?.detail || 'Gagal memperbarui status',
                                        variant: 'destructive',
                                      });
                                    }
                                  }}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {STATUS_OPTIONS.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                        {opt.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Bottom Menu: Pagi Hari, Sholat Dhuhur, Riwayat */}
      <div className="border-t bg-white px-4 py-2 flex items-center justify-between gap-2 fixed bottom-12 left-0 right-0 max-w-4xl mx-auto">
        <div className="flex gap-2 overflow-x-auto flex-1 pr-2 justify-center">
          <button
            type="button"
            onClick={() => setSelectedMenu('pagi')}
            className={`flex flex-col items-center justify-center min-w-[80px] px-2 py-1 rounded-xl border text-[11px] transition-colors ${
              selectedMenu === 'pagi'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white mb-1 shadow-sm">
              <Sun className="w-4 h-4" />
            </div>
            <span className="truncate max-w-[90px]">Pagi Hari</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedMenu('dzuhur')}
            className={`flex flex-col items-center justify-center min-w-[80px] px-2 py-1 rounded-xl border text-[11px] transition-colors ${
              selectedMenu === 'dzuhur'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center text-white mb-1 shadow-sm">
              <CloudSun className="w-4 h-4" />
            </div>
            <span className="truncate max-w-[90px]">Sholat Dhuhur</span>
          </button>
        </div>

        <div className="flex flex-col items-center pl-2 border-l border-slate-200 ml-2">
          <button
            type="button"
            onClick={() => setSelectedMenu('history')}
            className={`flex flex-col items-center justify-center w-[70px] px-2 py-1 rounded-xl border text-[11px] transition-colors ${
              selectedMenu === 'history'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-white mb-1 shadow-sm">
              <History className="w-4 h-4" />
            </div>
            <span>Riwayat</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PengabsenAliyahApp;
