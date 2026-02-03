import React, { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { downloadRiwayatAbsensiPMQPDF } from '@/lib/pdfUtils';
import { ClipboardList, CheckCircle, XCircle, AlertCircle, Clock, FileDown } from 'lucide-react';

const getTodayLocalYMD = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const RiwayatAbsensiPMQ = () => {
  const [tingkatanList, setTingkatanList] = useState([]);
  const [kelompokList, setKelompokList] = useState([]);
  const [filterTingkatan, setFilterTingkatan] = useState('all');
  const [filterKelompok, setFilterKelompok] = useState('all');
  const [filterPeriode, setFilterPeriode] = useState('hari');
  const [filterTanggal, setFilterTanggal] = useState(getTodayLocalYMD());
  const [tanggalStart, setTanggalStart] = useState(getTodayLocalYMD());
  const [tanggalEnd, setTanggalEnd] = useState(getTodayLocalYMD());
  const [filterSesi, setFilterSesi] = useState('all'); // all | pagi | malam | custom
  const [filterStatus, setFilterStatus] = useState(null); // null = semua
  const [summary, setSummary] = useState(null);
  const [detail, setDetail] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const getTingkatanLabel = () => {
    if (filterTingkatan === 'all') return '';
    const t = tingkatanList.find((x) => x.key === filterTingkatan);
    return t ? t.label : '';
  };

  const getKelompokLabel = () => {
    if (filterKelompok === 'all') return '';
    const k = kelompokList.find((x) => x.id === filterKelompok);
    if (!k) return '';
    const tLabel = tingkatanList.find((t) => t.key === k.tingkatan_key)?.label || k.tingkatan_key;
    return `${k.nama} (${tLabel})`;
  };

  useEffect(() => {
    loadMaster();
  }, []);

  useEffect(() => {
    calculateDateRange();
  }, [filterPeriode, filterTanggal]);

  useEffect(() => {
    loadData();
    setPage(1);
  }, [filterTingkatan, filterKelompok, tanggalStart, tanggalEnd, filterSesi, filterStatus]);

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

  const loadMaster = async () => {
    try {
      const [tingRes, kelRes] = await Promise.all([
        api.get('/pmq/tingkatan'),
        api.get('/pmq/kelompok'),
      ]);
      setTingkatanList(tingRes.data || []);
      setKelompokList(kelRes.data || []);
    } catch (e) {
      console.error('Gagal memuat master PMQ', e);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {
        tanggal_start: tanggalStart,
        tanggal_end: tanggalEnd,
      };
      if (filterTingkatan !== 'all') params.tingkatan_key = filterTingkatan;
      if (filterKelompok !== 'all') params.kelompok_id = filterKelompok;
      if (filterSesi !== 'all') params.sesi = filterSesi;

      const res = await api.get('/pmq/absensi/riwayat', { params });
      setSummary(res.data.summary);
      let rows = res.data.detail || [];
      if (filterStatus) {
        rows = rows.filter((row) => row.status === filterStatus);
      }
      setDetail(rows);
    } catch (e) {
      console.error('Gagal memuat riwayat absensi PMQ', e);
    } finally {
      setLoading(false);
    }
  };

  const statusCards = [
    { key: 'hadir', label: 'Hadir', icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-50' },
    { key: 'alfa', label: 'Alfa', icon: XCircle, color: 'text-red-700', bg: 'bg-red-50' },
    { key: 'sakit', label: 'Sakit', icon: AlertCircle, color: 'text-yellow-700', bg: 'bg-yellow-50' },
    { key: 'izin', label: 'Izin', icon: AlertCircle, color: 'text-blue-700', bg: 'bg-blue-50' },
    { key: 'terlambat', label: 'Terlambat', icon: Clock, color: 'text-orange-700', bg: 'bg-orange-50' },
  ];

  const handleStatusCardClick = (statusKey) => {
    setFilterStatus((prev) => (prev === statusKey ? null : statusKey));
    setPage(1);
  };

  const total = detail.length;
  const effectivePageSize = pageSize === -1 ? (total || 1) : pageSize;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(total / effectivePageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * effectivePageSize;
  const endIndex = pageSize === -1 ? total : Math.min(startIndex + effectivePageSize, total);
  const pageData = detail.slice(startIndex, endIndex);

  return (
    <div className="animate-fade-in">
      <div className="mb-6 animate-slide-in-left">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center font-display">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-cyan-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
            <ClipboardList className="text-white" size={24} />
          </div>
          Riwayat Absensi PMQ
        </h1>
        <p className="text-gray-600 mt-2 ml-15">Ringkasan dan detail kehadiran siswa PMQ</p>
      </div>

      {/* Filter bar atas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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

      {/* Filter bar bawah */}
      <Card className="mb-4 shadow-card">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="text-sm text-muted-foreground">
              <div>{getPeriodeLabel()}</div>
              <div>{`Periode tanggal: ${tanggalStart} s.d. ${tanggalEnd}`}</div>
              <div>{`Tingkatan: ${getTingkatanLabel() || 'Semua'}`}</div>
              <div>{`Kelompok: ${getKelompokLabel() || 'Semua'}`}</div>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  downloadRiwayatAbsensiPMQPDF(detail, {
                    periodeLabel: getPeriodeLabel(),
                    tanggalStart,
                    tanggalEnd,
                    tingkatanLabel: getTingkatanLabel(),
                    kelompokLabel: getKelompokLabel(),
                  })
                }
                disabled={!detail.length}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Label>Tingkatan PMQ</Label>
              <Select
                value={filterTingkatan}
                onValueChange={(val) => {
                  setFilterTingkatan(val);
                  setFilterKelompok('all');
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Tingkatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Tingkatan</SelectItem>
                  {tingkatanList.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kelompok</Label>
              <Select
                value={filterKelompok}
                onValueChange={(val) => {
                  setFilterKelompok(val);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semua Kelompok" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kelompok</SelectItem>
                  {kelompokList
                    .filter((k) => filterTingkatan === 'all' || k.tingkatan_key === filterTingkatan)
                    .map((k) => {
                      const tLabel =
                        tingkatanList.find((t) => t.key === k.tingkatan_key)?.label || k.tingkatan_key;
                      return (
                        <SelectItem key={k.id} value={k.id}>
                          {k.nama} ({tLabel})
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Sesi</Label>
              <Select value={filterSesi} onValueChange={setFilterSesi}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Sesi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="pagi">Pagi</SelectItem>
                  <SelectItem value="malam">Malam</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Status</Label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                {statusCards.map((card) => {
                  const Icon = card.icon;
                  const isActive = filterStatus === card.key;
                  const count = summary?.[card.key] || 0;
                  return (
                    <button
                      key={card.key}
                      type="button"
                      onClick={() => handleStatusCardClick(card.key)}
                      className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                        isActive ? `${card.bg} ${card.color} border-current` : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="flex-1 text-left">{card.label}</span>
                      <span className="font-semibold">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabel detail */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Detail Riwayat Absensi PMQ</span>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Jumlah data: {total}</span>
              <select
                className="border border-border rounded px-2 py-1 bg-background"
                value={pageSize}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setPageSize(val);
                  setPage(1);
                }}
              >
                <option value={30}>30 / halaman</option>
                <option value={50}>50 / halaman</option>
                <option value={100}>100 / halaman</option>
                <option value={-1}>Tampilkan semua</option>
              </select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-10 text-center text-muted-foreground text-sm">Memuat data riwayat absensi PMQ...</div>
          ) : pageData.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">Tidak ada data ditemukan</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-foreground">No</th>
                    <th className="px-3 py-2 text-left font-semibold text-foreground">Tanggal</th>
                    <th className="px-3 py-2 text-left font-semibold text-foreground">Sesi</th>
                    <th className="px-3 py-2 text-left font-semibold text-foreground">Nama Siswa</th>
                    <th className="px-3 py-2 text-left font-semibold text-foreground">Tingkatan</th>
                    <th className="px-3 py-2 text-left font-semibold text-foreground">Kelompok</th>
                    <th className="px-3 py-2 text-left font-semibold text-foreground">Status</th>
                    <th className="px-3 py-2 text-left font-semibold text-foreground">Waktu Absen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pageData.map((row, idx) => (
                    <tr key={row.id || `${row.siswa_id}-${row.tanggal}-${idx}`} className="hover:bg-muted/40">
                      <td className="px-3 py-1.5 align-top">{startIndex + idx + 1}</td>
                      <td className="px-3 py-1.5 align-top">{row.tanggal || '-'}</td>
                      <td className="px-3 py-1.5 align-top capitalize">{row.sesi || '-'}</td>
                      <td className="px-3 py-1.5 align-top">{row.siswa_nama || '-'}</td>
                      <td className="px-3 py-1.5 align-top">{row.tingkatan_label || '-'}</td>
                      <td className="px-3 py-1.5 align-top">{row.kelompok_nama || '-'}</td>
                      <td className="px-3 py-1.5 align-top capitalize">{row.status || '-'}</td>
                      <td className="px-3 py-1.5 align-top">
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
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border text-xs text-muted-foreground">
              <div>
                Halaman {currentPage} dari {totalPages}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RiwayatAbsensiPMQ;
