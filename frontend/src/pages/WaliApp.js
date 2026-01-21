import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWaliAuth } from '@/contexts/WaliAuthContext';
import { waliAppAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const WaliApp = () => {
  const { user, loading, logout } = useWaliAuth();
  const [todayData, setTodayData] = useState(null);
  const now = new Date();
  const currentYear = now.getFullYear();

  const formatDateYMD = (year, monthIndex, day) => {
    const m = String(monthIndex + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth()); // 0-11
  const [selectedDay, setSelectedDay] = useState(now.getDate());
  const [historyDate, setHistoryDate] = useState(() => formatDateYMD(currentYear, now.getMonth(), now.getDate()));
  const [historyData, setHistoryData] = useState(null);
  const [loadingToday, setLoadingToday] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/wali-app/login');
    }
  }, [loading, user, navigate]);

  const loadToday = async () => {
    try {
      setLoadingToday(true);
      const resp = await waliAppAPI.absensiHariIni();
      setTodayData(resp.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal memuat data hari ini', variant: 'destructive' });
    } finally {
      setLoadingToday(false);
    }
  };

  const loadHistory = async (tanggal) => {
    try {
      setLoadingHistory(true);
      const resp = await waliAppAPI.absensiRiwayat({ tanggal });
      setHistoryData(resp.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal memuat data riwayat', variant: 'destructive' });
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadToday();
      loadHistory(historyDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user) {
      loadHistory(historyDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyDate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Memuat...</div>
      </div>
    );
  }

  const renderStatusBadge = (status) => {
    if (!status) return <span className="px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-500">Belum</span>;
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
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${cls}`}>{labelMap[status] || status}</span>;
  };

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
    'Jul',
    'Agu',
    'Sep',
    'Okt',
    'Nov',
    'Des',
  ];

  const getDaysInMonth = (year, monthIndex) => {
    // monthIndex: 0-11
    return new Date(year, monthIndex + 1, 0).getDate();
  };


  const waktuLabels = [
    { key: 'subuh', label: 'Subuh' },
    { key: 'dzuhur', label: 'Dzuhur' },
    { key: 'ashar', label: 'Ashar' },
    { key: 'maghrib', label: 'Maghrib' },
    { key: 'isya', label: 'Isya' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" data-testid="wali-app-page">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Absensi Sholat - Wali Santri</h1>
          <p className="text-xs text-gray-500">{user.nama}</p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          Logout
        </Button>
      </header>

      <main className="flex-1 p-4 space-y-4 max-w-4xl mx-auto w-full">
        {/* Hari Ini */}
        <section className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">Status Hari Ini</h2>
              <p className="text-xs text-gray-500 mt-1">Ringkasan absensi sholat anak Anda untuk hari ini.</p>
            </div>
            <Button variant="outline" size="sm" onClick={loadToday} disabled={loadingToday}>
              {loadingToday ? 'Memuat...' : 'Refresh'}
            </Button>
          </div>

          {!todayData || !todayData.data || todayData.data.length === 0 ? (
            <div className="py-4 text-sm text-gray-500">
              Belum ada data absensi untuk hari ini.
            </div>
          ) : (
            <div className="space-y-3">
              {todayData.data.map((anak) => (
                <div
                  key={anak.santri_id}
                  className="border rounded-lg p-3 bg-slate-50 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-800">{anak.nama}</div>
                    <div className="text-xs text-gray-500">NIS: {anak.nis}</div>
                    <div className="text-xs text-gray-500">Asrama: {anak.nama_asrama}</div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
                    {waktuLabels.map((w) => (
                      <div key={w.key} className="flex flex-col items-center text-[10px] text-gray-500">
                        <span className="mb-1 font-semibold">{w.label}</span>
                        {renderStatusBadge(anak.status?.[w.key])}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Riwayat */}
        <section className="bg-white rounded-lg shadow p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Riwayat per Tanggal</h2>
            <p className="text-xs text-gray-500 mt-1">
              Pilih bulan lalu tanggal untuk melihat status absensi sholat anak Anda pada hari tersebut.
            </p>
          </div>

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
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Grid tanggal */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {Array.from({ length: getDaysInMonth(currentYear, selectedMonth) }, (_, i) => i + 1).map((day) => (
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
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          {loadingHistory ? (
            <div className="py-4 text-sm text-gray-500">Memuat data riwayat...</div>
          ) : !historyData || !historyData.data || historyData.data.length === 0 ? (
            <div className="py-4 text-sm text-gray-500">
              Belum ada data absensi untuk tanggal ini.
            </div>
          ) : (
            <div className="space-y-3">
              {historyData.data.map((anak) => (
                <div key={anak.santri_id} className="border rounded-lg p-3 bg-slate-50">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{anak.nama}</div>
                      <div className="text-xs text-gray-500">NIS: {anak.nis}</div>
                      <div className="text-xs text-gray-500">Asrama: {anak.nama_asrama}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {waktuLabels.map((w) => (
                      <div key={w.key} className="flex flex-col items-center text-[10px] text-gray-500">
                        <span className="mb-1 font-semibold">{w.label}</span>
                        {renderStatusBadge(anak.status?.[w.key])}
                      </div>
                    ))}
                  </div>
                  {anak.pengabsen_nama && (
                    <div className="mt-2 text-[11px] text-gray-500 text-right">
                      Dicatat oleh: <span className="font-semibold">{anak.pengabsen_nama}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default WaliApp;
