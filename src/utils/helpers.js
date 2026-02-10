import logger from './logger';

/**
 * 서버 응답 날짜 파싱 (여러 형식 지원)
 * - epoch millis (number): 1737272200000
 * - epoch millis (string): "1737272200000"
 * - ISO 8601 (string): "2025-01-19T06:30:00Z", "2025-01-19T15:30:00+09:00"
 * - 날짜 문자열 (string): "2025-01-19T15:30:00"
 */
export const parseDate = (value) => {
  if (value === null || value === undefined || value === '') return null;

  // 이미 Date 객체인 경우
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // number인 경우 epoch millis로 처리
  if (typeof value === 'number') {
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  // string인 경우
  if (typeof value === 'string') {
    // 숫자로만 이루어진 문자열이면 epoch millis로 처리
    if (/^\d+$/.test(value)) {
      const date = new Date(parseInt(value, 10));
      return isNaN(date.getTime()) ? null : date;
    }

    // ISO 8601 또는 날짜 문자열
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
};

/**
 * Date 객체를 epoch millis로 변환 (서버 전송용)
 * - 서버가 epoch millis를 기대
 */
export const toEpochMillis = (date) => {
  if (!date) return null;
  if (typeof date === 'number') return date;
  if (date instanceof Date) return date.getTime();
  return null;
};

// 기존 함수명 유지 (호환성)
export const parseToKST = parseDate;
export const toKSTString = toEpochMillis;
export const toUTCString = toEpochMillis;

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return '날짜 없음';

  try {
    const date = parseDate(dateString);
    if (!date) {
      return '잘못된 날짜';
    }

    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Seoul',
    }).format(date);
  } catch (error) {
    logger.error('날짜 형식 변환 오류:', error);
    return '날짜 형식 오류';
  }
};

export const formatRelativeTime = (dateString) => {
  const date = parseDate(dateString);
  if (!date) return '';

  const now = new Date();
  const diff = now - date;

  // 미래 시간인 경우
  if (diff < 0) {
    const futureDiff = -diff;
    const minutes = Math.floor(futureDiff / 60000);
    const hours = Math.floor(futureDiff / 3600000);
    const days = Math.floor(futureDiff / 86400000);

    if (minutes < 1) return '곧';
    if (minutes < 60) return `${minutes}분 후`;
    if (hours < 24) return `${hours}시간 후`;
    return `${days}일 후`;
  }

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
};

export const formatSmartDate = (dateString) => {
  if (!dateString) return null;

  const date = parseDate(dateString);
  if (!date) return null;

  // KST 기준으로 날짜/시간 정보 추출
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
    weekday: 'short',
  });

  const parts = formatter.formatToParts(date);
  const getPart = (type) => parts.find(p => p.type === type)?.value;

  const year = parseInt(getPart('year'));
  const month = parseInt(getPart('month'));
  const day = parseInt(getPart('day'));
  const hours = parseInt(getPart('hour'));
  const minutes = parseInt(getPart('minute'));

  // 현재 시간 (KST 기준)
  const now = new Date();
  const nowParts = formatter.formatToParts(now);
  const getNowPart = (type) => nowParts.find(p => p.type === type)?.value;

  const nowYear = parseInt(getNowPart('year'));
  const nowMonth = parseInt(getNowPart('month'));
  const nowDay = parseInt(getNowPart('day'));

  const isToday = year === nowYear && month === nowMonth && day === nowDay;
  const isYesterday = year === nowYear && month === nowMonth && day === nowDay - 1;
  const isTomorrow = year === nowYear && month === nowMonth && day === nowDay + 1;

  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = days[new Date(year, month - 1, day).getDay()];

  const ampm = hours >= 12 ? '오후' : '오전';
  const displayHours = hours % 12 || 12;
  const timeString = `${ampm} ${displayHours}:${minutes.toString().padStart(2, '0')}`;

  let relativeText = null;
  if (isToday) relativeText = '오늘';
  else if (isYesterday) relativeText = '어제';
  else if (isTomorrow) relativeText = '내일';

  return {
    month,
    day,
    year,
    dayName,
    timeString,
    isToday,
    isYesterday,
    isTomorrow,
    relativeText,
    fullDate: date,
  };
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'COMPLETED':
      return 'status-completed';
    case 'PENDING':
      return 'status-pending';
    case 'FAILED':
    case 'CANCELLED':
      return 'status-failed';
    default:
      return 'status-pending';
  }
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    logger.error('클립보드 복사 실패:', err);
    return false;
  }
};

export const shareUrl = async (url, title) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        url,
      });
      return true;
    } catch (err) {
      logger.error('공유 실패:', err);
    }
  }
  
  // 공유 API가 지원되지 않으면 클립보드에 복사
  return await copyToClipboard(url);
};

export const isExpired = (expiryTime) => {
  const expiry = parseDate(expiryTime);
  if (!expiry) return true;
  return new Date() > expiry;
};

export const getRemainingTime = (expiryTime) => {
  const now = new Date();
  const expiry = parseDate(expiryTime);
  if (!expiry) return null;

  const diff = expiry - now;

  if (diff <= 0) return null;

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return { minutes, seconds };
};