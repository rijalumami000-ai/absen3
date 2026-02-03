import React, { useEffect, useState } from 'react';
import { Plus, Search, Users, Link, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/api';

const SiswaPMQ = () => {
  const [siswaList, setSiswaList] = useState([]);
  const [tingkatanList, setTingkatanList] = useState([]);
  const [kelompokList, setKelompokList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTingkatan, setFilterTingkatan] = useState('all');
  const [filterKelompok, setFilterKelompok] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLinkSantriOpen, setIsLinkSantriOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    gender: '',
    tingkatan_key: '',
    kelompok_id: '',
  });
  const [linkForm, setLinkForm] = useState({
    santri_id: '',
    tingkatan_key: '',
    kelompok_id: '',
  });
  const [availableSantri, setAvailableSantri] = useState([]);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchMaster();
    fetchSiswa();
  }, []);

  const fetchMaster = async () => {
    try {
      const [tingRes, kelRes] = await Promise.all([
        api.get('/pmq/tingkatan'),
        api.get('/pmq/kelompok'),
      ]);
      setTingkatanList(tingRes.data || []);
      setKelompokList(kelRes.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Gagal memuat data tingkatan/kelompok PMQ');
    }
  };

  const fetchSiswa = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterTingkatan !== 'all') params.tingkatan_key = filterTingkatan;
      if (filterKelompok !== 'all') params.kelompok_id = filterKelompok;
      if (filterGender !== 'all') params.gender = filterGender;
      if (searchQuery) params.search = searchQuery;
      const res = await api.get('/pmq/siswa', { params });
      setSiswaList(res.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Gagal memuat siswa PMQ');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setFormData({ nama: '', gender: '', tingkatan_key: '', kelompok_id: '' });
    setEditingId(null);
    setIsCreateOpen(true);
  };

  const openLinkFromSantri = async () => {
    try {
      const res = await api.get('/pmq/santri-available');
      setAvailableSantri(res.data || []);
      setLinkForm({ santri_id: '', tingkatan_key: '', kelompok_id: '' });
      setIsLinkSantriOpen(true);
    } catch (e) {
      console.error(e);
      toast.error('Gagal memuat daftar santri');
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.nama || !formData.tingkatan_key) {
        toast.error('Nama dan Tingkatan wajib diisi');
        return;
      }
      
      if (editingId) {
        // Update existing siswa
        await api.put(`/pmq/siswa/${editingId}`, formData);
        toast.success('Siswa PMQ berhasil diperbarui');
      } else {
        // Create new siswa
        await api.post('/pmq/siswa', formData);
        toast.success('Siswa PMQ berhasil ditambahkan');
      }
      
      setIsCreateOpen(false);
      setEditingId(null);
      fetchSiswa();
    } catch (e) {
      toast.error(e.response?.data?.detail || `Gagal ${editingId ? 'memperbarui' : 'menambah'} siswa PMQ`);
    }
  };

  const handleLink = async () => {
    try {
      if (!linkForm.santri_id || !linkForm.tingkatan_key) {
        toast.error('Santri dan Tingkatan wajib dipilih');
        return;
      }
      await api.post('/pmq/siswa', {
        santri_id: linkForm.santri_id,
        tingkatan_key: linkForm.tingkatan_key,
        kelompok_id: linkForm.kelompok_id || undefined,
      });
      toast.success('Santri berhasil didaftarkan ke PMQ');
      setIsLinkSantriOpen(false);
      fetchSiswa();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Gagal mendaftarkan santri ke PMQ');
    }
  };

  const handleEdit = (siswa) => {
    setFormData({
      nama: siswa.nama,
      gender: siswa.gender,
      tingkatan_key: siswa.tingkatan_key,
      kelompok_id: siswa.kelompok_id || '',
    });
    setEditingId(siswa.id);
    setIsCreateOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus siswa PMQ ini?')) return;
    try {
      await api.delete(`/pmq/siswa/${id}`);
      toast.success('Siswa PMQ berhasil dihapus');
      fetchSiswa();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Gagal menghapus siswa PMQ');
    }
  };

  const filteredKelompokForForm = (tingkatanKey) =>
    kelompokList.filter((k) => k.tingkatan_key === tingkatanKey);

  const getGenderLabel = (g) => {
    if (!g) return '-';
    return g === 'putra' ? 'Putra' : 'Putri';
  };

  const totalSiswa = siswaList.length;
  const totalPutra = siswaList.filter((s) => s.gender === 'putra').length;
  const totalPutri = siswaList.filter((s) => s.gender === 'putri').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center animate-slide-in-left">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Siswa PMQ</h1>
          <p className="text-muted-foreground mt-1">Kelola siswa Pendidikan Murottilil Qur'an</p>
        </div>
        <div className="flex gap-3 animate-slide-in-right items-center">
          <Card className="shadow-card">
            <CardContent className="p-3 flex items-center gap-4">
              <div>
                <p className="text-[11px] text-muted-foreground">Total Siswa PMQ</p>
                <p className="text-2xl font-bold text-foreground">{totalSiswa}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Putra: <span className="font-semibold text-foreground">{totalPutra}</span> · Putri:{' '}
                  <span className="font-semibold text-foreground">{totalPutri}</span>
                </p>
              </div>
              <div className="bg-emerald-50 text-emerald-700 p-2 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
            </CardContent>
          </Card>
          <Button variant="outline" className="hover-lift" disabled>
            <FileDown className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={openLinkFromSantri} variant="outline" className="hover-lift">
            <Link className="w-4 h-4 mr-2" />
            Link dari Santri
          </Button>
          <Button onClick={openCreate} className="btn-ripple">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Siswa Baru
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama siswa PMQ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            onBlur={fetchSiswa}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchSiswa();
            }}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Filter Tingkatan</Label>
          <Select
            value={filterTingkatan}
            onValueChange={(val) => {
              setFilterTingkatan(val);
              setFilterKelompok('all');
              fetchSiswa();
            }}
          >
            <SelectTrigger className="mt-1">
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
          <Label className="text-xs text-muted-foreground">Filter Gender</Label>
          <Select
            value={filterGender}
            onValueChange={(val) => {
              setFilterGender(val);
              fetchSiswa();
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Semua Gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Gender</SelectItem>
              <SelectItem value="putra">Putra</SelectItem>
              <SelectItem value="putri">Putri</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Filter Kelompok</Label>
          <Select
            value={filterKelompok}
            onValueChange={(val) => {
              setFilterKelompok(val);
              fetchSiswa();
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Semua Kelompok" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelompok</SelectItem>
              {kelompokList
                .filter((k) => filterTingkatan === 'all' || k.tingkatan_key === filterTingkatan)
                .map((k) => (
                  <SelectItem key={k.id} value={k.id}>
                    {k.nama}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabel */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Memuat data siswa PMQ...</div>
      ) : siswaList.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">Tidak ada siswa PMQ ditemukan</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Nama</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Gender</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Tingkatan</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Kelompok</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">QR</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {siswaList.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/50">
                    <td className="px-4 py-2 font-medium text-foreground">{s.nama}</td>
                    <td className="px-4 py-2 text-muted-foreground">{getGenderLabel(s.gender)}</td>
                    <td className="px-4 py-2 text-muted-foreground">{s.tingkatan_label}</td>
                    <td className="px-4 py-2 text-muted-foreground">{s.kelompok_nama || '-'}</td>
                    <td className="px-4 py-2">
                      {s.qr_code ? (
                        <div className="flex items-center gap-2">
                          <div className="w-12 h-12 bg-white border border-border rounded flex items-center justify-center overflow-hidden">
                            <img
                              src={`data:image/png;base64,${s.qr_code}`}
                              alt="QR PMQ"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">QR {s.santri_id ? 'Santri' : 'PMQ'}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Belum ada QR</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      <div className="flex gap-2">
                        {!s.santri_id && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(s)}
                          >
                            Edit
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 border-red-200 hover:bg-red-50"
                          onClick={() => handleDelete(s.id)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialog Tambah Siswa Baru */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Siswa PMQ Baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Siswa</Label>
              <Input
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Nama siswa PMQ"
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(val) => setFormData({ ...formData, gender: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="putra">Putra</SelectItem>
                  <SelectItem value="putri">Putri</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tingkatan PMQ</Label>
              <Select
                value={formData.tingkatan_key}
                onValueChange={(val) => {
                  setFormData({ ...formData, tingkatan_key: val, kelompok_id: '' });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tingkatan" />
                </SelectTrigger>
                <SelectContent>
                  {tingkatanList.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kelompok (Opsional)</Label>
              <Select
                value={formData.kelompok_id}
                onValueChange={(val) => setFormData({ ...formData, kelompok_id: val })}
                disabled={!formData.tingkatan_key}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelompok" />
                </SelectTrigger>
                <SelectContent>
                  {filteredKelompokForForm(formData.tingkatan_key).map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleCreate}>
              Simpan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Link dari Santri */}
      <Dialog open={isLinkSantriOpen} onOpenChange={setIsLinkSantriOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Daftarkan Santri ke PMQ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Pilih Santri</Label>
              <Select
                value={linkForm.santri_id}
                onValueChange={(val) => setLinkForm({ ...linkForm, santri_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih santri" />
                </SelectTrigger>
                <SelectContent>
                  {availableSantri.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tingkatan PMQ</Label>
              <Select
                value={linkForm.tingkatan_key}
                onValueChange={(val) => setLinkForm({ ...linkForm, tingkatan_key: val, kelompok_id: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tingkatan" />
                </SelectTrigger>
                <SelectContent>
                  {tingkatanList.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kelompok (Opsional)</Label>
              <Select
                value={linkForm.kelompok_id}
                onValueChange={(val) => setLinkForm({ ...linkForm, kelompok_id: val })}
                disabled={!linkForm.tingkatan_key}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelompok" />
                </SelectTrigger>
                <SelectContent>
                  {filteredKelompokForForm(linkForm.tingkatan_key).map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleLink}>
              Daftarkan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SiswaPMQ;
