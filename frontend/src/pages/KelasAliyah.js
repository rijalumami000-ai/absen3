import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center animate-slide-in-left">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Kelas Madrasah Aliyah</h1>
          <p className="text-muted-foreground mt-1">Kelola kelas untuk Madrasah Aliyah</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="btn-ripple active-scale shadow-card hover:shadow-card-hover transition-smooth">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Kelas Aliyah
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md animate-scale-in">
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
                  />
                </div>
                <div>
                  <Label>Tingkat (Opsional)</Label>
                  <Input
                    placeholder="Misal: X / XI / XII"
                    value={formData.tingkat}
                    onChange={(e) => setFormData({ ...formData, tingkat: e.target.value })}
                  />
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
        <Input
          placeholder="Cari kelas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-3"
        />
      </div>

      {/* Kelas List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      ) : filteredKelas.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">Tidak ada kelas Aliyah ditemukan</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Nama Kelas</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Tingkat</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Jumlah Siswa</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredKelas.map((kelas) => (
                  <tr key={kelas.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{kelas.nama}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{kelas.tingkat || '-'}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{kelas.jumlah_siswa ?? 0}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(kelas)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(kelas.id)}
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
            <DialogTitle className="font-display">Edit Kelas Aliyah</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Kelas</Label>
              <Input
                placeholder="Nama kelas"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              />
            </div>
            <div>
              <Label>Tingkat (Opsional)</Label>
              <Input
                placeholder="Misal: X / XI / XII"
                value={formData.tingkat}
                onChange={(e) => setFormData({ ...formData, tingkat: e.target.value })}
              />
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

export default KelasAliyah;
