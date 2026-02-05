import React, { useEffect, useState } from 'react';
import api, { asramaAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { History } from 'lucide-react';

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
  const { toast } = useToast();

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
    };
    loadInit();
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tanggal, asramaId, gender]);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="whatsapp-history-page">
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
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <div>Waktu Kirim: {formatTimestamp(item.sent_at)}</div>
                <div>Admin: {item.admin_nama || 'admin'}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WhatsAppHistory;