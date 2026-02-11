import api from './config';

export const paymentMethodAPI = {
  /**
   * 내 결제 수단 목록 조회
   */
  getMyPaymentMethods: () => {
    return api.get('/payment-methods');
  },

  /**
   * 결제 수단 등록
   * @param {{ platform: string, bankCode: string, accountNumber: string, accountHolder: string }} data
   */
  create: (data) => {
    return api.post('/payment-methods', data);
  },

  /**
   * 기본 결제 수단 설정
   * @param {number} id - 결제 수단 ID
   */
  setDefault: (id) => {
    return api.put(`/payment-methods/${id}/default`);
  },

  /**
   * 결제 수단 삭제
   * @param {number} id - 결제 수단 ID
   */
  delete: (id) => {
    return api.delete(`/payment-methods/${id}`);
  },
};

// 결제 플랫폼
export const PAYMENT_PLATFORMS = [
  { value: 'TOSS', label: '토스' },
  // TODO: 추가 플랫폼 예정
  // { value: 'KAKAO_PAY', label: '카카오페이' },
  // { value: 'NAVER_PAY', label: '네이버페이' },
];

// 은행 코드
export const BANK_CODES = [
  { value: 'TOSS_BANK', label: '토스뱅크' },
  { value: 'KB', label: 'KB국민은행' },
  { value: 'SHINHAN', label: '신한은행' },
  { value: 'WOORI', label: '우리은행' },
  { value: 'HANA', label: '하나은행' },
  { value: 'NH', label: 'NH농협은행' },
  { value: 'IBK', label: 'IBK기업은행' },
  { value: 'SC', label: 'SC제일은행' },
  { value: 'CITI', label: '한국씨티은행' },
  { value: 'KAKAO_BANK', label: '카카오뱅크' },
  { value: 'K_BANK', label: '케이뱅크' },
  { value: 'BUSAN', label: '부산은행' },
  { value: 'DAEGU', label: '대구은행' },
  { value: 'KWANGJU', label: '광주은행' },
  { value: 'JEONBUK', label: '전북은행' },
  { value: 'JEJU', label: '제주은행' },
  { value: 'GYEONGNAM', label: '경남은행' },
  { value: 'SUHYUP', label: '수협은행' },
  { value: 'SAEMAUL', label: '새마을금고' },
  { value: 'SHINHYUP', label: '신협' },
  { value: 'POST', label: '우체국' },
];
