import React, { useState, useEffect } from 'react';
import { absensiAPI, asramaAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { downloadRiwayatAbsensiSholatPDF } from '@/lib/pdfUtils';
import { ClipboardList, Users, CheckCircle, XCircle, AlertCircle, FileDown } from 'lucide-react';

const getTodayLocalYMD = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const Absensi = () => {
  const [detailData, setDetailData] = useState(null);
  const [asramaList, setAsramaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTanggal, setFilterTanggal] = useState(getTodayLocalYMD());
  const [filterAsrama, setFilterAsrama] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterPeriode, setFilterPeriode] = useState('hari');
  const [tanggalStart, setTanggalStart] = useState(getTodayLocalYMD());
  const [tanggalEnd, setTanggalEnd] = useState(getTodayLocalYMD());
  const { toast } = useToast();

  const getPeriodeLabel = () => {
    switch (filterPeriode) {
      case 'hari':
        return 'Periode: Per Hari';
      case 'minggu1':
        return 'Periode: Minggu 1';
      case 'minggu2':
        return 'Periode: Minggu 2';
      case 'minggu3':
        return 'Periode: Minggu 3';
      case 'minggu4':
        return 'Periode: Minggu 4';
      case '2minggu1':
        return 'Periode: 2 Minggu Pertama';
      case '2minggu2':
        return 'Periode: 2 Minggu Kedua';
      case 'semester1':
        return 'Periode: Semester 1 (Jan-Jun)';
      case 'semester2':
        return 'Periode: Semester 2 (Jul-Des)';
      case 'tahun':
        return 'Periode: Per Tahun';
      default:
        return '';
    }
  };

  const getGenderLabel = () => {
    if (!filterGender || filterGender === 'all') return '';
    if (filterGender === 'putra') return 'Laki-laki';
    if (filterGender === 'putri') return 'Perempuan';
    return '';
  };

  const getAsramaLabel = () => {
    if (!filterAsrama) return 'Semua';
    const asrama = asramaList.find((a) => a.id === filterAsrama);
    return asrama ? asrama.nama : 'Semua';
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    calculateDateRange();
  }, [filterPeriode, filterTanggal]);

  useEffect(() => {
    loadDetail();
  }, [tanggalStart, tanggalEnd, filterAsrama, filterGender]);

  const loadData = async () => {
    try {
      const asramaRes = await asramaAPI.getAll();
      setAsramaList(asramaRes.data);
      await loadDetail();
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

  const calculateDateRange = () => {
    const date = new Date(filterTanggal);
    let start, end;

    switch (filterPeriode) {
      case 'hari':
        start = filterTanggal;
        end = filterTanggal;
        break;
      case 'minggu1':
      case 'minggu2':
      case 'minggu3':
      case 'minggu4': {
        const weekIndex = parseInt(filterPeriode.replace('minggu', ''), 10) - 1; // 0-3
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const startDay = weekIndex * 7 + 1;
        const startDate = new Date(date.getFullYear(), date.getMonth(), startDay);
        const endDay = startDay + 6;
        const endDate = new Date(date.getFullYear(), date.getMonth(), endDay);
        start = startDate.toISOString().split('T')[0];
        end = endDate.toISOString().split('T')[0];
        break;
      }
      case '2minggu1': {
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const startDate = monthStart;
        const endDate = new Date(date.getFullYear(), date.getMonth(), 14);
        start = startDate.toISOString().split('T')[0];
        end = endDate.toISOString().split('T')[0];
        break;
      }
      case '2minggu2': {
        const startDate = new Date(date.getFullYear(), date.getMonth(), 15);
        const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        start = startDate.toISOString().split('T')[0];
        end = endDate.toISOString().split('T')[0];
        break;
      }
      case 'semester1': {
        const sem1Start = new Date(date.getFullYear(), 0, 1); // Jan 1
        const sem1End = new Date(date.getFullYear(), 5, 30); // Jun 30
        start = sem1Start.toISOString().split('T')[0];
        end = sem1End.toISOString().split('T')[0];
        break;
      }
      case 'semester2': {
        const sem2Start = new Date(date.getFullYear(), 6, 1); // Jul 1
        const sem2End = new Date(date.getFullYear(), 11, 31); // Dec 31
        start = sem2Start.toISOString().split('T')[0];
        end = sem2End.toISOString().split('T')[0];
        break;
      }
      case 'tahun': {
        const yearStart = new Date(date.getFullYear(), 0, 1);
        const yearEnd = new Date(date.getFullYear(), 11, 31);
        start = yearStart.toISOString().split('T')[0];
        end = yearEnd.toISOString().split('T')[0];
        break;
      }
      default:
        start = filterTanggal;
        end = filterTanggal;
    }

    setTanggalStart(start);
    setTanggalEnd(end);
  };

  const loadDetail = async () => {
    try {
      const response = await absensiAPI.getRiwayat({
        tanggal_start: tanggalStart,
        tanggal_end: tanggalEnd,
        asrama_id: filterAsrama || undefined,
        gender: filterGender || undefined,
      });
      setDetailData(response.data?.detail || {});
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

  const handleDownloadPDF = () => {
    if (!detailData) {
      toast({
        title: "Tidak ada data",
        description: "Tidak ada data untuk diunduh",
        variant: "destructive",
      });
      return;
    }

    const filters = {
      periodeLabel: getPeriodeLabel(),
      tanggalStart,
      tanggalEnd,
      asramaLabel: filterAsrama ? asramaList.find(a => a.id === filterAsrama)?.nama : null,
      genderLabel: filterGender ? (filterGender === 'putra' ? 'Putra' : 'Putri') : null,
    };

    try {
      downloadRiwayatAbsensiSholatPDF(detailData, filters);
      toast({
        title: "Berhasil",
        description: "File PDF berhasil diunduh",
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Gagal",
        description: "Gagal mengunduh file PDF",
        variant: "destructive",
      });
    }
  };

  if (loading) return <div className="flex justify-center p-8">Memuat data...</div>;

  return (
    <div data-testid="absensi-page" className="animate-fade-in">
      <div className="mb-6 animate-slide-in-left">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center font-display">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
            <ClipboardList className="text-white" size={24} />
          </div>
          Riwayat Absensi Sholat
        </h1>
        <p className="text-gray-600 mt-2 ml-15">Data absensi sholat santri per waktu</p>
      </div>

      {/* Filters */}
      <Card className="mb-6 shadow-card animate-scale-in">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="text-sm text-muted-foreground">
              <div>{getPeriodeLabel()}</div>
              <div>{`Periode tanggal: ${tanggalStart} s.d. ${tanggalEnd}`}</div>
              <div>{`Asrama: ${getAsramaLabel()}`}</div>
              <div>{`Gender: ${getGenderLabel() || 'Semua'}`}</div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadRiwayatAbsensiSholatPDF(detailData || {}, {
                    periodeLabel: getPeriodeLabel(),
                    tanggalStart,
                    tanggalEnd,
                    asramaLabel: getAsramaLabel(),
                    genderLabel: getGenderLabel(),
                  })
                }
                disabled={!detailData}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Periode</Label>
              <Select value={filterPeriode} onValueChange={setFilterPeriode}>
                <SelectTrigger data-testid="filter-periode-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hari">Per Hari</SelectItem>
                  <SelectItem value="minggu1">Minggu 1</SelectItem>
                  <SelectItem value="minggu2">Minggu 2</SelectItem>
                  <SelectItem value="minggu3">Minggu 3</SelectItem>
                  <SelectItem value="minggu4">Minggu 4</SelectItem>
                  <SelectItem value="2minggu1">2 Minggu Pertama</SelectItem>
                  <SelectItem value="2minggu2">2 Minggu Kedua</SelectItem>
                  <SelectItem value="semester1">Semester 1 (Jan-Jun)</SelectItem>
                  <SelectItem value="semester2">Semester 2 (Jul-Des)</SelectItem>
                  <SelectItem value="tahun">Per Tahun</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tanggal Referensi</Label>
              <Input
                type="date"
                value={filterTanggal}
                onChange={(e) => setFilterTanggal(e.target.value)}
                data-testid="filter-tanggal-input"
              />
            </div>
            <div>
              <Label>Tanggal Mulai</Label>
              <Input
                type="date"
                value={tanggalStart}
                onChange={(e) => setTanggalStart(e.target.value)}
              />
            </div>
            <div>
              <Label>Tanggal Selesai</Label>
              <Input
                type="date"
                value={tanggalEnd}
                onChange={(e) => setTanggalEnd(e.target.value)}
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={filterGender || 'all'} onValueChange={(val) => setFilterGender(val === 'all' ? '' : val)}>
                <SelectTrigger data-testid="filter-gender-select">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="putra">Putra</SelectItem>
                  <SelectItem value="putri">Putri</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Asrama</Label>
              <Select value={filterAsrama || 'all'} onValueChange={(val) => setFilterAsrama(val === 'all' ? '' : val)}>
                <SelectTrigger data-testid="filter-asrama-select">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
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
        </CardContent>
      </Card>

      {/* Detail per Waktu Sholat */}
      {detailData ? (
        <div className="space-y-6">
          {waktuSholatList.map((waktu) => (
            <Card key={waktu.key}>
              <CardHeader className={`bg-${waktu.color}-50`}>
                <CardTitle className="flex items-center text-xl">
                  <span className="capitalize">{waktu.name}</span>
                  <span className="ml-auto text-sm font-normal text-gray-600">
                    Total: {Object.values(detailData[waktu.key] || {}).reduce((sum, arr) => sum + arr.length, 0)} record
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {statusInfo.map((status) => {
                    const Icon = status.icon;
                    const santriList = detailData[waktu.key]?.[status.key] || [];
                    return (
                      <div
                        key={status.key}
                        className={`border-2 rounded-lg p-4 ${getStatusColor(status.key)}`}
                        data-testid={`${waktu.key}-${status.key}`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <Icon size={20} className="mr-2" />
                            <span className="font-semibold">{status.name}</span>
                          </div>
                          <span className="text-2xl font-bold">{santriList.length}</span>
                        </div>
                        {santriList.length > 0 && (
                          <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                            {santriList.map((santri, idx) => (
                              <div
                                key={idx}
                                className="text-xs p-2 bg-white bg-opacity-50 rounded"
                              >
                                <div className="font-medium">{santri.nama}</div>
                                <div className="text-gray-600">NIS: {santri.nis}</div>
                                {santri.pengabsen_nama && (
                                  <div className="text-gray-500 text-[11px] mt-0.5">
                                    Dicatat oleh: <span className="font-semibold">{santri.pengabsen_nama}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        {santriList.length === 0 && (
                          <p className="text-xs opacity-60 mt-2">Tidak ada data</p>
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
          <CardContent className="p-12 text-center text-gray-500">
            <ClipboardList size={48} className="mx-auto mb-4 opacity-30" />
            <p>Tidak ada data absensi untuk filter yang dipilih</p>
            <p className="text-sm mt-2">Coba ubah filter tanggal, gender, atau asrama</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Absensi;
