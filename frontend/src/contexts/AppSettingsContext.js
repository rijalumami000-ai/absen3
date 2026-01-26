import React, { createContext, useContext, useState, useEffect } from 'react';
import { settingsAPI } from '@/lib/api';

const AppSettingsContext = createContext();

export const AppSettingsProvider = ({ children }) => {
  const [appSettings, setAppSettings] = useState({
    admin_title: 'Admin Panel Absensi Santri Dan Siswa',
    wali_title: 'Wali Santri Ponpes Al-Hamid',
    pengabsen_title: 'Pengabsen Sholat Ponpes Al-Hamid',
    pembimbing_title: 'Monitoring Sholat Ponpes Al-Hamid',
    pengabsen_kelas_title: 'Pengabsen Kelas Madin',
    monitoring_kelas_title: 'Monitoring Kelas Madin',
  });
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.getAppSettings();
      setAppSettings(response.data);
    } catch (error) {
      console.error('Failed to load app settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    
    // Reload settings every time window gains focus (user switches back to tab)
    const handleFocus = () => {
      loadSettings();
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <AppSettingsContext.Provider value={{ appSettings, loading, reloadSettings: loadSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }
  return context;
};
