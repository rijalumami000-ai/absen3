import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Clock, Plus, Save } from 'lucide-react';

const emptySesi = { key: '', label: '', start_time: '18:30', end_time: '19:30', active: true };

const SettingWaktuPMQ = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sesiList, setSesiList] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/pmq/settings/waktu');
      setSesiList(res.data?.sesi || []);
    } catch (e) {
      console.error('Gagal memuat setting waktu PMQ', e);
      toast.error('Gagal memuat setting waktu PMQ');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeField = (index, field, value) => {
    setSesiList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddSesi = () => {
    setSesiList((prev) => [...prev, { ...emptySesi }]);
  };

  const handleRemoveSesi = (index) => {
    setSesiList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      // Validasi ringan
      for (const s of sesiList) {
        if (!s.key || !s.label) {
          toast.error('Key dan Nama Sesi wajib diisi');
          setSaving(false);
          return;
        }
      }

      await api.put('/pmq/settings/waktu', {
        id: 'pmq_waktu',
        sesi: sesiList,
      });
      toast.success('Pengaturan waktu PMQ berhasil disimpan');
      loadData();
    } catch (e) {
      console.error('Gagal menyimpan setting waktu PMQ', e);
      toast.error(e.response?.data?.detail || 'Gagal menyimpan setting waktu PMQ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Setting Waktu PMQ</h1>
            <p className="text-sm text-muted-foreground mt-1">Atur sesi waktu absensi untuk Pendidikan Murottilil Qur'an</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving || loading} className="gap-2">
          <Save className="w-4 h-4" />
          Simpan
        </Button>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Daftar Sesi PMQ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="py-10 text-center text-muted-foreground text-sm">Memuat pengaturan waktu PMQ...</div>
          ) : (
            <>
              <div className="space-y-3">
                {sesiList.map((s, index) => (
                  <div
                    key={index}
                    className="border border-border rounded-lg p-3 flex flex-col md:flex-row md:items-center gap-3"
                  >
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">Key Sesi</Label>
                        <Input
                          value={s.key}
                          onChange={(e) => handleChangeField(index, 'key', e.target.value)}
                          placeholder="Misal: pagi, malam"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Nama Sesi</Label>
                        <Input
                          value={s.label}
                          onChange={(e) => handleChangeField(index, 'label', e.target.value)}
                          placeholder="Misal: Sesi Pagi"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Jam Mulai</Label>
                          <Input
                            type="time"
                            value={s.start_time}
                            onChange={(e) => handleChangeField(index, 'start_time', e.target.value)}
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">Jam Selesai</Label>
                          <Input
                            type="time"
                            value={s.end_time}
                            onChange={(e) => handleChangeField(index, 'end_time', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between md:justify-center gap-2">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={!!s.active}
                            onCheckedChange={(val) => handleChangeField(index, 'active', val)}
                          />
                          <span className="text-xs text-muted-foreground">Aktif</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-red-500 border-red-200 hover:bg-red-50"
                          onClick={() => handleRemoveSesi(index)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {sesiList.length === 0 && (
                  <div className="text-xs text-muted-foreground">
                    Belum ada sesi. Tambahkan sesi dengan tombol di bawah.
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  Disarankan minimal memiliki 2 sesi: Pagi dan Malam.
                </div>
                <Button type="button" variant="outline" className="gap-2" onClick={handleAddSesi}>
                  <Plus className="w-4 h-4" />
                  Tambah Sesi
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingWaktuPMQ;
