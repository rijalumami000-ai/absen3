import React, { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const DEFAULT_TEMPLATE =
  "Assalamu'alaikum {nama_wali}.\n" +
  'Rekap sholat ananda {nama_santri} pada {tanggal}:\n' +
  'Dzuhur: {dzuhur}\n' +
  'Ashar: {ashar}\n' +
  'Maghrib: {maghrib}\n' +
  'Isya: {isya}\n' +
  'Subuh: {subuh}\n' +
  'Terima kasih.';

const placeholders = [
  { key: '{nama_wali}', desc: 'Nama wali santri' },
  { key: '{nama_santri}', desc: 'Nama santri' },
  { key: '{tanggal}', desc: 'Tanggal rekap (format Indonesia)' },
  { key: '{dzuhur}', desc: 'Status dzuhur' },
  { key: '{ashar}', desc: 'Status ashar' },
  { key: '{maghrib}', desc: 'Status maghrib' },
  { key: '{isya}', desc: 'Status isya' },
  { key: '{subuh}', desc: 'Status subuh' },
];

const WhatsAppTemplateSettings = () => {
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const preview = useMemo(() => {
    let text = template || DEFAULT_TEMPLATE;
    const data = {
      '{nama_wali}': 'Bapak/Ibu Ahmad',
      '{nama_santri}': 'Ahmad Fauzan',
      '{tanggal}': new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      '{dzuhur}': 'Hadir',
      '{ashar}': 'Hadir',
      '{maghrib}': 'Izin',
      '{isya}': 'Hadir',
      '{subuh}': 'Alfa',
    };
    Object.entries(data).forEach(([key, value]) => {
      text = text.replace(new RegExp(key, 'g'), value);
    });
    return text;
  }, [template]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const resp = await api.get('/settings/whatsapp-template');
      setTemplate(resp.data?.template || DEFAULT_TEMPLATE);
    } catch (err) {
      setTemplate(DEFAULT_TEMPLATE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplate();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.put('/settings/whatsapp-template', { template });
      toast({ title: 'Sukses', description: 'Template WhatsApp berhasil disimpan' });
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Gagal menyimpan template WhatsApp',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="whatsapp-template-page">
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">Template WhatsApp Wali Santri</h1>
        <p className="text-muted-foreground mt-1">
          Atur isi pesan rekap sholat yang akan dikirim ke WhatsApp wali santri.
        </p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Isi Template</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-muted-foreground">Memuat template...</div>
          ) : (
            <Textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={10}
              data-testid="whatsapp-template-input"
            />
          )}
          <Button onClick={handleSave} disabled={saving} data-testid="whatsapp-template-save">
            {saving ? 'Menyimpan...' : 'Simpan Template'}
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Placeholder yang tersedia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            {placeholders.map((item) => (
              <div key={item.key} className="flex items-center justify-between bg-muted rounded-lg px-3 py-2">
                <span className="font-mono text-emerald-700">{item.key}</span>
                <span className="text-muted-foreground">{item.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Preview Pesan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 whitespace-pre-line text-sm">
            {preview}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppTemplateSettings;