import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, User } from 'lucide-react';

const Login = () => {
  const LOGO_AL_HAMID = 'https://customer-assets.emergentagent.com/job_pesantren-app-3/artifacts/443f4wsk_Logo%20Al%20Hamid.jpg';
  const LOGO_YAYASAN = 'https://customer-assets.emergentagent.com/job_pesantren-app-3/artifacts/l73l3ek6_LOGO%20YAYASAN.png';
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      toast({
        title: "Login Berhasil",
        description: "Selamat datang di Admin Panel",
      });
      navigate('/dashboard');
    } else {
      toast({
        title: "Login Gagal",
        description: result.error,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left Side - Decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 relative overflow-hidden">
        {/* Decorative Pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id="islamic-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="10" cy="10" r="8" fill="none" stroke="white" strokeWidth="0.5"/>
              <circle cx="0" cy="0" r="3" fill="white"/>
              <circle cx="20" cy="0" r="3" fill="white"/>
              <circle cx="0" cy="20" r="3" fill="white"/>
              <circle cx="20" cy="20" r="3" fill="white"/>
            </pattern>
            <rect width="100%" height="100%" fill="url(#islamic-pattern)"/>
          </svg>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6" data-testid="login-logos">
              {[
                {
                  src: LOGO_AL_HAMID,
                  alt: 'Logo Pondok Al-Hamid',
                  frameClass: 'bg-transparent border-white/40 overflow-hidden',
                  imgClass: 'scale-110',
                },
                {
                  src: LOGO_YAYASAN,
                  alt: 'Logo Yayasan',
                  frameClass: 'bg-white/80 border-white/30',
                  imgClass: '',
                },
              ].map((logo, idx) => (
                <div
                  key={logo.alt}
                  className={`w-20 h-20 rounded-2xl backdrop-blur border flex items-center justify-center p-2 shadow-lg ${logo.frameClass}`}
                  data-testid={`login-logo-frame-${idx}`}
                >
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    className={`w-full h-full object-contain mix-blend-multiply ${logo.imgClass}`}
                    data-testid={`login-logo-${idx}`}
                  />
                </div>
              ))}
            </div>
            <h1 className="font-display text-4xl font-bold mb-4">
              Master Absensi Santri &amp; Siswa
            </h1>
            <p className="text-white/80 text-lg leading-relaxed">
              Sistem manajemen absensi modern untuk pesantren dan sekolah. Memudahkan pencatatan, monitoring, dan pelaporan kehadiran santri &amp; siswa. Di lingkungan Pondok Pesantren Al-Hamid Cintamulya &amp; Satuan Pendidikan di Mathlaul Anwar Cintamulya.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-white/70">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <span>Scan QR untuk absensi cepat</span>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <span>Notifikasi real-time untuk wali santri</span>
            </div>
            <div className="flex items-center gap-3 text-white/70">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <span>Laporan statistik lengkap</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4" data-testid="login-logos-mobile">
              {[
                {
                  src: LOGO_AL_HAMID,
                  alt: 'Logo Pondok Al-Hamid',
                  frameClass: 'bg-transparent border-border/60 overflow-hidden',
                  imgClass: 'scale-110',
                },
                {
                  src: LOGO_YAYASAN,
                  alt: 'Logo Yayasan',
                  frameClass: 'bg-white border-border/60',
                  imgClass: '',
                },
              ].map((logo, idx) => (
                <div
                  key={logo.alt}
                  className={`w-16 h-16 rounded-2xl border flex items-center justify-center p-2 shadow-sm ${logo.frameClass}`}
                  data-testid={`login-logo-mobile-frame-${idx}`}
                >
                  <img
                    src={logo.src}
                    alt={logo.alt}
                    className={`w-full h-full object-contain mix-blend-multiply ${logo.imgClass}`}
                    data-testid={`login-logo-mobile-${idx}`}
                  />
                </div>
              ))}
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Master Absensi Santri &amp; Siswa</h1>
          </div>

          <div className="bg-card rounded-2xl shadow-card p-8 border border-border/50">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl font-bold text-foreground">Selamat Datang</h2>
              <p className="text-muted-foreground mt-2">Masuk ke panel administrasi</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    required
                    data-testid="username-input"
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    required
                    data-testid="password-input"
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-semibold bg-primary-700 hover:bg-primary-800 active:scale-[0.98] transition-all"
                disabled={loading}
                data-testid="login-button"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Memproses...
                  </span>
                ) : 'Masuk'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-center text-xs text-muted-foreground">
                Jika lupa akses, silakan hubungi Super Admin.
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Master Absensi Santri &amp; Siswa &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
