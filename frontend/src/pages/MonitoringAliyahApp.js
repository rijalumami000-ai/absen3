import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMonitoringAliyahAuth } from '@/contexts/MonitoringAliyahAuthContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { monitoringAliyahAppAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const getTodayLocalYMD = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const MonitoringAliyahApp = () => {
  const { user, loading, logout } = useMonitoringAliyahAuth();
  const { appSettings } = useAppSettings();
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'history'
  const [jenis, setJenis] = useState('pagi');
  const [tanggal, setTanggal] = useState(getTodayLocalYMD());
  const [kelasId, setKelasId] = useState('all');
  const [kelasList, setKelasList] = useState([]);
  const [data, setData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [historyJenis, setHistoryJenis] = useState('pagi');
  const [historyStart, setHistoryStart] = useState(getTodayLocalYMD());
  const [historyEnd, setHistoryEnd] = useState(getTodayLocalYMD());
  const [historyItems, setHistoryItems] = useState([]);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  const [loadingHistory, setLoadingHistory] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/monitoring-aliyah-app/login');
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    const loadKelas = async () => {
      try {
        const resp = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/aliyah/kelas`);
        const json = await resp.json();
        setKelasList(json || []);
      } catch (e) {
        // ignore
      }
    };
    loadKelas();
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, jenis, tanggal, kelasId]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const params = {
        jenis,
        tanggal,
      };
      if (kelasId !== 'all') params.kelas_id = kelasId;
      const resp = await monitoringAliyahAppAPI.absensiHariIni(params);
      setData(resp.data.data || []);
    } catch (error) {
      // swallow for now
    } finally {
      setLoadingData(false);
    }
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const params = {
        jenis: historyJenis,
        tanggal_start: historyStart,
        tanggal_end: historyEnd,
      };
      if (kelasId !== 'all') params.kelas_id = kelasId;
      const resp = await monitoringAliyahAppAPI.absensiRiwayat(params);
      setHistoryItems(resp.data.detail || []);
    } catch (error) {
      // swallow
    } finally {
      setLoadingHistory(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Memuat...</div>
      </div>
    );
  }

  const totalSiswa = data.length;
  const hadirCount = data.filter((row) => row.status === 'hadir').length;

  const kelasOrderMap = new Map((kelasList || []).map((k, index) => [k.id, index]));

  const groupedData = Object.values(
    data.reduce((acc, row) => {
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
      items: [...group.items].sort((a, b) =>
        (a.nama || '').localeCompare(b.nama || '', 'id', { sensitivity: 'base' })
      ),
    }))
    .sort((a, b) => {
      const idxA = kelasOrderMap.has(a.kelas_id) ? kelasOrderMap.get(a.kelas_id) : Infinity;
      const idxB = kelasOrderMap.has(b.kelas_id) ? kelasOrderMap.get(b.kelas_id) : Infinity;
      if (idxA !== idxB) return idxA - idxB;
      return (a.kelas_nama || '').localeCompare(b.kelas_nama || '', 'id', { sensitivity: 'base' });
    });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" data-testid="monitoring-aliyah-app-page">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">
            {appSettings.monitoring_aliyah_title || 'Monitoring Kelas Aliyah'}
          </h1>
          <p className="text-xs text-gray-500">{user.nama} (@{user.username})</p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          Logout
        </Button>
      </header>

      <main className="flex-1 p-4 space-y-4 max-w-5xl mx-auto w-full">
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
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
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              activeTab === 'history'
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            Riwayat Absensi
          </button>
        </div>

        {activeTab === 'today' && (
          <section className="bg-white rounded-lg shadow p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500">Jenis Absensi</p>
                <div className="flex gap-2 mt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={jenis === 'pagi' ? 'default' : 'outline'}
                    onClick={() => setJenis('pagi')}
                  >
                    Kehadiran Pagi
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={jenis === 'dzuhur' ? 'default' : 'outline'}
                    onClick={() => setJenis('dzuhur')}
                  >
                    Sholat Dhuhur
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 items-end">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tanggal</p>
                  <Input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Kelas</p>
                  <Select value={kelasId} onValueChange={setKelasId}>
                    <SelectTrigger className="w-40 h-8 text-xs">
                      <SelectValue placeholder="Semua Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kelas</SelectItem>
                      {kelasList.map((k) => (
                        <SelectItem key={k.id} value={k.id} className="text-xs">
                          {k.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <div className="bg-slate-50 border border-slate-200 rounded-lg py-2">
                <p className="text-slate-700 font-semibold">Kelas Dipantau</p>
                <p className="text-lg font-bold text-slate-800">{kelasList.length}</p>
              </div>
            </div>

            {loadingData ? (
              <div className="text-center text-xs text-gray-500 py-4">Memuat data...</div>
            ) : groupedData.length === 0 ? (
              <div className="text-center text-xs text-gray-500 py-4">Tidak ada data</div>
            ) : (
              <div className="space-y-4 max-h-[420px] overflow-y-auto">
                {groupedData.map((group) => (
                  <div key={group.kelas_id || group.kelas_nama}>
                    <div className="text-xs font-semibold text-slate-700 mb-2">
                      {group.kelas_nama || 'Tanpa Kelas'}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-100">
                          <tr>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Nama</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Kelas</th>
                            <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {group.items.map((row) => (
                            <tr key={row.siswa_id}>
                              <td className="px-3 py-1.5 text-slate-800">{row.nama}</td>
                              <td className="px-3 py-1.5 text-slate-600">{row.kelas_nama}</td>
                              <td className="px-3 py-1.5 text-slate-600 capitalize">{row.status || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'history' && (
          <section className="bg-white rounded-lg shadow p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500">Jenis Riwayat</p>
                <div className="flex gap-2 mt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant={historyJenis === 'pagi' ? 'default' : 'outline'}
                    onClick={() => setHistoryJenis('pagi')}
                  >
                    Kehadiran Pagi
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={historyJenis === 'dzuhur' ? 'default' : 'outline'}
                    onClick={() => setHistoryJenis('dzuhur')}
                  >
                    Sholat Dhuhur
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 items-end">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tanggal Mulai</p>
                  <Input type="date" value={historyStart} onChange={(e) => setHistoryStart(e.target.value)} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tanggal Akhir</p>
                  <Input type="date" value={historyEnd} onChange={(e) => setHistoryEnd(e.target.value)} />
                </div>
                <Button type="button" size="sm" onClick={loadHistory}>
                  Tampilkan
                </Button>
              </div>
            </div>

            {loadingHistory ? (
              <div className="text-center text-xs text-gray-500 py-4">Memuat riwayat...</div>
            ) : historyItems.length === 0 ? (
              <div className="text-center text-xs text-gray-500 py-4">Tidak ada riwayat</div>
            ) : (
              <div className="overflow-x-auto max-h-[420px]">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Tanggal</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Nama</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Kelas</th>
                      <th className="px-3 py-2 text-left font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {historyItems.map((row) => (
                      <tr key={row.id || `${row.siswa_id}-${row.tanggal}-${row.status}`}>
                        <td className="px-3 py-1.5 text-slate-600">{row.tanggal}</td>
                        <td className="px-3 py-1.5 text-slate-800">{row.siswa_nama}</td>
                        <td className="px-3 py-1.5 text-slate-600">{row.kelas_nama}</td>
                        <td className="px-3 py-1.5 text-slate-600 capitalize">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default MonitoringAliyahApp;
