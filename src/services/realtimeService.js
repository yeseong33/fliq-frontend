import { io } from 'socket.io-client';
import logger from '../utils/logger';
import { tokenManager } from '../utils/tokenManager';

const getRealtimeUrl = () => {
  const url = import.meta.env.VITE_REALTIME_URL;
  if (!url) return 'http://localhost:4000';
  try {
    const parsed = new URL(url);
    if (import.meta.env.PROD && parsed.protocol !== 'https:' && parsed.protocol !== 'wss:') {
      logger.error('Realtime URL must use HTTPS/WSS in production');
      return null;
    }
    return url;
  } catch {
    logger.error('Invalid REALTIME_URL format');
    return null;
  }
};

const getToken = () => {
  return tokenManager.getToken() || '';
};

let socket = null;

export const realtimeService = {
  connect() {
    if (socket?.connected) return socket;

    const url = getRealtimeUrl();
    if (!url) return null;

    socket = io(url, {
      auth: { token: getToken() },
      transports: import.meta.env.PROD ? ['websocket'] : ['websocket', 'polling'],
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
    });

    // 재연결 시 최신 토큰 사용
    socket.on('reconnect_attempt', () => {
      socket.auth = { token: getToken() };
    });

    return socket;
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket() {
    return socket;
  },

  isConnected() {
    return socket?.connected ?? false;
  },
};
