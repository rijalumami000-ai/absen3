import React, { createContext, useContext, useEffect, useState } from 'react';
import { waliAppAPI } from '@/lib/api';

const WaliAuthContext = createContext(null);

export const WaliAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('wali_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const resp = await waliAppAPI.me();
        setUser(resp.data);
      } catch (err) {
        localStorage.removeItem('wali_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [token]);

  const login = async (username, password) => {
    try {
      const resp = await waliAppAPI.login(username, password);
      const { access_token, user: userData } = resp.data;
      localStorage.setItem('wali_token', access_token);
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
    localStorage.removeItem('wali_token');
    setToken(null);
    setUser(null);
  };

  return (
    <WaliAuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </WaliAuthContext.Provider>
  );
};

export const useWaliAuth = () => {
  const ctx = useContext(WaliAuthContext);
  if (!ctx) {
    throw new Error('useWaliAuth must be used within WaliAuthProvider');
  }
  return ctx;
};
