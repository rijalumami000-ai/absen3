import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePembimbingAuth } from '@/contexts/PembimbingAuthContext';
import { pembimbingAppAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const PembimbingApp = () => {
  const { user, loading, logout } = usePembimbingAuth();
  const { appSettings } = useAppSettings();
  const [activeTab, setActiveTab] = useState('today');
  const [selectedWaktu, setSelectedWaktu] = useState(null);
  const [todayData, setTodayData] = useState(null);
  const [statistik, setStatistik] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [periodType, setPeriodType] = useState('day'); // 'day', 'week', 'biweek1', 'biweek2', 'month', 'year'
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
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [historyDate, setHistoryDate] = useState(() =>
    formatDateYMD(currentYear, now.getMonth(), now.getDate())
  );
  const [historyWaktu, setHistoryWaktu] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/pembimbing-app/login');
    }
  }, [loading, user, navigate]);

  const loadTodayData = async () => {
    try {
      setLoadingData(true);
      const params = selectedWaktu ? { waktu_sholat: selectedWaktu } : {};
      const todayStr = formatDateYMD(currentYear, now.getMonth(), now.getDate());
      const [absensiRes, statRes] = await Promise.all([
        pembimbingAppAPI.absensiHariIni(params),
        pembimbingAppAPI.statistik({ tanggal: todayStr }),
      ]);
      setTodayData(absensiRes.data);
      setStatistik(statRes.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal memuat data', variant: 'destructive' });
    } finally {
      setLoadingData(false);
    }
  };

  // Calculate date range based on period type
  const dateRange = useMemo(() => {
    const dates = [];
    const year = currentYear;
    const month = selectedMonth;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    if (periodType === 'day') {
      dates.push(formatDateYMD(year, month, selectedDay));
    } else if (periodType === 'week') {
      // Get week dates (7 days starting from selected week)
      const weekStart = (selectedWeek - 1) * 7 + 1;
      for (let i = 0; i < 7; i++) {
        const day = weekStart + i;
        if (day <= daysInMonth) {
          dates.push(formatDateYMD(year, month, day));
        }
      }
    } else if (periodType === 'biweek1') {
      // First 2 weeks (day 1-14)
      for (let i = 1; i <= 14 && i <= daysInMonth; i++) {
        dates.push(formatDateYMD(year, month, i));
      }
    } else if (periodType === 'biweek2') {
      // Second 2 weeks (day 15-end)
      for (let i = 15; i <= daysInMonth; i++) {
        dates.push(formatDateYMD(year, month, i));
      }
    } else if (periodType === 'month') {
      // Whole month
      for (let i = 1; i <= daysInMonth; i++) {
        dates.push(formatDateYMD(year, month, i));
      }
    } else if (periodType === 'year') {
      // Whole year - just get first day of each month for summary
      for (let m = 0; m < 12; m++) {
        dates.push(formatDateYMD(year, m, 1));
      }
    }
    return dates;
  }, [periodType, selectedMonth, selectedDay, selectedWeek, currentYear]);

  const loadHistoryData = async () => {
    try {
      setLoadingData(true);
      
      if (periodType === 'day') {
        const params = { tanggal: historyDate };
        if (historyWaktu) params.waktu_sholat = historyWaktu;
        const res = await pembimbingAppAPI.absensiRiwayat(params);
        setHistoryData({ type: 'single', data: res.data });
      } else {
        // For multiple dates, fetch summary
        const allData = await Promise.all(
          dateRange.map(async (date) => {
            const params = { tanggal: date };
            if (historyWaktu) params.waktu_sholat = historyWaktu;
            const res = await pembimbingAppAPI.absensiRiwayat(params);
            return { date, data: res.data };
          })
        );
        setHistoryData({ type: 'multiple', data: allData });
      }
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
  }, [user, activeTab, historyDate, historyWaktu, periodType, dateRange]);

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
  const fullMonths = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

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
                <th className="px-2 py-1 text-center text-pink-600">Haid</th>
                <th className="px-2 py-1 text-center text-violet-600">Istihadhoh</th>
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
                    <td className="px-2 py-1 text-center">{stat.haid || 0}</td>
                    <td className="px-2 py-1 text-center">{stat.istihadhoh || 0}</td>
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

  const renderMultipleDaySummary = () => {
    if (!historyData || historyData.type !== 'multiple') return null;

    // Calculate summary stats
    const summary = {
      hadir: 0, alfa: 0, sakit: 0, izin: 0, haid: 0, istihadhoh: 0, total: 0
    };

    historyData.data.forEach(({ data }) => {
      if (data && data.data) {
        data.data.forEach((santri) => {
          Object.values(santri.status || {}).forEach((status) => {
            if (status) {
              summary[status] = (summary[status] || 0) + 1;
              summary.total++;
            }
          });
        });
      }
    });

    return (
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Ringkasan Periode ({dateRange.length} hari)
        </h3>
        <div className="grid grid-cols-4 gap-2 text-xs">
          <div className="bg-emerald-50 p-2 rounded text-center">
            <div className="font-bold text-emerald-700">{summary.hadir}</div>
            <div className="text-emerald-600">Hadir</div>
          </div>
          <div className="bg-red-50 p-2 rounded text-center">
            <div className="font-bold text-red-700">{summary.alfa}</div>
            <div className="text-red-600">Alfa</div>
          </div>
          <div className="bg-sky-50 p-2 rounded text-center">
            <div className="font-bold text-sky-700">{summary.sakit}</div>
            <div className="text-sky-600">Sakit</div>
          </div>
          <div className="bg-amber-50 p-2 rounded text-center">
            <div className="font-bold text-amber-700">{summary.izin}</div>
            <div className="text-amber-600">Izin</div>
          </div>
          <div className="bg-pink-50 p-2 rounded text-center">
            <div className="font-bold text-pink-700">{summary.haid}</div>
            <div className="text-pink-600">Haid</div>
          </div>
          <div className="bg-violet-50 p-2 rounded text-center">
            <div className="font-bold text-violet-700">{summary.istihadhoh}</div>
            <div className="text-violet-600">Istihadhoh</div>
          </div>
        </div>
        
        {/* Per-day breakdown */}
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-gray-600 mb-2">Detail per Tanggal:</h4>
          <div className="max-h-60 overflow-y-auto space-y-1">
            {historyData.data.map(({ date, data }) => {
              const dayStats = { hadir: 0, alfa: 0, sakit: 0, izin: 0, haid: 0, istihadhoh: 0 };
              if (data && data.data) {
                data.data.forEach((santri) => {
                  Object.values(santri.status || {}).forEach((status) => {
                    if (status) dayStats[status]++;
                  });
                });
              }
              return (
                <div key={date} className="flex items-center justify-between text-[10px] bg-gray-50 px-2 py-1 rounded">
                  <span className="font-medium">{date}</span>
                  <div className="flex gap-2">
                    <span className="text-emerald-600">H:{dayStats.hadir}</span>
                    <span className="text-red-600">A:{dayStats.alfa}</span>
                    <span className="text-sky-600">S:{dayStats.sakit}</span>
                    <span className="text-amber-600">I:{dayStats.izin}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-slate-50 flex flex-col animate-fade-in" data-testid="pembimbing-app-page">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg px-4 py-4 flex items-center justify-between animate-slide-in-left">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-display font-semibold">{appSettings.pembimbing_title || 'Monitoring Sholat Ponpes Al-Hamid'}</h1>
            <p className="text-xs text-indigo-100">{user.nama}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={logout} className="bg-white/10 text-white border-white/20 hover:bg-white/20 active-scale transition-smooth">
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
            {renderStatistik()}

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
            {/* Period Type Selection */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Pilih Jenis Periode</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'day', label: 'Per Hari' },
                  { key: 'week', label: 'Per Minggu' },
                  { key: 'biweek1', label: '2 Minggu I' },
                  { key: 'biweek2', label: '2 Minggu II' },
                  { key: 'month', label: 'Per Bulan' },
                  { key: 'year', label: 'Per Tahun' },
                ].map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setPeriodType(p.key)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      periodType === p.key
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Waktu Sholat */}
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

            {/* Date Selection */}
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                {periodType === 'year' ? 'Pilih Tahun' : 'Pilih Bulan'}
              </h3>

              {/* Month Grid */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {months.map((m, idx) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(idx);
                      if (periodType === 'day') {
                        const iso = formatDateYMD(currentYear, idx, selectedDay);
                        setHistoryDate(iso);
                      }
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

              {/* Day Grid - only for 'day' period */}
              {periodType === 'day' && (
                <>
                  <h4 className="text-xs font-semibold text-gray-600 mb-2">Pilih Tanggal:</h4>
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
                </>
              )}

              {/* Week Selection - only for 'week' period */}
              {periodType === 'week' && (
                <>
                  <h4 className="text-xs font-semibold text-gray-600 mb-2">Pilih Minggu:</h4>
                  <div className="flex flex-wrap gap-2">
                    {[1, 2, 3, 4, 5].map((week) => (
                      <button
                        key={week}
                        onClick={() => setSelectedWeek(week)}
                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                          selectedWeek === week
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        Minggu {week}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <p className="text-xs text-gray-600 mt-3">
                Periode: <span className="font-semibold">
                  {periodType === 'day' && historyDate}
                  {periodType === 'week' && `Minggu ${selectedWeek}, ${fullMonths[selectedMonth]} ${currentYear}`}
                  {periodType === 'biweek1' && `1-14 ${fullMonths[selectedMonth]} ${currentYear}`}
                  {periodType === 'biweek2' && `15-${getDaysInMonth(currentYear, selectedMonth)} ${fullMonths[selectedMonth]} ${currentYear}`}
                  {periodType === 'month' && `${fullMonths[selectedMonth]} ${currentYear}`}
                  {periodType === 'year' && `Tahun ${currentYear}`}
                </span>
              </p>
            </div>

            {/* Summary for multiple days */}
            {periodType !== 'day' && renderMultipleDaySummary()}

            {/* Santri List - only for single day */}
            {periodType === 'day' && (
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Riwayat Absensi</h3>
                  <Button variant="outline" size="sm" onClick={loadHistoryData} disabled={loadingData}>
                    {loadingData ? 'Memuat...' : 'Refresh'}
                  </Button>
                </div>
                {loadingData ? (
                  <div className="py-4 text-sm text-gray-500">Memuat data...</div>
                ) : historyData?.type === 'single' ? (
                  renderSantriList(historyData.data)
                ) : (
                  <div className="py-4 text-sm text-gray-500">Pilih tanggal untuk melihat detail.</div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default PembimbingApp;
