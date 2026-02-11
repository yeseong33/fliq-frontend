import { gatheringAPI } from '../api';

export const gatheringService = {
  async createGathering(gatheringData) {
    const response = await gatheringAPI.create(gatheringData);
    return response.data;
  },

  async getGathering(id) {
    const response = await gatheringAPI.getGathering(id);
    return response.data;
  },

  async joinGathering(qrCode) {
    const response = await gatheringAPI.joinGathering(qrCode);
    return response.data;
  },

  async getMyGatherings() {
    const response = await gatheringAPI.getMyGatherings();
    return response.data;
  },

  async getParticipatedGatherings() {
    const response = await gatheringAPI.getParticipatedGatherings();
    return response.data;
  },

  async updateGathering(gatheringId, updateData) {
    const response = await gatheringAPI.update(gatheringId, updateData);
    return response.data;
  },

  async createPaymentRequest(gatheringId, totalAmount) {
    const response = await gatheringAPI.createPaymentRequest(gatheringId, totalAmount);
    return response.data;
  },

  async leaveGathering(gatheringId) {
    const response = await gatheringAPI.leaveGathering(gatheringId);
    return response.data;
  },

  async closeGathering(gatheringId) {
    const response = await gatheringAPI.closeGathering(gatheringId);
    return response.data;
  },
};