import React, { useState, useEffect } from 'react';
import { pengabsenAPI, asramaAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RefreshCw, Copy, Check, Plus, Pencil, Trash2, UserCheck } from 'lucide-react';

const Pengabsen = () => {
  const [pengabsen, setPengabsen] = useState([]);
  const [asrama, setAsrama] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPengabsen, setCurrentPengabsen] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [form, setForm] = useState({
    nama: '',
    username: '',
    email_atau_hp: '',
    asrama_ids: [],
  });
  const { toast } = useToast();

  const loadData = async () => {
    try {
      setLoading(true);
      const [pengRes, asramaRes] = await Promise.all([pengabsenAPI.getAll(), asramaAPI.getAll()]);
      setPengabsen(pengRes.data);
      setAsrama(asramaRes.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal memuat data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openAddDialog = () => {
    setForm({ nama: '', username: '', email_atau_hp: '', asrama_ids: [] });
    setEditMode(false);
    setCurrentPengabsen(null);
    setDialogOpen(true);
  };

  const openEditDialog = (p) => {
    setForm({
      nama: p.nama,
      username: p.username,
      email_atau_hp: p.email_atau_hp || '',
      asrama_ids: p.asrama_ids || [],
    });
    setEditMode(true);
    setCurrentPengabsen(p);
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.asrama_ids.length === 0) {
      toast({ title: 'Error', description: 'Pilih minimal 1 asrama', variant: 'destructive' });
      return;
    }
    try {
      if (editMode) {
        await pengabsenAPI.update(currentPengabsen.id, form);
        toast({ title: 'Sukses', description: 'Pengabsen berhasil diperbarui' });
      } else {
        await pengabsenAPI.create(form);
        toast({ title: 'Sukses', description: 'Pengabsen berhasil ditambahkan' });
      }
      setDialogOpen(false);
      loadData();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Gagal menyimpan data',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = (p) => {
    setToDelete(p);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await pengabsenAPI.delete(toDelete.id);
      toast({ title: 'Sukses', description: 'Pengabsen berhasil dihapus' });
      setDeleteDialogOpen(false);
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal menghapus data', variant: 'destructive' });
    }
  };

  const handleRegenerateKodeAkses = async (p) => {
    try {
      setRegeneratingId(p.id);
      const response = await pengabsenAPI.regenerateKodeAkses(p.id);
      toast({
        title: 'Sukses',
        description: `Kode akses baru: ${response.data.kode_akses}`,
      });
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Gagal mengubah kode akses', variant: 'destructive' });
    } finally {
      setRegeneratingId(null);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleAsrama = (asramaId) => {
    setForm((prev) => ({
      ...prev,
      asrama_ids: prev.asrama_ids.includes(asramaId)
        ? prev.asrama_ids.filter((id) => id !== asramaId)
        : [...prev.asrama_ids, asramaId],
    }));
  };

  const getAsramaNames = (ids) => {
    if (!ids || ids.length === 0) return '-';
    return ids
      .map((id) => asrama.find((a) => a.id === id)?.nama || id)
      .join(', ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="pengabsen-admin-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kelola Pengabsen</h1>
          <p className="text-gray-500 mt-1">Daftar pengabsen yang bertugas mencatat absensi santri</p>
        </div>
        <Button onClick={openAddDialog} data-testid="add-pengabsen-btn">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Pengabsen
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kode Akses</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kontak</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asrama</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pengabsen.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Belum ada data pengabsen
                  </td>
                </tr>
              ) : (
                pengabsen.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <UserCheck className="w-5 h-5 mr-2 text-gray-400" />
                        <span className="font-medium text-gray-900">{p.nama}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{p.username}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {p.kode_akses || '-'}
                        </code>
                        <button
                          onClick={() => copyToClipboard(p.kode_akses, p.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Salin kode akses"
                        >
                          {copiedId === p.id ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4 text-gray-500" />
                          )}
                        </button>
                        <button
                          onClick={() => handleRegenerateKodeAkses(p)}
                          disabled={regeneratingId === p.id}
                          className="p-1 hover:bg-gray-200 rounded"
                          title="Generate kode akses baru"
                        >
                          <RefreshCw
                            className={`w-4 h-4 text-blue-500 ${
                              regeneratingId === p.id ? 'animate-spin' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{p.email_atau_hp || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{getAsramaNames(p.asrama_ids)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(p)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => confirmDelete(p)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialog Tambah/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editMode ? 'Edit Pengabsen' : 'Tambah Pengabsen'}</DialogTitle>
            <DialogDescription>
              {editMode
                ? 'Perbarui data pengabsen'
                : 'Masukkan data pengabsen baru. Kode akses akan dibuat otomatis.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nama">Nama Lengkap</Label>
                <Input
                  id="nama"
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email_atau_hp">Email/HP</Label>
                <Input
                  id="email_atau_hp"
                  value={form.email_atau_hp}
                  onChange={(e) => setForm({ ...form, email_atau_hp: e.target.value })}
                  placeholder="email@example.com atau 08123456789"
                />
              </div>
              <div>
                <Label>Asrama yang Dikelola</Label>
                <div className="mt-2 flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {asrama.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => toggleAsrama(a.id)}
                      className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                        form.asrama_ids.includes(a.id)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {a.nama}
                    </button>
                  ))}
                </div>
                {asrama.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">Belum ada asrama. Tambahkan asrama terlebih dahulu.</p>
                )}
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit">{editMode ? 'Simpan' : 'Tambah'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengabsen?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus <strong>{toDelete?.nama}</strong>? Tindakan ini tidak
              dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Pengabsen;
