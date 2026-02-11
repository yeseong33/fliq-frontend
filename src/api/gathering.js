import api from './config';

export const gatheringAPI = {
  create: (gatheringData) => {
    return api.post('/gatherings', gatheringData);
  },

  getMyGatherings: (size = 100) => {
    return api.get(`/gatherings/my?size=${size}`);
  },

  getGathering: (id) => {
    return api.get(`/gatherings/${id}`);
  },

  joinGathering: (qrCode) => {
    return api.post('/gatherings/join', { qrCode });
  },

  getParticipatedGatherings: (size = 100) => {
    return api.get(`/gatherings/participated?size=${size}`);
  },

  refreshQR: (gatheringId) => {
    return api.post(`/gatherings/${gatheringId}/refresh-qr`);
  },

  update: (gatheringId, updateData) => {
    return api.patch(`/gatherings/${gatheringId}`, updateData);
  },

  createPaymentRequest: (gatheringId, totalAmount) => {
    return api.post(`/gatherings/${gatheringId}/payment-request?totalAmount=${totalAmount}`);
  },

  leaveGathering: (gatheringId) => {
    return api.delete(`/gatherings/${gatheringId}/leave`);
  },

  closeGathering: (gatheringId) => {
    return api.post(`/gatherings/${gatheringId}/close`);
  }
};