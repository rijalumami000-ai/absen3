import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePengabsenKelasAuth } from '@/contexts/PengabsenKelasAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, LogIn, GraduationCap } from 'lucide-react';

const PengabsenKelasAppLogin = () => {
  const [username, setUsername] = useState('');
  const [kodeAkses, setKodeAkses] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = usePengabsenKelasAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(username, kodeAkses);

    if (result.success) {
      toast.success('Login berhasil!');
      navigate('/pengabsen-kelas-app');
    } else {
      toast.error(result.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-xl mb-4">
            <GraduationCap className="w-10 h-10 text-primary-700" />
          </div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Pengabsen Kelas
          </h1>
          <p className="text-primary-100">Madrasah Diniyah</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="username" className="text-foreground">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Masukkan username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-2"
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="kode_akses" className="text-foreground">Kode Akses</Label>
              <Input
                id="kode_akses"
                type="text"
                placeholder="9 digit kode akses"
                value={kodeAkses}
                onChange={(e) => setKodeAkses(e.target.value)}
                required
                className="mt-2"
                disabled={loading}
                maxLength={9}
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2" />
                  Masuk
                </>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-primary-100 text-sm">
            Aplikasi Absensi Madrasah Diniyah
          </p>
        </div>
      </div>
    </div>
  );
};

export default PengabsenKelasAppLogin;
