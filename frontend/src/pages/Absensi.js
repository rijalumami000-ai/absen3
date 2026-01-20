import React, { useState, useEffect } from 'react';
import { absensiAPI, asramaAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ClipboardList, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const Absensi = () => {
  const [detailData, setDetailData] = useState(null);
  const [asramaList, setAsramaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTanggal, setFilterTanggal] = useState(new Date().toISOString().split('T')[0]);
  const [filterAsrama, setFilterAsrama] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterPeriode, setFilterPeriode] = useState('hari');
  const [tanggalStart, setTanggalStart] = useState(new Date().toISOString().split('T')[0]);
  const [tanggalEnd, setTanggalEnd] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadDetail();
  }, [filterTanggal, filterAsrama, filterGender]);

  useEffect(() => {
    calculateDateRange();
  }, [filterPeriode, filterTanggal]);

  const loadData = async () => {
    try {
      const asramaRes = await asramaAPI.getAll();
      setAsramaList(asramaRes.data);
      await loadDetail();
    } catch (error) {
      toast({
        title: \"Error\",
        description: \"Gagal memuat data\",
        variant: \"destructive\",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateDateRange = () => {
    const date = new Date(filterTanggal);
    let start, end;

    switch(filterPeriode) {
      case 'hari':
        start = end = filterTanggal;
        break;
      case 'minggu':
        start = new Date(date);
        start.setDate(date.getDate() - date.getDay());
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        break;
      case '2minggu':
        start = new Date(date);
        start.setDate(date.getDate() - 13);
        end = date;
        break;
      case 'bulan':
        start = new Date(date.getFullYear(), date.getMonth(), 1);
        end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        break;
      case 'semester':
        start = new Date(date);
        start.setMonth(date.getMonth() - 5);
        end = date;
        break;
      case 'tahun':
        start = new Date(date.getFullYear(), 0, 1);
        end = new Date(date.getFullYear(), 11, 31);
        break;
      default:
        start = end = filterTanggal;
    }

    setTanggalStart(start.toISOString().split('T')[0]);
    setTanggalEnd(end.toISOString().split('T')[0]);
  };

  const loadDetail = async () => {
    try {
      const response = await absensiAPI.getDetail(
        filterTanggal,
        filterAsrama || undefined,
        filterGender || undefined
      );
      setDetailData(response.data);
    } catch (error) {
      console.error('Error loading detail:', error);
      setDetailData(null);
    }
  };

  const waktuSholatList = [
    { key: 'subuh', name: 'Subuh', color: 'indigo' },
    { key: 'dzuhur', name: 'Dzuhur', color: 'blue' },
    { key: 'ashar', name: 'Ashar', color: 'amber' },
    { key: 'maghrib', name: 'Maghrib', color: 'orange' },
    { key: 'isya', name: 'Isya', color: 'purple' }
  ];

  const statusInfo = [
    { key: 'hadir', name: 'Hadir', icon: CheckCircle, color: 'green' },
    { key: 'alfa', name: 'Alfa', icon: XCircle, color: 'red' },
    { key: 'sakit', name: 'Sakit', icon: AlertCircle, color: 'yellow' },
    { key: 'izin', name: 'Izin', icon: AlertCircle, color: 'blue' },
    { key: 'haid', name: 'Haid', icon: Users, color: 'purple' },
    { key: 'istihadhoh', name: 'Istihadhoh', icon: Users, color: 'pink' }
  ];

  const getStatusColor = (status) => {
    const colors = {
      hadir: 'bg-green-100 text-green-700 border-green-200',
      alfa: 'bg-red-100 text-red-700 border-red-200',
      sakit: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      izin: 'bg-blue-100 text-blue-700 border-blue-200',
      haid: 'bg-purple-100 text-purple-700 border-purple-200',
      istihadhoh: 'bg-pink-100 text-pink-700 border-pink-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  if (loading) return <div className=\"flex justify-center p-8\">Memuat data...</div>;

  return (
    <div data-testid=\"absensi-page\">
      <div className=\"mb-6\">
        <h1 className=\"text-3xl font-bold text-gray-800 flex items-center\">
          <ClipboardList className=\"mr-3\" size={32} />
          Riwayat Absensi
        </h1>
        <p className=\"text-gray-600 mt-1\">Data absensi sholat santri per waktu</p>
      </div>

      {/* Filters */}
      <Card className=\"mb-6\">
        <CardContent className=\"p-4\">
          <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4\">
            <div>
              <Label>Periode</Label>
              <Select value={filterPeriode} onValueChange={setFilterPeriode}>
                <SelectTrigger data-testid=\"filter-periode-select\">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=\"hari\">Per Hari</SelectItem>
                  <SelectItem value=\"minggu\">Per Minggu</SelectItem>
                  <SelectItem value=\"2minggu\">Per 2 Minggu</SelectItem>
                  <SelectItem value=\"bulan\">Per Bulan</SelectItem>
                  <SelectItem value=\"semester\">Per Semester (6 Bulan)</SelectItem>
                  <SelectItem value=\"tahun\">Per Tahun</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tanggal</Label>
              <Input
                type=\"date\"
                value={filterTanggal}
                onChange={(e) => setFilterTanggal(e.target.value)}
                data-testid=\"filter-tanggal-input\"
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger data-testid=\"filter-gender-select\">
                  <SelectValue placeholder=\"Semua\" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=\"\">Semua</SelectItem>
                  <SelectItem value=\"putra\">Putra</SelectItem>
                  <SelectItem value=\"putri\">Putri</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Asrama</Label>
              <Select value={filterAsrama} onValueChange={setFilterAsrama}>
                <SelectTrigger data-testid=\"filter-asrama-select\">
                  <SelectValue placeholder=\"Semua\" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=\"\">Semua</SelectItem>
                  {asramaList
                    .filter(a => !filterGender || a.gender === filterGender)
                    .map((asrama) => (
                      <SelectItem key={asrama.id} value={asrama.id}>
                        {asrama.nama} ({asrama.gender})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className=\"mt-4 text-sm text-gray-600\">
            Menampilkan data: <strong>{tanggalStart}</strong> s/d <strong>{tanggalEnd}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Detail per Waktu Sholat */}
      {detailData ? (
        <div className=\"space-y-6\">
          {waktuSholatList.map((waktu) => (
            <Card key={waktu.key}>
              <CardHeader className={`bg-${waktu.color}-50`}>
                <CardTitle className=\"flex items-center text-xl\">
                  <span className=\"capitalize\">{waktu.name}</span>
                  <span className=\"ml-auto text-sm font-normal text-gray-600\">
                    Total: {Object.values(detailData[waktu.key] || {}).reduce((sum, arr) => sum + arr.length, 0)} record
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className=\"p-6\">
                <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4\">
                  {statusInfo.map((status) => {
                    const Icon = status.icon;
                    const santriList = detailData[waktu.key]?.[status.key] || [];
                    return (
                      <div
                        key={status.key}
                        className={`border-2 rounded-lg p-4 ${getStatusColor(status.key)}`}
                        data-testid={`${waktu.key}-${status.key}`}
                      >
                        <div className=\"flex items-center justify-between mb-3\">
                          <div className=\"flex items-center\">
                            <Icon size={20} className=\"mr-2\" />
                            <span className=\"font-semibold\">{status.name}</span>
                          </div>
                          <span className=\"text-2xl font-bold\">{santriList.length}</span>
                        </div>
                        {santriList.length > 0 && (
                          <div className=\"mt-2 space-y-1 max-h-40 overflow-y-auto\">
                            {santriList.map((santri, idx) => (
                              <div
                                key={idx}
                                className=\"text-xs p-2 bg-white bg-opacity-50 rounded\"
                              >
                                <div className=\"font-medium\">{santri.nama}</div>
                                <div className=\"text-gray-600\">NIS: {santri.nis}</div>
                              </div>
                            ))}
                          </div>
                        )}
                        {santriList.length === 0 && (
                          <p className=\"text-xs opacity-60 mt-2\">Tidak ada data</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className=\"p-12 text-center text-gray-500\">
            <ClipboardList size={48} className=\"mx-auto mb-4 opacity-30\" />
            <p>Tidak ada data absensi untuk filter yang dipilih</p>
            <p className=\"text-sm mt-2\">Coba ubah filter tanggal, gender, atau asrama</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Absensi;
