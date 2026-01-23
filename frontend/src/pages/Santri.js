import React, { useState, useEffect, useRef } from 'react';
import { santriAPI, asramaAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, QrCode, Download, Upload, FileDown, FileSpreadsheet, GraduationCap } from 'lucide-react';

const Santri = () => {
  const [santriList, setSantriList] = useState([]);
  const [asramaList, setAsramaList] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [madrasahStatus, setMadrasahStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [linkMadrasahDialogOpen, setLinkMadrasahDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedSantri, setSelectedSantri] = useState(null);
  const [filterGender, setFilterGender] = useState('');
  const [filterAsrama, setFilterAsrama] = useState('');
  const [importing, setImporting] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    nis: '',
    gender: 'putra',
    asrama_id: '',
    nama_wali: '',
    nomor_hp_wali: '',
    email_wali: ''
  });
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (asramaList.length > 0) {
      loadSantri();
    }
  }, [filterGender, filterAsrama, asramaList.length]);

  const loadData = async () => {
    try {
      const asramaRes = await asramaAPI.getAll();
      setAsramaList(asramaRes.data);
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
      if (!submitData.email_wali) delete submitData.email_wali;
      
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
      nama_wali: santri.nama_wali,
      nomor_hp_wali: santri.nomor_hp_wali,
      email_wali: santri.email_wali || ''
    });
    setEditMode(true);
    setDialogOpen(true);
  };


  const loadMadrasahStatus = async (santriId) => {
    try {
      const response = await santriAPI.get(`${santriId}/madrasah-status`);
      setMadrasahStatus(response.data);
    } catch (error) {
      setMadrasahStatus(null);
    }
  };

  const handleOpenLinkMadrasah = async (santri) => {
    setSelectedSantri(santri);
    await loadMadrasahStatus(santri.id);
    
    // Load kelas list
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/kelas`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      setKelasList(data);
    } catch (error) {
      console.error('Failed to load kelas');
    }
    
    setLinkMadrasahDialogOpen(true);
  };

  const handleLinkToMadrasah = async (kelasId = null) => {
    try {
      await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/santri/${selectedSantri.id}/link-to-madrasah?kelas_id=${kelasId || ''}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      toast({ title: "Sukses", description: "Santri berhasil didaftarkan ke Madrasah Diniyah" });
      setLinkMadrasahDialogOpen(false);
      loadSantri();
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error.response?.data?.detail || "Gagal mendaftarkan santri",
        variant: "destructive"
      });
    }
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

  const showQRCode = async (santri) => {
    setSelectedSantri(santri);
    setQrDialogOpen(true);
    
    // Fetch QR code with authorization
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(santriAPI.getQRCode(santri.id), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const qrUrl = URL.createObjectURL(blob);
        setSelectedSantri({ ...santri, qrUrl });
      }
    } catch (error) {
      console.error('Error loading QR code:', error);
      toast({
        title: "Error",
        description: "Gagal memuat QR code",
        variant: "destructive",
      });
    }
  };

  const downloadQRCode = async (santri) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(santriAPI.getQRCode(santri.id), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${santri.nama}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Sukses",
          description: "QR Code berhasil didownload",
        });
      } else {
        throw new Error('Failed to download');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal mendownload QR code",
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await santriAPI.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'template_santri.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ title: "Sukses", description: "Template berhasil didownload" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal download template",
        variant: "destructive",
      });
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImporting(true);
    try {
      const response = await santriAPI.import(file);
      toast({ 
        title: "Import Selesai", 
        description: `Berhasil: ${response.data.success}, Error: ${response.data.errors.length}` 
      });
      if (response.data.errors.length > 0) {
        console.log('Import errors:', response.data.errors);
      }
      loadSantri();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Gagal import data",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExport = async () => {
    try {
      const response = await santriAPI.export();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'data_santri.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ title: "Sukses", description: "Data berhasil diexport" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal export data",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ 
      nama: '', 
      nis: '', 
      gender: 'putra', 
      asrama_id: '', 
      nama_wali: '', 
      nomor_hp_wali: '', 
      email_wali: '' 
    });
    setSelectedSantri(null);
    setEditMode(false);
  };

  const getAsramaName = (asramaId) => {
    const asrama = asramaList.find(a => a.id === asramaId);
    return asrama ? asrama.nama : '-';
  };

  if (loading) return <div className="flex justify-center p-8">Memuat data...</div>;

  return (
    <div data-testid="santri-page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Kelola Santri</h1>
          <p className="text-gray-600 mt-1">Manajemen data santri dan QR code</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={downloadTemplate} data-testid="download-template-button">
            <FileSpreadsheet className="mr-2" size={20} />
            Template
          </Button>
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing} data-testid="import-button">
            <Upload className="mr-2" size={20} />
            {importing ? 'Importing...' : 'Import'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <Button variant="outline" onClick={handleExport} data-testid="export-button">
            <FileDown className="mr-2" size={20} />
            Export
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button data-testid="add-santri-button">
                <Plus className="mr-2" size={20} />
                Tambah Santri
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editMode ? 'Edit Santri' : 'Tambah Santri'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nama Santri</Label>
                    <Input
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      placeholder="Nama lengkap santri"
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
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Jenis Kelamin</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value, asrama_id: '' })}>
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
                </div>

                <hr className="my-4" />
                <h3 className="font-semibold text-gray-700">Data Wali Santri</h3>

                <div>
                  <Label>Nama Wali (Ayah/Ibu)</Label>
                  <Input
                    value={formData.nama_wali}
                    onChange={(e) => setFormData({ ...formData, nama_wali: e.target.value })}
                    placeholder="Nama lengkap wali"
                    required
                    data-testid="wali-nama-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nomor HP Wali</Label>
                    <Input
                      value={formData.nomor_hp_wali}
                      onChange={(e) => setFormData({ ...formData, nomor_hp_wali: e.target.value })}
                      placeholder="08xxxxxxxxxx"
                      required
                      data-testid="wali-hp-input"
                    />
                  </div>
                  <div>
                    <Label>Email Wali (Opsional)</Label>
                    <Input
                      type="email"
                      value={formData.email_wali}
                      onChange={(e) => setFormData({ ...formData, email_wali: e.target.value })}
                      placeholder="email@example.com"
                      data-testid="wali-email-input"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" data-testid="submit-santri-button">
                  {editMode ? 'Update' : 'Tambah & Generate QR'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Label>Filter Jenis Kelamin</Label>
              <Select value={filterGender || 'all'} onValueChange={(val) => setFilterGender(val === 'all' ? '' : val)}>
                <SelectTrigger data-testid="filter-gender-select">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="putra">Putra</SelectItem>
                  <SelectItem value="putri">Putri</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Label>Filter Asrama</Label>
              <Select value={filterAsrama || 'all'} onValueChange={(val) => setFilterAsrama(val === 'all' ? '' : val)}>
                <SelectTrigger data-testid="filter-asrama-select">
                  <SelectValue placeholder="Semua" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">HP Wali</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {santriList.map((santri) => (
              <tr key={santri.id} data-testid={`santri-row-${santri.id}`}>
                <td className="px-6 py-4 text-sm text-gray-900">{santri.nis}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  <div className="flex items-center gap-2">
                    {santri.nama}
                    {santri.is_in_madrasah && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-medium">
                        Madrasah Diniyah
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <span className={`px-2 py-1 rounded-full text-xs ${santri.gender === 'putra' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                    {santri.gender}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{getAsramaName(santri.asrama_id)}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{santri.nama_wali}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{santri.nomor_hp_wali}</td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => showQRCode(santri)} data-testid={`qr-santri-${santri.id}`} title="Lihat QR Code">
                      <QrCode size={16} />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => downloadQRCode(santri)} data-testid={`download-qr-${santri.id}`} title="Download QR">
                      <Download size={16} />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(santri)} data-testid={`edit-santri-${santri.id}`} title="Edit">
                      <Edit size={16} />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleOpenLinkMadrasah(santri)} 
                      className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                      title="Madrasah Diniyah"
                    >
                      <GraduationCap size={16} />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(santri.id)} data-testid={`delete-santri-${santri.id}`} title="Hapus">
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
                {selectedSantri.qrUrl ? (
                  <img 
                    src={selectedSantri.qrUrl} 
                    alt="QR Code" 
                    className="w-64 h-64 border-2 border-gray-200 rounded-lg"
                    data-testid="qr-code-image"
                  />
                ) : (
                  <div className="w-64 h-64 border-2 border-gray-200 rounded-lg flex items-center justify-center">
                    <p className="text-gray-500">Memuat QR Code...</p>
                  </div>
                )}
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
