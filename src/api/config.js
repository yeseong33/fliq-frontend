import axios from 'axios';
import { STORAGE_KEYS } from '../utils/constants';

// CRITICAL #4: 프로덕션에서 API URL 미설정 시 즉시 에러
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? (() => { throw new Error('VITE_API_BASE_URL must be set in production'); })()
    : 'http://localhost:8080/api/v1');

// CRITICAL #6: 401 처리 디바운스 (동시 다중 401 캐스케이드 방지)
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
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    if (onUnauthorized) {
      onUnauthorized();
    } else {
      window.location.href = '/auth';
    }
    setTimeout(() => { isLoggingOut = false; }, 3000);
  }
};

// CRITICAL #1: JWT 토큰 형식 검증
const isValidBearerToken = (token) => {
  if (typeof token !== 'string') return false;
  if (!token.startsWith('Bearer ')) return false;
  const jwt = token.slice(7);
  const parts = jwt.split('.');
  return parts.length === 3 && parts.every(p => p.length > 0);
};

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
    if (token && isValidBearerToken(token)) {
      config.headers.Authorization = token;
    } else if (token) {
      // 변조된 토큰 삭제
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    }

    // CRITICAL #3: 프로덕션 Origin 검증용 커스텀 헤더
    if (import.meta.env.PROD) {
      config.headers['X-Origin'] = window.location.origin;
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

    // 401 응답: Access Token 만료 → Refresh Token으로 갱신 시도
    if (error.response?.status === 401 && !originalRequest._retry) {
      // refresh 엔드포인트 자체가 실패한 경우 → 강제 로그아웃
      if (originalRequest.url?.includes('/auth/refresh')) {
        handleForceLogout();
        return Promise.reject(new Error('인증이 만료되었습니다.'));
      }

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

      const refreshToken = sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

      // Refresh Token이 없으면 강제 로그아웃
      if (!refreshToken) {
        isRefreshing = false;
        handleForceLogout();
        return Promise.reject(new Error('인증이 만료되었습니다.'));
      }

      try {
        // Refresh Token으로 새 토큰 발급 (rotation)
        const { data } = await api.post('/auth/refresh', { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = data.data;

        // 새 토큰 저장
        sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, `Bearer ${accessToken}`);
        sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

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
