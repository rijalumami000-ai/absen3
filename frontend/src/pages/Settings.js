import React, { useEffect, useState } from 'react';
import { settingsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState({
    hadir: '',
    alfa: '',
    sakit: '',
    izin: '',
    haid: '',
    istihadhoh: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getWaliNotifikasi();
      setTemplates(response.data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal memuat pengaturan',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await settingsAPI.updateWaliNotifikasi(templates);
      toast({
        title: 'Berhasil',
        description: 'Pengaturan notifikasi berhasil disimpan',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menyimpan pengaturan',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setTemplates((prev) => ({ ...prev, [field]: value }));
  };

  const statusLabels = {
    hadir: { label: 'Hadir', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    alfa: { label: 'Alfa (Bolos)', color: 'text-red-600', bgColor: 'bg-red-50' },
    sakit: { label: 'Sakit', color: 'text-sky-600', bgColor: 'bg-sky-50' },
    izin: { label: 'Izin', color: 'text-amber-600', bgColor: 'bg-amber-50' },
    haid: { label: 'Haid', color: 'text-pink-600', bgColor: 'bg-pink-50' },
    istihadhoh: { label: 'Istihadhoh', color: 'text-violet-600', bgColor: 'bg-violet-50' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">Memuat pengaturan...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="settings-page">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Pengaturan</h1>
        <p className="text-gray-500 mt-1">Kelola pengaturan aplikasi</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Template Notifikasi Wali Santri</CardTitle>
          <CardDescription>
            Atur pesan notifikasi yang dikirim ke Wali Santri ketika status absensi anak mereka diperbarui.
            <br />
            <span className="text-xs text-gray-500 mt-2 block">
              Variabel yang tersedia: <code className="bg-gray-100 px-1 rounded">{'{nama}'}</code> = nama santri,{' '}
              <code className="bg-gray-100 px-1 rounded">{'{waktu}'}</code> = waktu sholat (subuh, dzuhur, dll)
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(statusLabels).map(([key, { label, color, bgColor }]) => (
            <div key={key} className={`p-4 rounded-lg border ${bgColor}`}>
              <Label htmlFor={key} className={`font-medium ${color}`}>
                Status: {label}
              </Label>
              <Input
                id={key}
                value={templates[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className="mt-2 bg-white"
                placeholder={`Template pesan untuk status ${label}`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Contoh hasil: {templates[key].replace('{nama}', 'Ahmad').replace('{waktu}', 'subuh')}
              </p>
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
