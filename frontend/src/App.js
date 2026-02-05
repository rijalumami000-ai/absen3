import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { AppSettingsProvider } from '@/contexts/AppSettingsContext';
import { Toaster } from '@/components/ui/sonner';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Asrama from '@/pages/Asrama';
import Santri from '@/pages/Santri';
import WaliSantri from '@/pages/WaliSantri';
import Pengabsen from '@/pages/Pengabsen';
import Pembimbing from '@/pages/Pembimbing';
import Absensi from '@/pages/Absensi';
import WaktuSholat from '@/pages/WaktuSholat';
import Settings from '@/pages/Settings';
import Kelas from '@/pages/Kelas';
import MadrasahDiniyah from '@/pages/MadrasahDiniyah';
import KelasAliyah from '@/pages/KelasAliyah';
import SiswaAliyah from '@/pages/SiswaAliyah';
import RiwayatAbsensiMadin from '@/pages/RiwayatAbsensiMadin';
import PengabsenKelas from '@/pages/PengabsenKelas';
import AksesDitolak from '@/pages/AksesDitolak';
import PembimbingKelas from '@/pages/PembimbingKelas';
import PengabsenAliyah from '@/pages/PengabsenAliyah';
import MonitoringAliyah from '@/pages/MonitoringAliyah';
import RiwayatAbsensiAliyah from '@/pages/RiwayatAbsensiAliyah';
import SiswaPMQ from '@/pages/SiswaPMQ';
import TingkatanPMQ from '@/pages/TingkatanPMQ';
import PengabsenPMQ from '@/pages/PengabsenPMQ';
import RiwayatAbsensiPMQ from '@/pages/RiwayatAbsensiPMQ';
import SettingWaktuPMQ from '@/pages/SettingWaktuPMQ';
import PengabsenAliyahApp from '@/pages/PengabsenAliyahApp';
import MonitoringAliyahApp from '@/pages/MonitoringAliyahApp';
import MonitoringAliyahAppLogin from '@/pages/MonitoringAliyahAppLogin';
import PengabsenPMQApp from '@/pages/PengabsenPMQApp';
import SettingAplikasiAliyah from '@/pages/SettingAplikasiAliyah';
import SettingJamPagiAliyah from '@/pages/SettingJamPagiAliyah';
import PengabsenKelasApp from '@/pages/PengabsenKelasApp';
import MonitoringKelasAppLogin from '@/pages/MonitoringKelasAppLogin';
import MonitoringKelasApp from '@/pages/MonitoringKelasApp';
import PengabsenApp from '@/pages/PengabsenApp';
import PengabsenPortal from '@/pages/PengabsenPortal';
import { PengabsenAuthProvider, usePengabsenAuth } from '@/contexts/PengabsenAuthContext';
import WaliAppLogin from '@/pages/WaliAppLogin';
import WaliApp from '@/pages/WaliApp';
import { WaliAuthProvider, useWaliAuth } from '@/contexts/WaliAuthContext';
import PembimbingAppLogin from '@/pages/PembimbingAppLogin';
import PembimbingApp from '@/pages/PembimbingApp';
import { PembimbingAuthProvider, usePembimbingAuth } from '@/contexts/PembimbingAuthContext';
import { PengabsenKelasAuthProvider, usePengabsenKelasAuth } from '@/contexts/PengabsenKelasAuthContext';
import { PembimbingKelasAuthProvider, usePembimbingKelasAuth } from '@/contexts/PembimbingKelasAuthContext';
import { PengabsenAliyahAuthProvider, usePengabsenAliyahAuth } from '@/contexts/PengabsenAliyahAuthContext';
import { MonitoringAliyahAuthProvider, useMonitoringAliyahAuth } from '@/contexts/MonitoringAliyahAuthContext';
import { PengabsenPMQAuthProvider, usePengabsenPMQAuth } from '@/contexts/PengabsenPMQAuthContext';
import '@/App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Guard berbasis role untuk URL sensitif akan di-handle di dalam halaman / layout.
  // Jika dibutuhkan, di sini kita bisa tambahkan pengecekan global.

  return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Memuat...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

const PengabsenProtectedRoute = ({ children }) => {
  const { user, loading } = usePengabsenAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/pengabsen-portal" replace />;
  }

  return children;
};

const WaliProtectedRoute = ({ children }) => {
  const { user, loading } = useWaliAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/wali-app/login" replace />;
  }

  return children;
};

const PembimbingProtectedRoute = ({ children }) => {
  const { user, loading } = usePembimbingAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/pembimbing-app/login" replace />;
  }

  return children;
};

const PengabsenKelasProtectedRoute = ({ children }) => {
  const { user, loading } = usePengabsenKelasAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/pengabsen-portal" replace />;
  }

  return children;
};

const PembimbingKelasProtectedRoute = ({ children }) => {
  const { user, loading } = usePembimbingKelasAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/monitoring-kelas-app/login" replace />;
  }

  return children;
};

const PengabsenAliyahProtectedRoute = ({ children }) => {
  const { user, loading } = usePengabsenAliyahAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/pengabsen-portal" replace />;
  }

  return children;
};

const MonitoringAliyahProtectedRoute = ({ children }) => {
  const { user, loading } = useMonitoringAliyahAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/monitoring-aliyah-app/login" replace />;
  }

  return children;
};

const PengabsenPMQProtectedRoute = ({ children }) => {
  const { user, loading } = usePengabsenPMQAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/pengabsen-portal" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* PWA Routes - PRIORITAS PERTAMA */}
      <Route path="/pengabsen-portal" element={<PengabsenPortal />} />
      <Route path="/pengabsen-app/login" element={<Navigate to="/pengabsen-portal" replace />} />
      <Route
        path="/pengabsen-app"
        element={
          <PengabsenAuthProvider>
            <PengabsenProtectedRoute>
              <PengabsenApp />
            </PengabsenProtectedRoute>
          </PengabsenAuthProvider>
        }
      />
      <Route
        path="/wali-app/login"
        element={
          <WaliAuthProvider>
            <WaliAppLogin />
          </WaliAuthProvider>
        }
      />
      <Route
        path="/wali-app"
        element={
          <WaliAuthProvider>
            <WaliProtectedRoute>
              <WaliApp />
            </WaliProtectedRoute>
          </WaliAuthProvider>
        }
      />
      <Route
        path="/pembimbing-app/login"
        element={
          <PembimbingAuthProvider>
            <PembimbingAppLogin />
          </PembimbingAuthProvider>
        }
      />
      <Route
        path="/pembimbing-app"
        element={
          <PembimbingAuthProvider>
            <PembimbingProtectedRoute>
              <PembimbingApp />
            </PembimbingProtectedRoute>
          </PembimbingAuthProvider>
        }
      />
      <Route
        path="/pengabsen-kelas-app/login"
        element={
          <PengabsenKelasAuthProvider>
            <PengabsenKelasAppLogin />
          </PengabsenKelasAuthProvider>
        }
      />
      <Route
        path="/pengabsen-kelas-app"
        element={
          <PengabsenKelasAuthProvider>
            <PengabsenKelasProtectedRoute>
              <PengabsenKelasApp />
            </PengabsenKelasProtectedRoute>
          </PengabsenKelasAuthProvider>
        }
      />
      <Route
        path="/monitoring-kelas-app/login"
        element={
          <PembimbingKelasAuthProvider>
            <MonitoringKelasAppLogin />
          </PembimbingKelasAuthProvider>
        }
      />
      <Route
        path="/monitoring-kelas-app"
        element={
          <PembimbingKelasAuthProvider>
            <PembimbingKelasProtectedRoute>
              <MonitoringKelasApp />
            </PembimbingKelasProtectedRoute>
          </PembimbingKelasAuthProvider>
        }
      />
      <Route
        path="/pengabsen-aliyah-app/login"
        element={
          <PengabsenAliyahAuthProvider>
            <PengabsenAliyahAppLogin />
          </PengabsenAliyahAuthProvider>
        }
      />
      <Route
        path="/pengabsen-aliyah-app"
        element={
          <PengabsenAliyahAuthProvider>
            <PengabsenAliyahProtectedRoute>
              <PengabsenAliyahApp />
            </PengabsenAliyahProtectedRoute>
          </PengabsenAliyahAuthProvider>
        }
      />
      <Route
        path="/monitoring-aliyah-app/login"
        element={
          <MonitoringAliyahAuthProvider>
            <MonitoringAliyahAppLogin />
          </MonitoringAliyahAuthProvider>
        }
      />
      <Route
        path="/monitoring-aliyah-app"
        element={
          <MonitoringAliyahAuthProvider>
            <MonitoringAliyahProtectedRoute>
              <MonitoringAliyahApp />
            </MonitoringAliyahProtectedRoute>
          </MonitoringAliyahAuthProvider>
        }
      />
      <Route
        path="/pengabsen-pmq-app/login"
        element={
          <PengabsenPMQAuthProvider>
            <PengabsenPMQAppLogin />
          </PengabsenPMQAuthProvider>
        }
      />
      <Route
        path="/pengabsen-pmq-app"
        element={
          <PengabsenPMQAuthProvider>
            <PengabsenPMQProtectedRoute>
              <PengabsenPMQApp />
            </PengabsenPMQProtectedRoute>
          </PengabsenPMQAuthProvider>
        }
      />
      
      {/* Admin Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/asrama"
        element={
          <ProtectedRoute>
            <Asrama />
          </ProtectedRoute>
        }
      />
      <Route
        path="/santri"
        element={
          <ProtectedRoute>
            <Santri />
          </ProtectedRoute>
        }
      />
      <Route
        path="/wali"
        element={
          <ProtectedRoute>
            <WaliSantri />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pengabsen"
        element={
          <ProtectedRoute>
            <Pengabsen />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pembimbing"
        element={
          <ProtectedRoute>
            <Pembimbing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/absensi"
        element={
          <ProtectedRoute>
            <Absensi />
          </ProtectedRoute>
        }
      />
      <Route
        path="/waktu-sholat"
        element={
          <ProtectedRoute>
            <WaktuSholat />
          </ProtectedRoute>
        }
      />
      <Route
        path="/kelas"
        element={
          <ProtectedRoute>
            <Kelas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/madrasah-diniyah"
        element={
          <ProtectedRoute>
            <MadrasahDiniyah />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aliyah/siswa"
        element={
          <ProtectedRoute>
            <SiswaAliyah />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aliyah/kelas"
        element={
          <ProtectedRoute>
            <KelasAliyah />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aliyah/pengabsen"
        element={
          <ProtectedRoute>
            <PengabsenAliyah />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aliyah/monitoring"
        element={
          <ProtectedRoute>
            <MonitoringAliyah />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aliyah/riwayat"
        element={
          <ProtectedRoute>
            <RiwayatAbsensiAliyah />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aliyah/setting-aplikasi"
        element={
          <ProtectedRoute>
            <SettingAplikasiAliyah />
          </ProtectedRoute>
        }
      />
      <Route
        path="/aliyah/setting-jam-pagi"
        element={
          <ProtectedRoute>
            <SettingJamPagiAliyah />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pengabsen-kelas"
        element={
          <ProtectedRoute>
            <PengabsenKelas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/monitoring-kelas"
        element={
          <ProtectedRoute>
            <PembimbingKelas />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings-madrasah"
        element={
          <ProtectedRoute>
            <MadrasahDiniyah />
          </ProtectedRoute>
        }
      />
      <Route
        path="/riwayat-absensi-madin"
        element={
          <ProtectedRoute>
            <RiwayatAbsensiMadin />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pmq/siswa"
        element={
          <ProtectedRoute>
            <SiswaPMQ />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pmq/tingkatan"
        element={
          <ProtectedRoute>
            <TingkatanPMQ />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pmq/pengabsen"
        element={
          <ProtectedRoute>
            <PengabsenPMQ />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pmq/riwayat"
        element={
          <ProtectedRoute>
            <RiwayatAbsensiPMQ />
          </ProtectedRoute>
        }
      />
      <Route
        path="/pmq/setting-waktu"
        element={
          <ProtectedRoute>
            <SettingWaktuPMQ />
          </ProtectedRoute>
        }
      />
      <Route
        path="/akses-ditolak"
        element={
          <ProtectedRoute>
            <AksesDitolak />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppSettingsProvider>
        <AppContent />
        <Toaster />
      </AppSettingsProvider>
    </BrowserRouter>
  );
}

function AppContent() {
  const location = useLocation();
  
  // Check if current route is a PWA route
  const isPWARoute = location.pathname.startsWith('/pengabsen-app') || 
                     location.pathname.startsWith('/wali-app') || 
                     location.pathname.startsWith('/pembimbing-app') ||
                     location.pathname.startsWith('/pengabsen-kelas-app') ||
                     location.pathname.startsWith('/monitoring-kelas-app') ||
                     location.pathname.startsWith('/pengabsen-aliyah-app') ||
                     location.pathname.startsWith('/monitoring-aliyah-app') ||
                     location.pathname.startsWith('/pengabsen-pmq-app');
  
  // If it's a PWA route, don't wrap with AuthProvider
  if (isPWARoute) {
    return <AppRoutes />;
  }
  
  // For admin routes, wrap with AuthProvider
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
