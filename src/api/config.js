import axios from 'axios';
import { STORAGE_KEYS } from '../utils/constants';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

// Create axios instance with security headers
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF 방어
  },
});

// Add artificial delay in development mode
const addArtificialDelay = async () => {
  const delay = import.meta.env.VITE_API_DELAY;
  if (delay) {
    await new Promise(resolve => setTimeout(resolve, parseInt(delay)));
  }
};

// Request interceptor to add auth token and artificial delay
api.interceptors.request.use(
  async (config) => {
    // sessionStorage 사용 (브라우저 종료 시 자동 삭제)
    const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      config.headers.Authorization = token;
    }
    await addArtificialDelay();
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // API 응답이 success: false인 경우도 에러로 처리
    if (response.data?.success === false) {
      return Promise.reject({
        response: {
          data: {
            error: response.data.error
          }
        }
      });
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.USER);
      window.location.href = '/auth';
      return Promise.reject(new Error('인증이 만료되었습니다. 다시 로그인해주세요.'));
    }

    // API 에러 응답 처리
    if (error.response?.data) {
      const errorData = error.response.data;
      
      // code 필드가 있는 경우
      if (errorData.code) {
        return Promise.reject({
          code: errorData.code,
          message: errorData.message || '요청 처리 중 오류가 발생했습니다.'
        });
      }
      
      // error 객체가 있는 경우
      if (errorData.error) {
        return Promise.reject({
          code: errorData.error.code,
          message: errorData.error.message || '요청 처리 중 오류가 발생했습니다.'
        });
      }
    }
    
    // 네트워크 오류 등 기타 에러
    return Promise.reject({
      code: 'UNKNOWN_ERROR',
      message: '요청 처리 중 오류가 발생했습니다.'
    });
  }
);

export default api;