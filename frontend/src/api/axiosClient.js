import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token if present
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Unwrap ApiResponse
axiosClient.interceptors.response.use(
  (response) => {
    if (response.data && response.data.data !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    let message = error.response?.data?.message;
    if (error.response?.data?.data && typeof error.response.data.data === 'object' && !Array.isArray(error.response.data.data)) {
      const details = Object.entries(error.response.data.data).map(([field, msg]) => `${field}: ${msg}`).join(', ');
      if (details) {
        message = message ? `${message} (${details})` : details;
      }
    }
    return Promise.reject(new Error(message || error.message || 'Không kết nối được máy chủ, bạn kiểm tra mạng và thử lại nhé'));
  }
);

export default axiosClient;
