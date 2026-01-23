import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Calendar, Clock, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/api';

const Kelas = () => {
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedKelas, setSelectedKelas] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    jadwal: [],
    jam_mulai: '20:00',
    jam_selesai: '20:30',
    kapasitas: 30
  });

  const hariOptions = [
    { value: 'senin', label: 'Malam Senin' },
    { value: 'selasa', label: 'Malam Selasa' },
    { value: 'rabu', label: 'Malam Rabu' },
    { value: 'jumat', label: 'Malam Kamis' },
    { value: 'sabtu', label: 'Malam Sabtu' },
    { value: 'minggu', label: 'Malam Minggu' }
  ];

  useEffect(() => {
    fetchKelas();
  }, []);

  const fetchKelas = async () => {
    try {
      const response = await api.get('/kelas');
      setKelasList(response.data);
    } catch (error) {
      toast.error('Gagal memuat data kelas');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/kelas', formData);
      toast.success('Kelas berhasil ditambahkan');
      setIsCreateOpen(false);
      resetForm();
      fetchKelas();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan kelas');
    }
  };

  const handleUpdate = async () => {
    try {
      await api.put(`/kelas/${selectedKelas.id}`, formData);
      toast.success('Kelas berhasil diupdate');
      setIsEditOpen(false);
      resetForm();
      fetchKelas();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal mengupdate kelas');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus kelas ini? Siswa di kelas ini akan menjadi "belum ada kelas"')) {
      return;
    }

    try {
      await api.delete(`/kelas/${id}`);
      toast.success('Kelas berhasil dihapus');
      fetchKelas();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menghapus kelas');
    }
  };

  const openEditDialog = (kelas) => {
    setSelectedKelas(kelas);
    setFormData({
      nama: kelas.nama,
      jadwal: kelas.jadwal,
      jam_mulai: kelas.jam_mulai,
      jam_selesai: kelas.jam_selesai,
      kapasitas: kelas.kapasitas
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nama: '',
      jadwal: [],
      jam_mulai: '20:00',
      jam_selesai: '20:30',
      kapasitas: 30
    });
    setSelectedKelas(null);
  };

  const toggleJadwal = (hari) => {
    setFormData(prev => ({
      ...prev,
      jadwal: prev.jadwal.includes(hari)
        ? prev.jadwal.filter(h => h !== hari)
        : [...prev.jadwal, hari]
    }));
  };

  const filteredKelas = kelasList.filter(kelas =>
    kelas.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Kelas Madrasah Diniyah</h1>
          <p className="text-muted-foreground mt-1">Kelola data kelas dan siswa</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Kelas
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Tambah Kelas Baru</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nama Kelas</Label>
                <Input
                  placeholder="Contoh: 1A, 2B"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                />
              </div>
              <div>
                <Label>Jadwal Kelas</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {hariOptions.map(hari => (
                    <button
                      key={hari.value}
                      type="button"
                      onClick={() => toggleJadwal(hari.value)}
                      className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                        formData.jadwal.includes(hari.value)
                          ? 'bg-primary-700 text-white'
                          : 'bg-muted text-muted-foreground hover:bg-primary-100'
                      }`}
                    >
                      {hari.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Jam Mulai</Label>
                  <Input
                    type="time"
                    value={formData.jam_mulai}
                    onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Jam Selesai</Label>
                  <Input
                    type="time"
                    value={formData.jam_selesai}
                    onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Kapasitas Siswa</Label>
                <Input
                  type="number"
                  value={formData.kapasitas}
                  onChange={(e) => setFormData({ ...formData, kapasitas: parseInt(e.target.value) })}
                />
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
          placeholder="Cari kelas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Kelas List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      ) : filteredKelas.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">Tidak ada kelas ditemukan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredKelas.map((kelas) => (
            <div
              key={kelas.id}
              className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-display font-bold text-foreground">{kelas.nama}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditDialog(kelas)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(kelas.id)}
                    className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  <span>{kelas.jumlah_siswa} / {kelas.kapasitas} Siswa</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{kelas.jam_mulai} - {kelas.jam_selesai}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {kelas.jadwal.map(hari => (
                      <span key={hari} className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded text-xs">
                        {hariOptions.find(h => h.value === hari)?.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Kelas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Kelas</Label>
              <Input
                placeholder="Contoh: 1A, 2B"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              />
            </div>
            <div>
              <Label>Jadwal Kelas</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {hariOptions.map(hari => (
                  <button
                    key={hari.value}
                    type="button"
                    onClick={() => toggleJadwal(hari.value)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      formData.jadwal.includes(hari.value)
                        ? 'bg-primary-700 text-white'
                        : 'bg-muted text-muted-foreground hover:bg-primary-100'
                    }`}
                  >
                    {hari.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Jam Mulai</Label>
                <Input
                  type="time"
                  value={formData.jam_mulai}
                  onChange={(e) => setFormData({ ...formData, jam_mulai: e.target.value })}
                />
              </div>
              <div>
                <Label>Jam Selesai</Label>
                <Input
                  type="time"
                  value={formData.jam_selesai}
                  onChange={(e) => setFormData({ ...formData, jam_selesai: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Kapasitas Siswa</Label>
              <Input
                type="number"
                value={formData.kapasitas}
                onChange={(e) => setFormData({ ...formData, kapasitas: parseInt(e.target.value) })}
              />
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

export default Kelas;
