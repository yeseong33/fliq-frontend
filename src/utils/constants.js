export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  USER: 'user',
  SIGNUP_TOKEN: 'signupToken',
  RECOVERY_TOKEN: 'recoveryToken',
  RETURN_URL: 'returnUrl',
};

// 인증 플로우 상태
export const AUTH_FLOW = {
  IDLE: 'IDLE',
  SIGNUP_CONSENT: 'SIGNUP_CONSENT',
  SIGNUP_EMAIL: 'SIGNUP_EMAIL',
  SIGNUP_OTP: 'SIGNUP_OTP',
  SIGNUP_ACCOUNT: 'SIGNUP_ACCOUNT', // 계좌 등록 (선택)
  SIGNUP_PASSKEY: 'SIGNUP_PASSKEY',
  LOGIN_EMAIL: 'LOGIN_EMAIL',
  LOGIN_PASSKEY: 'LOGIN_PASSKEY',
  RECOVERY_EMAIL: 'RECOVERY_EMAIL',
  RECOVERY_OTP: 'RECOVERY_OTP',
  RECOVERY_PASSKEY: 'RECOVERY_PASSKEY',
};

export const GATHERING_STATUS = {
  ACTIVE: 'ACTIVE',
  PAYMENT_REQUESTED: 'PAYMENT_REQUESTED',
  COMPLETED: 'COMPLETED',
  CLOSED: 'CLOSED',
};

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
};

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PENDING]: '결제 대기',
  [PAYMENT_STATUS.PROCESSING]: '결제 처리중',
  [PAYMENT_STATUS.COMPLETED]: '결제 완료',
  [PAYMENT_STATUS.FAILED]: '결제 실패',
  [PAYMENT_STATUS.CANCELLED]: '결제 취소',
};

export const QR_CODE_EXPIRY_MINUTES = 30;
export const PAYMENT_TIMEOUT_HOURS = 24;

// reCAPTCHA 설정
export const RECAPTCHA = {
  V3_SITE_KEY: import.meta.env.VITE_RECAPTCHA_V3_SITE_KEY || '',
  V2_SITE_KEY: import.meta.env.VITE_RECAPTCHA_V2_SITE_KEY || '',
  VERSION: {
    V2: 'v2',
    V3: 'v3',
  },
};

// 약관 동의 타입
export const CONSENT_TYPES = [
  { type: 'TERMS_OF_SERVICE', label: '서비스 이용약관', required: true },
  { type: 'PRIVACY_POLICY', label: '개인정보 처리방침', required: true },
  { type: 'E_FINANCE_TERMS', label: '전자금융거래 이용약관', required: true },
  { type: 'MARKETING_CONSENT', label: '마케팅 수신 동의', required: false },
  { type: 'OPTIONAL_PERSONAL_INFO', label: '선택적 개인정보 수집 동의', required: false },
];

// reCAPTCHA v2 필요 에러 코드
export const ERROR_CODES = {
  RECAPTCHA_V2_REQUIRED: 'R002',
};