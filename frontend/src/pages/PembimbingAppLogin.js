import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePembimbingAuth } from '@/contexts/PembimbingAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const PembimbingAppLogin = () => {
  const [username, setUsername] = useState('');
  const [kodeAkses, setKodeAkses] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = usePembimbingAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/pembimbing-app');
    }
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(username, kodeAkses);
      toast({ title: 'Sukses', description: 'Login berhasil' });
      navigate('/pembimbing-app');
    } catch (error) {
      toast({
        title: 'Login Gagal',
        description: error.response?.data?.detail || 'Username atau kode akses salah',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
        <div className="text-gray-500">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">👨‍🏫</div>
            <h1 className="text-2xl font-bold text-gray-800">Absensi Sholat</h1>
            <p className="text-gray-500 text-sm mt-1">Aplikasi Pembimbing</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Username Pembimbing"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                data-testid="pembimbing-login-username"
              />
            </div>
            <div>
              <Label htmlFor="kodeAkses">Kode Akses</Label>
              <Input
                id="kodeAkses"
                type="text"
                inputMode="numeric"
                placeholder="Masukkan 9 digit kode akses"
                value={kodeAkses}
                onChange={(e) => setKodeAkses(e.target.value.replace(/\D/g, '').slice(0, 9))}
                required
                maxLength={9}
                data-testid="pembimbing-login-kode-akses"
              />
              <p className="text-xs text-gray-500 mt-1">Kode akses diberikan oleh Admin</p>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
              data-testid="pembimbing-login-submit"
            >
              {loading ? 'Memproses...' : 'Login'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PembimbingAppLogin;
