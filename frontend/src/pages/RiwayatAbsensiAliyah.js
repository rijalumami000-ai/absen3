import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { downloadRiwayatAbsensiAliyahPDF } from '@/lib/pdfUtils';
import { ClipboardList, CheckCircle, XCircle, AlertCircle, Clock, FileDown } from 'lucide-react';

const getTodayLocalYMD = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const RiwayatAbsensiAliyah = () => {
  const [kelasList, setKelasList] = useState([]);
  const [filterKelas, setFilterKelas] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [filterPeriode, setFilterPeriode] = useState('hari');
  const [filterTanggal, setFilterTanggal] = useState(getTodayLocalYMD());
  const [tanggalStart, setTanggalStart] = useState(getTodayLocalYMD());
  const [tanggalEnd, setTanggalEnd] = useState(getTodayLocalYMD());
  const [summary, setSummary] = useState(null);
  const [detail, setDetail] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterJenis, setFilterJenis] = useState('all'); // 'all' | 'pagi' | 'dzuhur'

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);

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

  const getKelasLabel = () => {
    if (filterKelas === 'all') return '';
    const kelas = kelasList.find((k) => k.id === filterKelas);
    return kelas ? kelas.nama : '';
  };

  const getGenderLabel = () => {
    if (filterGender === 'all') return '';
    if (filterGender === 'putra') return 'Laki-laki';
    if (filterGender === 'putri') return 'Perempuan';
    return '';
  };

  useEffect(() => {
    loadKelas();
  }, []);

  useEffect(() => {
    calculateDateRange();
  }, [filterPeriode, filterTanggal]);

  useEffect(() => {
    loadData();
  }, [filterKelas, filterGender, tanggalStart, tanggalEnd, filterJenis]);

  const calculateDateRange = () => {
    const date = new Date(filterTanggal);
    let start;
    let end;

    switch (filterPeriode) {
      case 'hari':
        start = filterTanggal;
        end = filterTanggal;
        break;
      case 'minggu1':
      case 'minggu2':
      case 'minggu3':
      case 'minggu4': {
        const weekIndex = parseInt(filterPeriode.replace('minggu', ''), 10) - 1;
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
        const sem1Start = new Date(date.getFullYear(), 0, 1);
        const sem1End = new Date(date.getFullYear(), 5, 30);
        start = sem1Start.toISOString().split('T')[0];
        end = sem1End.toISOString().split('T')[0];
        break;
      }
      case 'semester2': {
        const sem2Start = new Date(date.getFullYear(), 6, 1);
        const sem2End = new Date(date.getFullYear(), 11, 31);
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

  const loadKelas = async () => {
    try {
      const res = await api.get('/aliyah/kelas');
      setKelasList(res.data || []);
    } catch (e) {
      console.error('Gagal memuat kelas aliyah', e);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {
        tanggal_start: tanggalStart,
        tanggal_end: tanggalEnd,
      };
      if (filterKelas !== 'all') params.kelas_id = filterKelas;
      if (filterGender !== 'all') params.gender = filterGender;
      if (filterJenis !== 'all') params.jenis = filterJenis;

      const res = await api.get('/aliyah/absensi/riwayat', { params });
      setSummary(res.data.summary);
      setDetail(res.data.detail);
    } catch (e) {
      console.error('Gagal memuat riwayat absensi aliyah', e);
    } finally {
      setLoading(false);
    }
  };

  const statusCards = [
    { key: 'hadir', label: 'Hadir', icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-50' },
    { key: 'alfa', label: 'Alfa', icon: XCircle, color: 'text-red-700', bg: 'bg-red-50' },
    { key: 'sakit', label: 'Sakit', icon: AlertCircle, color: 'text-yellow-700', bg: 'bg-yellow-50' },
    { key: 'izin', label: 'Izin', icon: AlertCircle, color: 'text-blue-700', bg: 'bg-blue-50' },
    { key: 'dispensasi', label: 'Dispensasi', icon: AlertCircle, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { key: 'bolos', label: 'Bolos', icon: Clock, color: 'text-orange-700', bg: 'bg-orange-50' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6 animate-slide-in-left">
      <div className="flex flex-wrap gap-2 mb-3">
        <Button
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          {statusCards.map((item) => {
            const Icon = item.icon;
            return (
              <Card key={item.key} className="shadow-card animate-scale-in">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                    <p className="text-2xl font-bold text-foreground">{summary[item.key] ?? 0}</p>
                  </div>
                  <div className={`${item.bg} ${item.color} p-2 rounded-lg`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

          type="button"
          size="sm"
          variant={filterJenis === 'pagi' ? 'default' : 'outline'}
          onClick={() => {
            setFilterJenis('pagi');
            setPage(1);
          }}
        >
          Absensi Kehadiran Siswa Pagi Hari
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filterJenis === 'dzuhur' ? 'default' : 'outline'}
          onClick={() => {
            setFilterJenis('dzuhur');
            setPage(1);
          }}
        >
          Kehadiran Sholat Dhuhur
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filterJenis === 'all' ? 'default' : 'outline'}
          onClick={() => {
            setFilterJenis('all');
            setPage(1);
          }}
        >
          Semua
        </Button>
      </div>

        <h1 className="text-3xl font-bold text-gray-800 flex items-center font-display">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-emerald-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
            <ClipboardList className="text-white" size={24} />
          </div>
          Riwayat Absensi Madrasah Aliyah
        </h1>
        <p className="text-gray-600 mt-2 ml-15">Ringkasan dan detail kehadiran siswa Madrasah Aliyah</p>
      </div>

      {/* Filter Bar */}
      <Card className="mb-6 shadow-card animate-scale-in">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div className="text-sm text-muted-foreground">
              <div>{getPeriodeLabel()}</div>
              <div>{`Periode tanggal: ${tanggalStart} s.d. ${tanggalEnd}`}</div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadRiwayatAbsensiAliyahPDF(detail, {
                    periodeLabel: getPeriodeLabel(),
                    tanggalStart,
                    tanggalEnd,
                    kelasLabel: getKelasLabel(),
                    genderLabel: getGenderLabel(),
                  })
                }
                disabled={loading || detail.length === 0}
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
                <SelectTrigger>
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
              <Input type="date" value={filterTanggal} onChange={(e) => setFilterTanggal(e.target.value)} />
            </div>
            <div>
              <Label>Tanggal Mulai</Label>
              <Input type="date" value={tanggalStart} onChange={(e) => setTanggalStart(e.target.value)} />
            </div>
            <div>
              <Label>Tanggal Selesai</Label>
              <Input type="date" value={tanggalEnd} onChange={(e) => setTanggalEnd(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <Label>Filter Kelas Aliyah</Label>
              <Select value={filterKelas} onValueChange={setFilterKelas}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kelas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelas</SelectItem>
                  {kelasList.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
          {/* Pagination helpers */}
          {(() => {
            const total = detail.length;
            const effectivePageSize = pageSize === -1 ? (total || 1) : pageSize;
            const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(total / effectivePageSize));
            const currentPage = Math.min(page, totalPages);
            const startIndex = (currentPage - 1) * effectivePageSize;
            const endIndex = pageSize === -1 ? total : Math.min(startIndex + effectivePageSize, total);

            const pageData = detail.slice(startIndex, endIndex);

            return (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Tanggal</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Nama Siswa</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Kelas</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Gender</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Waktu Absen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {pageData.map((row) => (
                        <tr key={row.id || `${row.siswa_id}-${row.tanggal}-${row.status}`}>
                          <td className="px-4 py-2 text-muted-foreground">{row.tanggal}</td>
                          <td className="px-4 py-2 text-foreground">{row.siswa_nama}</td>
                          <td className="px-4 py-2 text-muted-foreground">{row.kelas_nama}</td>
                          <td className="px-4 py-2 text-muted-foreground">{row.gender}</td>
                          <td className="px-4 py-2 text-muted-foreground capitalize">{row.status}</td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {row.waktu_absen
                              ? new Date(row.waktu_absen).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Footer pagination */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-4 py-3 border-t text-xs text-muted-foreground">
                  <div>
                    Menampilkan {total === 0 ? 0 : startIndex + 1}-{endIndex} dari {total} baris
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span>Max per halaman:</span>
                      <Select
                        value={String(pageSize)}
                        onValueChange={(val) => {
                          const newSize = parseInt(val, 10);
                          setPageSize(newSize);
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="h-8 w-28">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[10, 30, 40, 50, 100, 150, 200, 300, 400, 500, 800, -1].map((opt) => (
                            <SelectItem key={opt} value={String(opt)}>
                              {opt === -1 ? 'Semua' : opt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Sebelumnya
                      </Button>
                      <span>
                        Halaman {currentPage} / {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      >
                        Berikutnya
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            );
          })()}

              </Select>
            </div>
            <div>
              <Label>Filter Gender</Label>
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Gender</SelectItem>
                  <SelectItem value="putra">Laki-laki</SelectItem>
                  <SelectItem value="putri">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Detail Absensi Aliyah</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
          ) : detail.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Tidak ada data absensi</div>
          ) : (
            <></>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RiwayatAbsensiAliyah;
