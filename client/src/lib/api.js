import axios from 'axios';
import logger from './logger';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('portfolio_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Basic request logging for dev
  if (import.meta.env.DEV) {
    logger.info(`[API REQ] ${config.method?.toUpperCase()} ${config.url}`);
    if (config.data && !config.url?.includes('auth')) {
       // Avoid logging auth data even in dev
       logger.info(`[API REQ PAYLOAD]`, config.data);
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      logger.info(`[API RES] ${response.status} from ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    const status = error.response ? error.response.status : null;

    if (status === 401) {
      logger.warn('[API] 401 Unauthorized - Logging out...');
      localStorage.removeItem('portfolio_token');
      localStorage.removeItem('portfolio_user');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
         window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export const getErrorMessage = (error) => {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }

  if (Array.isArray(error?.response?.data?.errors)) {
    return error.response.data.errors[0]?.message || 'Request failed';
  }

  if (error?.message) {
    return error.message;
  }

  return 'Something went wrong';
};
