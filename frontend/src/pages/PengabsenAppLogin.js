import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePengabsenAuth } from '@/contexts/PengabsenAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, KeyRound, QrCode } from 'lucide-react';

const PengabsenAppLogin = () => {
  const [username, setUsername] = useState('');
  const [kodeAkses, setKodeAkses] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = usePengabsenAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/pengabsen-app');
    }
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(username, kodeAkses);
    setLoading(false);

    if (result.success) {
      toast({
        title: 'Login Berhasil',
        description: 'Selamat datang di aplikasi Pengabsen',
      });
      navigate('/pengabsen-app');
    } else {
      toast({
        title: 'Login Gagal',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
        <div className="animate-pulse text-primary-700">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex flex-col" data-testid="pengabsen-login-page">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="grid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="1" fill="currentColor" className="text-primary-700"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)"/>
        </svg>
      </div>

      <div className="relative flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-primary-700 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-700/30">
              <QrCode className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">Pengabsen</h1>
            <p className="text-muted-foreground mt-2">Aplikasi Pencatat Absensi Sholat</p>
          </div>

          {/* Login Card */}
          <div className="bg-card rounded-2xl shadow-card border border-border/50 p-8">
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
                    placeholder="Username Pengabsen"
                    required
                    data-testid="pengabsen-login-username"
                    className="pl-10 h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kodeAkses" className="text-sm font-medium">Kode Akses</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="kodeAkses"
                    type="text"
                    inputMode="numeric"
                    value={kodeAkses}
                    onChange={(e) => setKodeAkses(e.target.value.replace(/\D/g, '').slice(0, 9))}
                    placeholder="9 digit kode akses"
                    required
                    maxLength={9}
                    data-testid="pengabsen-login-kode-akses"
                    className="pl-10 h-12 font-mono tracking-wider"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Kode akses diberikan oleh Admin</p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-primary-700 hover:bg-primary-800 active:scale-[0.98] transition-all" 
                disabled={loading} 
                data-testid="pengabsen-login-submit"
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
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            Sistem Absensi Sholat Pesantren
          </p>
        </div>
      </div>
    </div>
  );
};

export default PengabsenAppLogin;
