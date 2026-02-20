import axios from 'axios';
import { tokenManager } from '../utils/tokenManager';

// CRITICAL #4: 프로덕션에서 API URL 미설정 시 즉시 에러
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? (() => { throw new Error('VITE_API_BASE_URL must be set in production'); })()
    : 'http://localhost:8080/api/v1');

// 401 처리 디바운스 (동시 다중 401 캐스케이드 방지)
let isLoggingOut = false;
let onUnauthorized = null;

// Token refresh 상태
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

// 강제 로그아웃 (refresh 실패 시)
const handleForceLogout = () => {
  if (!isLoggingOut) {
    isLoggingOut = true;
    tokenManager.clearToken();
    sessionStorage.removeItem('user');
    if (onUnauthorized) {
      onUnauthorized();
    } else {
      window.location.href = '/auth';
    }
    setTimeout(() => { isLoggingOut = false; }, 3000);
  }
};

// Create axios instance with security headers
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // 쿠키 자동 전송 (HTTP-only refresh token)
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF 방어
  },
});

// Refresh 전용 axios (인터셉터 미적용, 무한루프 방지)
const refreshAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
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
    // 인메모리 토큰 사용
    const bearerToken = tokenManager.getBearerToken();
    if (bearerToken) {
      config.headers.Authorization = bearerToken;
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
  async (error) => {
    const originalRequest = error.config;

    // 401 응답: Access Token 만료 → Refresh Token 쿠키로 갱신 시도
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 이미 refresh 진행 중이면 큐에 대기
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Refresh Token 쿠키로 새 Access Token 발급 (body 없음)
        const { data } = await refreshAxios.post('/auth/refresh');
        const { accessToken } = data.data;

        // 인메모리에 새 Access Token 저장
        tokenManager.setToken(accessToken);

        // 대기 중인 요청들 재시도
        processQueue(null, accessToken);

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh 실패 → 대기 중인 요청 모두 reject + 강제 로그아웃
        processQueue(refreshError, null);
        handleForceLogout();
        return Promise.reject(new Error('인증이 만료되었습니다.'));
      } finally {
        isRefreshing = false;
      }
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
