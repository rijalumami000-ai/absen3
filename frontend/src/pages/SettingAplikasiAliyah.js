import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { settingsAPI } from '@/lib/api';

const SettingAplikasiAliyah = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pengabsenTitle, setPengabsenTitle] = useState('');
  const [monitoringTitle, setMonitoringTitle] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await settingsAPI.getAppSettings();
        const data = res.data || {};
        setPengabsenTitle(data.pengabsen_aliyah_title || 'Pengabsen Kelas Aliyah');
        setMonitoringTitle(data.monitoring_aliyah_title || 'Monitoring Kelas Aliyah');
      } catch (e) {
        toast.error('Gagal memuat pengaturan aplikasi');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsAPI.updateAppSettings({
        pengabsen_aliyah_title: pengabsenTitle,
        monitoring_aliyah_title: monitoringTitle,
      });
      toast.success('Pengaturan aplikasi Aliyah berhasil disimpan');
    } catch (e) {
      toast.error('Gagal menyimpan pengaturan aplikasi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-display font-bold text-foreground">Setting Aplikasi Aliyah</h1>
        <p className="text-muted-foreground">Memuat pengaturan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Setting Aplikasi Aliyah</h1>
        <p className="text-muted-foreground mt-1">Atur judul aplikasi PWA Pengabsen dan Monitoring Madrasah Aliyah.</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Judul Aplikasi PWA</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Judul PWA Pengabsen Aliyah</Label>
            <Input
              value={pengabsenTitle}
              onChange={(e) => setPengabsenTitle(e.target.value)}
              placeholder="Pengabsen Kelas Aliyah"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Judul PWA Monitoring Aliyah</Label>
            <Input
              value={monitoringTitle}
              onChange={(e) => setMonitoringTitle(e.target.value)}
              placeholder="Monitoring Kelas Aliyah"
              className="mt-1"
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="mt-2">
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingAplikasiAliyah;
