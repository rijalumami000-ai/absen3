import React, { useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, QrCode, ShieldCheck } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const LOGO_AL_HAMID = 'https://customer-assets.emergentagent.com/job_pesantren-app-3/artifacts/443f4wsk_Logo%20Al%20Hamid.jpg';
const LOGO_YAYASAN = 'https://customer-assets.emergentagent.com/job_pesantren-app-3/artifacts/l73l3ek6_LOGO%20YAYASAN.png';

const PengabsenPortal = () => {
  const [instansi, setInstansi] = useState('');
  const [username, setUsername] = useState('');
  const [kodeAkses, setKodeAkses] = useState('');
  const [showKode, setShowKode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ instansi: '', username: '', kode: '' });
  const { toast } = useToast();
  const navigate = useNavigate();

  const instansiOptions = useMemo(
    () => [
      { value: 'pesantren', label: 'Pesantren Alhamid', route: '/pengabsen-app', tokenKey: 'pengabsen_token' },
      { value: 'madin', label: 'Madrasah Diniyah', route: '/pengabsen-kelas-app', tokenKey: 'pengabsen_kelas_token' },
      { value: 'pmq', label: "Pendidikan Murottilil Qur'an (PMQ)", route: '/pengabsen-pmq-app', tokenKey: 'pengabsen_pmq_token' },
      { value: 'aliyah', label: 'Madrasah Aliyah Islamiyah', route: '/pengabsen-aliyah-app', tokenKey: 'pengabsen_aliyah_token' },
    ],
    []
  );

  const selectedInstansi = instansiOptions.find((opt) => opt.value === instansi);

  const clearErrors = () => {
    setFormError('');
    setFieldErrors({ instansi: '', username: '', kode: '' });
  };

  const validate = () => {
    const nextErrors = { instansi: '', username: '', kode: '' };
    if (!instansi) {
      nextErrors.instansi = 'Pilih instansi terlebih dahulu.';
    }
    if (!username.trim()) {
      nextErrors.username = 'Username wajib diisi.';
    }
    if (!kodeAkses.trim()) {
      nextErrors.kode = 'Kode akses wajib diisi.';
    }
    setFieldErrors(nextErrors);
    return !nextErrors.instansi && !nextErrors.username && !nextErrors.kode;
  };

  const handleInstansiChange = (value) => {
    setInstansi(value);
    setFormError('');
    setFieldErrors((prev) => ({ ...prev, instansi: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearErrors();
    if (!validate()) {
      toast({
        title: 'Form belum lengkap',
        description: 'Mohon lengkapi semua data terlebih dahulu.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      let response;
      if (instansi === 'pesantren') {
        response = await axios.post(`${API_URL}/api/pengabsen/login`, { username, kode_akses: kodeAkses });
      } else if (instansi === 'madin') {
        response = await axios.post(`${API_URL}/api/pengabsen-kelas/login`, { username, kode_akses: kodeAkses });
      } else if (instansi === 'pmq') {
        response = await axios.post(`${API_URL}/api/pmq/pengabsen/login`, { username, kode_akses: kodeAkses });
      } else if (instansi === 'aliyah') {
        response = await axios.post(`${API_URL}/api/aliyah/pengabsen/login`, { username, kode_akses: kodeAkses });
      }

      const { access_token, user } = response.data;
      if (selectedInstansi?.tokenKey) {
        localStorage.setItem(selectedInstansi.tokenKey, access_token);
      }
      if (instansi === 'madin' && user) {
        localStorage.setItem('pengabsen_kelas_user', JSON.stringify(user));
      }

      toast({ title: 'Login berhasil', description: `Selamat datang, ${selectedInstansi?.label}` });
      navigate(selectedInstansi?.route || '/pengabsen-app');
    } catch (error) {
      const message = error.response?.data?.detail || 'Username atau kode akses tidak dikenal.';
      setFormError(message);
      toast({ title: 'Login gagal', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex flex-col"
      data-testid="pengabsen-portal-page"
    >
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-emerald-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-10" data-testid="pengabsen-portal-header">
            <div className="flex items-center justify-center gap-3 flex-wrap mb-6" data-testid="pengabsen-portal-logos">
              {[{ src: LOGO_AL_HAMID, alt: 'Logo Al Hamid' }, { src: LOGO_YAYASAN, alt: 'Logo Yayasan' }].map(
                (logo, idx) => (
                  <div
                    key={logo.alt}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border border-emerald-100 bg-white/70 backdrop-blur shadow-lg flex items-center justify-center p-2"
                    data-testid={`pengabsen-portal-logo-frame-${idx}`}
                  >
                    <img
                      src={logo.src}
                      alt={logo.alt}
                      className="w-full h-full object-contain mix-blend-multiply"
                      data-testid={`pengabsen-portal-logo-${idx}`}
                    />
                  </div>
                )
              )}
            </div>
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/80 border border-emerald-100 shadow-sm mb-5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-semibold text-emerald-700">Portal Resmi Pengabsen</span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-900" data-testid="pengabsen-portal-title">
              Aplikasi Pengabsen Santri dan Siswa
            </h1>
            <p className="text-lg text-slate-600 mt-3" data-testid="pengabsen-portal-subtitle">
              Allhamid x Mathlaul Anwar
            </p>
            <p className="text-sm text-slate-500" data-testid="pengabsen-portal-subtitle-location">
              Cintamulya, Candipuro, Lampung Selatan
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">
            <div className="bg-white/80 backdrop-blur rounded-3xl border border-slate-100 shadow-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg">
                  <QrCode className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-emerald-600 font-semibold">Langkah 1</p>
                  <h2 className="text-lg font-semibold text-slate-900">Masuk sebagai pengabsen?</h2>
                </div>
              </div>
              <Label className="text-sm">Pilih instansi</Label>
              <Select value={instansi} onValueChange={handleInstansiChange}>
                <SelectTrigger className="mt-2" data-testid="pengabsen-portal-instansi-select">
                  <SelectValue placeholder="Pilih instansi" />
                </SelectTrigger>
                <SelectContent>
                  {instansiOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value} data-testid={`pengabsen-portal-instansi-${opt.value}`}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.instansi && (
                <p className="text-xs text-red-600 mt-2" data-testid="pengabsen-portal-instansi-error">
                  {fieldErrors.instansi}
                </p>
              )}

              <div className="mt-6 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 p-4 text-sm text-emerald-700">
                Pilih instansi terlebih dahulu untuk membuka form login sesuai jalur aplikasi.
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-semibold">Langkah 2</p>
                  <h2 className="text-lg font-semibold text-slate-900">Login Pengabsen</h2>
                  <p className="text-xs text-slate-500">
                    {selectedInstansi ? selectedInstansi.label : 'Pilih instansi terlebih dahulu'}
                  </p>
                </div>
              </div>

              {!selectedInstansi ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-6 text-sm text-slate-500" data-testid="pengabsen-portal-empty-form">
                  Form login akan muncul setelah Anda memilih instansi pengabsen.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" data-testid="pengabsen-portal-form">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm">
                      Username
                    </Label>
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan username"
                      data-testid="pengabsen-portal-username-input"
                    />
                    {fieldErrors.username && (
                      <p className="text-xs text-red-600" data-testid="pengabsen-portal-username-error">
                        {fieldErrors.username}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="kodeAkses" className="text-sm">
                      Kode Akses
                    </Label>
                    <div className="relative">
                      <Input
                        id="kodeAkses"
                        type={showKode ? 'text' : 'password'}
                        inputMode="numeric"
                        value={kodeAkses}
                        onChange={(e) => setKodeAkses(e.target.value.replace(/\D/g, '').slice(0, 9))}
                        placeholder="Masukkan kode akses"
                        data-testid="pengabsen-portal-kode-input"
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowKode((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        data-testid="pengabsen-portal-toggle-kode"
                      >
                        {showKode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {fieldErrors.kode && (
                      <p className="text-xs text-red-600" data-testid="pengabsen-portal-kode-error">
                        {fieldErrors.kode}
                      </p>
                    )}
                  </div>

                  {formError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600" data-testid="pengabsen-portal-form-error">
                      {formError}
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full h-11 text-base font-semibold"
                    disabled={loading}
                    data-testid="pengabsen-portal-submit"
                  >
                    {loading ? 'Memproses...' : 'Masuk'}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PengabsenPortal;