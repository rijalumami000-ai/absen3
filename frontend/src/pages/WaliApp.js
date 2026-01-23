import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWaliAuth } from '@/contexts/WaliAuthContext';
import { waliAppAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { requestNotificationPermission, onMessageListener } from '@/firebase';

const WaliApp = () => {
  const { user, loading, logout } = useWaliAuth();
  const [todayData, setTodayData] = useState(null);
  const [notificationStatus, setNotificationStatus] = useState('unknown');
  const [activeTab, setActiveTab] = useState('sholat'); // 'sholat' or 'kelas'
  const [kelasAbsensi, setKelasAbsensi] = useState([]);
  const [loadingKelasAbsensi, setLoadingKelasAbsensi] = useState(false);
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

  // FCM Token Registration
  const registerFcmToken = useCallback(async () => {
    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        console.log('Browser tidak mendukung notifikasi');
        setNotificationStatus('unsupported');
        return;
      }

      // Check current permission
      if (Notification.permission === 'denied') {
        setNotificationStatus('denied');
        return;
      }

      // Register service worker first
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        } catch (swError) {
          console.warn('Service worker registration failed:', swError);
        }
      }

      // Request permission and get token
      const fcmToken = await requestNotificationPermission();
      if (fcmToken) {
        // Send token to backend
        await waliAppAPI.registerFcmToken(fcmToken);
        setNotificationStatus('granted');
        console.log('FCM token registered successfully');
      } else {
        setNotificationStatus('denied');
      }
    } catch (error) {
      console.error('Error registering FCM token:', error);
      setNotificationStatus('error');
    }
  }, []);

  useEffect(() => {
    if (user) {
      // Register FCM token when user is logged in
      registerFcmToken();
      
      // Listen for foreground messages
      onMessageListener()
        .then((payload) => {
          if (payload) {
            toast({
              title: payload.notification?.title || 'Notifikasi',
              description: payload.notification?.body || 'Anda memiliki notifikasi baru',
            });
            // Refresh data when notification received
            loadToday();
          }
        })
        .catch((err) => console.log('Message listener error:', err));
    }
  }, [user, registerFcmToken, toast]);

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

  // Load absensi kelas
  useEffect(() => {
    if (user && activeTab === 'kelas') {
      loadKelasAbsensi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, activeTab, historyDate]);

  const loadKelasAbsensi = async () => {
    setLoadingKelasAbsensi(true);
    try {
      const token = localStorage.getItem('wali_token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/wali-app/absensi-kelas?tanggal=${historyDate}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setKelasAbsensi(data);
      }
    } catch (error) {
      console.error('Error loading kelas absensi:', error);
    } finally {
      setLoadingKelasAbsensi(false);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-b from-secondary-50 to-background flex flex-col" data-testid="wali-app-page">
      <header className="bg-card/95 backdrop-blur-md shadow-sm px-4 py-4 flex items-center justify-between sticky top-0 z-10 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Wali Santri</h1>
            <p className="text-xs text-muted-foreground">{user.nama}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={logout} className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive">
          Logout
        </Button>
      </header>

      <main className="flex-1 p-4 space-y-4 max-w-4xl mx-auto w-full">
        {/* Notification Status Banner */}
        {notificationStatus === 'denied' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <span className="text-amber-700 text-sm">
              Notifikasi dinonaktifkan. Aktifkan di pengaturan browser untuk menerima update absensi.
            </span>
          </div>
        )}
        {notificationStatus === 'unsupported' && (
          <div className="bg-muted border border-border rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-muted-foreground/10 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <span className="text-muted-foreground text-sm">
              Browser Anda tidak mendukung notifikasi push.
            </span>
          </div>
        )}
        {notificationStatus === 'unknown' && (
          <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <span className="text-primary-800 text-sm">
                Aktifkan notifikasi untuk update absensi real-time
              </span>
            </div>
            <Button size="sm" onClick={registerFcmToken} className="shrink-0 bg-primary-700 hover:bg-primary-800">
              Aktifkan
            </Button>
          </div>
        )}
        {notificationStatus === 'granted' && (
          <div className="bg-primary-50 border border-primary-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-primary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-primary-800 text-sm">
              Notifikasi aktif. Anda akan menerima update absensi sholat anak Anda.
            </span>
          </div>
        )}
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
