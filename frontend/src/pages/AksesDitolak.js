import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

const AksesDitolak = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl shadow-card p-8 text-center animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
          <Lock className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Akses Ditolak</h1>
        <p className="text-muted-foreground mb-6">
          Anda tidak memiliki hak akses untuk membuka halaman ini.
          Jika menurut Anda ini adalah kesalahan, silakan hubungi Super Admin.
        </p>
        <Button
          className="w-full"
          onClick={() => navigate('/dashboard')}
        >
          Kembali ke Dashboard
        </Button>
      </div>
    </div>
  );
};

export default AksesDitolak;
