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
import PengabsenAppLogin from '@/pages/PengabsenAppLogin';
import PengabsenApp from '@/pages/PengabsenApp';
import { PengabsenAuthProvider, usePengabsenAuth } from '@/contexts/PengabsenAuthContext';
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

function AppRoutes() {
  return (
    <Routes>
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
