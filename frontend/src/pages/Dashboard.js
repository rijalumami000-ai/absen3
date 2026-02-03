import React, { useState, useEffect } from 'react';
import api, { absensiAPI, santriAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [totalSantri, setTotalSantri] = useState(0);
  const [totalSiswaMadin, setTotalSiswaMadin] = useState(0);
  const [totalSiswaAliyah, setTotalSiswaAliyah] = useState(0);
  const [totalSiswaPMQ, setTotalSiswaPMQ] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [statsRes, santriRes, siswaMadinRes, siswaAliyahRes, siswaPMQRes] = await Promise.all([
        absensiAPI.getStats({ tanggal_start: today, tanggal_end: today }),
        santriAPI.getAll({}),
        api.get('/siswa-madrasah'),
        api.get('/aliyah/siswa'),
        api.get('/pmq/siswa'),
      ]);

      setStats(statsRes.data);
      setTotalSantri(santriRes.data.length);
      setTotalSiswaMadin(siswaMadinRes.data.length || 0);
      setTotalSiswaAliyah(siswaAliyahRes.data.length || 0);
      setTotalSiswaPMQ(siswaPMQRes.data.length || 0);
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Memuat data...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Santri Pesantren',
      value: totalSantri,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Siswa Madrasah Diniyah',
      value: totalSiswaMadin,
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Total Siswa Madrasah Aliyah',
      value: totalSiswaAliyah,
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      title: 'Kartu 4',
      value: '-',
      icon: Users,
      color: 'text-gray-500',
      bgColor: 'bg-gray-50',
      subtitle: 'Belum digunakan',
    },
  ];

  return (
    <div data-testid="dashboard-page" className="animate-fade-in">
      <div className="mb-8 animate-slide-in-left">
        <h1 className="text-3xl font-bold text-gray-800 font-display">Dashboard</h1>
        <p className="text-gray-600 mt-2">Selamat datang di Admin Panel Absensi Santri Dan Siswa</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card 
              key={index} 
              data-testid={`stat-card-${index}`}
              className="card-hover transition-smooth animate-scale-in shadow-card hover:shadow-card-hover"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                    {stat.subtitle && (
                      <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                    )}
                  </div>
                  <div className={`${stat.bgColor} ${stat.color} p-3 rounded-lg transition-transform hover:scale-110 transition-smooth`}>
                    <Icon size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Kartu Statistik Hari ini dihapus sesuai permintaan, hanya menyisakan Informasi Sistem */}

        <Card className="card-hover animate-fade-in transition-smooth" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-700" />
              </div>
              Informasi Sistem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Tanggal</p>
                <p className="text-lg font-semibold text-gray-800">
                  {new Date().toLocaleDateString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Lokasi</p>
                <p className="text-lg font-semibold text-gray-800">Lampung Selatan</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status Sistem</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-lg font-semibold text-green-700">Aktif</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
