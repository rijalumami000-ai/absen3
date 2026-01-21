import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePembimbingAuth } from '@/contexts/PembimbingAuthContext';
import { pembimbingAppAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const PembimbingApp = () => {
  const { user, loading, logout } = usePembimbingAuth();
  const [activeTab, setActiveTab] = useState('today'); // 'today' or 'history'
  const [selectedWaktu, setSelectedWaktu] = useState(null);
  const [todayData, setTodayData] = useState(null);
  const [statistik, setStatistik] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const now = new Date();
  const currentYear = now.getFullYear();

  const formatDateYMD = (year, monthIndex, day) => {
    const m = String(monthIndex + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [historyDate, setHistoryDate] = useState(() =>
    formatDateYMD(currentYear, now.getMonth(), now.getDate())
  );
  const [historyWaktu, setHistoryWaktu] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/pembimbing-app/login');
    }
  }, [loading, user, navigate]);

  // Load today's data
  const loadTodayData = async () => {
    try {
      setLoadingData(true);
      const params = selectedWaktu ? { waktu_sholat: selectedWaktu } : {};
      const [absensiRes, statRes] = await Promise.all([
        pembimbingAppAPI.absensiHariIni(params),
        pembimbingAppAPI.statistik({ tanggal: formatDateYMD(currentYear, now.getMonth(), now.getDate()) }),
      ]);
      setTodayData(absensiRes.data);
      setStatistik(statRes.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal memuat data', variant: 'destructive' });
    } finally {
      setLoadingData(false);
    }
  };

  // Load history data
  const loadHistoryData = async () => {
    try {
      setLoadingData(true);
      const params = { tanggal: historyDate };
      if (historyWaktu) params.waktu_sholat = historyWaktu;
      const res = await pembimbingAppAPI.absensiRiwayat(params);
      setHistoryData(res.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal memuat riwayat', variant: 'destructive' });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && activeTab === 'today') {
      loadTodayData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab, selectedWaktu]);

  useEffect(() => {
    if (user && activeTab === 'history') {
      loadHistoryData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab, historyDate, historyWaktu]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Memuat...</div>
      </div>
    );
  }

  const waktuLabels = [
    { key: 'subuh', label: 'Subuh' },
    { key: 'dzuhur', label: 'Dzuhur' },
    { key: 'ashar', label: 'Ashar' },
    { key: 'maghrib', label: 'Maghrib' },
    { key: 'isya', label: 'Isya' },
  ];

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const getDaysInMonth = (year, monthIndex) => {
    return new Date(year, monthIndex + 1, 0).getDate();
  };

  const renderStatusBadge = (status) => {
    if (!status)
      return <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-500">Belum</span>;
    const map = {
      hadir: 'bg-emerald-100 text-emerald-700',
      alfa: 'bg-red-100 text-red-700',
      sakit: 'bg-sky-100 text-sky-700',
      izin: 'bg-amber-100 text-amber-700',
      haid: 'bg-pink-100 text-pink-700',
      istihadhoh: 'bg-violet-100 text-violet-700',
    };
    const labelMap = {
      hadir: 'Hadir',
      alfa: 'Alfa',
      sakit: 'Sakit',
      izin: 'Izin',
      haid: 'Haid',
      istihadhoh: 'Istihadhoh',
    };
    const cls = map[status] || 'bg-gray-100 text-gray-700';
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cls}`}>
        {labelMap[status] || status}
      </span>
    );
  };

  const renderStatistik = () => {
    if (!statistik) return null;
    return (
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Statistik Hari Ini ({statistik.total_santri} santri)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-2 py-1 text-left">Waktu</th>
                <th className="px-2 py-1 text-center text-emerald-600">Hadir</th>
                <th className="px-2 py-1 text-center text-red-600">Alfa</th>
                <th className="px-2 py-1 text-center text-sky-600">Sakit</th>
                <th className="px-2 py-1 text-center text-amber-600">Izin</th>
                <th className="px-2 py-1 text-center text-gray-500">Belum</th>
              </tr>
            </thead>
            <tbody>
              {waktuLabels.map((w) => {
                const stat = statistik.stats?.[w.key] || {};
                return (
                  <tr key={w.key} className="border-t">
                    <td className="px-2 py-1 font-medium">{w.label}</td>
                    <td className="px-2 py-1 text-center">{stat.hadir || 0}</td>
                    <td className="px-2 py-1 text-center">{stat.alfa || 0}</td>
                    <td className="px-2 py-1 text-center">{stat.sakit || 0}</td>
                    <td className="px-2 py-1 text-center">{stat.izin || 0}</td>
                    <td className="px-2 py-1 text-center text-gray-400">{stat.belum || 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSantriList = (data) => {
    if (!data || !data.data || data.data.length === 0) {
      return <div className="py-4 text-sm text-gray-500">Tidak ada data santri.</div>;
    }

    // Group by asrama
    const grouped = {};
    data.data.forEach((s) => {
      const key = s.nama_asrama || 'Lainnya';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(s);
    });

    return (
      <div className="space-y-4">
        {Object.entries(grouped).map(([asramaName, santriList]) => (
          <div key={asramaName}>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 bg-gray-100 px-3 py-1 rounded">
              {asramaName} ({santriList.length} santri)
            </h4>
            <div className="space-y-2">
              {santriList.map((santri) => (
                <div
                  key={santri.santri_id}
                  className="border rounded-lg p-3 bg-slate-50 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{santri.nama}</div>
                    <div className="text-xs text-gray-500">NIS: {santri.nis}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                    {waktuLabels.map((w) => (
                      <div key={w.key} className="flex flex-col items-center text-[10px] text-gray-500">
                        <span className="mb-1 font-semibold">{w.label}</span>
                        {renderStatusBadge(santri.status?.[w.key])}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" data-testid="pembimbing-app-page">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Absensi Sholat - Pembimbing</h1>
          <p className="text-xs text-gray-500">{user.nama}</p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          Logout
        </Button>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b px-4 py-2 flex gap-2">
        <button
          onClick={() => setActiveTab('today')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'today'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Hari Ini
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
            activeTab === 'history'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Riwayat
        </button>
      </div>

      <main className="flex-1 p-4 space-y-4 max-w-4xl mx-auto w-full">
        {activeTab === 'today' && (
          <>
            {/* Statistik */}
            {renderStatistik()}

            {/* Filter Waktu Sholat */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Filter Waktu Sholat</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedWaktu(null)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    selectedWaktu === null
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Semua
                </button>
                {waktuLabels.map((w) => (
                  <button
                    key={w.key}
                    onClick={() => setSelectedWaktu(w.key)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      selectedWaktu === w.key
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Daftar Santri */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">
                  Daftar Absensi Santri Hari Ini
                </h3>
                <Button variant="outline" size="sm" onClick={loadTodayData} disabled={loadingData}>
                  {loadingData ? 'Memuat...' : 'Refresh'}
                </Button>
              </div>
              {loadingData ? (
                <div className="py-4 text-sm text-gray-500">Memuat data...</div>
              ) : (
                renderSantriList(todayData)
              )}
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <>
            {/* Filter Waktu Sholat untuk Riwayat */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Filter Waktu Sholat</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setHistoryWaktu(null)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    historyWaktu === null
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Semua
                </button>
                {waktuLabels.map((w) => (
                  <button
                    key={w.key}
                    onClick={() => setHistoryWaktu(w.key)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      historyWaktu === w.key
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Pilih Tanggal */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Pilih Tanggal</h3>
              <p className="text-xs text-gray-500 mb-3">
                Pilih bulan lalu tanggal untuk melihat riwayat absensi.
              </p>

              {/* Grid bulan */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {months.map((m, idx) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(idx);
                      const iso = formatDateYMD(currentYear, idx, selectedDay);
                      setHistoryDate(iso);
                    }}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${
                      selectedMonth === idx
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Grid tanggal */}
              <div className="grid grid-cols-7 gap-1 mb-3">
                {Array.from({ length: getDaysInMonth(currentYear, selectedMonth) }, (_, i) => i + 1).map(
                  (day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        setSelectedDay(day);
                        const iso = formatDateYMD(currentYear, selectedMonth, day);
                        setHistoryDate(iso);
                      }}
                      className={`text-[10px] h-7 rounded border flex items-center justify-center transition-colors ${
                        selectedDay === day
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {day}
                    </button>
                  )
                )}
              </div>

              <p className="text-xs text-gray-600">
                Tanggal dipilih: <span className="font-semibold">{historyDate}</span>
              </p>
            </div>

            {/* Daftar Santri Riwayat */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Riwayat Absensi</h3>
                <Button variant="outline" size="sm" onClick={loadHistoryData} disabled={loadingData}>
                  {loadingData ? 'Memuat...' : 'Refresh'}
                </Button>
              </div>
              {loadingData ? (
                <div className="py-4 text-sm text-gray-500">Memuat data...</div>
              ) : (
                renderSantriList(historyData)
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default PembimbingApp;
