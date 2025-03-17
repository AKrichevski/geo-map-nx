import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.warn('API: Unauthorized access');
          break;
        case 404:
          console.warn('API: Resource not found');
          break;
        case 500:
          console.error('API: Server error');
          break;
        default:
          break;
      }
    } else if (error.request) {
      console.error('API Request Error: No response received', error.request);
    } else {
      console.error('API Error:', error.message);
    }

    return Promise.reject(error);
  }
);

export const apiService = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response: AxiosResponse<T> = await api.get(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  post: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response: AxiosResponse<T> = await api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  put: async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response: AxiosResponse<T> = await api.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response: AxiosResponse<T> = await api.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await api.get('/api/health');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
};

export default apiService;
