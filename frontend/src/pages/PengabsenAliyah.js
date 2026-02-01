import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Key, Search, Copy, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/lib/api';
import { downloadPengabsenKelasPDF } from '@/lib/pdfUtils';

const PengabsenAliyah = () => {
  const [pengabsenList, setPengabsenList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPengabsen, setSelectedPengabsen] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    email_atau_hp: '',
    username: '',
    kelas_ids: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pengabsenRes, kelasRes] = await Promise.all([
        api.get('/aliyah/pengabsen'),
        api.get('/aliyah/kelas'),
      ]);
      setPengabsenList(pengabsenRes.data || []);
      setKelasList(kelasRes.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Gagal memuat data Pengabsen Aliyah');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ nama: '', email_atau_hp: '', username: '', kelas_ids: [] });
    setSelectedPengabsen(null);
  };

  const toggleKelas = (kelasId) => {
    setFormData((prev) => ({
      ...prev,
      kelas_ids: prev.kelas_ids.includes(kelasId)
        ? prev.kelas_ids.filter((id) => id !== kelasId)
        : [...prev.kelas_ids, kelasId],
    }));
  };

  const handleCreate = async () => {
    try {
      await api.post('/aliyah/pengabsen', formData);
      toast.success('Pengabsen Aliyah berhasil ditambahkan');
      setIsCreateOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan pengabsen Aliyah');
    }
  };

  const openEditDialog = (pengabsen) => {
    setSelectedPengabsen(pengabsen);
    setFormData({
      nama: pengabsen.nama,
      email_atau_hp: pengabsen.email_atau_hp,
      username: pengabsen.username,
      kelas_ids: pengabsen.kelas_ids || [],
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedPengabsen) return;
    try {
      await api.put(`/aliyah/pengabsen/${selectedPengabsen.id}`, formData);
      toast.success('Pengabsen Aliyah berhasil diupdate');
      setIsEditOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal mengupdate pengabsen Aliyah');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus pengabsen Aliyah ini?')) return;
    try {
      await api.delete(`/aliyah/pengabsen/${id}`);
      toast.success('Pengabsen Aliyah berhasil dihapus');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menghapus pengabsen Aliyah');
    }
  };

  const handleRegenerateKode = async (id) => {
    try {
      await api.post(`/aliyah/pengabsen/${id}/regenerate-kode-akses`);
      toast.success('Kode akses berhasil di-generate ulang');
      fetchData();
    } catch (error) {
      toast.error('Gagal generate kode akses');
    }
  };

  const copyKodeAkses = (kode) => {
    navigator.clipboard.writeText(kode);
    toast.success('Kode akses disalin!');
  };

  const filteredPengabsen = pengabsenList.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.nama.toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q) ||
      (p.email_atau_hp || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center animate-slide-in-left">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Pengabsen Madrasah Aliyah</h1>
          <p className="text-muted-foreground mt-1">Kelola pengabsen untuk Madrasah Aliyah</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => downloadPengabsenKelasPDF(pengabsenList, kelasList)}
            className="hover-lift transition-smooth active-scale"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="btn-ripple active-scale shadow-card hover:shadow-card-hover transition-smooth"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Pengabsen Aliyah
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md animate-scale-in">
              <DialogHeader>
                <DialogTitle className="font-display">Tambah Pengabsen Aliyah</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nama Lengkap</Label>
                  <Input
                    placeholder="Nama pengabsen"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Username</Label>
                  <Input
                    placeholder="Username untuk login"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email / No. HP</Label>
                  <Input
                    placeholder="Kontak pengabsen"
                    value={formData.email_atau_hp}
                    onChange={(e) => setFormData({ ...formData, email_atau_hp: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Pilih Kelas Aliyah yang Diakses</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
                    {kelasList.map((kelas) => (
                      <button
                        key={kelas.id}
                        type="button"
                        onClick={() => toggleKelas(kelas.id)}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          formData.kelas_ids.includes(kelas.id)
                            ? 'bg-primary-700 text-white'
                            : 'bg-muted text-muted-foreground hover:bg-primary-100'
                        }`}
                      >
                        {kelas.nama}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full">
                  Simpan
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Cari pengabsen Aliyah..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      ) : filteredPengabsen.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">Tidak ada pengabsen Aliyah ditemukan</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Nama</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Username</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Kontak</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Kode Akses</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Kelas Aliyah</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPengabsen.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{p.nama}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{p.username}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{p.email_atau_hp}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                          {p.kode_akses || '-'}
                        </code>
                        <button
                          type="button"
                          onClick={() => copyKodeAkses(p.kode_akses)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRegenerateKode(p.id)}
                          className="p-1 hover:bg-muted rounded"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {Array.isArray(p.kelas_ids) && p.kelas_ids.length > 0
                        ? p.kelas_ids
                            .map((id) => kelasList.find((k) => k.id === id)?.nama || id)
                            .join(', ')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(p)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(p.id)}
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md animate-scale-in">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Pengabsen Aliyah</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Lengkap</Label>
              <Input
                placeholder="Nama pengabsen"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              />
            </div>
            <div>
              <Label>Username</Label>
              <Input
                placeholder="Username untuk login"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <Label>Email / No. HP</Label>
              <Input
                placeholder="Kontak pengabsen"
                value={formData.email_atau_hp}
                onChange={(e) => setFormData({ ...formData, email_atau_hp: e.target.value })}
              />
            </div>
            <div>
              <Label>Pilih Kelas Aliyah yang Diakses</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
                {kelasList.map((kelas) => (
                  <button
                    key={kelas.id}
                    type="button"
                    onClick={() => toggleKelas(kelas.id)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      formData.kelas_ids.includes(kelas.id)
                        ? 'bg-primary-700 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-primary-100'
                    }`}
                  >
                    {kelas.nama}
                  </button>
                ))}
              </div>
            </div>
            <Button onClick={handleUpdate} className="w-full">
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PengabsenAliyah;
