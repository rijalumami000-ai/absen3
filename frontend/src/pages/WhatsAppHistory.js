import React, { useEffect, useState } from 'react';
import api, { asramaAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { History, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const formatTimestamp = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleString('id-ID', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const WhatsAppHistory = () => {
  const [tanggal, setTanggal] = useState('');
  const [asramaId, setAsramaId] = useState('all');
  const [gender, setGender] = useState('all');
  const [search, setSearch] = useState('');
  const [asramaList, setAsramaList] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState('');
  const [sendingId, setSendingId] = useState(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const DEFAULT_TEMPLATE =
    "Assalamu'alaikum {nama_wali}.\n" +
    'Rekap sholat ananda {nama_santri} pada {tanggal}:\n' +
    'Dzuhur: {dzuhur}\n' +
    'Ashar: {ashar}\n' +
    'Maghrib: {maghrib}\n' +
    'Isya: {isya}\n' +
    'Subuh: {subuh}\n' +
    'Terima kasih.';

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {
        tanggal: tanggal || undefined,
        asrama_id: asramaId !== 'all' ? asramaId : undefined,
        gender: gender !== 'all' ? gender : undefined,
        q: search ? search.trim() : undefined,
      };
      const resp = await api.get('/whatsapp/history', { params });
      setHistoryList(resp.data || []);
    } catch (err) {
      toast({
        title: 'Error',
        description: err.response?.data?.detail || 'Gagal memuat history WhatsApp',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadInit = async () => {
      try {
        const resp = await asramaAPI.getAll();
        setAsramaList(resp.data || []);
      } catch (err) {
        setAsramaList([]);
      }
      try {
        const tpl = await api.get('/settings/whatsapp-template');
        setTemplate(tpl.data?.template || DEFAULT_TEMPLATE);
      } catch (err) {
        setTemplate(DEFAULT_TEMPLATE);
      }
    };
    loadInit();
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tanggal, asramaId, gender]);

  const buildMessage = (item) => {
    const payload = {
      '{nama_wali}': item.nama_wali || '-',
      '{nama_santri}': item.nama_santri || '-',
      '{tanggal}': item.tanggal || '-',
      '{dzuhur}': item.rekap?.dzuhur || 'belum',
      '{ashar}': item.rekap?.ashar || 'belum',
      '{maghrib}': item.rekap?.maghrib || 'belum',
      '{isya}': item.rekap?.isya || 'belum',
      '{subuh}': item.rekap?.subuh || 'belum',
    };
    let text = template || DEFAULT_TEMPLATE;
    Object.entries(payload).forEach(([key, value]) => {
      text = text.replace(new RegExp(key, 'g'), value);
    });
    return text;
  };

  const normalizePhone = (value) => {
    if (!value) return '';
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.startsWith('0')) return `62${digits.slice(1)}`;
    if (digits.startsWith('62')) return digits;
    return digits;
  };

  const handleResend = async (item) => {
    const phone = normalizePhone(item.nomor_hp_wali || '');
    if (!phone) {
      toast({ title: 'Nomor WA kosong', description: 'Nomor wali santri belum tersedia.', variant: 'destructive' });
      return;
    }
    const message = buildMessage(item);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    try {
      setSendingId(item.id);
      await api.post('/whatsapp/history/resend', { history_id: item.id });
      toast({ title: 'Terkirim ulang', description: `Notifikasi untuk ${item.nama_santri} tercatat ulang.` });
      await fetchHistory();
    } catch (err) {
      toast({
        title: 'Gagal kirim ulang',
        description: err.response?.data?.detail || 'Gagal mencatat kirim ulang',
        variant: 'destructive',
      });
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="whatsapp-history-page">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
            <History className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground" data-testid="whatsapp-history-title">
              History Notifikasi WhatsApp
            </h1>
            <p className="text-muted-foreground mt-1">Daftar santri yang sudah menerima rekap WhatsApp.</p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/whatsapp/rekap')}
          className="gap-2"
          data-testid="whatsapp-history-back-button"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Kirim WA Wali
        </Button>
      </div>

      <Card className="shadow-card" data-testid="whatsapp-history-filter-card">
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Tanggal Kirim</Label>
              <Input
                type="date"
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                data-testid="whatsapp-history-date"
              />
            </div>
            <div>
              <Label>Filter Asrama</Label>
              <Select value={asramaId} onValueChange={setAsramaId}>
                <SelectTrigger data-testid="whatsapp-history-asrama-select">
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
                <SelectTrigger data-testid="whatsapp-history-gender-select">
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
                  data-testid="whatsapp-history-search"
                />
                <Button type="button" variant="outline" onClick={fetchHistory} data-testid="whatsapp-history-search-btn">
                  Cari
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-10 text-muted-foreground" data-testid="whatsapp-history-loading">
          Memuat history WhatsApp...
        </div>
      ) : historyList.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground" data-testid="whatsapp-history-empty">
          Belum ada history notifikasi.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" data-testid="whatsapp-history-list">
          {historyList.map((item) => (
            <Card key={item.id} className="shadow-card" data-testid={`whatsapp-history-card-${item.id}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">{item.nama_santri}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div>Waktu Kirim: {formatTimestamp(item.sent_at)}</div>
                <div>Admin: {item.admin_nama || 'admin'}</div>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => handleResend(item)}
                  disabled={sendingId === item.id}
                  data-testid={`whatsapp-history-resend-${item.id}`}
                >
                  {sendingId === item.id ? 'Mengirim ulang...' : 'Kirim Ulang'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WhatsAppHistory;