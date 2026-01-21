import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePengabsenAuth } from '@/contexts/PengabsenAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-sky-100">
        <div className="text-gray-500">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-sky-100 p-4" data-testid="pengabsen-login-page">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📱</div>
          <h1 className="text-2xl font-bold text-gray-800">Absensi Sholat</h1>
          <p className="text-gray-600 mt-1">Aplikasi Pengabsen</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username Pengabsen"
              required
              data-testid="pengabsen-login-username"
            />
          </div>
          <div>
            <Label htmlFor="kodeAkses">Kode Akses</Label>
            <Input
              id="kodeAkses"
              type="text"
              inputMode="numeric"
              value={kodeAkses}
              onChange={(e) => setKodeAkses(e.target.value.replace(/\D/g, '').slice(0, 9))}
              placeholder="Masukkan 9 digit kode akses"
              required
              maxLength={9}
              data-testid="pengabsen-login-kode-akses"
            />
            <p className="text-xs text-gray-500 mt-1">Kode akses diberikan oleh Admin</p>
          </div>
          <Button type="submit" className="w-full" disabled={loading} data-testid="pengabsen-login-submit">
            {loading ? 'Memproses...' : 'Login'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PengabsenAppLogin;
