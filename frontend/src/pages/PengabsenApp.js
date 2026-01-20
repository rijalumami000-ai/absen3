import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePengabsenAuth } from '@/contexts/PengabsenAuthContext';
import { pengabsenAppAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

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
  const [waktu, setWaktu] = useState('maghrib');
  const [data, setData] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
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
    );
  }

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
            <h2 className="text-sm font-semibold text-gray-700">Daftar Santri & Status</h2>
            <span className="text-xs text-gray-500">Total: {data.length} santri</span>
          </div>

          {loadingData ? (
            <div className="py-6 text-center text-gray-500">Memuat data...</div>
          ) : data.length === 0 ? (
            <div className="py-6 text-center text-gray-500 text-sm">
              Belum ada santri untuk asrama yang Anda kelola.
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 border-b text-xs text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-left">Nama</th>
                    <th className="px-3 py-2 text-left">NIS</th>
                    <th className="px-3 py-2 text-left">Asrama</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.map((row) => (
                    <tr key={row.santri_id}>
                      <td className="px-3 py-2 text-gray-800">{row.nama}</td>
                      <td className="px-3 py-2 text-gray-600">{row.nis}</td>
                      <td className="px-3 py-2 text-gray-600">{row.nama_asrama}</td>
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
          )}
        </section>

        <section className="bg-white rounded-lg shadow p-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">Scan QR (Coming Soon)</h2>
          <p className="text-xs text-gray-500">
            Fitur kamera untuk scan QR santri akan ditambahkan pada tahap berikutnya. Saat ini Anda sudah dapat
            mengelola status hadir/alfa/sakit/izin/haid/istihadhoh secara manual dari daftar di atas.
          </p>
        </section>
      </main>
    </div>
  );
};

export default PengabsenApp;
