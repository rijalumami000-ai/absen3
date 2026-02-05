import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, QrCode, Search, Link, UserPlus, Users, FileDown } from 'lucide-react';
import { downloadSiswaMadinPDF } from '@/lib/pdfUtils';
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

const MadrasahDiniyah = () => {
  const [siswaList, setSiswaList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [kelasFilter, setKelasFilter] = useState('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isLinkSantriOpen, setIsLinkSantriOpen] = useState(false);
  const [isLinkToSantriOpen, setIsLinkToSantriOpen] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    nis: '',
    gender: 'putra',
    kelas_id: '',
    santri_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [siswaRes, santriRes, kelasRes] = await Promise.all([
        api.get('/siswa-madrasah'),
        api.get('/santri'),
        api.get('/kelas')
      ]);
      setSiswaList(siswaRes.data);
      setSantriList(santriRes.data);
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
      const payload = { ...formData };
      if (!payload.santri_id) delete payload.santri_id;
      if (!payload.kelas_id) delete payload.kelas_id;
      if (!payload.nis) delete payload.nis;

      await api.post('/siswa-madrasah', payload);
      toast.success('Siswa berhasil ditambahkan');
      setIsCreateOpen(false);
      setIsLinkSantriOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan siswa');
    }
  };

  const handleUpdate = async () => {
    try {
      const payload = {};
      if (formData.nama) payload.nama = formData.nama;
      if (formData.nis) payload.nis = formData.nis;
      if (formData.gender) payload.gender = formData.gender;
      if (formData.kelas_id) payload.kelas_id = formData.kelas_id;

      await api.put(`/siswa-madrasah/${selectedSiswa.id}`, payload);
      toast.success('Siswa berhasil diupdate');
      setIsEditOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal mengupdate siswa');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus siswa ini?')) {
      return;
    }

    try {
      await api.delete(`/siswa-madrasah/${id}`);
      toast.success('Siswa berhasil dihapus');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menghapus siswa');
    }
  };

  const handleLinkToSantri = async (santri_id) => {
    try {
      await api.post(`/siswa-madrasah/${selectedSiswa.id}/link-to-santri`, null, {
        params: { santri_id }
      });
      toast.success('Siswa berhasil di-link ke Santri');
      setIsLinkToSantriOpen(false);
      setSelectedSiswa(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal link ke santri');
    }
  };

  const openEditDialog = (siswa) => {
    setSelectedSiswa(siswa);
    setFormData({
      nama: siswa.nama,
      nis: siswa.nis || '',
      gender: siswa.gender,
      kelas_id: siswa.kelas_id || '',
      santri_id: ''
    });
    setIsEditOpen(true);
  };

  const openLinkToSantriDialog = (siswa) => {
    setSelectedSiswa(siswa);
    setIsLinkToSantriOpen(true);
  };

  const openLinkSantriDialog = () => {
    resetForm();
    setIsLinkSantriOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nama: '',
      nis: '',
      gender: 'putra',
      kelas_id: '',
      santri_id: ''
    });
    setSelectedSiswa(null);
  };

  const downloadQRCode = async (siswaId, namaSiswa) => {
    try {
      const response = await api.get(`/siswa-madrasah/${siswaId}/qr-code`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `QR_${namaSiswa}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('QR Code berhasil diunduh');
    } catch (error) {
  const [linkSantriSearch, setLinkSantriSearch] = useState('');

      toast.error('Gagal mengunduh QR Code');
    }
  };

  const filteredSiswa = siswaList.filter((siswa) => {
    const matchKelas = kelasFilter === 'all' || siswa.kelas_id === kelasFilter;
    const query = searchQuery.toLowerCase();
    const matchSearch =
      !query ||
      siswa.nama.toLowerCase().includes(query) ||
      (siswa.kelas_nama && siswa.kelas_nama.toLowerCase().includes(query));
    return matchKelas && matchSearch;
  });

  // Filter santri yang belum di-link
  const availableSantri = santriList.filter((santri) =>
    !siswaList.some((siswa) => siswa.santri_id === santri.id)
  );

  // Filter santri sesuai pencarian di dialog Link dari Santri
  const filteredAvailableSantri = availableSantri.filter((santri) => {
    const q = linkSantriSearch.toLowerCase();
    if (!q) return true;
    return (
      santri.nama.toLowerCase().includes(q) ||
      (santri.nis && santri.nis.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center animate-slide-in-left">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Siswa Madin</h1>
          <p className="text-muted-foreground mt-1">Kelola siswa Madrasah Diniyah</p>
        </div>
        <div className="flex gap-2 animate-slide-in-right">
          <Button 
            variant="outline" 
            onClick={() => downloadSiswaMadinPDF(filteredSiswa, kelasList)}
            className="hover-lift transition-smooth active-scale"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Dialog open={isLinkSantriOpen} onOpenChange={setIsLinkSantriOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={openLinkSantriDialog}>
                <Link className="w-4 h-4 mr-2" />
                Link dari Santri
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[600px] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Daftarkan Santri ke Madrasah Diniyah</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Cari Santri</Label>
                  <Input
                    placeholder="Ketik nama atau NIS santri..."
                    value={linkSantriSearch}
                    onChange={(e) => setLinkSantriSearch(e.target.value)}
                    className="mb-2"
                  />
                  <Label>Pilih Santri</Label>
                  <Select
                    value={formData.santri_id}
                    onValueChange={(value) => {
                      const santri = santriList.find((s) => s.id === value);
                      setFormData({
                        ...formData,
                        santri_id: value,
                        nama: santri?.nama || '',
                        gender: santri?.gender || 'putra',
                        nis: santri?.nis || '',
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih santri" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredAvailableSantri.map((santri) => (
                        <SelectItem key={santri.id} value={santri.id}>
                          {santri.nama} - {santri.nis}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Pilih Kelas (Opsional)</Label>
                  <Select
                    value={formData.kelas_id}
                    onValueChange={(value) => setFormData({ ...formData, kelas_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Belum Ada Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {kelasList.map(kelas => (
                        <SelectItem key={kelas.id} value={kelas.id}>
                          {kelas.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} className="w-full" disabled={!formData.santri_id}>
                  Daftarkan
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Siswa Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Siswa Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nama Siswa</Label>
                  <Input
                    placeholder="Nama lengkap"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  />
                </div>
                <div>
                  <Label>NIS (Opsional)</Label>
                  <Input
                    placeholder="Nomor Induk Siswa"
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => setFormData({ ...formData, gender: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="putra">Putra</SelectItem>
                      <SelectItem value="putri">Putri</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Pilih Kelas (Opsional)</Label>
                  <Select
                    value={formData.kelas_id}
                    onValueChange={(value) => setFormData({ ...formData, kelas_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Belum Ada Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {kelasList.map(kelas => (
                        <SelectItem key={kelas.id} value={kelas.id}>
                          {kelas.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreate} className="w-full">
                  Simpan
                </Button>
      {/* Filter Kelas + Search */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="w-full md:w-64 flex items-center gap-2">
          <Label className="text-sm text-muted-foreground">Filter Kelas</Label>
          <Select value={kelasFilter} onValueChange={setKelasFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Semua Kelas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelas</SelectItem>
              {kelasList.map((kelas) => (
                <SelectItem key={kelas.id} value={kelas.id}>
                  {kelas.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Cari siswa atau kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>


              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Cari siswa atau kelas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{siswaList.length}</p>
              <p className="text-sm text-muted-foreground">Total Siswa</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Link className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {siswaList.filter(s => s.santri_id).length}
              </p>
              <p className="text-sm text-muted-foreground">Linked ke Santri</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-orange-700" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {siswaList.filter(s => !s.kelas_id).length}
              </p>
              <p className="text-sm text-muted-foreground">Belum Ada Kelas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Siswa List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      ) : filteredSiswa.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">Tidak ada siswa ditemukan</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Nama</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">NIS</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Gender</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Kelas</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSiswa.map((siswa) => (
                  <tr key={siswa.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-foreground">{siswa.nama}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{siswa.nis || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${
                        siswa.gender === 'putra' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                      }`}>
                        {siswa.gender === 'putra' ? 'Putra' : 'Putri'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {siswa.kelas_nama ? (
                        <span className="text-foreground font-medium">{siswa.kelas_nama}</span>
                      ) : (
                        <span className="text-orange-600 text-xs">Belum Ada Kelas</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {siswa.santri_id ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                          Linked
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          Standalone
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {siswa.has_qr && (
                          <button
                            onClick={() => downloadQRCode(siswa.id, siswa.nama)}
                            className="p-2 hover:bg-primary-100 text-primary-700 rounded-lg transition-colors"
                            title="Download QR Code"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openEditDialog(siswa)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {!siswa.santri_id && (
                          <button
                            onClick={() => openLinkToSantriDialog(siswa)}
                            className="p-2 hover:bg-green-100 text-green-700 rounded-lg transition-colors"
                            title="Link ke Santri"
                          >
                            <Link className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(siswa.id)}
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
            <DialogTitle>Edit Siswa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedSiswa?.santri_id && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800">
                  ℹ️ Siswa ini ter-link dengan Santri. Nama, NIS, dan Gender tidak bisa diedit di sini.
                  Silakan edit di menu <strong>Santri</strong>.
                </p>
              </div>
            )}
            <div>
              <Label>Nama Siswa</Label>
              <Input
                placeholder="Nama lengkap"
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                disabled={selectedSiswa?.santri_id}
              />
            </div>
            <div>
              <Label>NIS (Opsional)</Label>
              <Input
                placeholder="Nomor Induk Siswa"
                value={formData.nis}
                onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                disabled={selectedSiswa?.santri_id}
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
                disabled={selectedSiswa?.santri_id}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="putra">Putra</SelectItem>
                  <SelectItem value="putri">Putri</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pilih Kelas</Label>
              <Select
                value={formData.kelas_id}
                onValueChange={(value) => setFormData({ ...formData, kelas_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Belum Ada Kelas" />
                </SelectTrigger>
                <SelectContent>
                  {kelasList.map(kelas => (
                    <SelectItem key={kelas.id} value={kelas.id}>
                      {kelas.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleUpdate} className="w-full">
              Update
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link to Santri Dialog */}
      <Dialog open={isLinkToSantriOpen} onOpenChange={setIsLinkToSantriOpen}>
        <DialogContent className="max-w-md max-h-[600px] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Link Siswa ke Santri</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pilih santri dari menu Santri untuk di-link dengan siswa <strong>{selectedSiswa?.nama}</strong>
            </p>
            <div className="space-y-2">
              {availableSantri.map(santri => (
                <button
                  key={santri.id}
                  onClick={() => handleLinkToSantri(santri.id)}
                  className="w-full p-4 text-left border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <p className="font-medium text-foreground">{santri.nama}</p>
                  <p className="text-sm text-muted-foreground">NIS: {santri.nis}</p>
                </button>
              ))}
              {availableSantri.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  Semua santri sudah di-link
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MadrasahDiniyah;
