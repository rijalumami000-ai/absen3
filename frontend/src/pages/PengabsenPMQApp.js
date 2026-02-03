import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePengabsenPMQAuth } from '@/contexts/PengabsenPMQAuthContext';
import { pengabsenPMQAppAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Scanner } from '@yudiel/react-qr-scanner';
import { BookOpen, Rocket, Sparkles, MoonStar, ClockHistory } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'null', label: 'Belum' },
  { value: 'hadir', label: 'Hadir' },
  { value: 'alfa', label: 'Alfa' },
  { value: 'sakit', label: 'Sakit' },
  { value: 'izin', label: 'Izin' },
  { value: 'terlambat', label: 'Terlambat' },
];

const getTodayLocalYMD = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const PengabsenPMQApp = () => {
  const { user, loading, logout } = usePengabsenPMQAuth();
  const [activeTab, setActiveTab] = useState('today');
  const [selectedTingkatanKey, setSelectedTingkatanKey] = useState('');
  const [tanggal, setTanggal] = useState(getTodayLocalYMD());
  const [sesiList, setSesiList] = useState([]);
  const [sesiKey, setSesiKey] = useState('');
  const [data, setData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scanning, setScanning] = useState(false);
  const [historyStart, setHistoryStart] = useState(getTodayLocalYMD());
  const [historyEnd, setHistoryEnd] = useState(getTodayLocalYMD());
  const [historyItems, setHistoryItems] = useState([]);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [collapsedHistoryGroups, setCollapsedHistoryGroups] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/pengabsen-pmq-app/login');
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    const loadSesi = async () => {
      try {
        const resp = await pengabsenPMQAppAPI.waktuSettings();
        const json = resp.data;
        const sesi = (json?.sesi || []).filter((s) => s.active);
        setSesiList(sesi);
        if (sesi.length && !sesiKey) {
          setSesiKey(sesi[0].key);
        }
      } catch (e) {
        // ignore for PWA
      }
    };
    loadSesi();
  }, [sesiKey]);

  useEffect(() => {
    if (user && sesiKey) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tanggal, sesiKey]);

  const loadData = async () => {
    try {
      setLoadingData(true);
      const resp = await pengabsenPMQAppAPI.absensiHariIni({ tanggal, sesi: sesiKey });
      setData(resp.data.data || []);
    } catch (e) {
      // silent
    } finally {
  const tingkatanDefs = useMemo(
    () => [
      { key: 'jet_tempur', label: 'Jet Tempur', icon: Rocket, color: 'from-sky-500 to-emerald-400' },
      { key: 'persiapan', label: 'Persiapan', icon: Sparkles, color: 'from-amber-500 to-orange-400' },
      { key: 'jazariyah', label: 'Jazariyah', icon: BookOpen, color: 'from-indigo-500 to-sky-500' },
      { key: 'al_quran', label: "Al-Qur'an", icon: MoonStar, color: 'from-emerald-600 to-lime-500' },
    ],
    []
  );

  const allowedTingkatanKeys = useMemo(() => {
    const keys = user?.tingkatan_keys || [];
    if (!keys.length) return [];
    return tingkatanDefs.filter((t) => keys.includes(t.key));
  }, [tingkatanDefs, user]);

  const selectedTingkatan = useMemo(() => {
    if (!selectedTingkatanKey) return null;
    return tingkatanDefs.find((t) => t.key === selectedTingkatanKey) || null;
  }, [selectedTingkatanKey, tingkatanDefs]);


      setLoadingData(false);
    }
  };

  const handleStatusChange = async (siswaId, kelompokId, status) => {
    try {
      const newStatus = status === 'null' ? null : status;
      await pengabsenPMQAppAPI.upsertAbsensi({
        siswa_id: siswaId,
        kelompok_id: kelompokId,
        tanggal,
        sesi: sesiKey,
        status: newStatus,
      });
      await loadData();
    } catch (e) {
      // TODO: optional toast
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

      await pengabsenPMQAppAPI.scanAbsensi(payload, { sesi: sesiKey });
      await loadData();
    } catch (e) {
      // TODO: optional toast
    }
  };

  const filteredData = useMemo(() => {
    if (!searchQuery) return data;
    const q = searchQuery.toLowerCase();
    return data.filter((row) => (row.nama || '').toLowerCase().includes(q));
  }, [data, searchQuery]);

  const groupedData = useMemo(() => {
    const byTingkatan = {};
    filteredData.forEach((row) => {
      const tKey = row.tingkatan_key || 'unknown';
      const tLabel = row.tingkatan_label || 'Tanpa Tingkatan';
      const kId = row.kelompok_id || 'unknown';
      const kNama = row.kelompok_nama || 'Tanpa Kelompok';

      if (!byTingkatan[tKey]) {
        byTingkatan[tKey] = {
          tingkatan_key: tKey,
          tingkatan_label: tLabel,
          kelompok: {},
        };
      }
      if (!byTingkatan[tKey].kelompok[kId]) {
        byTingkatan[tKey].kelompok[kId] = {
          kelompok_id: kId,
          kelompok_nama: kNama,
          items: [],
        };
      }
      byTingkatan[tKey].kelompok[kId].items.push(row);
    });

    // sort siswa per kelompok
    Object.values(byTingkatan).forEach((t) => {
      Object.values(t.kelompok).forEach((g) => {
        g.items.sort((a, b) => (a.nama || '').localeCompare(b.nama || '', 'id', { sensitivity: 'base' }));
      });
    });

    return byTingkatan;
  }, [filteredData]);

  const historyFiltered = useMemo(() => {
    if (!historySearchQuery) return historyItems;
    const q = historySearchQuery.toLowerCase();
    return historyItems.filter((row) => (row.siswa_nama || '').toLowerCase().includes(q));
  }, [historyItems, historySearchQuery]);

  // Tentukan tingkatan default pertama kali
  useEffect(() => {
    if (!selectedTingkatanKey && allowedTingkatanKeys.length) {
      setSelectedTingkatanKey(allowedTingkatanKeys[0].key);
    }
  }, [allowedTingkatanKeys, selectedTingkatanKey]);

  const groupedHistory = useMemo(() => {
    return Object.values(
      historyFiltered.reduce((acc, row) => {
        const gId = row.kelompok_id || 'unknown';
        const gNama = row.kelompok_nama || 'Tanpa Kelompok';
        if (!acc[gId]) {
          acc[gId] = { kelompok_id: gId, kelompok_nama: gNama, items: [] };
        }
        acc[gId].items.push(row);
        return acc;
      }, {})
    );
  }, [historyFiltered]);

        {activeTab === 'history' && (
          <section className="bg-white rounded-lg shadow p-4 space-y-4">
            {/* TODO: isi ulang konten riwayat jika diperlukan */}
          </section>
        )}
      </main>

      {/* Bottom Tingkatan & Tab Bar */}
      <div className="border-t bg-white px-4 py-2 flex items-center justify-between gap-2 fixed bottom-0 left-0 right-0 max-w-4xl mx-auto">
        <div className="flex gap-2 overflow-x-auto flex-1 pr-2">
          {allowedTingkatanKeys.map((t) => {
            const Icon = t.icon;
            const isActive = selectedTingkatanKey === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setSelectedTingkatanKey(t.key)}
                className={`flex flex-col items-center justify-center min-w-[70px] px-2 py-1 rounded-xl border text-[11px] transition-colors ${
                  isActive
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white mb-1 shadow-sm`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="truncate max-w-[80px]">{t.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-col items-center pl-2 border-l border-slate-200 ml-2">
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center justify-center w-[60px] px-2 py-1 rounded-xl border text-[11px] transition-colors ${
              activeTab === 'history'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-white mb-1 shadow-sm">
              <ClockHistory className="w-4 h-4" />
            </div>
            <span>Riwayat</span>
          </button>
        </div>
      </div>


  const totalSiswa = data.length;
  const hadirCount = data.filter((row) => row.status === 'hadir').length;
  const belumCount = data.filter((row) => !row.status).length;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" data-testid="pengabsen-pmq-app-page">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Pengabsen PMQ</h1>
          <p className="text-xs text-gray-500">{user.nama} (@{user.username})</p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          Logout
        </Button>
      </header>

      <main className="flex-1 p-4 space-y-4 max-w-4xl mx-auto w-full pb-20">
        {activeTab === 'today' && (
          <section className="bg-white rounded-lg shadow p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500">Sesi & Tanggal</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Select value={sesiKey} onValueChange={setSesiKey}>
                    <SelectTrigger className="w-40 h-8 text-xs">
                      <SelectValue placeholder="Pilih sesi" />
                    </SelectTrigger>
                    <SelectContent>
                      {sesiList.map((s) => (
                        <SelectItem key={s.key} value={s.key} className="text-xs">
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="date"
                    value={tanggal}
                    onChange={(e) => setTanggal(e.target.value)}
                    className="h-8 text-xs w-40"
                  />
                </div>
              </div>
              <div className="flex gap-2 items-end">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Cari Nama</p>
                  <Input
                    placeholder="Cari nama siswa..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 text-xs"
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
                <Scanner onScan={handleScanResult} allowMultiple={false} styles={{ container: { width: '100%' } }} />
              </div>
            ) : (
              <p className="text-xs text-gray-500">
                Tekan tombol <span className="font-semibold">Mulai Scan</span> untuk mengaktifkan kamera dan scan QR
                siswa.
              </p>
            )}

            <div className="mt-4">
              {loadingData ? (
                <div className="text-center text-xs text-gray-500 py-4">Memuat data...</div>
              ) : !selectedTingkatan ? (
                <div className="text-center text-xs text-gray-500 py-4">
                  Pilih tingkatan di menu bawah untuk melihat daftar siswa.
                </div>
              ) : !groupedData[selectedTingkatan.key] ? (
                <div className="text-center text-xs text-gray-500 py-4">Tidak ada data siswa untuk tingkatan ini</div>
              ) : (
                <div className="space-y-4 max-h-[420px] overflow-y-auto">
                  {Object.values(groupedData[selectedTingkatan.key].kelompok).map((group) => {
                    const count = group.items.length;
                    const key = group.kelompok_id || group.kelompok_nama;
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
                            {group.kelompok_nama || 'Tanpa Kelompok'} ({count} siswa)
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
                                  {/* Tanpa keterangan tingkatan/kelompok di bawah nama */}
                                </div>
                                <div className="w-32">
                                  <Select
                                    value={row.status || 'null'}
                                    onValueChange={(val) => handleStatusChange(row.siswa_id, group.kelompok_id, val)}
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
        )}

        {activeTab === 'history' && (
          <section className="bg-white rounded-lg shadow p-4 space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="w-full md:w-64">
                  <p className="text-xs text-gray-500 mb-1">Cari Nama</p>
                  <Input
                    placeholder="Cari di riwayat..."
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex gap-2 items-end">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tanggal Mulai</p>
                    <Input
                      type="date"
                      value={historyStart}
                      onChange={(e) => setHistoryStart(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Tanggal Akhir</p>
                    <Input
                      type="date"
                      value={historyEnd}
                      onChange={(e) => setHistoryEnd(e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="pt-5">
                    <Button
                      type="button"
                      size="sm"
                      className="w-full md:w-auto"
                      onClick={async () => {
                        try {
                          setLoadingHistory(true);
                          const resp = await pengabsenPMQAppAPI.riwayat({
                            tanggal_start: historyStart,
                            tanggal_end: historyEnd,
                            sesi: sesiKey,
                          });
                          setHistoryItems(resp.data.detail || []);
                          setCollapsedHistoryGroups({});
                        } catch (e) {
                          // silent
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

            {loadingHistory ? (
              <div className="text-center text-xs text-gray-500 py-4">Memuat riwayat...</div>
            ) : groupedHistory.length === 0 ? (
              <div className="text-center text-xs text-gray-500 py-4">Tidak ada riwayat</div>
            ) : (
              <div className="space-y-4 max-h-[420px] overflow-y-auto">
                {groupedHistory.map((group) => {
                  const count = group.items.length;
                  const key = group.kelompok_id || group.kelompok_nama;
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
                          {group.kelompok_nama || 'Tanpa Kelompok'} ({count} data)
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
                                  {row.tingkatan_label}  b7 {group.kelompok_nama || '-'}  b7 {row.tanggal}
                                </p>
                              </div>
                              <div className="text-xs capitalize text-gray-700">{row.status}</div>
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
    </div>
  );
};

export default PengabsenPMQApp;
