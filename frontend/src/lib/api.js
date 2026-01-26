import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Default axios instance for general use
const api = axios.create({
  baseURL: API,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

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
  regenerateKodeAkses: (id) => axios.post(`${API}/pengabsen/${id}/regenerate-kode-akses`, {}, { headers: getAuthHeader() }),
};

// Pembimbing API (Admin)
export const pembimbingAPI = {
  getAll: () => axios.get(`${API}/pembimbing`, { headers: getAuthHeader() }),
  create: (data) => axios.post(`${API}/pembimbing`, data, { headers: getAuthHeader() }),
  update: (id, data) => axios.put(`${API}/pembimbing/${id}`, data, { headers: getAuthHeader() }),
  delete: (id) => axios.delete(`${API}/pembimbing/${id}`, { headers: getAuthHeader() }),
  regenerateKodeAkses: (id) => axios.post(`${API}/pembimbing/${id}/regenerate-kode-akses`, {}, { headers: getAuthHeader() }),
};

const getPengabsenAuthHeader = () => {
  const token = localStorage.getItem('pengabsen_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getWaliAuthHeader = () => {
  const token = localStorage.getItem('wali_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getPembimbingAuthHeader = () => {
  const token = localStorage.getItem('pembimbing_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// API khusus PWA Pengabsen
export const pengabsenAppAPI = {
  login: (username, kode_akses) =>
    axios.post(`${API}/pengabsen/login`, { username, kode_akses }),
  me: () => axios.get(`${API}/pengabsen/me`, { headers: getPengabsenAuthHeader() }),
  upsertAbsensi: (params) =>
    axios.post(`${API}/pengabsen/absensi`, null, {
      params,
      headers: getPengabsenAuthHeader(),
    }),
  deleteAbsensi: (params) =>
    axios.delete(`${API}/pengabsen/absensi`, {
      params,
      headers: getPengabsenAuthHeader(),
    }),
  listHariIni: (params) =>
    axios.get(`${API}/pengabsen/santri-absensi-hari-ini`, {
      params,
      headers: getPengabsenAuthHeader(),
    }),
  riwayat: (params) =>
    axios.get(`${API}/pengabsen/riwayat`, {
      params,
      headers: getPengabsenAuthHeader(),
    }),
  riwayatDetail: (params) =>
    axios.get(`${API}/pengabsen/riwayat-detail`, {
      params,
      headers: getPengabsenAuthHeader(),
    }),
};

// API khusus PWA Wali Santri
export const waliAppAPI = {
  login: (username, password) => axios.post(`${API}/wali/login`, { username, password }),
  me: () => axios.get(`${API}/wali/me`, { headers: getWaliAuthHeader() }),
  absensiHariIni: () => axios.get(`${API}/wali/anak-absensi-hari-ini`, { headers: getWaliAuthHeader() }),
  absensiRiwayat: (params) =>
    axios.get(`${API}/wali/anak-absensi-riwayat`, {
      params,
      headers: getWaliAuthHeader(),
    }),
  registerFcmToken: (token) =>
    axios.post(`${API}/wali/fcm-token`, { token }, { headers: getWaliAuthHeader() }),
};

// Absensi API
export const absensiAPI = {
  getAll: (params) => {
    const query = new URLSearchParams(params).toString();
    return axios.get(`${API}/absensi${query ? `?${query}` : ''}`, { headers: getAuthHeader() });
  },
  getStats: (params) => {
    const query = new URLSearchParams(params).toString();
    return axios.get(`${API}/absensi/stats${query ? `?${query}` : ''}`, { headers: getAuthHeader() });
  },
  getDetail: (tanggal, asrama_id, gender) => {
    const params = new URLSearchParams({ tanggal });
    if (asrama_id) params.append('asrama_id', asrama_id);
    if (gender) params.append('gender', gender);
    return axios.get(`${API}/absensi/detail?${params.toString()}`, { headers: getAuthHeader() });
  },
  delete: (id) => axios.delete(`${API}/absensi/${id}`, { headers: getAuthHeader() }),
};

// Waktu Sholat API
export const waktuSholatAPI = {
  get: (tanggal) => axios.get(`${API}/waktu-sholat?tanggal=${tanggal}`, { headers: getAuthHeader() }),
  sync: (tanggal) => axios.post(`${API}/waktu-sholat/sync?tanggal=${tanggal}`, {}, { headers: getAuthHeader() }),
};

// Settings API
export const settingsAPI = {
  getWaliNotifikasi: () => axios.get(`${API}/settings/wali-notifikasi`, { headers: getAuthHeader() }),
  updateWaliNotifikasi: (data) => axios.put(`${API}/settings/wali-notifikasi`, data, { headers: getAuthHeader() }),
  getAppSettings: () => axios.get(`${API}/settings/app`),
  updateAppSettings: (data) => axios.put(`${API}/settings/app`, data, { headers: getAuthHeader() }),
};

// Pembimbing PWA API
export const pembimbingAppAPI = {
  login: (username, kode_akses) =>
    axios.post(`${API}/pembimbing/login`, { username, kode_akses }),
  me: () => axios.get(`${API}/pembimbing/me`, { headers: getPembimbingAuthHeader() }),
  absensiHariIni: (params) =>
    axios.get(`${API}/pembimbing/santri-absensi-hari-ini`, {
      params,
      headers: getPembimbingAuthHeader(),
    }),
  absensiRiwayat: (params) =>
    axios.get(`${API}/pembimbing/absensi-riwayat`, {
      params,
      headers: getPembimbingAuthHeader(),
    }),
  statistik: (params) =>
    axios.get(`${API}/pembimbing/statistik`, {
      params,
      headers: getPembimbingAuthHeader(),
    }),
};
