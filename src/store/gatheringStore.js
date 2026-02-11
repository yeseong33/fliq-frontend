import { create } from 'zustand';
import { gatheringService } from '../services/gatheringService';

export const useGatheringStore = create((set, get) => ({
  gatherings: [],
  currentGathering: null,
  loading: false,
  error: null,

  initialize: () => {
    set({
      gatherings: [],
      currentGathering: null,
      loading: false,
      error: null
    });
  },

  createGathering: async (gatheringData) => {
    set({ loading: true, error: null });
    try {
      const response = await gatheringService.createGathering(gatheringData);
      // API 응답 구조: { success: true, data: {...} }
      let gathering = response?.data || response;

      // 생성자를 참여자에 자동 추가
      if (gathering?.qrCode) {
        try {
          const joinResponse = await gatheringService.joinGathering(gathering.qrCode);
          gathering = joinResponse?.data || joinResponse || gathering;
        } catch (joinError) {
          // 이미 참여자인 경우 등 에러 무시
        }
      }

      set({ currentGathering: gathering, loading: false });
      return gathering;
    } catch (error) {
      // API 에러를 그대로 전달
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getGathering: async (id) => {
    set({ loading: true, error: null });
    try {
      const response = await gatheringService.getGathering(id);
      // API 응답 구조: { success: true, data: {...} }
      const gathering = response?.data || response;
      set({ currentGathering: gathering, loading: false });
      return gathering;
    } catch (error) {
      // API 에러를 그대로 전달
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  joinGathering: async (qrCode) => {
    set({ loading: true, error: null });
    try {
      const response = await gatheringService.joinGathering(qrCode);
      // API 응답 구조: { success: true, data: {...} }
      const gathering = response?.data || response;
      set({ currentGathering: gathering, loading: false });
      return gathering;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  getMyGatherings: async () => {
    set({ loading: true, error: null });
    try {
      // 내가 생성한 모임과 참여한 모임 모두 조회
      const [myGatherings, participatedGatherings] = await Promise.all([
        gatheringService.getMyGatherings(),
        gatheringService.getParticipatedGatherings()
      ]);

      // API 응답 구조: { success: true, data: { content: [...] } }
      // service에서 response.data를 반환하므로 여기서는 .data.content로 접근
      const myContent = myGatherings?.data?.content || myGatherings?.content || [];
      const participatedContent = participatedGatherings?.data?.content || participatedGatherings?.content || [];

      // id 기준으로 중복 제거
      const gatheringMap = new Map();
      [...myContent, ...participatedContent].forEach(gathering => {
        if (gathering && gathering.id) {
          gatheringMap.set(gathering.id, gathering);
        }
      });

      const allGatherings = Array.from(gatheringMap.values());

      // createdAt 기준 정렬 (최신순)
      allGatherings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      set({ gatherings: allGatherings, loading: false });
      return { content: allGatherings };
    } catch (error) {
      // API 에러를 그대로 전달
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  createPaymentRequest: async (gatheringId, totalAmount) => {
    set({ loading: true, error: null });
    try {
      const response = await gatheringService.createPaymentRequest(gatheringId, totalAmount);
      // API 응답 구조: { success: true, data: {...} }
      const gathering = response?.data || response;
      set({ currentGathering: gathering, loading: false });
      return gathering;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  updateGathering: async (gatheringId, updateData) => {
    set({ loading: true, error: null });
    try {
      const response = await gatheringService.updateGathering(gatheringId, updateData);
      const gathering = response?.data || response;
      set({ currentGathering: gathering, loading: false });
      return gathering;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  refreshGathering: async () => {
    const current = get().currentGathering;
    if (current?.id) {
      await get().getGathering(current.id);
    }
  },

  leaveGathering: async (gatheringId) => {
    set({ loading: true, error: null });
    try {
      await gatheringService.leaveGathering(gatheringId);
      // 목록에서 해당 모임 제거
      const gatherings = get().gatherings.filter(g => g.id !== gatheringId);
      set({ gatherings, currentGathering: null, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  closeGathering: async (gatheringId) => {
    set({ loading: true, error: null });
    try {
      await gatheringService.closeGathering(gatheringId);
      // 목록에서 해당 모임 제거
      const gatherings = get().gatherings.filter(g => g.id !== gatheringId);
      set({ gatherings, currentGathering: null, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  clearCurrentGathering: () => {
    set({ currentGathering: null });
  },
}));