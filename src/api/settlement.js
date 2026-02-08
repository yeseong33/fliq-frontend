import api from './config';

export const settlementAPI = {
  // 정산 계산 (Expense 기반으로 Settlement 생성)
  calculate: (gatheringId) => {
    return api.post(`/settlements/calculate/${gatheringId}`);
  },

  // 모임별 정산 목록 조회
  getByGathering: (gatheringId) => {
    return api.get(`/settlements/gathering/${gatheringId}`);
  },

  // 내가 보내야 할 정산 목록
  getMyToSend: () => {
    return api.get('/settlements/my/to-send');
  },

  // 내가 받아야 할 정산 목록
  getMyToReceive: () => {
    return api.get('/settlements/my/to-receive');
  },

  // 정산 완료 (송금자가 호출)
  complete: (settlementId) => {
    return api.post(`/settlements/${settlementId}/complete`);
  },

  // 정산 확인 (수령자가 호출)
  confirm: (settlementId) => {
    return api.post(`/settlements/${settlementId}/confirm`);
  },

  // 정산 거절 (수령자가 송금 미수령 시 호출)
  reject: (settlementId, reason) => {
    return api.post(`/settlements/${settlementId}/reject`, { reason });
  }
};
