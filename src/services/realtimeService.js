import { io } from 'socket.io-client';
import { STORAGE_KEYS } from '../utils/constants';

const REALTIME_URL = import.meta.env.VITE_REALTIME_URL || 'http://localhost:4000';

let socket = null;

export const realtimeService = {
  connect() {
    if (socket?.connected) return socket;

    const bearerToken = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN) || '';
    const token = bearerToken.replace(/^Bearer\s+/i, '');

    socket = io(REALTIME_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
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
