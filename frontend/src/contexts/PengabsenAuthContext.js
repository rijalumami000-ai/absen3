import React, { createContext, useContext, useEffect, useState } from 'react';
import { pengabsenAppAPI } from '@/lib/api';

const PengabsenAuthContext = createContext(null);

export const PengabsenAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('pengabsen_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const resp = await pengabsenAppAPI.me();
        setUser(resp.data);
      } catch (err) {
        localStorage.removeItem('pengabsen_token');
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
      const resp = await pengabsenAppAPI.login(username, kodeAkses);
      const { access_token, user: userData } = resp.data;
      localStorage.setItem('pengabsen_token', access_token);
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
    localStorage.removeItem('pengabsen_token');
    setToken(null);
    setUser(null);
  };

  return (
    <PengabsenAuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </PengabsenAuthContext.Provider>
  );
};

export const usePengabsenAuth = () => {
  const ctx = useContext(PengabsenAuthContext);
  if (!ctx) {
    throw new Error('usePengabsenAuth must be used within PengabsenAuthProvider');
  }
  return ctx;
};
