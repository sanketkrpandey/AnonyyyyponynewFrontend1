import axios from 'axios';
import { getToken, clearToken } from '../utils/storage';

const baseURL = `${import.meta.env.VITE_API_URL}${import.meta.env.VITE_API_PREFIX || ''}`;

const api = axios.create({
  baseURL,
  timeout: 10000
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearToken();
      // Optionally redirect to auth page
      // window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api;