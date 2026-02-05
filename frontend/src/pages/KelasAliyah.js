import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Users, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/api';

const KelasAliyah = () => {
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    tingkat: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('/aliyah/kelas');
      setKelasList(res.data || []);
    } catch (error) {
      toast.error('Gagal memuat data kelas Aliyah');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ nama: '', tingkat: '' });
    setSelectedKelas(null);
  };

  const handleCreate = async () => {
    try {
      await api.post('/aliyah/kelas', {
        nama: formData.nama,
        tingkat: formData.tingkat || undefined,
      });
      toast.success('Kelas Aliyah berhasil ditambahkan');
      setIsCreateOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan kelas Aliyah');
    }
  };

  const openEditDialog = (kelas) => {
    setSelectedKelas(kelas);
    setFormData({
      nama: kelas.nama,
      tingkat: kelas.tingkat || '',
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedKelas) return;
    try {
      const payload = {};
      if (formData.nama) payload.nama = formData.nama;
      if (formData.tingkat) payload.tingkat = formData.tingkat;
      await api.put(`/aliyah/kelas/${selectedKelas.id}`, payload);
      toast.success('Kelas Aliyah berhasil diupdate');
      setIsEditOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal mengupdate kelas Aliyah');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus kelas Aliyah ini?')) return;
    try {
      await api.delete(`/aliyah/kelas/${id}`);
      toast.success('Kelas Aliyah berhasil dihapus');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menghapus kelas Aliyah');
    }
  };

  const filteredKelas = kelasList.filter((kelas) =>
    kelas.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in" data-testid="kelas-aliyah-page">
      {/* Header */}
      <div className="flex justify-between items-center animate-slide-in-left" data-testid="kelas-aliyah-header">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground" data-testid="kelas-aliyah-title">
            Kelas Madrasah Aliyah
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="kelas-aliyah-subtitle">
            Kelola kelas untuk Madrasah Aliyah
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={resetForm}
                className="btn-ripple active-scale shadow-card hover:shadow-card-hover transition-smooth"
                data-testid="kelas-aliyah-add-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Kelas Aliyah
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md animate-scale-in" data-testid="kelas-aliyah-create-dialog">
              <DialogHeader>
                <DialogTitle className="font-display">Tambah Kelas Aliyah</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nama Kelas</Label>
                  <Input
                    placeholder="Misal: X IPA 1"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    data-testid="kelas-aliyah-create-name-input"
                  />
                </div>
                <div>
                  <Label>Tingkat (Opsional)</Label>
                  <Input
                    placeholder="Misal: X / XI / XII"
                    value={formData.tingkat}
                    onChange={(e) => setFormData({ ...formData, tingkat: e.target.value })}
                    data-testid="kelas-aliyah-create-tingkat-input"
                  />
                </div>
                <Button onClick={handleCreate} className="w-full" data-testid="kelas-aliyah-create-submit">
                  Simpan
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative" data-testid="kelas-aliyah-search-wrapper">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Cari kelas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
          data-testid="kelas-aliyah-search-input"
        />
      </div>

      {/* Kelas List */}
      {loading ? (
        <div className="text-center py-12" data-testid="kelas-aliyah-loading">
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      ) : filteredKelas.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border" data-testid="kelas-aliyah-empty">
          <p className="text-muted-foreground">Tidak ada kelas Aliyah ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="kelas-aliyah-grid">
          {filteredKelas.map((kelas) => (
            <div
              key={kelas.id}
              className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow"
              data-testid={`kelas-aliyah-card-${kelas.id}`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-display font-bold text-foreground" data-testid={`kelas-aliyah-name-${kelas.id}`}>
                  {kelas.nama}
                </h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => openEditDialog(kelas)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    data-testid={`kelas-aliyah-edit-${kelas.id}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(kelas.id)}
                    className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                    data-testid={`kelas-aliyah-delete-${kelas.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid={`kelas-aliyah-count-${kelas.id}`}>
                  <Users className="w-4 h-4" />
                  <span>{kelas.jumlah_siswa ?? 0} Siswa</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground" data-testid={`kelas-aliyah-tingkat-${kelas.id}`}>
                  <Layers className="w-4 h-4" />
                  <span>{kelas.tingkat || '-'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md animate-scale-in" data-testid="kelas-aliyah-edit-dialog">
          <DialogHeader>
            <DialogTitle className="font-display">Edit Kelas Aliyah</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Kelas</Label>
              <Input
                placeholder="Nama kelas"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                data-testid="kelas-aliyah-edit-name-input"
              />
            </div>
            <div>
              <Label>Tingkat (Opsional)</Label>
              <Input
                placeholder="Misal: X / XI / XII"
                value={formData.tingkat}
                onChange={(e) => setFormData({ ...formData, tingkat: e.target.value })}
                data-testid="kelas-aliyah-edit-tingkat-input"
              />
            </div>
            <Button onClick={handleUpdate} className="w-full" data-testid="kelas-aliyah-edit-submit">
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KelasAliyah;
