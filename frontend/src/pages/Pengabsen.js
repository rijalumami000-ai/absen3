import React, { useState, useEffect } from 'react';
import { pengabsenAPI, asramaAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, UserCheck } from 'lucide-react';

const Pengabsen = () => {
  const [pengabsenList, setPengabsenList] = useState([]);
  const [asramaList, setAsramaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPengabsen, setSelectedPengabsen] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    email_atau_hp: '',
    username: '',
    password: '',
    asrama_ids: []
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pengabsenRes, asramaRes] = await Promise.all([
        pengabsenAPI.getAll(),
        asramaAPI.getAll()
      ]);
      setPengabsenList(pengabsenRes.data);
      setAsramaList(asramaRes.data);
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
    
    if (formData.asrama_ids.length === 0) {
      toast({
        title: "Error",
        description: "Pilih minimal 1 asrama",
        variant: "destructive",
      });
      return;
    }

    try {
      const submitData = { ...formData };
      if (editMode && !submitData.password) delete submitData.password;

      if (editMode) {
        await pengabsenAPI.update(selectedPengabsen.id, submitData);
        toast({ title: "Sukses", description: "Pengabsen berhasil diupdate" });
      } else {
        await pengabsenAPI.create(submitData);
        toast({ title: "Sukses", description: "Pengabsen berhasil ditambahkan" });
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

  const handleEdit = (pengabsen) => {
    setSelectedPengabsen(pengabsen);
    setFormData({
      nama: pengabsen.nama,
      email_atau_hp: pengabsen.email_atau_hp,
      username: pengabsen.username,
      password: '',
      asrama_ids: pengabsen.asrama_ids || []
    });
    setEditMode(true);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus pengabsen ini?')) return;
    try {
      await pengabsenAPI.delete(id);
      toast({ title: "Sukses", description: "Pengabsen berhasil dihapus" });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Gagal menghapus data",
        variant: "destructive",
      });
    }
  };

  const toggleAsrama = (asramaId) => {
    setFormData(prev => {
      const asramaIds = [...prev.asrama_ids];
      if (asramaIds.includes(asramaId)) {
        return { ...prev, asrama_ids: asramaIds.filter(id => id !== asramaId) };
      } else {
        return { ...prev, asrama_ids: [...asramaIds, asramaId] };
      }
    });
  };

  const resetForm = () => {
    setFormData({ nama: '', email_atau_hp: '', username: '', password: '', asrama_ids: [] });
    setSelectedPengabsen(null);
    setEditMode(false);
  };

  const getAsramaNames = (asramaIds) => {
    if (!asramaIds || asramaIds.length === 0) return '-';
    return asramaIds.map(id => {
      const asrama = asramaList.find(a => a.id === id);
      return asrama ? `${asrama.nama} (${asrama.gender})` : '';
    }).filter(Boolean).join(', ');
  };

  if (loading) return <div className="flex justify-center p-8">Memuat data...</div>;

  return (
    <div data-testid="pengabsen-page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Kelola Pengabsen</h1>
          <p className="text-gray-600 mt-1">Manajemen akun pengabsen (bisa multi-asrama)</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="add-pengabsen-button">
              <Plus className="mr-2" size={20} />
              Tambah Pengabsen
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Pengabsen' : 'Tambah Pengabsen'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nama Lengkap</Label>
                <Input
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Nama pengabsen"
                  required
                  data-testid="pengabsen-nama-input"
                />
              </div>
              <div>
                <Label>Email atau Nomor HP</Label>
                <Input
                  value={formData.email_atau_hp}
                  onChange={(e) => setFormData({ ...formData, email_atau_hp: e.target.value })}
                  placeholder="email@example.com atau 08xxxxxxxxxx"
                  required
                  data-testid="pengabsen-contact-input"
                />
              </div>
              <div>
                <Label>Username</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Username untuk login"
                  required
                  data-testid="pengabsen-username-input"
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
                  data-testid="pengabsen-password-input"
                />
              </div>
              <div>
                <Label className="mb-3 block">Asrama yang Dikelola (Pilih minimal 1)</Label>
                {asramaList.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 border rounded-lg">
                    Memuat data asrama...
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                    {asramaList.map((asrama) => (
                      <div key={asrama.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`asrama-${asrama.id}`}
                          checked={formData.asrama_ids.includes(asrama.id)}
                          onCheckedChange={() => toggleAsrama(asrama.id)}
                          data-testid={`pengabsen-asrama-${asrama.id}`}
                        />
                        <label htmlFor={`asrama-${asrama.id}`} className="text-sm cursor-pointer">
                          {asrama.nama} ({asrama.gender})
                        </label>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  Dipilih: {formData.asrama_ids.length} asrama
                </p>
              </div>
              <Button type="submit" className="w-full" data-testid="submit-pengabsen-button">
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email/HP</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asrama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Asrama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pengabsenList.map((pengabsen) => (
              <tr key={pengabsen.id} data-testid={`pengabsen-row-${pengabsen.id}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <UserCheck className="mr-2 text-gray-400" size={20} />
                    <span className="text-sm font-medium text-gray-900">{pengabsen.nama}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{pengabsen.email_atau_hp}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{pengabsen.username}</td>
                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                  <div className="truncate" title={getAsramaNames(pengabsen.asrama_ids)}>
                    {getAsramaNames(pengabsen.asrama_ids)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {pengabsen.asrama_ids?.length || 0} asrama
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(pengabsen)} data-testid={`edit-pengabsen-${pengabsen.id}`}>
                      <Edit size={16} />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(pengabsen.id)} data-testid={`delete-pengabsen-${pengabsen.id}`}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pengabsenList.length === 0 && (
          <div className="text-center py-12 text-gray-500">Belum ada data pengabsen</div>
        )}
      </div>
    </div>
  );
};

export default Pengabsen;
