import React, { useEffect, useState } from 'react';
import { Plus, Search, Key, FileDown, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/lib/api';
import { downloadPengabsenPMQPDF } from '@/lib/pdfUtils';

const PengabsenPMQ = () => {
  const [pengabsenList, setPengabsenList] = useState([]);
  const [tingkatanList, setTingkatanList] = useState([]);
  const [kelompokList, setKelompokList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPengabsen, setSelectedPengabsen] = useState(null);
  const [formData, setFormData] = useState({
    nama: '',
    email_atau_hp: '',
    username: '',
    tingkatan_keys: [],
    kelompok_ids: [],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [pengRes, tingRes, kelRes] = await Promise.all([
        api.get('/pmq/pengabsen'),
        api.get('/pmq/tingkatan'),
        api.get('/pmq/kelompok'),
      ]);
      setPengabsenList(pengRes.data || []);
      setTingkatanList(tingRes.data || []);
      setKelompokList(kelRes.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Gagal memuat data Pengabsen PMQ');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ nama: '', email_atau_hp: '', username: '', tingkatan_keys: [], kelompok_ids: [] });
    setSelectedPengabsen(null);
  };

  const toggleTingkatan = (key) => {
    setFormData((prev) => ({
      ...prev,
      tingkatan_keys: prev.tingkatan_keys.includes(key)
        ? prev.tingkatan_keys.filter((k) => k !== key)
        : [...prev.tingkatan_keys, key],
    }));
  };

  const toggleKelompok = (id) => {
    setFormData((prev) => ({
      ...prev,
      kelompok_ids: prev.kelompok_ids.includes(id)
        ? prev.kelompok_ids.filter((k) => k !== id)
        : [...prev.kelompok_ids, id],
    }));
  };

  const handleCreate = async () => {
    try {
      if (!formData.nama || !formData.username || formData.tingkatan_keys.length === 0) {
        toast.error('Nama, Username dan minimal satu Tingkatan wajib diisi');
        return;
      }
      await api.post('/pmq/pengabsen', formData);
      toast.success('Pengabsen PMQ berhasil ditambahkan');
      setIsCreateOpen(false);
      resetForm();
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Gagal menambahkan pengabsen PMQ');
    }
  };

  const openEditDialog = (p) => {
    setSelectedPengabsen(p);
    setFormData({
      nama: p.nama,
      email_atau_hp: p.email_atau_hp,
      username: p.username,
      tingkatan_keys: p.tingkatan_keys || [],
      kelompok_ids: p.kelompok_ids || [],
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedPengabsen) return;
    try {
      await api.put(`/pmq/pengabsen/${selectedPengabsen.id}`, formData);
      toast.success('Pengabsen PMQ berhasil diupdate');
      setIsEditOpen(false);
      resetForm();
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Gagal mengupdate pengabsen PMQ');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus pengabsen PMQ ini?')) return;
    try {
      await api.delete(`/pmq/pengabsen/${id}`);
      toast.success('Pengabsen PMQ berhasil dihapus');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Gagal menghapus pengabsen PMQ');
    }
  };

  const handleRegenerateKode = async (id) => {
    try {
      const res = await api.post(`/pmq/pengabsen/${id}/regenerate-kode-akses`);
      toast.success('Kode akses PMQ berhasil digenerate ulang');
      const updated = res.data;
      setPengabsenList((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (e) {
      toast.error('Gagal generate ulang kode akses');
    }
  };

  const filteredPengabsen = pengabsenList.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.nama.toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q) ||
      (p.email_atau_hp || '').toLowerCase().includes(q)
    );
  });

  const kelompokLabel = (ids) => {
    if (!ids || ids.length === 0) return '-';
    const found = kelompokList.filter((k) => ids.includes(k.id));
    return found.map((k) => `${k.nama} (${k.tingkatan_key})`).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center animate-slide-in-left">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Pengabsen PMQ</h1>
          <p className="text-muted-foreground mt-1">Kelola pengabsen Pendidikan Murottilil Qur'an</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="hover-lift"
            onClick={() => {
              if (!pengabsenList.length) {
                toast.info('Tidak ada data pengabsen PMQ untuk diunduh');
                return;
              }
              downloadPengabsenPMQPDF(pengabsenList, tingkatanList, kelompokList);
            }}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="btn-ripple">
                <Plus className="w-4 h-4 mr-2" />
                Tambah Pengabsen PMQ
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Pengabsen PMQ</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nama Lengkap</Label>
                  <Input
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Nama pengabsen"
                  />
                </div>
                <div>
                  <Label>Username</Label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Username untuk login PWA PMQ"
                  />
                </div>
                <div>
                  <Label>Email / No. HP</Label>
                  <Input
                    value={formData.email_atau_hp}
                    onChange={(e) => setFormData({ ...formData, email_atau_hp: e.target.value })}
                    placeholder="Kontak pengabsen"
                  />
                </div>
                <div>
                  <Label>Tingkatan yang Diakses</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {tingkatanList.map((t) => (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => toggleTingkatan(t.key)}
                        className={`px-3 py-2 rounded-lg text-sm flex items-center justify-between border transition-colors ${
                          formData.tingkatan_keys.includes(t.key)
                            ? 'bg-primary-700 text-white border-primary-700'
                            : 'bg-muted text-muted-foreground hover:bg-primary-50 border-border'
                        }`}
                      >
                        <span>{t.label}</span>
                        <Layers className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Kelompok yang Diakses</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border border-border rounded-lg p-2">
                    {kelompokList.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Belum ada kelompok PMQ</p>
                    ) : (
                      kelompokList.map((k) => (
                        <button
                          key={k.id}
                          type="button"
                          onClick={() => toggleKelompok(k.id)}
                          className={`px-3 py-2 rounded-lg text-xs text-left border transition-colors ${
                            formData.kelompok_ids.includes(k.id)
                              ? 'bg-primary-700 text-white border-primary-700'
                              : 'bg-muted text-muted-foreground hover:bg-primary-50 border-border'
                          }`}
                        >
                          <div className="font-medium">{k.nama}</div>
                          <div className="text-[10px] opacity-70">{k.tingkatan_key}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
                <Button className="w-full" onClick={handleCreate}>
                  Simpan
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Cari pengabsen PMQ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Memuat data Pengabsen PMQ...</div>
      ) : filteredPengabsen.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">Tidak ada pengabsen PMQ ditemukan</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Nama</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Username</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Kontak</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Kode Akses</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Tingkatan</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Kelompok</th>
                  <th className="px-6 py-3 text-left font-semibold text-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPengabsen.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/50">
                    <td className="px-6 py-3 font-medium text-foreground">{p.nama}</td>
                    <td className="px-6 py-3 text-muted-foreground">{p.username}</td>
                    <td className="px-6 py-3 text-muted-foreground">{p.email_atau_hp}</td>
                    <td className="px-6 py-3 text-muted-foreground">
                      <div className="inline-flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                          {p.kode_akses || '-'}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-primary-600 hover:text-primary-700"
                          onClick={() => handleRegenerateKode(p.id)}
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground text-xs">
                      {(p.tingkatan_keys || []).join(', ') || '-'}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground text-xs">
                      {kelompokLabel(p.kelompok_ids)}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(p)}>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 border-red-200 hover:bg-red-50"
                          onClick={() => handleDelete(p.id)}
                        >
                          Hapus
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

      {/* Dialog Edit Pengabsen */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pengabsen PMQ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Lengkap</Label>
              <Input
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              />
            </div>
            <div>
              <Label>Username</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <Label>Email / No. HP</Label>
              <Input
                value={formData.email_atau_hp}
                onChange={(e) => setFormData({ ...formData, email_atau_hp: e.target.value })}
              />
            </div>
            <div>
              <Label>Tingkatan yang Diakses</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {tingkatanList.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => toggleTingkatan(t.key)}
                    className={`px-3 py-2 rounded-lg text-sm flex items-center justify-between border transition-colors ${
                      formData.tingkatan_keys.includes(t.key)
                        ? 'bg-primary-700 text-white border-primary-700'
                        : 'bg-muted text-muted-foreground hover:bg-primary-50 border-border'
                    }`}
                  >
                    <span>{t.label}</span>
                    <Layers className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Kelompok yang Diakses</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto border border-border rounded-lg p-2">
                {kelompokList.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Belum ada kelompok PMQ</p>
                ) : (
                  kelompokList.map((k) => (
                    <button
                      key={k.id}
                      type="button"
                      onClick={() => toggleKelompok(k.id)}
                      className={`px-3 py-2 rounded-lg text-xs text-left border transition-colors ${
                        formData.kelompok_ids.includes(k.id)
                          ? 'bg-primary-700 text-white border-primary-700'
                          : 'bg-muted text-muted-foreground hover:bg-primary-50 border-border'
                      }`}
                    >
                      <div className="font-medium">{k.nama}</div>
                      <div className="text-[10px] opacity-70">{k.tingkatan_key}</div>
                    </button>
                  ))
                )}
              </div>
            </div>
            <Button className="w-full" onClick={handleUpdate}>
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PengabsenPMQ;
