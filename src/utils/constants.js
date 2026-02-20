export const STORAGE_KEYS = {
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
  {
    type: 'TERMS_OF_SERVICE',
    label: '서비스 이용약관',
    required: true,
    version: '1.0',
    summary: '서비스 이용 조건, 이용자의 권리와 의무, 책임 제한 등을 규정합니다.',
    content: `제1조 (목적)
본 약관은 Fliq(이하 "회사")가 제공하는 모임 비용 정산 서비스(이하 "서비스")의 이용 조건 및 절차, 이용자와 회사 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (용어의 정의)
1. "서비스"란 회사가 제공하는 모임 생성, 비용 기록, 정산 계산, 송금 연동 등의 기능을 말합니다.
2. "이용자"란 본 약관에 동의하고 서비스에 가입한 자를 말합니다.
3. "모임"이란 이용자가 서비스 내에서 생성한 비용 정산 단위를 말합니다.

제3조 (약관의 효력 및 변경)
1. 본 약관은 서비스 화면에 게시하거나 기타 방법으로 이용자에게 공지함으로써 효력을 발생합니다.
2. 회사는 관련 법령에 위배되지 않는 범위에서 약관을 변경할 수 있으며, 변경 시 7일 전 공지합니다.

제4조 (서비스 이용)
1. 이용자는 서비스를 통해 모임을 생성하고, 비용을 기록하며, 정산을 요청할 수 있습니다.
2. 서비스는 실제 금융 거래(송금)를 직접 수행하지 않으며, 외부 결제 서비스로의 연동을 제공합니다.

제5조 (이용자의 의무)
1. 이용자는 타인의 정보를 도용하거나 허위 정보를 등록해서는 안 됩니다.
2. 이용자는 서비스를 부정한 목적으로 이용해서는 안 됩니다.

제6조 (책임 제한)
1. 회사는 이용자 간의 금전 거래에 대해 직접적인 책임을 지지 않습니다.
2. 천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에 대해 책임을 지지 않습니다.

※ 본 약관은 서비스 정식 출시 시 최종 확정됩니다.`,
  },
  {
    type: 'PRIVACY_POLICY',
    label: '개인정보 처리방침',
    required: true,
    version: '1.0',
    summary: '수집하는 개인정보 항목, 이용 목적, 보유 기간을 안내합니다.',
    content: `1. 개인정보 수집 항목 및 이용 목적

[필수 수집 항목]
• 이메일 주소: 회원 식별, 로그인, 서비스 관련 공지
• 이름(닉네임): 모임 내 참여자 표시, 정산 대상 식별
• 패스키(WebAuthn 공개키): 안전한 로그인 인증

[서비스 이용 시 자동 수집]
• 서비스 이용 기록: 모임 생성/참여 내역, 비용 기록, 정산 내역
• 기기 정보: 브라우저 종류, OS 정보 (서비스 최적화 목적)

2. 개인정보 보유 및 이용 기간
• 회원 탈퇴 시까지 보유하며, 탈퇴 즉시 파기합니다.
• 단, 관련 법령에 따라 보존이 필요한 경우:
  - 전자상거래법에 따른 거래 기록: 5년
  - 통신비밀보호법에 따른 접속 기록: 3개월

3. 개인정보의 제3자 제공
• 이용자의 별도 동의 없이 제3자에게 개인정보를 제공하지 않습니다.
• 다만, 법령에 의한 요청이 있는 경우 예외로 합니다.

4. 개인정보의 파기
• 보유 기간 경과 또는 처리 목적 달성 시 지체 없이 파기합니다.
• 전자적 파일: 복구 불가능한 방법으로 삭제
• 종이 문서: 분쇄 또는 소각

5. 이용자의 권리
• 개인정보 열람, 정정, 삭제, 처리 정지를 요청할 수 있습니다.
• 요청은 서비스 내 프로필 설정 또는 고객센터를 통해 가능합니다.

6. 개인정보 보호책임자
• 담당자: (추후 지정)
• 연락처: (추후 지정)

※ 본 방침은 서비스 정식 출시 시 최종 확정됩니다.`,
  },
  {
    type: 'E_FINANCE_TERMS',
    label: '전자금융거래 이용약관',
    required: true,
    version: '1.0',
    summary: '전자금융거래 관련 권리, 의무 및 결제 서비스 이용 조건을 안내합니다.',
    content: `제1조 (목적)
본 약관은 Fliq(이하 "회사")가 제공하는 전자금융거래 관련 서비스의 이용 조건을 규정합니다.

제2조 (서비스 범위)
1. 회사는 직접적인 전자금융거래(송금, 결제)를 수행하지 않습니다.
2. 회사는 정산 금액 계산 및 외부 결제 서비스(토스 등) 연동 기능을 제공합니다.
3. 실제 송금은 이용자가 외부 결제 서비스를 통해 직접 수행합니다.

제3조 (결제 수단 정보)
1. 이용자는 정산 수령을 위해 계좌 정보를 등록할 수 있습니다.
2. 등록된 계좌 정보는 모임 내 정산 안내 목적으로만 사용됩니다.
3. 회사는 계좌 정보의 정확성에 대해 보증하지 않습니다.

제4조 (이용자 보호)
1. 회사는 이용자의 금융 정보를 암호화하여 안전하게 보관합니다.
2. 부정 거래 의심 시 서비스 이용을 제한할 수 있습니다.

제5조 (면책)
1. 외부 결제 서비스의 오류, 장애로 인한 손해에 대해 회사는 책임을 지지 않습니다.
2. 이용자 간 송금 과정에서 발생하는 분쟁에 대해 회사는 중재 의무를 지지 않습니다.

※ 본 약관은 서비스 정식 출시 시 최종 확정됩니다.`,
  },
  {
    type: 'MARKETING_CONSENT',
    label: '마케팅 수신 동의',
    required: false,
    version: '1.0',
    summary: '이벤트, 혜택 등 마케팅 정보 수신에 동의합니다.',
    content: `[마케팅 정보 수신 동의]

1. 수집 항목: 이메일 주소
2. 이용 목적: 신규 기능 안내, 이벤트/프로모션 정보, 서비스 혜택 알림
3. 보유 기간: 동의 철회 시까지

• 동의하지 않아도 서비스 이용에 제한이 없습니다.
• 동의 후에도 마이페이지에서 언제든 철회할 수 있습니다.
• 수신 거부 시 마케팅 정보 발송이 즉시 중단됩니다.`,
  },
  {
    type: 'OPTIONAL_PERSONAL_INFO',
    label: '선택적 개인정보 수집 동의',
    required: false,
    version: '1.0',
    summary: '서비스 개선을 위한 추가 정보 수집에 동의합니다.',
    content: `[선택적 개인정보 수집 동의]

1. 수집 항목: 서비스 이용 패턴, 기능 사용 통계
2. 이용 목적: 서비스 품질 개선, 사용자 경험 최적화, 통계 분석
3. 보유 기간: 동의 철회 시 또는 회원 탈퇴 시까지

• 동의하지 않아도 서비스 이용에 제한이 없습니다.
• 동의 후에도 마이페이지에서 언제든 철회할 수 있습니다.
• 수집된 정보는 통계 목적으로만 활용되며, 개인을 식별할 수 없는 형태로 처리됩니다.`,
  },
];

// reCAPTCHA v2 필요 에러 코드
export const ERROR_CODES = {
  RECAPTCHA_V2_REQUIRED: 'R002',
};