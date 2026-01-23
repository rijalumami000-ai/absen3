import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const PembimbingKelasAuthContext = createContext();

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const PembimbingKelasAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pembimbing_kelas_token');
    const storedUser = localStorage.getItem('pembimbing_kelas_user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, kode_akses) => {
    try {
      const response = await axios.post(`${API_URL}/api/pembimbing-kelas/login`, {
        username,
        kode_akses
      });

      const { access_token, user: userData } = response.data;
      localStorage.setItem('pembimbing_kelas_token', access_token);
      localStorage.setItem('pembimbing_kelas_user', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Login gagal'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('pembimbing_kelas_token');
    localStorage.removeItem('pembimbing_kelas_user');
    setUser(null);
  };

  return (
    <PembimbingKelasAuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </PembimbingKelasAuthContext.Provider>
  );
};

export const usePembimbingKelasAuth = () => {
  const context = useContext(PembimbingKelasAuthContext);
  if (!context) {
    throw new Error('usePembimbingKelasAuth must be used within PembimbingKelasAuthProvider');
  }
  return context;
};
