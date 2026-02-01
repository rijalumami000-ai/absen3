import React, { createContext, useContext, useEffect, useState } from 'react';
import { pengabsenAliyahAppAPI } from '@/lib/api';

const PengabsenAliyahAuthContext = createContext(null);

export const PengabsenAliyahAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('pengabsen_aliyah_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const resp = await pengabsenAliyahAppAPI.me();
        setUser(resp.data);
      } catch (err) {
        localStorage.removeItem('pengabsen_aliyah_token');
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
      const resp = await pengabsenAliyahAppAPI.login(username, kodeAkses);
      const { access_token, user: userData } = resp.data;
      localStorage.setItem('pengabsen_aliyah_token', access_token);
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
    localStorage.removeItem('pengabsen_aliyah_token');
    setToken(null);
    setUser(null);
  };

  return (
    <PengabsenAliyahAuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </PengabsenAliyahAuthContext.Provider>
  );
};

export const usePengabsenAliyahAuth = () => {
  const ctx = useContext(PengabsenAliyahAuthContext);
  if (!ctx) {
    throw new Error('usePengabsenAliyahAuth must be used within PengabsenAliyahAuthProvider');
  }
  return ctx;
};
