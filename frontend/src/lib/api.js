import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Asrama API
export const asramaAPI = {
  getAll: (gender) => axios.get(`${API}/asrama${gender ? `?gender=${gender}` : ''}`, { headers: getAuthHeader() }),
  create: (data) => axios.post(`${API}/asrama`, data, { headers: getAuthHeader() }),
  update: (id, data) => axios.put(`${API}/asrama/${id}`, data, { headers: getAuthHeader() }),
  delete: (id) => axios.delete(`${API}/asrama/${id}`, { headers: getAuthHeader() }),
};

// Santri API
export const santriAPI = {
  getAll: (params) => {
    const query = new URLSearchParams(params).toString();
    return axios.get(`${API}/santri${query ? `?${query}` : ''}`, { headers: getAuthHeader() });
  },
  create: (data) => axios.post(`${API}/santri`, data, { headers: getAuthHeader() }),
  update: (id, data) => axios.put(`${API}/santri/${id}`, data, { headers: getAuthHeader() }),
  delete: (id) => axios.delete(`${API}/santri/${id}`, { headers: getAuthHeader() }),
  getQRCode: (id) => `${API}/santri/${id}/qr-code`,
  downloadTemplate: () => axios.get(`${API}/santri/template/download`, { 
    headers: getAuthHeader(),
    responseType: 'blob'
  }),
  import: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${API}/santri/import`, formData, { 
      headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' }
    });
  },
  export: () => axios.get(`${API}/santri/export`, { 
    headers: getAuthHeader(),
    responseType: 'blob'
  }),
};

// Wali Santri API
export const waliAPI = {
  getAll: () => axios.get(`${API}/wali`, { headers: getAuthHeader() }),
  update: (id, data) => axios.put(`${API}/wali/${id}`, data, { headers: getAuthHeader() }),
  getWhatsAppMessage: (id) => axios.get(`${API}/wali/${id}/whatsapp-message`, { headers: getAuthHeader() }),
};

// Pengabsen API
export const pengabsenAPI = {
  getAll: () => axios.get(`${API}/pengabsen`, { headers: getAuthHeader() }),
  create: (data) => axios.post(`${API}/pengabsen`, data, { headers: getAuthHeader() }),
  update: (id, data) => axios.put(`${API}/pengabsen/${id}`, data, { headers: getAuthHeader() }),
  delete: (id) => axios.delete(`${API}/pengabsen/${id}`, { headers: getAuthHeader() }),
};

// Pembimbing API
export const pembimbingAPI = {
  getAll: () => axios.get(`${API}/pembimbing`, { headers: getAuthHeader() }),
  create: (data) => axios.post(`${API}/pembimbing`, data, { headers: getAuthHeader() }),
  update: (id, data) => axios.put(`${API}/pembimbing/${id}`, data, { headers: getAuthHeader() }),
  delete: (id) => axios.delete(`${API}/pembimbing/${id}`, { headers: getAuthHeader() }),
};

// Absensi API
export const absensiAPI = {
  getAll: (params) => {
    const query = new URLSearchParams(params).toString();
    return axios.get(`${API}/absensi${query ? `?${query}` : ''}`, { headers: getAuthHeader() });
  },
  getStats: (tanggal) => axios.get(`${API}/absensi/stats${tanggal ? `?tanggal=${tanggal}` : ''}`, { headers: getAuthHeader() }),
  delete: (id) => axios.delete(`${API}/absensi/${id}`, { headers: getAuthHeader() }),
};

// Waktu Sholat API
export const waktuSholatAPI = {
  get: (tanggal) => axios.get(`${API}/waktu-sholat?tanggal=${tanggal}`, { headers: getAuthHeader() }),
  sync: (tanggal) => axios.post(`${API}/waktu-sholat/sync?tanggal=${tanggal}`, {}, { headers: getAuthHeader() }),
};
