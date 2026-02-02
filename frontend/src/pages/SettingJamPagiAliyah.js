import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { settingsAPI } from '@/lib/api';

const SettingJamPagiAliyah = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [startTime, setStartTime] = useState('06:30');
  const [endTime, setEndTime] = useState('07:15');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await settingsAPI.getAliyahAbsensiPagi();
        const data = res.data || {};
        setStartTime(data.start_time || '06:30');
        setEndTime(data.end_time || '07:15');
      } catch (e) {
        toast.error('Gagal memuat pengaturan jam pagi Aliyah');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsAPI.updateAliyahAbsensiPagi({
        start_time: startTime,
        end_time: endTime,
      });
      toast.success('Pengaturan jam pagi Aliyah berhasil disimpan');
    } catch (e) {
      toast.error('Gagal menyimpan pengaturan jam pagi Aliyah');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-display font-bold text-foreground">Pengaturan Jam Pagi Aliyah</h1>
        <p className="text-muted-foreground">Memuat pengaturan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Pengaturan Jam Pagi Aliyah</h1>
        <p className="text-muted-foreground mt-1">
          Atur rentang waktu global untuk absensi Kehadiran Siswa Pagi Hari Madrasah Aliyah.
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-base">Jam Kehadiran Siswa Pagi Hari</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Jam Mulai</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Jam Selesai</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Pengaturan ini hanya membatasi <span className="font-semibold">scan QR</span> untuk jenis absensi
            <span className="font-semibold"> Kehadiran Siswa Pagi Hari</span>. Edit manual lewat dropdown
            (termasuk di Riwayat) tetap diizinkan kapan saja.
          </p>
          <Button onClick={handleSave} disabled={saving} className="mt-2">
            {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingJamPagiAliyah;
