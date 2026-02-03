import React, { createContext, useContext, useEffect, useState } from 'react';
import { pengabsenPMQAppAPI } from '@/lib/api';

const PengabsenPMQAuthContext = createContext(null);

export const PengabsenPMQAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('pengabsen_pmq_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const resp = await pengabsenPMQAppAPI.me();
        setUser(resp.data);
      } catch (err) {
        localStorage.removeItem('pengabsen_pmq_token');
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
      const resp = await pengabsenPMQAppAPI.login(username, kodeAkses);
      const { access_token, user: userData } = resp.data;
      localStorage.setItem('pengabsen_pmq_token', access_token);
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
    localStorage.removeItem('pengabsen_pmq_token');
    setToken(null);
    setUser(null);
  };

  return (
    <PengabsenPMQAuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </PengabsenPMQAuthContext.Provider>
  );
};

export const usePengabsenPMQAuth = () => {
  const ctx = useContext(PengabsenPMQAuthContext);
  if (!ctx) {
    throw new Error('usePengabsenPMQAuth must be used within PengabsenPMQAuthProvider');
  }
  return ctx;
};
