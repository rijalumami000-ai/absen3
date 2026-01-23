import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
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
import PengabsenKelas from '@/pages/PengabsenKelas';
import PembimbingKelas from '@/pages/PembimbingKelas';
import PengabsenKelasAppLogin from '@/pages/PengabsenKelasAppLogin';
import PengabsenKelasApp from '@/pages/PengabsenKelasApp';
import MonitoringKelasAppLogin from '@/pages/MonitoringKelasAppLogin';
import MonitoringKelasApp from '@/pages/MonitoringKelasApp';
import PengabsenAppLogin from '@/pages/PengabsenAppLogin';
import PengabsenApp from '@/pages/PengabsenApp';
import { PengabsenAuthProvider, usePengabsenAuth } from '@/contexts/PengabsenAuthContext';
import WaliAppLogin from '@/pages/WaliAppLogin';
import WaliApp from '@/pages/WaliApp';
import { WaliAuthProvider, useWaliAuth } from '@/contexts/WaliAuthContext';
import PembimbingAppLogin from '@/pages/PembimbingAppLogin';
import PembimbingApp from '@/pages/PembimbingApp';
import { PembimbingAuthProvider, usePembimbingAuth } from '@/contexts/PembimbingAuthContext';
import { PengabsenKelasAuthProvider, usePengabsenKelasAuth } from '@/contexts/PengabsenKelasAuthContext';
import { PembimbingKelasAuthProvider, usePembimbingKelasAuth } from '@/contexts/PembimbingKelasAuthContext';
import '@/App.css';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

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

  return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = window.location.pathname;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Memuat...</div>
      </div>
    );
  }

  // Don't redirect if user is accessing PWA routes
  const isPWARoute = location.includes('-app');
  
  if (user && !isPWARoute) {
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
    return <Navigate to="/pengabsen-app/login" replace />;
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
    return <Navigate to="/pengabsen-kelas-app/login" replace />;
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

function AppRoutes() {
  return (
    <Routes>
      {/* PWA Routes - PRIORITAS PERTAMA */}
      <Route
        path="/pengabsen-app/login"
        element={
          <PengabsenAuthProvider>
            <PengabsenAppLogin />
          </PengabsenAuthProvider>
        }
      />
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
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
