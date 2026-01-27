import React, { useState, useEffect } from 'react';
import { absensiAPI, santriAPI, madinAbsensiAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [totalSantri, setTotalSantri] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [statsRes, santriRes] = await Promise.all([
        absensiAPI.getStats(today),
        santriAPI.getAll({})
      ]);
      
      setStats(statsRes.data);
      setTotalSantri(santriRes.data.length);
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
      title: 'Total Santri',
      value: totalSantri,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Hadir Hari Ini',
      value: stats?.hadir || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Alfa Hari Ini',
      value: stats?.alfa || 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Total Absensi Hari Ini',
      value: stats?.total || 0,
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
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
        <Card className="card-hover animate-fade-in transition-smooth" style={{ animationDelay: '100ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-green-700" />
              </div>
              Statistik Kehadiran Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl hover-lift transition-smooth">
                <span className="text-sm font-medium text-gray-700">Hadir</span>
                <span className="text-lg font-bold text-green-700">{stats?.hadir || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl hover-lift transition-smooth">
                <span className="text-sm font-medium text-gray-700">Alfa</span>
                <span className="text-lg font-bold text-red-700">{stats?.alfa || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl hover-lift transition-smooth">
                <span className="text-sm font-medium text-gray-700">Sakit</span>
                <span className="text-lg font-bold text-yellow-700">{stats?.sakit || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl hover-lift transition-smooth">
                <span className="text-sm font-medium text-gray-700">Izin</span>
                <span className="text-lg font-bold text-blue-700">{stats?.izin || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-xl hover-lift transition-smooth">
                <span className="text-sm font-medium text-gray-700">Haid</span>
                <span className="text-lg font-bold text-purple-700">{stats?.haid || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-pink-50 rounded-xl hover-lift transition-smooth">
                <span className="text-sm font-medium text-gray-700">Istihadhoh</span>
                <span className="text-lg font-bold text-pink-700">{stats?.istihadhoh || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

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
