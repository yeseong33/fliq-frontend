import api from './config';

export const consentAPI = {
  /** 약관 동의 일괄 저장 */
  saveAll: (consents) => api.post('/consents', { consents }),
  /** 내 동의 현황 조회 */
  getMyConsents: () => api.get('/consents/me'),
  /** 필수 약관 동의 여부 확인 */
  checkRequired: () => api.get('/consents/me/check'),
};
