import React, { useEffect, useState } from 'react';
import { madinAbsensiAPI, madinKelasAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ClipboardList, Users, CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';

const getTodayLocalYMD = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const RiwayatAbsensiMadin = () => {
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

  useEffect(() => {
    loadKelas();
  }, []);

  useEffect(() => {
    calculateDateRange();
  }, [filterPeriode, filterTanggal]);

  useEffect(() => {
    loadData();
  }, [filterKelas, filterGender, tanggalStart, tanggalEnd]);

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

  const loadKelas = async () => {
    try {
      const res = await madinKelasAPI.getAll();
      setKelasList(res.data || []);
    } catch (e) {
      console.error('Gagal memuat kelas madin', e);
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

      const res = await madinAbsensiAPI.getRiwayat(params);
      setSummary(res.data.summary);
      setDetail(res.data.detail);
    } catch (e) {
      console.error('Gagal memuat riwayat absensi madin', e);
    } finally {
      setLoading(false);
    }
  };

  const statusCards = [
    { key: 'hadir', label: 'Hadir', icon: CheckCircle, color: 'text-green-700', bg: 'bg-green-50' },
    { key: 'alfa', label: 'Alfa', icon: XCircle, color: 'text-red-700', bg: 'bg-red-50' },
    { key: 'sakit', label: 'Sakit', icon: AlertCircle, color: 'text-yellow-700', bg: 'bg-yellow-50' },
    { key: 'izin', label: 'Izin', icon: AlertCircle, color: 'text-blue-700', bg: 'bg-blue-50' },
    { key: 'telat', label: 'Telat', icon: Clock, color: 'text-orange-700', bg: 'bg-orange-50' },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6 animate-slide-in-left">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center font-display">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
            <ClipboardList className="text-white" size={24} />
          </div>
          Riwayat Absensi Madin
        </h1>
        <p className="text-gray-600 mt-2 ml-15">Ringkasan dan detail kehadiran siswa Madrasah Diniyah</p>
      </div>

      {/* Filter Bar */}
      <Card className="mb-6 shadow-card animate-scale-in">
        <CardContent className="p-4">
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

            <div>
              <Label>Kelas Madin</Label>
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
              </Select>
            </div>
            <div>
              <Label>Gender</Label>
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="putra">Laki-laki</SelectItem>
                  <SelectItem value="putri">Perempuan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {statusCards.map((card) => {
          const Icon = card.icon;
          const total = summary?.[card.key] || 0;
          return (
            <Card key={card.key} className={`shadow-sm border ${card.bg} animate-fade-in`}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm font-semibold">
                  <span>{card.label}</span>
                  <Icon className={card.color} size={18} />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-bold text-gray-800">{total}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detail Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Detail Kehadiran</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left">Tanggal</th>
                <th className="px-4 py-2 text-left">Nama Siswa</th>
                <th className="px-4 py-2 text-left">Kelas</th>
                <th className="px-4 py-2 text-left">Gender</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Waktu Absen</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    Memuat data...
                  </td>
                </tr>
              ) : detail.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                    Tidak ada data absensi untuk filter ini.
                  </td>
                </tr>
              ) : (
                detail.map((row) => (
                  <tr key={row.id} className="border-t border-border hover:bg-muted/40">
                    <td className="px-4 py-2">{row.tanggal}</td>
                    <td className="px-4 py-2">{row.siswa_nama}</td>
                    <td className="px-4 py-2">{row.kelas_nama}</td>
                    <td className="px-4 py-2 capitalize">{row.gender}</td>
                    <td className="px-4 py-2 capitalize">{row.status}</td>
                    <td className="px-4 py-2">
                      {row.waktu_absen
                        ? new Date(row.waktu_absen).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default RiwayatAbsensiMadin;
