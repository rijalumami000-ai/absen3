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
  const [savingAppSettings, setSavingAppSettings] = useState(false);
  const [templates, setTemplates] = useState({
    hadir: '',
    alfa: '',
    sakit: '',
    izin: '',
    haid: '',
    istihadhoh: '',
  });
  const [appSettings, setAppSettings] = useState({
    admin_title: '',
    wali_title: '',
    pengabsen_title: '',
    pembimbing_title: '',
    pengabsen_kelas_title: '',
    monitoring_kelas_title: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    loadAppSettings();
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

  const loadAppSettings = async () => {
    try {
      const response = await settingsAPI.getAppSettings();
      setAppSettings(response.data);
    } catch (error) {
      console.error('Failed to load app settings:', error);
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

  const handleSaveAppSettings = async () => {
    try {
      setSavingAppSettings(true);
      await settingsAPI.updateAppSettings(appSettings);
      toast({
        title: 'Berhasil',
        description: 'Pengaturan judul aplikasi berhasil disimpan',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Gagal menyimpan pengaturan judul aplikasi',
        variant: 'destructive',
      });
    } finally {
      setSavingAppSettings(false);
    }
  };

  const handleChange = (field, value) => {
    setTemplates((prev) => ({ ...prev, [field]: value }));
  };

  const handleAppSettingsChange = (field, value) => {
    setAppSettings((prev) => ({ ...prev, [field]: value }));
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
    <div className="space-y-6 animate-fade-in" data-testid="settings-page">
      <div className="animate-slide-in-left">
        <h1 className="text-2xl font-bold text-gray-800 font-display">Pengaturan</h1>
        <p className="text-gray-500 mt-1">Kelola pengaturan aplikasi</p>
      </div>

      {/* App Titles Settings */}
      <Card className="shadow-card card-hover transition-smooth animate-scale-in">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardTitle className="text-lg font-display">Judul Aplikasi</CardTitle>
          <CardDescription>
            Customize judul yang tampil di setiap aplikasi
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label>Judul Dashboard Admin</Label>
            <Input
              value={appSettings.admin_title}
              onChange={(e) => handleAppSettingsChange('admin_title', e.target.value)}
              placeholder="Admin Panel Absensi Santri Dan Siswa"
            />
          </div>
          <div>
            <Label>Judul Aplikasi Wali Santri</Label>
            <Input
              value={appSettings.wali_title}
              onChange={(e) => handleAppSettingsChange('wali_title', e.target.value)}
              placeholder="Wali Santri Ponpes Al-Hamid"
            />
          </div>
          <div>
            <Label>Judul Aplikasi Pengabsen Sholat</Label>
            <Input
              value={appSettings.pengabsen_title}
              onChange={(e) => handleAppSettingsChange('pengabsen_title', e.target.value)}
              placeholder="Pengabsen Sholat Ponpes Al-Hamid"
            />
          </div>
          <div>
            <Label>Judul Aplikasi Monitoring Sholat</Label>
            <Input
              value={appSettings.pembimbing_title}
              onChange={(e) => handleAppSettingsChange('pembimbing_title', e.target.value)}
              placeholder="Monitoring Sholat Ponpes Al-Hamid"
            />
          </div>
          <div>
            <Label>Judul Aplikasi Pengabsen Kelas Madin</Label>
            <Input
              value={appSettings.pengabsen_kelas_title}
              onChange={(e) => handleAppSettingsChange('pengabsen_kelas_title', e.target.value)}
              placeholder="Pengabsen Kelas Madin"
            />
          </div>
          <div>
            <Label>Judul Aplikasi Monitoring Kelas Madin</Label>
            <Input
              value={appSettings.monitoring_kelas_title}
              onChange={(e) => handleAppSettingsChange('monitoring_kelas_title', e.target.value)}
              placeholder="Monitoring Kelas Madin"
            />
          </div>
          <Button onClick={handleSaveAppSettings} disabled={savingAppSettings} className="w-full btn-ripple active-scale">
            {savingAppSettings ? 'Menyimpan...' : 'Simpan Judul Aplikasi'}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Template Settings */}
      <Card className="shadow-card card-hover transition-smooth animate-scale-in">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardTitle className="text-lg font-display">Template Notifikasi Wali Santri</CardTitle>
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
