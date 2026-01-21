import React, { createContext, useContext, useState, useEffect } from 'react';
import { pembimbingAppAPI } from '@/lib/api';

const PembimbingAuthContext = createContext(null);

export const PembimbingAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pembimbing_token');
    if (token) {
      pembimbingAppAPI
        .me()
        .then((response) => {
          setUser(response.data);
        })
        .catch(() => {
          localStorage.removeItem('pembimbing_token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, kodeAkses) => {
    const response = await pembimbingAppAPI.login(username, kodeAkses);
    const { access_token, user: userData } = response.data;
    localStorage.setItem('pembimbing_token', access_token);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('pembimbing_token');
    setUser(null);
  };

  return (
    <PembimbingAuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </PembimbingAuthContext.Provider>
  );
};

export const usePembimbingAuth = () => {
  const context = useContext(PembimbingAuthContext);
  if (!context) {
    throw new Error('usePembimbingAuth must be used within a PembimbingAuthProvider');
  }
  return context;
};
