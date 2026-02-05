import React, { useEffect, useMemo, useState } from 'react';
import api, { asramaAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, CalendarClock, Users, History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_TEMPLATE =
  "Assalamu'alaikum {nama_wali}.\n" +
  'Rekap sholat ananda {nama_santri} pada {tanggal}:\n' +
  'Dzuhur: {dzuhur}\n' +
  'Ashar: {ashar}\n' +
  'Maghrib: {maghrib}\n' +
  'Isya: {isya}\n' +
  'Subuh: {subuh}\n' +
  'Terima kasih.';

const WAKTU_ORDER = ['dzuhur', 'ashar', 'maghrib', 'isya', 'subuh'];
const STATUS_LABELS = {
  hadir: 'Hadir',
  alfa: 'Alfa',
  sakit: 'Sakit',
  izin: 'Izin',
  haid: 'Haid',
  istihadhoh: 'Istihadhoh',
  masbuq: 'Masbuq',
  belum: 'Belum',
};

const getYesterday = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatTanggal = (value) => {
  if (!value) return '-';
  return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const normalizePhone = (value) => {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0')) return `62${digits.slice(1)}`;
  if (digits.startsWith('62')) return digits;
  return digits;
};

const WhatsAppRekap = () => {
  const [tanggal, setTanggal] = useState(getYesterday());
  const [asramaId, setAsramaId] = useState('all');
  const [gender, setGender] = useState('all');
  const [search, setSearch] = useState('');
  const [asramaList, setAsramaList] = useState([]);
  const [rekapList, setRekapList] = useState([]);
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [loading, setLoading] = useState(true);
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [sendingId, setSendingId] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const selectedDate = useMemo(() => {
    const date = new Date(`${tanggal}T00:00:00`);
    date.setHours(0, 0, 0, 0);
    return date;
  }, [tanggal]);

  const canSend = selectedDate < today;

  const fetchTemplate = async () => {
    try {
      setLoadingTemplate(true);
      const resp = await api.get('/settings/whatsapp-template');
      setTemplate(resp.data?.template || DEFAULT_TEMPLATE);
    } catch (err) {
      setTemplate(DEFAULT_TEMPLATE);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const fetchRekap = async () => {
    try {
      setLoading(true);
      const params = {
        tanggal,
        asrama_id: asramaId !== 'all' ? asramaId : undefined,
        gender: gender !== 'all' ? gender : undefined,
        q: search ? search.trim() : undefined,
      };
      const resp = await api.get('/whatsapp/rekap', { params });
      setRekapList(resp.data || []);
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Gagal memuat rekap WhatsApp',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInit = async () => {
      try {
        const asramaResp = await asramaAPI.getAll();
        setAsramaList(asramaResp.data || []);
      } catch (err) {
        setAsramaList([]);
      }
    };
    loadInit();
    fetchTemplate();
  }, []);

  useEffect(() => {
    fetchRekap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tanggal, asramaId, gender]);

  const applySearch = () => {
    fetchRekap();
  };

  const handleSendWhatsApp = async (item) => {
    const phone = normalizePhone(item.nomor_hp_wali || '');
    if (!phone) {
      toast({ title: 'Nomor WA kosong', description: 'Nomor wali santri belum tersedia.', variant: 'destructive' });
      return;
    }
    const message = buildMessage(item);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    try {
      setSendingId(item.santri_id);
      await api.post('/whatsapp/rekap/send', { santri_id: item.santri_id, tanggal });
      toast({ title: 'Tercatat', description: `Notifikasi untuk ${item.nama_santri} dicatat di history.` });
      await fetchRekap();
    } catch (err) {
      toast({
        title: 'Gagal mencatat',
        description: err.response?.data?.detail || 'Gagal mencatat history WhatsApp',
        variant: 'destructive',
      });
    } finally {
      setSendingId(null);
    }
  };

  const buildMessage = (item) => {
    const payload = {
      '{nama_wali}': item.nama_wali || '-',
      '{nama_santri}': item.nama_santri || '-',
      '{tanggal}': formatTanggal(tanggal),
      '{dzuhur}': STATUS_LABELS[item.rekap?.dzuhur || 'belum'],
      '{ashar}': STATUS_LABELS[item.rekap?.ashar || 'belum'],
      '{maghrib}': STATUS_LABELS[item.rekap?.maghrib || 'belum'],
      '{isya}': STATUS_LABELS[item.rekap?.isya || 'belum'],
      '{subuh}': STATUS_LABELS[item.rekap?.subuh || 'belum'],
    };
    let text = template || DEFAULT_TEMPLATE;
    Object.entries(payload).forEach(([key, value]) => {
      text = text.replace(new RegExp(key, 'g'), value);
    });
    return text;
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="whatsapp-rekap-page">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
          <MessageCircle className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground" data-testid="whatsapp-rekap-title">
            Kirim Rekap WhatsApp Wali Santri
          </h1>
          <p className="text-muted-foreground mt-1">
            Rekap sholat harian (Dzuhur–Subuh) dikirimkan ke nomor WhatsApp wali santri.
          </p>
        </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/whatsapp/history')}
          className="gap-2"
          data-testid="whatsapp-rekap-history-button"
        >
          <History className="w-4 h-4" />
          History Notifikasi
        </Button>
      </div>

      {!canSend && (
        <div
          className="bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg px-4 py-3"
          data-testid="whatsapp-rekap-warning"
        >
          Tombol kirim WhatsApp hanya aktif untuk rekap hari sebelumnya. Pilih tanggal sebelum hari ini.
        </div>
      )}

      <Card className="shadow-card" data-testid="whatsapp-rekap-filter-card">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Tanggal Rekap</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={tanggal}
                  onChange={(e) => setTanggal(e.target.value)}
                  data-testid="whatsapp-rekap-date"
                />
                <CalendarClock className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
            <div>
              <Label>Filter Asrama</Label>
              <Select value={asramaId} onValueChange={setAsramaId}>
                <SelectTrigger data-testid="whatsapp-rekap-asrama-select">
                  <SelectValue placeholder="Semua Asrama" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Asrama</SelectItem>
                  {asramaList.map((asrama) => (
                    <SelectItem key={asrama.id} value={asrama.id}>
                      {asrama.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Filter Gender</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger data-testid="whatsapp-rekap-gender-select">
                  <SelectValue placeholder="Semua Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Gender</SelectItem>
                  <SelectItem value="putra">Putra</SelectItem>
                  <SelectItem value="putri">Putri</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cari Nama</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Cari nama santri..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="whatsapp-rekap-search"
                />
                <Button type="button" variant="outline" onClick={applySearch} data-testid="whatsapp-rekap-search-btn">
                  Cari
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground" data-testid="whatsapp-rekap-summary">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>Total santri: {rekapList.length}</span>
        </div>
        <div>{loadingTemplate ? 'Memuat template...' : 'Template WhatsApp siap digunakan'}</div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground" data-testid="whatsapp-rekap-loading">
          Memuat rekap WhatsApp...
        </div>
      ) : rekapList.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground" data-testid="whatsapp-rekap-empty">
          Tidak ada data santri untuk filter ini.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="whatsapp-rekap-list">
          {rekapList.map((item) => {
            const phone = normalizePhone(item.nomor_hp_wali || '');
            const sendDisabled = !canSend || !phone;
            return (
              <Card key={item.santri_id} className="shadow-card" data-testid={`whatsapp-rekap-card-${item.santri_id}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold">
                    {item.nama_santri}
                    <span className="text-xs text-muted-foreground block">
                      Wali: {item.nama_wali || '-'} • Asrama: {item.asrama_nama || '-'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {WAKTU_ORDER.map((waktu) => (
                      <div
                        key={waktu}
                        className="px-2 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        {waktu.charAt(0).toUpperCase() + waktu.slice(1)}: {STATUS_LABELS[item.rekap?.[waktu] || 'belum']}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-muted-foreground">Nomor WA: {phone || '-'}</div>
                  <Button
                    type="button"
                    className="w-full"
                    disabled={sendDisabled || sendingId === item.santri_id}
                    onClick={() => handleSendWhatsApp(item)}
                    data-testid={`whatsapp-rekap-send-${item.santri_id}`}
                  >
                    {sendDisabled
                      ? phone
                        ? 'Tersedia besok'
                        : 'Nomor wali belum ada'
                      : sendingId === item.santri_id
                        ? 'Mencatat...'
                        : 'Kirim WhatsApp'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WhatsAppRekap;