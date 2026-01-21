import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWaliAuth } from '@/contexts/WaliAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, Heart } from 'lucide-react';

const WaliAppLogin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useWaliAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/wali-app');
    }
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(username, password);
      toast({ title: 'Sukses', description: 'Login berhasil' });
      navigate('/wali-app');
    } catch (error) {
      toast({
        title: 'Login Gagal',
        description: error.response?.data?.detail || 'Username atau password salah',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-50 to-secondary-100">
        <div className="animate-pulse text-secondary-700">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-secondary-100 flex flex-col" data-testid="wali-login-page">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="grid-wali" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="5" cy="5" r="1" fill="currentColor" className="text-secondary-700"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid-wali)"/>
        </svg>
      </div>

      <div className="relative flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-secondary-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-secondary-600/30">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground">Wali Santri</h1>
            <p className="text-muted-foreground mt-2">Pantau kehadiran sholat putra/putri Anda</p>
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
                    placeholder="Username Wali"
                    required
                    data-testid="wali-login-username"
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
                    placeholder="Password"
                    required
                    data-testid="wali-login-password"
                    className="pl-10 h-12"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Password default: 12345</p>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold bg-secondary-600 hover:bg-secondary-700 active:scale-[0.98] transition-all" 
                disabled={loading}
                data-testid="wali-login-submit"
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

export default WaliAppLogin;
