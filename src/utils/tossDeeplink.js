// 토스 딥링크 은행 코드 매핑
const TOSS_BANK_CODES = {
  TOSS_BANK: '092',
  KB: '004',
  SHINHAN: '088',
  WOORI: '020',
  HANA: '081',
  NH: '011',
  IBK: '003',
  SC: '023',
  CITI: '027',
  KAKAO_BANK: '090',
  K_BANK: '089',
  BUSAN: '032',
  DAEGU: '031',
  KWANGJU: '034',
  JEONBUK: '037',
  JEJU: '035',
  GYEONGNAM: '039',
  SUHYUP: '007',
  SAEMAUL: '045',
  SHINHYUP: '048',
  POST: '071',
};

/**
 * 토스 송금 딥링크 생성
 * @param {Object} params
 * @param {string} params.bankCode - 은행 코드 (TOSS_BANK, KB 등)
 * @param {string} params.accountNumber - 계좌번호
 * @param {number} params.amount - 송금 금액
 * @param {string} [params.message] - 송금 메모 (선택)
 * @returns {string} 토스 딥링크 URL
 */
export const createTossTransferLink = ({ bankCode, accountNumber, amount, message }) => {
  const tossBankCode = TOSS_BANK_CODES[bankCode];
  if (!tossBankCode) {
    throw new Error('유효하지 않은 은행 코드입니다.');
  }

  const cleanAccountNumber = accountNumber.replace(/-/g, '');
  if (!/^\d{7,16}$/.test(cleanAccountNumber)) {
    throw new Error('유효하지 않은 계좌번호입니다.');
  }

  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    throw new Error('유효하지 않은 금액입니다.');
  }

  const params = new URLSearchParams({
    bank: tossBankCode,
    accountNo: cleanAccountNumber,
    amount: String(numAmount),
  });

  if (message) {
    params.append('msg', String(message).slice(0, 50));
  }

  return `supertoss://send?${params.toString()}`;
};

/**
 * 토스 앱 설치 여부와 관계없이 송금 시도
 * 토스 앱이 없으면 앱스토어/플레이스토어로 이동
 * @param {Object} params - createTossTransferLink와 동일한 파라미터
 */
export const openTossTransfer = (params) => {
  const deeplink = createTossTransferLink(params);

  // 딥링크 프로토콜 화이트리스트 검증
  if (!/^supertoss:\/\/send\?/.test(deeplink)) {
    throw new Error('유효하지 않은 딥링크입니다.');
  }

  // iOS/Android 구분
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);

  // 딥링크 시도
  const startTime = Date.now();
  window.location.href = deeplink;

  // 앱이 열리지 않으면 스토어로 이동 (2초 후)
  setTimeout(() => {
    if (Date.now() - startTime < 2500) {
      if (isIOS) {
        window.location.href = 'https://apps.apple.com/kr/app/toss/id839333328';
      } else if (isAndroid) {
        window.location.href = 'https://play.google.com/store/apps/details?id=viva.republica.toss';
      }
    }
  }, 2000);
};

/**
 * 은행 코드로 은행명 가져오기
 */
export const getBankName = (bankCode) => {
  const bankNames = {
    TOSS_BANK: '토스뱅크',
    KB: 'KB국민',
    SHINHAN: '신한',
    WOORI: '우리',
    HANA: '하나',
    NH: 'NH농협',
    IBK: 'IBK기업',
    SC: 'SC제일',
    CITI: '씨티',
    KAKAO_BANK: '카카오뱅크',
    K_BANK: '케이뱅크',
    BUSAN: '부산',
    DAEGU: '대구',
    KWANGJU: '광주',
    JEONBUK: '전북',
    JEJU: '제주',
    GYEONGNAM: '경남',
    SUHYUP: '수협',
    SAEMAUL: '새마을',
    SHINHYUP: '신협',
    POST: '우체국',
  };
  return bankNames[bankCode] || bankCode;
};
