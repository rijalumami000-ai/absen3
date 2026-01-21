import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePengabsenAuth } from '@/contexts/PengabsenAuthContext';
import { pengabsenAppAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Scanner } from '@yudiel/react-qr-scanner';

const WAKTU_OPTIONS = [
  { value: 'subuh', label: 'Subuh' },
  { value: 'dzuhur', label: 'Dzuhur' },
  { value: 'ashar', label: 'Ashar' },
  { value: 'maghrib', label: 'Maghrib' },
  { value: 'isya', label: 'Isya' },
];

const STATUS_OPTIONS = [
  { value: 'null', label: 'Belum' },
  { value: 'hadir', label: 'Hadir' },
  { value: 'alfa', label: 'Alfa' },
  { value: 'sakit', label: 'Sakit' },
  { value: 'izin', label: 'Izin' },
  { value: 'haid', label: 'Haid' },
  { value: 'istihadhoh', label: 'Istihadhoh' },
];

const PengabsenApp = () => {
  const { user, loading, logout } = usePengabsenAuth();
  const [activeTab, setActiveTab] = useState('today'); // 'today' | 'history'
  const [waktu, setWaktu] = useState('maghrib');
  const [data, setData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [lastScanAt, setLastScanAt] = useState(0);
  const [showScanSuccess, setShowScanSuccess] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyStart, setHistoryStart] = useState(() => new Date().toISOString().split('T')[0]);
  const [historyEnd, setHistoryEnd] = useState(() => new Date().toISOString().split('T')[0]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/pengabsen-app/login');
    }
  }, [loading, user, navigate]);

  const loadData = async (waktuSholat) => {
    try {
      setLoadingData(true);
      const resp = await pengabsenAppAPI.listHariIni({ waktu_sholat: waktuSholat });
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

  useEffect(() => {
    if (user) {
      loadData(waktu);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, waktu]);

  const handleStatusChange = async (santriId, status) => {
    try {
      if (status === 'null') {
        await pengabsenAppAPI.deleteAbsensi({ santri_id: santriId, waktu_sholat: waktu });
      } else {
        await pengabsenAppAPI.upsertAbsensi({
          santri_id: santriId,
          waktu_sholat: waktu,
          status_absen: status,
        });
      }
      await loadData(waktu);
      toast({ title: 'Sukses', description: 'Status absensi diperbarui' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Gagal memperbarui status',
        variant: 'destructive',
      });
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Memuat...</div>
      </div>
  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const resp = await pengabsenAppAPI.riwayat({ tanggal_start: historyStart, tanggal_end: historyEnd });
      setHistoryItems(resp.data.items || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat riwayat absensi',
        variant: 'destructive',
      });
    } finally {
      setLoadingHistory(false);
    }
  };

    );
  }

  const totalSantri = data.length;
  const hadirCount = data.filter((row) => row.status === 'hadir').length;
  const belumCount = data.filter((row) => row.status == null).length;

  const groupedByAsrama = data.reduce((acc, row) => {
    const key = row.asrama_id || 'tanpa-asrama';
    if (!acc[key]) {
      acc[key] = {
        asramaId: row.asrama_id,
        namaAsrama: row.nama_asrama || 'Tanpa Asrama',
        items: [],
      };
    }
    acc[key].items.push(row);
    return acc;
  }, {});

  const groupedList = Object.values(groupedByAsrama);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col" data-testid="pengabsen-app-page">
      <header className="bg-white shadow-sm px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Absensi Sholat - Pengabsen</h1>
          <p className="text-xs text-gray-500">{user.nama} (@{user.username})</p>
        </div>
        <Button variant="outline" size="sm" onClick={logout}>
          Logout
        </Button>
      </header>

      <main className="flex-1 p-4 space-y-4 max-w-4xl mx-auto w-full">
        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Pilih Waktu Sholat</h2>
          <div className="flex flex-wrap gap-2">
            {WAKTU_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setWaktu(opt.value)}
                className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                  waktu === opt.value
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-700">Daftar Santri & Status</h2>
              <p className="text-xs text-gray-500 mt-1">
                Total: <span className="font-semibold">{totalSantri}</span> santri &mdash; Hadir:{' '}
                <span className="text-emerald-600 font-semibold">{hadirCount}</span> &mdash; Belum:{' '}
                <span className="text-amber-600 font-semibold">{belumCount}</span>
              </p>
            </div>
          </div>

          {loadingData ? (
            <div className="py-6 text-center text-gray-500">Memuat data...</div>
          ) : data.length === 0 ? (
            <div className="py-6 text-center text-gray-500 text-sm">
              Belum ada santri untuk asrama yang Anda kelola.
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto space-y-4">
              {groupedList.map((group) => (
                <div key={group.asramaId || 'tanpa-asrama'} className="border rounded-lg overflow-hidden bg-white">
                  <div className="px-3 py-2 bg-gray-50 border-b flex items-center justify-between">
                    <div className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                        {group.namaAsrama?.[0] || 'A'}
                      </span>
                      <span>{group.namaAsrama}</span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {group.items.length} santri
                    </div>
                  </div>
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b text-xs text-gray-500">
                      <tr>
                        <th className="px-3 py-2 text-left">Nama</th>
                        <th className="px-3 py-2 text-left">NIS</th>
                        <th className="px-3 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {group.items.map((row) => (
                        <tr key={row.santri_id}>
                          <td className="px-3 py-2 text-gray-800">{row.nama}</td>
                          <td className="px-3 py-2 text-gray-600">{row.nis}</td>
                          <td className="px-3 py-2">
                            <Select
                              value={row.status ?? 'null'}
                              onValueChange={(val) => handleStatusChange(row.santri_id, val)}
                            >
                              <SelectTrigger className="w-32 h-8 text-xs">
                                <SelectValue placeholder="Pilih status" />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700">Scan QR Santri</h2>
            <Button
              variant={scanning ? 'outline' : 'default'}
              size="sm"
              onClick={() => setScanning((prev) => !prev)}
            >
              {scanning ? 'Stop Kamera' : 'Mulai Scan'}
            </Button>
          </div>

          {!scanning ? (
            <p className="text-xs text-gray-500">
              Tekan tombol <span className="font-semibold">Mulai Scan</span> untuk mengaktifkan kamera dan scan QR
              santri. Pastikan Anda mengizinkan akses kamera di browser.
            </p>
          ) : (
            <div className="space-y-3">
              <div
                className={`aspect-video max-w-md mx-auto overflow-hidden rounded-xl border bg-black transition-colors duration-300 ${
                  showScanSuccess ? 'border-emerald-500' : 'border-gray-300'
                }`}
              >
                <Scanner
                  onScan={async (detected) => {
                    try {
                      if (!detected || detected.length === 0) return;
                      const code = detected[0];
                      const text = code.rawValue || '';
                      if (!text) return;

                      const parsed = JSON.parse(text);
                      if (!parsed.santri_id) {
                        throw new Error('QR tidak berisi santri_id');
                      }

                      const now = Date.now();
                      if (now - lastScanAt < 1500) {
                        // dalam 1.5 detik, abaikan untuk mencegah double scan
                        return;
                      }

                      setLastScanAt(now);
                      setShowScanSuccess(true);
                      setTimeout(() => setShowScanSuccess(false), 1000);

                      setLastScan({ raw: text, parsed, waktu });
                      await pengabsenAppAPI.upsertAbsensi({
                        santri_id: parsed.santri_id,
                        waktu_sholat: waktu,
                        status_absen: 'hadir',
                      });
                      await loadData(waktu);
                      toast({
                        title: 'Scan Berhasil',
                        description: `Hadir: ${parsed.nama || 'Santri'} (${parsed.nis || '-'})`,
                      });
                    } catch (e) {
                      console.error(e);
                      toast({
                        title: 'QR tidak valid',
                        description: 'Pastikan QR berasal dari sistem ini.',
                        variant: 'destructive',
                      });
                    }
                  }}
                  onError={(error) => {
                    console.warn(error);
                  }}
                  components={{
                    audio: false,
                  }}
                  styles={{
                    container: { width: '100%', height: '100%' },
                    video: { width: '100%', height: '100%', objectFit: 'cover' },
                  }}
                />
              </div>

              {showScanSuccess && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-emerald-500/80 text-white px-6 py-3 rounded-full text-lg font-bold shadow-lg">
                    HADIR
                  </div>
                </div>
              )}

              {lastScan && (
                <div className="text-xs text-gray-600 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                  <div className="font-semibold mb-1">Scan terakhir:</div>
                  <div>Nama: {lastScan.parsed.nama}</div>
                  <div>NIS: {lastScan.parsed.nis}</div>
                  <div>Waktu Sholat: {WAKTU_OPTIONS.find((w) => w.value === lastScan.waktu)?.label}</div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default PengabsenApp;
