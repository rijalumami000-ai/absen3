import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100" data-testid="login-page">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🕌</div>
          <h1 className="text-2xl font-bold text-gray-800">Absensi Sholat</h1>
          <p className="text-gray-600 mt-2">Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              required
              data-testid="username-input"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              data-testid="password-input"
              className="mt-1"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
            data-testid="login-button"
          >
            {loading ? 'Memproses...' : 'Login'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Default: admin / admin123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
