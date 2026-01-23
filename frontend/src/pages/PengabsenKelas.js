import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Key, Search, Copy } from 'lucide-react';
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

const PengabsenKelas = () => {
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
    kelas_ids: []
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pengabsenRes, kelasRes] = await Promise.all([
        api.get('/pengabsen-kelas'),
        api.get('/kelas')
      ]);
      setPengabsenList(pengabsenRes.data);
      setKelasList(kelasRes.data);
    } catch (error) {
      toast.error('Gagal memuat data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/pengabsen-kelas', formData);
      toast.success('Pengabsen Kelas berhasil ditambahkan');
      setIsCreateOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan pengabsen kelas');
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/pengabsen-kelas/${selectedPengabsen.id}`, formData);
      toast.success('Pengabsen Kelas berhasil diupdate');
      setIsEditOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal mengupdate pengabsen kelas');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus pengabsen kelas ini?')) {
      return;
    }

    try {
      await api.delete(`/pengabsen-kelas/${id}`);
      toast.success('Pengabsen Kelas berhasil dihapus');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menghapus pengabsen kelas');
    }
  };

  const handleRegenerateKode = async (id) => {
    try {
      const response = await api.post(`/pengabsen-kelas/${id}/regenerate-kode-akses`);
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

  const openEditDialog = (pengabsen) => {
    setSelectedPengabsen(pengabsen);
    setFormData({
      nama: pengabsen.nama,
      email_atau_hp: pengabsen.email_atau_hp,
      username: pengabsen.username,
      kelas_ids: pengabsen.kelas_ids
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nama: '',
      email_atau_hp: '',
      username: '',
      kelas_ids: []
    });
    setSelectedPengabsen(null);
  };

  const toggleKelas = (kelasId) => {
    setFormData(prev => ({
      ...prev,
      kelas_ids: prev.kelas_ids.includes(kelasId)
        ? prev.kelas_ids.filter(id => id !== kelasId)
        : [...prev.kelas_ids, kelasId]
    }));
  };

  const filteredPengabsen = pengabsenList.filter(pengabsen =>
    pengabsen.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pengabsen.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center animate-slide-in-left">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Pengabsen Kelas</h1>
          <p className="text-muted-foreground mt-1">Kelola pengabsen untuk Madrasah Diniyah</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="btn-ripple active-scale shadow-card hover:shadow-card-hover transition-smooth">
              <Plus className="w-4 h-4 mr-2" />
              Tambah Pengabsen Kelas
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md animate-scale-in">
            <DialogHeader>
              <DialogTitle className="font-display">Tambah Pengabsen Kelas</DialogTitle>
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
                <Label>Pilih Kelas yang Diakses</Label>
                <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
                  {kelasList.map(kelas => (
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Cari pengabsen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Pengabsen List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      ) : filteredPengabsen.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">Tidak ada pengabsen kelas ditemukan</p>
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Kelas</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPengabsen.map((pengabsen) => (
                  <tr key={pengabsen.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{pengabsen.nama}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{pengabsen.username}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{pengabsen.email_atau_hp}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <code className="bg-primary-100 text-primary-700 px-2 py-1 rounded font-mono text-xs">
                          {pengabsen.kode_akses}
                        </code>
                        <button
                          onClick={() => copyKodeAkses(pengabsen.kode_akses)}
                          className="p-1 hover:bg-muted rounded"
                          title="Salin kode"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {pengabsen.kelas_ids.map(kelasId => {
                          const kelas = kelasList.find(k => k.id === kelasId);
                          return kelas ? (
                            <span key={kelasId} className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded text-xs">
                              {kelas.nama}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRegenerateKode(pengabsen.id)}
                          className="p-2 hover:bg-primary-100 text-primary-700 rounded-lg transition-colors"
                          title="Generate Ulang Kode"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditDialog(pengabsen)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(pengabsen.id)}
                          className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pengabsen Kelas</DialogTitle>
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
              <Label>Pilih Kelas yang Diakses</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
                {kelasList.map(kelas => (
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
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PengabsenKelas;
