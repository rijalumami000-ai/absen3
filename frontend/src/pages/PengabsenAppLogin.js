import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePengabsenAuth } from '@/contexts/PengabsenAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const PengabsenAppLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = usePengabsenAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(username, password);
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-sky-100" data-testid="pengabsen-login-page">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">📱</div>
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
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Memproses...' : 'Login'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PengabsenAppLogin;
