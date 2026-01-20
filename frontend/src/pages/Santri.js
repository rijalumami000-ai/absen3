import React, { useState, useEffect } from 'react';
import { santriAPI, asramaAPI, waliAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, QrCode, Download } from 'lucide-react';

const Santri = () => {
  const [santriList, setSantriList] = useState([]);
  const [asramaList, setAsramaList] = useState([]);
  const [waliList, setWaliList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [filterGender, setFilterGender] = useState('');
  const [filterAsrama, setFilterAsrama] = useState('');
  const [formData, setFormData] = useState({
    nama: '',
    nis: '',
    gender: 'putra',
    asrama_id: '',
    wali_id: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadSantri();
  }, [filterGender, filterAsrama]);

  const loadData = async () => {
    try {
      const [asramaRes, waliRes] = await Promise.all([
        asramaAPI.getAll(),
        waliAPI.getAll()
      ]);
      setAsramaList(asramaRes.data);
      setWaliList(waliRes.data);
      await loadSantri();
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSantri = async () => {
    try {
      const params = {};
      if (filterGender) params.gender = filterGender;
      if (filterAsrama) params.asrama_id = filterAsrama;
      const response = await santriAPI.getAll(params);
      setSantriList(response.data);
    } catch (error) {
      console.error('Error loading santri:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (!submitData.wali_id) delete submitData.wali_id;
      
      if (editMode) {
        await santriAPI.update(selectedSantri.id, submitData);
        toast({ title: "Sukses", description: "Santri berhasil diupdate" });
      } else {
        await santriAPI.create(submitData);
        toast({ title: "Sukses", description: "Santri berhasil ditambahkan dan QR code dibuat" });
      }
      setDialogOpen(false);
      resetForm();
      loadSantri();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Gagal menyimpan data",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (santri) => {
    setSelectedSantri(santri);
    setFormData({
      nama: santri.nama,
      nis: santri.nis,
      gender: santri.gender,
      asrama_id: santri.asrama_id,
      wali_id: santri.wali_id || ''
    });
    setEditMode(true);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus santri ini? QR code juga akan dihapus.')) return;
    try {
      await santriAPI.delete(id);
      toast({ title: "Sukses", description: "Santri berhasil dihapus" });
      loadSantri();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Gagal menghapus data",
        variant: "destructive",
      });
    }
  };

  const showQRCode = (santri) => {
    setSelectedSantri(santri);
    setQrDialogOpen(true);
  };

  const downloadQRCode = (santri) => {
    const link = document.createElement('a');
    link.href = santriAPI.getQRCode(santri.id);
    link.download = `QR_${santri.nama}_${santri.nis}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setFormData({ nama: '', nis: '', gender: 'putra', asrama_id: '', wali_id: '' });
    setSelectedSantri(null);
    setEditMode(false);
  };

  const getAsramaName = (asramaId) => {
    const asrama = asramaList.find(a => a.id === asramaId);
    return asrama ? asrama.nama : '-';
  };

  const getWaliName = (waliId) => {
    if (!waliId) return '-';
    const wali = waliList.find(w => w.id === waliId);
    return wali ? wali.nama : '-';
  };

  if (loading) return <div className="flex justify-center p-8">Memuat data...</div>;

  return (
    <div data-testid="santri-page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Kelola Santri</h1>
          <p className="text-gray-600 mt-1">Manajemen data santri dan QR code</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="add-santri-button">
              <Plus className="mr-2" size={20} />
              Tambah Santri
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Santri' : 'Tambah Santri'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nama Lengkap</Label>
                <Input
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Nama santri"
                  required
                  data-testid="santri-nama-input"
                />
              </div>
              <div>
                <Label>NIS</Label>
                <Input
                  value={formData.nis}
                  onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                  placeholder="Nomor Induk Santri"
                  required
                  data-testid="santri-nis-input"
                />
              </div>
              <div>
                <Label>Jenis Kelamin</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger data-testid="santri-gender-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="putra">Putra</SelectItem>
                    <SelectItem value="putri">Putri</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Asrama</Label>
                <Select value={formData.asrama_id} onValueChange={(value) => setFormData({ ...formData, asrama_id: value })} required>
                  <SelectTrigger data-testid="santri-asrama-select">
                    <SelectValue placeholder="Pilih asrama" />
                  </SelectTrigger>
                  <SelectContent>
                    {asramaList.filter(a => a.gender === formData.gender).map((asrama) => (
                      <SelectItem key={asrama.id} value={asrama.id}>{asrama.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Wali Santri (Opsional)</Label>
                <Select value={formData.wali_id} onValueChange={(value) => setFormData({ ...formData, wali_id: value })}>
                  <SelectTrigger data-testid="santri-wali-select">
                    <SelectValue placeholder="Pilih wali santri" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tidak ada</SelectItem>
                    {waliList.map((wali) => (
                      <SelectItem key={wali.id} value={wali.id}>{wali.nama}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" data-testid="submit-santri-button">
                {editMode ? 'Update' : 'Tambah & Generate QR'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label>Filter Jenis Kelamin</Label>
              <Select value={filterGender} onValueChange={setFilterGender}>
                <SelectTrigger data-testid="filter-gender-select">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua</SelectItem>
                  <SelectItem value="putra">Putra</SelectItem>
                  <SelectItem value="putri">Putri</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label>Filter Asrama</Label>
              <Select value={filterAsrama} onValueChange={setFilterAsrama}>
                <SelectTrigger data-testid="filter-asrama-select">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Semua</SelectItem>
                  {asramaList.map((asrama) => (
                    <SelectItem key={asrama.id} value={asrama.id}>{asrama.nama} ({asrama.gender})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Santri List */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIS</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asrama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wali</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {santriList.map((santri) => (
              <tr key={santri.id} data-testid={`santri-row-${santri.id}`}>
                <td className="px-6 py-4 text-sm text-gray-900">{santri.nis}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{santri.nama}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className={`px-2 py-1 rounded-full text-xs ${santri.gender === 'putra' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                    {santri.gender}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{getAsramaName(santri.asrama_id)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{getWaliName(santri.wali_id)}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => showQRCode(santri)} data-testid={`qr-santri-${santri.id}`}>
                      <QrCode size={16} />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => downloadQRCode(santri)} data-testid={`download-qr-${santri.id}`}>
                      <Download size={16} />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(santri)} data-testid={`edit-santri-${santri.id}`}>
                      <Edit size={16} />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(santri.id)} data-testid={`delete-santri-${santri.id}`}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {santriList.length === 0 && (
          <div className="text-center py-12 text-gray-500">Belum ada data santri</div>
        )}
      </div>

      {/* QR Code Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Code - {selectedSantri?.nama}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {selectedSantri && (
              <>
                <img 
                  src={santriAPI.getQRCode(selectedSantri.id)} 
                  alt="QR Code" 
                  className="w-64 h-64 border-2 border-gray-200 rounded-lg"
                  data-testid="qr-code-image"
                />
                <div className="text-center">
                  <p className="font-semibold text-gray-800">{selectedSantri.nama}</p>
                  <p className="text-sm text-gray-600">NIS: {selectedSantri.nis}</p>
                </div>
                <Button onClick={() => downloadQRCode(selectedSantri)} className="w-full" data-testid="download-qr-button">
                  <Download className="mr-2" size={16} />
                  Download QR Code
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Santri;
