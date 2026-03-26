import axios from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://portfolio-backend-tw1s.onrender.com/api/v1';

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

  return config;
});

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
