import React, { useState, useEffect } from 'react';
import { pembimbingAPI, asramaAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, UserCog } from 'lucide-react';

const Pembimbing = () => {
  const [pembimbingList, setPembimbingList] = useState([]);
  const [asramaList, setAsramaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedPembimbing, setSelectedPembimbing] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
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
      const [pembimbingRes, asramaRes] = await Promise.all([
        pembimbingAPI.getAll(),
        asramaAPI.getAll()
      ]);
      setPembimbingList(pembimbingRes.data);
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
    try {
      const submitData = { ...formData };
      if (editMode && !submitData.password) delete submitData.password;

      if (editMode) {
        await pembimbingAPI.update(selectedPembimbing.id, submitData);
        toast({ title: "Sukses", description: "Pembimbing berhasil diupdate" });
      } else {
        await pembimbingAPI.create(submitData);
        toast({ title: "Sukses", description: "Pembimbing berhasil ditambahkan" });
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

  const handleEdit = (pembimbing) => {
    setSelectedPembimbing(pembimbing);
    setFormData({
      nama: pembimbing.nama,
      username: pembimbing.username,
      password: '',
      asrama_ids: pembimbing.asrama_ids || []
    });
    setEditMode(true);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus pembimbing ini?')) return;
    try {
      await pembimbingAPI.delete(id);
      toast({ title: "Sukses", description: "Pembimbing berhasil dihapus" });
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
    setFormData({ nama: '', username: '', password: '', asrama_ids: [] });
    setSelectedPembimbing(null);
    setEditMode(false);
  };

  const getAsramaNames = (asramaIds) => {
    if (!asramaIds || asramaIds.length === 0) return '-';
    return asramaIds.map(id => {
      const asrama = asramaList.find(a => a.id === id);
      return asrama ? asrama.nama : '';
    }).filter(Boolean).join(', ');
  };

  if (loading) return <div className="flex justify-center p-8">Memuat data...</div>;

  return (
    <div data-testid="pembimbing-page">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Kelola Pembimbing</h1>
          <p className="text-gray-600 mt-1">Manajemen akun pembimbing multi-asrama</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="add-pembimbing-button">
              <Plus className="mr-2" size={20} />
              Tambah Pembimbing
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Pembimbing' : 'Tambah Pembimbing'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nama Lengkap</Label>
                <Input
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Nama pembimbing"
                  required
                  data-testid="pembimbing-nama-input"
                />
              </div>
              <div>
                <Label>Username</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Username untuk login"
                  required
                  data-testid="pembimbing-username-input"
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
                  data-testid="pembimbing-password-input"
                />
              </div>
              <div>
                <Label className="mb-3 block">Asrama yang Dibimbing</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                  {asramaList.map((asrama) => (
                    <div key={asrama.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`asrama-${asrama.id}`}
                        checked={formData.asrama_ids.includes(asrama.id)}
                        onCheckedChange={() => toggleAsrama(asrama.id)}
                        data-testid={`pembimbing-asrama-${asrama.id}`}
                      />
                      <label htmlFor={`asrama-${asrama.id}`} className="text-sm cursor-pointer">
                        {asrama.nama} ({asrama.gender})
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full" data-testid="submit-pembimbing-button">
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asrama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Asrama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {pembimbingList.map((pembimbing) => (
              <tr key={pembimbing.id} data-testid={`pembimbing-row-${pembimbing.id}`}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <UserCog className="mr-2 text-gray-400" size={20} />
                    <span className="text-sm font-medium text-gray-900">{pembimbing.nama}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{pembimbing.username}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{getAsramaNames(pembimbing.asrama_ids)}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {pembimbing.asrama_ids?.length || 0} asrama
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(pembimbing)} data-testid={`edit-pembimbing-${pembimbing.id}`}>
                      <Edit size={16} />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(pembimbing.id)} data-testid={`delete-pembimbing-${pembimbing.id}`}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pembimbingList.length === 0 && (
          <div className="text-center py-12 text-gray-500">Belum ada data pembimbing</div>
        )}
      </div>
    </div>
  );
};

export default Pembimbing;
