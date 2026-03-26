import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1';

console.log(`[API INIT] Using API base URL: ${BASE_URL}`);

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Request interceptor for logging
axiosInstance.interceptors.request.use((config) => {
  console.log(`[API REQ] ${config.method.toUpperCase()} ${config.url}`);
  
  // Safe logging of payload
  if (config.data) {
    const logData = { ...config.data };
    if (logData.password) logData.password = '***'; // Mask password
    console.log(`[API REQ PAYLOAD]`, JSON.stringify(logData));
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for logging & error handling
axiosInstance.interceptors.response.use((response) => {
  console.log(`[API RES] ${response.status} from ${response.config.url}`);
  return response;
}, (error) => {
  const status = error.response ? error.response.status : 'Network/Unknown';
  const message = error.response ? (error.response.data?.message || error.response.statusText) : error.message;
  
  console.error(`[API ERROR] Status: ${status} | URL: ${error.config?.url} | Message: ${message}`);
  return Promise.reject(error);
});

export default axiosInstance;
