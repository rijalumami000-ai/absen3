import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const PengabsenKelasAuthContext = createContext();

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const PengabsenKelasAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pengabsen_kelas_token');
    const storedUser = localStorage.getItem('pengabsen_kelas_user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, kode_akses) => {
    try {
      const response = await axios.post(`${API_URL}/api/pengabsen-kelas/login`, {
        username,
        kode_akses
      });

      const { access_token, user: userData } = response.data;
      localStorage.setItem('pengabsen_kelas_token', access_token);
      localStorage.setItem('pengabsen_kelas_user', JSON.stringify(userData));
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
    localStorage.removeItem('pengabsen_kelas_token');
    localStorage.removeItem('pengabsen_kelas_user');
    setUser(null);
  };

  return (
    <PengabsenKelasAuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </PengabsenKelasAuthContext.Provider>
  );
};

export const usePengabsenKelasAuth = () => {
  const context = useContext(PengabsenKelasAuthContext);
  if (!context) {
    throw new Error('usePengabsenKelasAuth must be used within PengabsenKelasAuthProvider');
  }
  return context;
};
