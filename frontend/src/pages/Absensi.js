import React, { useState, useEffect } from 'react';
import { absensiAPI, santriAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ClipboardList } from 'lucide-react';

const Absensi = () => {
  const [absensiList, setAbsensiList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTanggal, setFilterTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [filterWaktuSholat, setFilterWaktuSholat] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadAbsensi();
  }, [filterTanggal, filterWaktuSholat]);

  const loadData = async () => {
    try {
      const santriRes = await santriAPI.getAll({});
      setSantriList(santriRes.data);
      await loadAbsensi();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAbsensi = async () => {
    try {
      const params = {};
      if (filterTanggal) params.tanggal = filterTanggal;
      if (filterWaktuSholat) params.waktu_sholat = filterWaktuSholat;
      
      const response = await absensiAPI.getAll(params);
      setAbsensiList(response.data);
    } catch (error) {
      console.error('Error loading absensi:', error);
    }
  };

  const getSantriName = (santriId) => {
    const santri = santriList.find(s => s.id === santriId);
    return santri ? santri.nama : 'Unknown';
  };

  const getSantriNIS = (santriId) => {
    const santri = santriList.find(s => s.id === santriId);
    return santri ? santri.nis : '-';
  };

  const getStatusColor = (status) => {
    const colors = {
      hadir: 'bg-green-100 text-green-700',
      alfa: 'bg-red-100 text-red-700',
      sakit: 'bg-yellow-100 text-yellow-700',
      izin: 'bg-blue-100 text-blue-700',
      haid: 'bg-purple-100 text-purple-700',
      istihadhoh: 'bg-pink-100 text-pink-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) return <div className="flex justify-center p-8">Memuat data...</div>;

  return (
    <div data-testid="absensi-page">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <ClipboardList className="mr-3" size={32} />
          Riwayat Absensi
        </h1>
        <p className="text-gray-600 mt-1">Data absensi sholat santri</p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label>Tanggal</Label>
              <Input
                type="date"
                value={filterTanggal}
                onChange={(e) => setFilterTanggal(e.target.value)}
                data-testid="filter-tanggal-input"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label>Waktu Sholat</Label>
              <Select value={filterWaktuSholat} onValueChange={setFilterWaktuSholat}>
                <SelectTrigger data-testid="filter-waktu-select">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua</SelectItem>
                  <SelectItem value="subuh">Subuh</SelectItem>
                  <SelectItem value="dzuhur">Dzuhur</SelectItem>
                  <SelectItem value="ashar">Ashar</SelectItem>
                  <SelectItem value="maghrib">Maghrib</SelectItem>
                  <SelectItem value="isya">Isya</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Absensi List */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu Sholat</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIS</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Santri</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Waktu Absen</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {absensiList.map((absensi) => (
              <tr key={absensi.id} data-testid={`absensi-row-${absensi.id}`}>
                <td className="px-6 py-4 text-sm text-gray-900">{absensi.tanggal}</td>
                <td className="px-6 py-4 text-sm text-gray-900 capitalize">{absensi.waktu_sholat}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{getSantriNIS(absensi.santri_id)}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{getSantriName(absensi.santri_id)}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(absensi.status)}`}>
                    {absensi.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{formatDateTime(absensi.waktu_absen)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {absensiList.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Tidak ada data absensi untuk filter yang dipilih
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Total: {absensiList.length} record
      </div>
    </div>
  );
};

export default Absensi;
