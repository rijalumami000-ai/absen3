import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Layers, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import api from '@/lib/api';

const TingkatanPMQ = () => {
  const [tingkatanList, setTingkatanList] = useState([]);
  const [kelompokList, setKelompokList] = useState([]);
  const [newKelompok, setNewKelompok] = useState({});
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedKelompok, setSelectedKelompok] = useState(null);
  const [editNama, setEditNama] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tingRes, kelRes] = await Promise.all([
        api.get('/pmq/tingkatan'),
        api.get('/pmq/kelompok'),
      ]);
      setTingkatanList(tingRes.data || []);
      setKelompokList(kelRes.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Gagal memuat data PMQ');
    } finally {
      setLoading(false);
    }
  };

  const handleAddKelompok = async (tingkatanKey) => {
    const nama = (newKelompok[tingkatanKey] || '').trim();
    if (!nama) {
      toast.error('Nama kelompok wajib diisi');
      return;
    }
    try {
      await api.post('/pmq/kelompok', { tingkatan_key: tingkatanKey, nama });
      toast.success('Kelompok PMQ berhasil ditambahkan');
      setNewKelompok((prev) => ({ ...prev, [tingkatanKey]: '' }));
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Gagal menambah kelompok');
    }
  };

  const handleDeleteKelompok = async (id) => {
    if (!window.confirm('Yakin ingin menghapus kelompok ini?')) return;
    try {
      await api.delete(`/pmq/kelompok/${id}`);
      toast.success('Kelompok PMQ berhasil dihapus');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Gagal menghapus kelompok');
    }
  };

  const openEditKelompok = (kelompok) => {
    setSelectedKelompok(kelompok);
    setEditNama(kelompok.nama || '');
    setIsEditOpen(true);
  };

  const handleUpdateKelompok = async () => {
    if (!selectedKelompok) return;
    const nama = editNama.trim();
    if (!nama) {
      toast.error('Nama kelompok wajib diisi');
      return;
    }
    try {
      await api.put(`/pmq/kelompok/${selectedKelompok.id}`, { nama });
      toast.success('Kelompok PMQ berhasil diupdate');
      setIsEditOpen(false);
      setSelectedKelompok(null);
      setEditNama('');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Gagal mengupdate kelompok');
    }
  };

  const kelompokByTingkatan = (key) => kelompokList.filter((k) => k.tingkatan_key === key);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="tingkatan-pmq-page">
      <div className="flex items-center gap-3 animate-slide-in-left" data-testid="tingkatan-pmq-header">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
          <Layers className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground" data-testid="tingkatan-pmq-title">
            Tingkatan & Kelompok PMQ
          </h1>
          <p className="text-muted-foreground mt-1" data-testid="tingkatan-pmq-subtitle">
            Atur tingkatan dan kelompok untuk Pendidikan Murottilil Qur'an
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground" data-testid="tingkatan-pmq-loading">
          Memuat data...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" data-testid="tingkatan-pmq-grid">
          {tingkatanList.map((t) => (
            <Card key={t.key} className="shadow-card" data-testid={`tingkatan-pmq-card-${t.key}`}>
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  <span data-testid={`tingkatan-pmq-label-${t.key}`}>{t.label}</span>
                  <span className="text-[11px] text-muted-foreground" data-testid={`tingkatan-pmq-count-${t.key}`}>
                    {kelompokByTingkatan(t.key).length} kelompok
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nama kelompok baru"
                    value={newKelompok[t.key] || ''}
                    onChange={(e) => setNewKelompok((prev) => ({ ...prev, [t.key]: e.target.value }))}
                    data-testid={`tingkatan-pmq-new-kelompok-input-${t.key}`}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleAddKelompok(t.key)}
                    data-testid={`tingkatan-pmq-add-kelompok-${t.key}`}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1 max-h-56 overflow-y-auto" data-testid={`tingkatan-pmq-kelompok-list-${t.key}`}>
                  {kelompokByTingkatan(t.key).length === 0 ? (
                    <p className="text-xs text-muted-foreground">Belum ada kelompok</p>
                  ) : (
                    kelompokByTingkatan(t.key).map((k) => (
                      <div
                        key={k.id}
                        className="flex items-center justify-between text-sm bg-muted rounded-lg px-3 py-1.5"
                        data-testid={`tingkatan-pmq-kelompok-${k.id}`}
                      >
                        <span data-testid={`tingkatan-pmq-kelompok-name-${k.id}`}>{k.nama}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="text-slate-500 hover:text-slate-700"
                            onClick={() => openEditKelompok(k)}
                            data-testid={`tingkatan-pmq-kelompok-edit-${k.id}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteKelompok(k.id)}
                            data-testid={`tingkatan-pmq-kelompok-delete-${k.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md" data-testid="tingkatan-pmq-edit-dialog">
          <DialogHeader>
            <DialogTitle>Edit Kelompok PMQ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Nama Kelompok</label>
              <Input
                placeholder="Nama kelompok"
                value={editNama}
                onChange={(e) => setEditNama(e.target.value)}
                data-testid="tingkatan-pmq-edit-name-input"
              />
            </div>
            <Button onClick={handleUpdateKelompok} className="w-full" data-testid="tingkatan-pmq-edit-submit">
              Simpan Perubahan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TingkatanPMQ;
