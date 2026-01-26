import React, { useState, useEffect } from 'react';
import { waktuSholatAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Clock, RefreshCw, MapPin } from 'lucide-react';

const getTodayLocalYMD = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const WaktuSholat = () => {
  const [waktuSholat, setWaktuSholat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [tanggal, setTanggal] = useState(getTodayLocalYMD());
  const { toast } = useToast();

  useEffect(() => {
    loadWaktuSholat();
  }, [tanggal]);

  const loadWaktuSholat = async () => {
    setLoading(true);
    try {
      const response = await waktuSholatAPI.get(tanggal);
      setWaktuSholat(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat waktu sholat",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await waktuSholatAPI.sync(tanggal);
      setWaktuSholat(response.data);
      toast({
        title: "Sukses",
        description: "Waktu sholat berhasil disinkronkan",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyinkronkan waktu sholat",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const waktuSholatItems = [
    { name: 'Subuh', time: waktuSholat?.subuh, color: 'bg-indigo-50 border-indigo-200' },
    { name: 'Dzuhur', time: waktuSholat?.dzuhur, color: 'bg-blue-50 border-blue-200' },
    { name: 'Ashar', time: waktuSholat?.ashar, color: 'bg-amber-50 border-amber-200' },
    { name: 'Maghrib', time: waktuSholat?.maghrib, color: 'bg-orange-50 border-orange-200' },
    { name: 'Isya', time: waktuSholat?.isya, color: 'bg-purple-50 border-purple-200' },
  ];

  return (
    <div data-testid="waktu-sholat-page" className="animate-fade-in">
      <div className="mb-6 animate-slide-in-left">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center font-display">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
            <Clock className="text-white" size={24} />
          </div>
          Waktu Sholat
        </h1>
        <p className="text-gray-600 mt-2 ml-15">Jadwal waktu sholat untuk Lampung Selatan</p>
      </div>

      <Card className="mb-6 card-hover shadow-card hover:shadow-card-hover transition-smooth animate-scale-in">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <Label>Pilih Tanggal</Label>
              <Input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                data-testid="tanggal-input"
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleSync}
              disabled={syncing}
              data-testid="sync-button"
            >
              <RefreshCw className={`mr-2 ${syncing ? 'animate-spin' : ''}`} size={16} />
              {syncing ? 'Menyinkronkan...' : 'Sinkronkan dari API'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="text-gray-500">Memuat waktu sholat...</div>
        </div>
      ) : waktuSholat ? (
        <>
          <div className="mb-6 flex items-center text-gray-600">
            <MapPin size={20} className="mr-2" />
            <span>{waktuSholat.lokasi} - {waktuSholat.tanggal}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {waktuSholatItems.map((item, index) => (
              <Card key={index} className={`border-2 ${item.color} card-hover shadow-card hover:shadow-card-hover transition-smooth animate-scale-in`} data-testid={`waktu-${item.name.toLowerCase()}`} style={{ animationDelay: `${index * 100}ms` }}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-gray-700 font-display">{item.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-800 font-mono">
                    {item.time || '-'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">WIB</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6 shadow-card animate-fade-in" style={{ animationDelay: '500ms' }}>
            <CardHeader>
              <CardTitle className="font-display">Informasi</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>Waktu sholat diambil dari API Aladhan</li>
                <li>Data disinkronkan otomatis saat pertama kali dibuka</li>
                <li>Klik tombol Sinkronkan untuk memperbarui data</li>
                <li>Lokasi: Desa Cintamulya, Candipuro, Lampung Selatan</li>
              </ul>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            Tidak ada data waktu sholat. Silakan sinkronkan dari API.
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WaktuSholat;
