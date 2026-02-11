import api from './config';

export const consentAPI = {
  /**
   * 약관 동의 일괄 저장
   * @param {Array<{ type: string, agreed: boolean, version: string }>} consents
   */
  saveAll: (consents) => {
    const mapped = consents.map((c) => ({
      consentType: c.type,
      consentGiven: c.agreed,
      termsVersion: c.version,
    }));
    return api.post('/consents', { consents: mapped });
  },
  /** 내 동의 현황 조회 */
  getMyConsents: () => api.get('/consents/me'),
  /** 필수 약관 동의 여부 확인 */
  checkRequired: () => api.get('/consents/me/check'),
};
