import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, QrCode, Search, Link, UserPlus, Users, FileDown } from 'lucide-react';
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
import { downloadSiswaAliyahPDF } from '@/lib/pdfUtils';

const SiswaAliyah = () => {
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
    santri_id: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [siswaRes, santriRes, kelasRes] = await Promise.all([
        api.get('/aliyah/siswa'),
        api.get('/santri'),
        api.get('/aliyah/kelas'),
      ]);
      setSiswaList(siswaRes.data || []);
      setSantriList(santriRes.data || []);
      setKelasList(kelasRes.data || []);
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

      await api.post('/aliyah/siswa', payload);
      toast.success('Siswa Aliyah berhasil ditambahkan');
      setIsCreateOpen(false);
      setIsLinkSantriOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menambahkan siswa Aliyah');
    }
  };

  const handleUpdate = async () => {
    try {
      const payload = {};
      if (formData.nama) payload.nama = formData.nama;
      if (formData.nis) payload.nis = formData.nis;
      if (formData.gender) payload.gender = formData.gender;
      if (formData.kelas_id) payload.kelas_id = formData.kelas_id;

      await api.put(`/aliyah/siswa/${selectedSiswa.id}`, payload);
      toast.success('Siswa Aliyah berhasil diupdate');
      setIsEditOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal mengupdate siswa Aliyah');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus siswa Aliyah ini?')) {
      return;
    }

    try {
      await api.delete(`/aliyah/siswa/${id}`);
      toast.success('Siswa Aliyah berhasil dihapus');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Gagal menghapus siswa Aliyah');
    }
  };

  const handleLinkToSantri = async (santri_id) => {
    try {
      await api.put(`/aliyah/siswa/${selectedSiswa.id}`, { santri_id });
      toast.success('Siswa Aliyah berhasil di-link ke Santri');
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
      santri_id: '',
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
      santri_id: '',
    });
    setSelectedSiswa(null);
  };

  const downloadQRCode = async (siswaId, namaSiswa) => {
    try {
      const response = await api.get(`/aliyah/siswa/${siswaId}/qr-code`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `QR_Aliyah_${namaSiswa}.png`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('QR Code berhasil diunduh');
    } catch (error) {
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

  // Filter santri yang belum di-link ke Aliyah
  const availableSantri = santriList.filter(
    (santri) => !siswaList.some((siswa) => siswa.santri_id === santri.id)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center animate-slide-in-left">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Siswa Aliyah</h1>
          <p className="text-muted-foreground mt-1">Kelola siswa Madrasah Aliyah</p>
        </div>
        <div className="flex gap-2 animate-slide-in-right">
          <Button
            variant="outline"
            onClick={() => downloadSiswaAliyahPDF(filteredSiswa, kelasList)}
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
                <DialogTitle>Daftarkan Santri ke Madrasah Aliyah</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
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
                      {availableSantri.map((santri) => (
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
                      {kelasList.map((kelas) => (
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
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                <UserPlus className="w-4 h-4 mr-2" />
                Tambah Siswa Aliyah
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md animate-scale-in">
              <DialogHeader>
                <DialogTitle>Tambah Siswa Aliyah</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nama</Label>
                  <Input
                    placeholder="Nama siswa"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  />
                </div>
                <div>
                  <Label>NIS (Opsional)</Label>
                  <Input
                    placeholder="NIS"
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
                  <Label>Kelas (Opsional)</Label>
                  <Select
                    value={formData.kelas_id}
                    onValueChange={(value) => setFormData({ ...formData, kelas_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Belum Ada Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      {kelasList.map((kelas) => (
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
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau kelas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Label className="text-xs mr-1">Filter Kelas:</Label>
          <Select value={kelasFilter} onValueChange={setKelasFilter}>
            <SelectTrigger className="w-40">
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
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      ) : filteredSiswa.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">Tidak ada siswa Aliyah ditemukan</p>
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">QR</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSiswa.map((siswa) => (
                  <tr key={siswa.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{siswa.nama}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{siswa.nis || '-'}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground capitalize">{siswa.gender}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{siswa.kelas_nama || '-'}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {siswa.has_qr ? (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => downloadQRCode(siswa.id, siswa.nama)}
                        >
                          <QrCode className="w-4 h-4" />
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Tidak ada</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(siswa)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Dialog open={isLinkToSantriOpen && selectedSiswa?.id === siswa.id} onOpenChange={setIsLinkToSantriOpen}>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openLinkToSantriDialog(siswa)}
                            >
                              <Users className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md max-h-[600px] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Link ke Santri</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-sm text-muted-foreground">
                                Pilih santri yang akan di-link dengan siswa Aliyah <strong>{siswa.nama}</strong>.
                              </p>
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {santriList.map((santri) => (
                                  <button
                                    key={santri.id}
                                    className="w-full text-left p-2 rounded border border-border hover:bg-muted text-sm"
                                    onClick={() => handleLinkToSantri(santri.id)}
                                  >
                                    <div className="font-medium">{santri.nama}</div>
                                    <div className="text-xs text-muted-foreground">NIS: {santri.nis}</div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(siswa.id)}
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
    </div>
  );
};

export default SiswaAliyah;
