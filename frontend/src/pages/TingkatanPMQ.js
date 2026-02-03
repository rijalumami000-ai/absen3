import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import api from '@/lib/api';

const TingkatanPMQ = () => {
  const [tingkatanList, setTingkatanList] = useState([]);
  const [kelompokList, setKelompokList] = useState([]);
  const [newKelompok, setNewKelompok] = useState({});
  const [loading, setLoading] = useState(true);

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

  const kelompokByTingkatan = (key) => kelompokList.filter((k) => k.tingkatan_key === key);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3 animate-slide-in-left">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
          <Layers className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Tingkatan & Kelompok PMQ</h1>
          <p className="text-muted-foreground mt-1">Atur tingkatan dan kelompok untuk Pendidikan Murottilil Qur'an</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Memuat data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {tingkatanList.map((t) => (
            <Card key={t.key} className="shadow-card">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center justify-between">
                  <span>{t.label}</span>
                  <span className="text-[11px] text-muted-foreground">{kelompokByTingkatan(t.key).length} kelompok</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Nama kelompok baru"
                    value={newKelompok[t.key] || ''}
                    onChange={(e) => setNewKelompok((prev) => ({ ...prev, [t.key]: e.target.value }))}
                  />
                  <Button size="icon" variant="outline" onClick={() => handleAddKelompok(t.key)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1 max-h-56 overflow-y-auto">
                  {kelompokByTingkatan(t.key).length === 0 ? (
                    <p className="text-xs text-muted-foreground">Belum ada kelompok</p>
                  ) : (
                    kelompokByTingkatan(t.key).map((k) => (
                      <div
                        key={k.id}
                        className="flex items-center justify-between text-sm bg-muted rounded-lg px-3 py-1.5"
                      >
                        <span>{k.nama}</span>
                        <button
                          type="button"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteKelompok(k.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TingkatanPMQ;
