import React, { useState, useEffect } from 'react';
import { waliAPI, santriAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, UserCircle } from 'lucide-react';

const WaliSantri = () => {
  const [waliList, setWaliList] = useState([]);
  const [santriList, setSantriList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedWali, setSelectedWali] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    username: '',
    password: '',
    nomor_hp: '',
    email: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [waliRes, santriRes] = await Promise.all([
        waliAPI.getAll(),
        santriAPI.getAll({})
      ]);
      setWaliList(waliRes.data);
      setSantriList(santriRes.data);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = { ...formData };
      if (!submitData.email) delete submitData.email;
      if (editMode && !submitData.password) delete submitData.password;

      if (editMode) {
        await waliAPI.update(selectedWali.id, submitData);
        toast({ title: "Sukses", description: "Wali santri berhasil diupdate" });
      } else {
        await waliAPI.create(submitData);
        toast({ title: "Sukses", description: "Wali santri berhasil ditambahkan" });
      }
      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Gagal menyimpan data",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (wali) => {
    setSelectedWali(wali);
    setFormData({
      nama: wali.nama,
      username: wali.username,
      password: '',
      nomor_hp: wali.nomor_hp,
      email: wali.email || ''
    });
    setEditMode(true);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus wali santri ini?')) return;
    try {
      await waliAPI.delete(id);
      toast({ title: "Sukses", description: "Wali santri berhasil dihapus" });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Gagal menghapus data",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ nama: '', username: '', password: '', nomor_hp: '', email: '' });
    setSelectedWali(null);
    setEditMode(false);
  };

  const getJumlahAnak = (waliId) => {
    return santriList.filter(s => s.wali_id === waliId).length;
  };

  const getNamaAnak = (waliId) => {
    return santriList.filter(s => s.wali_id === waliId).map(s => s.nama).join(', ') || '-';
  };

  if (loading) return <div className="flex justify-center p-8">Memuat data...</div>;

  return (
    <div data-testid="wali-page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Kelola Wali Santri</h1>
          <p className="text-gray-600 mt-1">Manajemen akun wali santri</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="add-wali-button">
              <Plus className="mr-2" size={20} />
              Tambah Wali Santri
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Wali Santri' : 'Tambah Wali Santri'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nama Lengkap</Label>
                <Input
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Nama wali"
                  required
                  data-testid="wali-nama-input"
                />
              </div>
              <div>
                <Label>Username</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Username untuk login"
                  required
                  data-testid="wali-username-input"
                />
              </div>
              <div>
                <Label>Password {editMode && '(Kosongkan jika tidak diubah)'}</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Password"
                  required={!editMode}
                  data-testid="wali-password-input"
                />
              </div>
              <div>
                <Label>Nomor HP</Label>
                <Input
                  value={formData.nomor_hp}
                  onChange={(e) => setFormData({ ...formData, nomor_hp: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                  required
                  data-testid="wali-hp-input"
                />
              </div>
              <div>
                <Label>Email (Opsional)</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                  data-testid="wali-email-input"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="submit-wali-button">
                {editMode ? 'Update' : 'Tambah'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nomor HP</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Anak</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {waliList.map((wali) => (
              <tr key={wali.id} data-testid={`wali-row-${wali.id}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <UserCircle className="mr-2 text-gray-400" size={20} />
                    <span className="text-sm font-medium text-gray-900">{wali.nama}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{wali.username}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{wali.nomor_hp}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{wali.email || '-'}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {getJumlahAnak(wali.id)} anak
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(wali)} data-testid={`edit-wali-${wali.id}`}>
                      <Edit size={16} />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(wali.id)} data-testid={`delete-wali-${wali.id}`}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {waliList.length === 0 && (
          <div className="text-center py-12 text-gray-500">Belum ada data wali santri</div>
        )}
      </div>
    </div>
  );
};

export default WaliSantri;
