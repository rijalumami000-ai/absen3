import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePengabsenPMQAuth } from '@/contexts/PengabsenPMQAuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const PengabsenPMQAppLogin = () => {
  const { login, loading } = usePengabsenPMQAuth();
  const [username, setUsername] = useState('');
  const [kodeAkses, setKodeAkses] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await login(username, kodeAkses);
    setSubmitting(false);
    if (res.success) {
      navigate('/pengabsen-pmq-app', { replace: true });
    } else {
      setError(res.error || 'Login gagal');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Memuat...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg text-center">Login Pengabsen PMQ</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Username</label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Kode Akses</label>
              <Input
                value={kodeAkses}
                onChange={(e) => setKodeAkses(e.target.value)}
                placeholder="Masukkan kode akses"
                required
              />
            </div>
            {error && <div className="text-xs text-red-500">{error}</div>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PengabsenPMQAppLogin;
