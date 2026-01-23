import React, { useState, useEffect } from 'react';
import { asramaAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Building } from 'lucide-react';

const Asrama = () => {
  const [asramaList, setAsramaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedAsrama, setSelectedAsrama] = useState(null);
  const [formData, setFormData] = useState({ nama: '', gender: 'putra', kapasitas: 0 });
  const { toast } = useToast();

  useEffect(() => {
    loadAsrama();
  }, []);

  const loadAsrama = async () => {
    try {
      const response = await asramaAPI.getAll();
      setAsramaList(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data asrama",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await asramaAPI.update(selectedAsrama.id, formData);
        toast({ title: "Sukses", description: "Asrama berhasil diupdate" });
      } else {
        await asramaAPI.create(formData);
        toast({ title: "Sukses", description: "Asrama berhasil ditambahkan" });
      }
      setDialogOpen(false);
      resetForm();
      loadAsrama();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Gagal menyimpan data",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (asrama) => {
    setSelectedAsrama(asrama);
    setFormData({ nama: asrama.nama, gender: asrama.gender, kapasitas: asrama.kapasitas });
    setEditMode(true);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus asrama ini?')) return;
    try {
      await asramaAPI.delete(id);
      toast({ title: "Sukses", description: "Asrama berhasil dihapus" });
      loadAsrama();
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Gagal menghapus data",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({ nama: '', gender: 'putra', kapasitas: 0 });
    setSelectedAsrama(null);
    setEditMode(false);
  };

  const putraList = asramaList.filter(a => a.gender === 'putra');
  const putriList = asramaList.filter(a => a.gender === 'putri');

  if (loading) return <div className="flex justify-center p-8">Memuat data...</div>;

  return (
    <div data-testid="asrama-page" className="animate-fade-in">
      <div className="flex justify-between items-center mb-6 animate-slide-in-left">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 font-display">Kelola Asrama Santri</h1>
          <p className="text-gray-600 mt-1">Manajemen data asrama putra dan putri</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button data-testid="add-asrama-button">
              <Plus className="mr-2" size={20} />
              Tambah Asrama
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editMode ? 'Edit Asrama' : 'Tambah Asrama'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nama Asrama</Label>
                <Input
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Contoh: Asrama A"
                  required
                  data-testid="asrama-nama-input"
                />
              </div>
              <div>
                <Label>Jenis</Label>
                <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                  <SelectTrigger data-testid="asrama-gender-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="putra">Putra</SelectItem>
                    <SelectItem value="putri">Putri</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Kapasitas</Label>
                <Input
                  type="number"
                  value={formData.kapasitas}
                  onChange={(e) => setFormData({ ...formData, kapasitas: parseInt(e.target.value) })}
                  placeholder="Contoh: 30"
                  required
                  data-testid="asrama-kapasitas-input"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="submit-asrama-button">
                {editMode ? 'Update' : 'Tambah'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asrama Putra */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="mr-2" size={20} />
              Asrama Putra ({putraList.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {putraList.map((asrama) => (
                <div key={asrama.id} className="p-4 border rounded-lg flex justify-between items-center" data-testid={`asrama-item-${asrama.id}`}>
                  <div>
                    <p className="font-semibold text-gray-800">{asrama.nama}</p>
                    <p className="text-sm text-gray-600">Kapasitas: {asrama.kapasitas} santri</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(asrama)} data-testid={`edit-asrama-${asrama.id}`}>
                      <Edit size={16} />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(asrama.id)} data-testid={`delete-asrama-${asrama.id}`}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
              {putraList.length === 0 && (
                <p className="text-center text-gray-500 py-8">Belum ada data asrama putra</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Asrama Putri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="mr-2" size={20} />
              Asrama Putri ({putriList.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {putriList.map((asrama) => (
                <div key={asrama.id} className="p-4 border rounded-lg flex justify-between items-center" data-testid={`asrama-item-${asrama.id}`}>
                  <div>
                    <p className="font-semibold text-gray-800">{asrama.nama}</p>
                    <p className="text-sm text-gray-600">Kapasitas: {asrama.kapasitas} santri</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(asrama)} data-testid={`edit-asrama-${asrama.id}`}>
                      <Edit size={16} />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(asrama.id)} data-testid={`delete-asrama-${asrama.id}`}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              ))}
              {putriList.length === 0 && (
                <p className="text-center text-gray-500 py-8">Belum ada data asrama putri</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Asrama;
