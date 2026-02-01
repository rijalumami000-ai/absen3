import React, { createContext, useContext, useEffect, useState } from 'react';
import { monitoringAliyahAppAPI } from '@/lib/api';

const MonitoringAliyahAuthContext = createContext(null);

export const MonitoringAliyahAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('monitoring_aliyah_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const resp = await monitoringAliyahAppAPI.me();
        setUser(resp.data);
      } catch (err) {
        localStorage.removeItem('monitoring_aliyah_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [token]);

  const login = async (username, kodeAkses) => {
    try {
      const resp = await monitoringAliyahAppAPI.login(username, kodeAkses);
      const { access_token, user: userData } = resp.data;
      localStorage.setItem('monitoring_aliyah_token', access_token);
      setToken(access_token);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || 'Login gagal',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('monitoring_aliyah_token');
    setToken(null);
    setUser(null);
  };

  return (
    <MonitoringAliyahAuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </MonitoringAliyahAuthContext.Provider>
  );
};

export const useMonitoringAliyahAuth = () => {
  const ctx = useContext(MonitoringAliyahAuthContext);
  if (!ctx) {
    throw new Error('useMonitoringAliyahAuth must be used within MonitoringAliyahAuthProvider');
  }
  return ctx;
};
