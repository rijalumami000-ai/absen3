import React, { useEffect, useState, useRef } from 'react';
import { Plus, Search, Users, Link, FileDown, QrCode, Download, Link2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import api from '@/lib/api';
import { downloadSiswaPMQPDF } from '@/lib/pdfUtils';

const SiswaPMQ = () => {
  const [siswaList, setSiswaList] = useState([]);
  const [tingkatanList, setTingkatanList] = useState([]);
  const [kelompokList, setKelompokList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTingkatan, setFilterTingkatan] = useState('all');
  const [filterKelompok, setFilterKelompok] = useState('all');
  const [filterGender, setFilterGender] = useState('all');
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [nfcDialog, setNfcDialog] = useState({ open: false, siswa: null, value: '' });
  const [isLinkSantriOpen, setIsLinkSantriOpen] = useState(false);
  const [formData, setFormData] = useState({
    nama: '',
    gender: '',
    tingkatan_key: '',
    kelompok_id: '',
  });
  const [linkForm, setLinkForm] = useState({
    santri_id: '',
    tingkatan_key: '',
    kelompok_id: '',
  });
  const [linkSantriSearch, setLinkSantriSearch] = useState('');
  const [editingSiswa, setEditingSiswa] = useState(null);
  const [qrPreview, setQrPreview] = useState({ open: false, siswa: null });
  const [availableSantri, setAvailableSantri] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const nfcInputRef = useRef(null);


  const filteredAvailableSantri = availableSantri.filter((s) => {
    const q = linkSantriSearch.toLowerCase();
    if (!q) return true;
    return (
      (s.nama && s.nama.toLowerCase().includes(q)) ||
      (s.nis && s.nis.toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    fetchMaster();
    fetchSiswa();
  }, []);

  const fetchMaster = async () => {
    try {
      const [tingRes, kelRes] = await Promise.all([
        api.get('/pmq/tingkatan'),
        api.get('/pmq/kelompok'),
      ]);
      setTingkatanList(tingRes.data || []);
      setKelompokList(kelRes.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Gagal memuat data tingkatan/kelompok PMQ');
    }
  };

  const fetchSiswa = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterTingkatan !== 'all') params.tingkatan_key = filterTingkatan;
      if (filterKelompok !== 'all') params.kelompok_id = filterKelompok;
      if (filterGender !== 'all') params.gender = filterGender;
      if (searchQuery) params.search = searchQuery;
      const res = await api.get('/pmq/siswa', { params });
      setSiswaList(res.data || []);
    } catch (e) {
      console.error(e);
      toast.error('Gagal memuat siswa PMQ');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditingSiswa(null);
    setFormData({ nama: '', gender: '', tingkatan_key: '', kelompok_id: '' });
    setEditingId(null);
    setIsCreateOpen(true);
  };

  const openLinkFromSantri = async () => {
    try {
      const res = await api.get('/pmq/santri-available');
      setAvailableSantri(res.data || []);
      setLinkForm({ santri_id: '', tingkatan_key: '', kelompok_id: '' });
      setIsLinkSantriOpen(true);
    } catch (e) {
      console.error(e);
      toast.error('Gagal memuat daftar santri');
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.nama || !formData.tingkatan_key) {
        toast.error('Nama dan Tingkatan wajib diisi');
        return;
      }

      if (editingId) {
        // Update existing siswa
        await api.put(`/pmq/siswa/${editingId}`, formData);
        toast.success('Siswa PMQ berhasil diperbarui');
      } else {
        // Create new siswa
        await api.post('/pmq/siswa', formData);
        toast.success('Siswa PMQ berhasil ditambahkan');
      }

      setIsCreateOpen(false);
      setEditingId(null);
      fetchSiswa();
    } catch (e) {
      toast.error(
        e.response?.data?.detail || `Gagal ${editingId ? 'memperbarui' : 'menambah'} siswa PMQ`
      );
    }
  };

  const handleLink = async () => {
    try {
      if (!linkForm.santri_id || !linkForm.tingkatan_key) {
        toast.error('Santri dan Tingkatan wajib dipilih');
        return;
      }
      await api.post('/pmq/siswa', {
        santri_id: linkForm.santri_id,
        tingkatan_key: linkForm.tingkatan_key,
        kelompok_id: linkForm.kelompok_id || undefined,
      });
      toast.success('Santri berhasil didaftarkan ke PMQ');
      setIsLinkSantriOpen(false);
      fetchSiswa();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Gagal mendaftarkan santri ke PMQ');
    }
  };

  const handleEdit = (siswa) => {
    setFormData({
      nama: siswa.nama,
      gender: siswa.gender,
      tingkatan_key: siswa.tingkatan_key,
      kelompok_id: siswa.kelompok_id || '',
    });
    setEditingId(siswa.id);
    setIsCreateOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus siswa PMQ ini?')) return;
    try {
      await api.delete(`/pmq/siswa/${id}`);
      toast.success('Siswa PMQ berhasil dihapus');
      fetchSiswa();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Gagal menghapus siswa PMQ');
    }
  };

  const handleDownloadSingleQR = (s) => {
    if (!s?.qr_code) return;
    try {
      const link = document.createElement('a');
      link.href = `data:image/png;base64,${s.qr_code}`;
      link.download = `${s.nama || 'QR_Siswa_PMQ'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
      toast.error('Gagal mengunduh QR');
    }
  };

  const filteredKelompokForForm = (tingkatanKey) =>
    kelompokList.filter((k) => k.tingkatan_key === tingkatanKey);

  const getGenderLabel = (g) => {
    if (!g) return '-';
    return g === 'putra' ? 'Putra' : 'Putri';
  };

  const totalSiswa = siswaList.length;
  const totalPutra = siswaList.filter((s) => s.gender === 'putra').length;
  const totalPutri = siswaList.filter((s) => s.gender === 'putri').length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center animate-slide-in-left">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Siswa PMQ</h1>
          <p className="text-muted-foreground mt-1">Kelola siswa Pendidikan Murottilil Qur&apos;an</p>
        </div>
        <div className="flex gap-3 animate-slide-in-right items-center flex-wrap justify-end">
          <Card className="shadow-card min-w-[260px] md:min-w-[320px]">
            <CardContent className="p-5 flex items-center gap-5">
              <div>
                <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Total Siswa PMQ</p>
                <p className="text-3xl md:text-4xl font-extrabold text-foreground mt-1">{totalSiswa}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Putra: <span className="font-semibold text-foreground">{totalPutra}</span> · Putri:{' '}
                  <span className="font-semibold text-foreground">{totalPutri}</span>
                </p>
              </div>
              <div className="bg-emerald-50 text-emerald-700 p-3 rounded-2xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
          <Button
            variant="outline"
            className="hover-lift"
            onClick={() => {
              if (!siswaList.length) {
                toast.info('Tidak ada data siswa PMQ untuk diunduh');
                return;
              }
              // Gunakan data yang sudah terfilter di tabel
              downloadSiswaPMQPDF(siswaList);
            }}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={openLinkFromSantri} variant="outline" className="hover-lift">
            <Link className="w-4 h-4 mr-2" />
            Link dari Santri
          </Button>
          <Button onClick={openCreate} className="btn-ripple">
            <Plus className="w-4 h-4 mr-2" />
            Tambah Siswa Baru
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama siswa PMQ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            onBlur={fetchSiswa}
            onKeyDown={(e) => {
              if (e.key === 'Enter') fetchSiswa();
            }}
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Filter Tingkatan</Label>
          <Select
            value={filterTingkatan}
            onValueChange={(val) => {
              setFilterTingkatan(val);
              setFilterKelompok('all');
              fetchSiswa();
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Semua Tingkatan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tingkatan</SelectItem>
              {tingkatanList.map((t) => (
                <SelectItem key={t.key} value={t.key}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Filter Gender</Label>
          <Select
            value={filterGender}
            onValueChange={(val) => {
              setFilterGender(val);
              fetchSiswa();
            }}
          >
            <SelectTrigger className="mt-1">
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
          <Label className="text-xs text-muted-foreground">Filter Kelompok</Label>
          <Select
            value={filterKelompok}
            onValueChange={(val) => {
              setFilterKelompok(val);
              fetchSiswa();
            }}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Semua Kelompok" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelompok</SelectItem>
              {kelompokList
                .filter((k) => filterTingkatan === 'all' || k.tingkatan_key === filterTingkatan)
                .map((k) => {
                  const tingkatanLabel =
                    tingkatanList.find((t) => t.key === k.tingkatan_key)?.label || k.tingkatan_key;
                  return (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama} ({tingkatanLabel})
                    </SelectItem>
                  );
                })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabel */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Memuat data siswa PMQ...</div>
      ) : siswaList.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <p className="text-muted-foreground">Tidak ada siswa PMQ ditemukan</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Nama</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Gender</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Tingkatan</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Kelompok</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">NFC</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">QR</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {siswaList.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/50">
                    <td className="px-4 py-2 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <span>{s.nama}</span>
                        <span
                          className={`inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${
                            s.santri_id
                              ? 'border-blue-300 bg-blue-50 text-blue-600'
                              : 'border-emerald-300 bg-emerald-50 text-emerald-600'
                          }`}
                          title={s.santri_id ? 'Siswa link dari santri' : 'Siswa manual PMQ'}
                        >
                          {s.santri_id ? <Link2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{getGenderLabel(s.gender)}</td>
                    <td className="px-4 py-2 text-muted-foreground">{s.tingkatan_label}</td>
                    <td className="px-4 py-2 text-muted-foreground">{s.kelompok_nama || '-'}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {s.nfc_uid ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700 border border-emerald-200">
                          NFC Terdaftar
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500">Belum</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {s.qr_code ? (
                          <>
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card hover:bg-muted transition-colors"
                              onClick={() => setQrPreview({ open: true, siswa: s })}
                              title="Lihat QR"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card hover:bg-muted transition-colors"
                              onClick={() => handleDownloadSingleQR(s)}
                              title="Download QR"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">Belum ada QR</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      <div className="flex gap-2">
                        {!s.santri_id && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setNfcDialog({ open: true, siswa: s, value: s.nfc_uid || '' });
                                setTimeout(() => nfcInputRef.current?.focus(), 200);
                              }}
                            >
                              Atur NFC
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(s)}
                            >
                              Edit
                            </Button>
                          </>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 border-red-200 hover:bg-red-50"
                          onClick={() => handleDelete(s.id)}
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dialog Tambah Siswa Baru */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Siswa PMQ' : 'Tambah Siswa PMQ Baru'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nama Siswa</Label>
              <Input
                value={formData.nama}
                onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                placeholder="Nama siswa PMQ"
              />
            </div>
            <div>
              <Label>Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(val) => setFormData({ ...formData, gender: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="putra">Putra</SelectItem>
                  <SelectItem value="putri">Putri</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tingkatan PMQ</Label>
              <Select
                value={formData.tingkatan_key}
                onValueChange={(val) => {
                  setFormData({ ...formData, tingkatan_key: val, kelompok_id: '' });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tingkatan" />
                </SelectTrigger>
                <SelectContent>
                  {tingkatanList.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kelompok (Opsional)</Label>
              <Select
                value={formData.kelompok_id}
                onValueChange={(val) => setFormData({ ...formData, kelompok_id: val })}
                disabled={!formData.tingkatan_key}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelompok" />
                </SelectTrigger>
                <SelectContent>
                  {filteredKelompokForForm(formData.tingkatan_key).map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleCreate}>
              {editingId ? 'Perbarui' : 'Simpan'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Link dari Santri */}
      <Dialog open={isLinkSantriOpen} onOpenChange={setIsLinkSantriOpen}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Daftarkan Santri ke PMQ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Cari Santri</Label>
              <Input
                placeholder="Ketik nama atau NIS santri..."
                value={linkSantriSearch}
                onChange={(e) => setLinkSantriSearch(e.target.value)}
                className="mb-2"
              />
              <Label>Pilih Santri</Label>
              <Select
                value={linkForm.santri_id}
                onValueChange={(val) => setLinkForm({ ...linkForm, santri_id: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih santri" />
                </SelectTrigger>
                <SelectContent>
                  {filteredAvailableSantri.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nama} ({getGenderLabel(s.gender)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tingkatan PMQ</Label>
              <Select
                value={linkForm.tingkatan_key}
                onValueChange={(val) => setLinkForm({ ...linkForm, tingkatan_key: val, kelompok_id: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tingkatan" />
                </SelectTrigger>
                <SelectContent>
                  {tingkatanList.map((t) => (
                    <SelectItem key={t.key} value={t.key}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kelompok (Opsional)</Label>
              <Select
                value={linkForm.kelompok_id}
                onValueChange={(val) => setLinkForm({ ...linkForm, kelompok_id: val })}
                disabled={!linkForm.tingkatan_key}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kelompok" />
                </SelectTrigger>
                <SelectContent>
                  {filteredKelompokForForm(linkForm.tingkatan_key).map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleLink}>
              Daftarkan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Preview QR */}
      <Dialog open={qrPreview.open} onOpenChange={(open) => setQrPreview((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>QR Siswa PMQ</DialogTitle>
          </DialogHeader>
          {qrPreview.siswa && (
            <div className="space-y-3 text-center">
              <div>
                <p className="font-semibold text-foreground">{qrPreview.siswa.nama}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {qrPreview.siswa.santri_id ? 'Siswa Link dari Santri' : 'Siswa Manual PMQ'}
                </p>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-56 h-56 bg-white border border-border rounded-xl flex items-center justify-center overflow-hidden">
                  <img
                    src={`data:image/png;base64,${qrPreview.siswa.qr_code}`}
                    alt="QR Siswa PMQ"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => handleDownloadSingleQR(qrPreview.siswa)}
              >
                Download QR
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* NFC Dialog */}
      <Dialog open={nfcDialog.open} onOpenChange={(open) => setNfcDialog((prev) => ({ ...prev, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Atur NFC - {nfcDialog.siswa?.nama}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>NFC UID</Label>
              <Input
                ref={nfcInputRef}
                placeholder="Tempelkan kartu NFC atau ketik UID"
                value={nfcDialog.value}
                onChange={(e) => setNfcDialog((prev) => ({ ...prev, value: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (nfcDialog.siswa) {
                      api
                        .put(`/pmq/siswa/${nfcDialog.siswa.id}`, { nfc_uid: nfcDialog.value.trim() || '' })
                        .then(() => {
                          toast.success('NFC berhasil disimpan');
                          setNfcDialog({ open: false, siswa: null, value: '' });
                          fetchSiswa();
                        })
                        .catch((error) => {
                          toast.error(error.response?.data?.detail || 'Gagal menyimpan NFC');
                        });
                    }
                  }
                }}
              />
              <p className="text-xs text-muted-foreground mt-2">
                USB NFC Reader akan mengetik UID otomatis ke kolom ini.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  if (nfcDialog.siswa) {
                    api
                      .put(`/pmq/siswa/${nfcDialog.siswa.id}`, { nfc_uid: nfcDialog.value.trim() || '' })
                      .then(() => {
                        toast.success('NFC berhasil disimpan');
                        setNfcDialog({ open: false, siswa: null, value: '' });
                        fetchSiswa();
                      })
                      .catch((error) => {
                        toast.error(error.response?.data?.detail || 'Gagal menyimpan NFC');
                      });
                  }
                }}
              >
                Simpan NFC
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (nfcDialog.siswa) {
                    api
                      .put(`/pmq/siswa/${nfcDialog.siswa.id}`, { nfc_uid: '' })
                      .then(() => {
                        toast.success('NFC dihapus');
                        setNfcDialog({ open: false, siswa: null, value: '' });
                        fetchSiswa();
                      })
                      .catch((error) => {
                        toast.error(error.response?.data?.detail || 'Gagal menghapus NFC');
                      });
                  }
                }}
              >
                Hapus NFC
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default SiswaPMQ;
