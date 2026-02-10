import { useState, useCallback, useRef } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { RECAPTCHA, ERROR_CODES } from '../utils/constants';
import logger from '../utils/logger';

/**
 * reCAPTCHA v3 + v2 fallback 훅
 *
 * 사용법:
 * const { executeRecaptcha, showV2, v2Ref, isV2Required, resetV2 } = useRecaptcha();
 *
 * // 폼 제출 시
 * const { token, version } = await executeRecaptcha('signup');
 * await submitForm({ recaptchaToken: token, recaptchaVersion: version });
 *
 * // 에러 처리
 * if (error.code === ERROR_CODES.RECAPTCHA_V2_REQUIRED) {
 *   showV2(); // v2 챌린지 표시
 * }
 */
export const useRecaptcha = () => {
  const { executeRecaptcha: executeV3 } = useGoogleReCaptcha();
  const [isV2Required, setIsV2Required] = useState(false);
  const [v2Token, setV2Token] = useState(null);
  const v2Ref = useRef(null);

  /**
   * reCAPTCHA 토큰 생성
   * v2가 필요하면 v2 토큰, 아니면 v3 토큰 반환
   */
  const executeRecaptcha = useCallback(async (action) => {
    // v2가 필요한 경우 v2 토큰 반환
    if (isV2Required && v2Token) {
      return {
        token: v2Token,
        version: RECAPTCHA.VERSION.V2,
      };
    }

    // v3 토큰 생성
    if (!executeV3) {
      logger.warn('reCAPTCHA v3 not ready');
      return { token: null, version: null };
    }

    try {
      const token = await executeV3(action);
      return {
        token,
        version: RECAPTCHA.VERSION.V3,
      };
    } catch (error) {
      logger.error('reCAPTCHA v3 error:', error);
      return { token: null, version: null };
    }
  }, [executeV3, isV2Required, v2Token]);

  /**
   * v2 챌린지 표시
   */
  const showV2 = useCallback(() => {
    setIsV2Required(true);
    setV2Token(null);
  }, []);

  /**
   * v2 토큰 설정 (ReCAPTCHA v2 컴포넌트의 onChange에서 호출)
   */
  const onV2Change = useCallback((token) => {
    setV2Token(token);
  }, []);

  /**
   * v2 만료 시 호출
   */
  const onV2Expired = useCallback(() => {
    setV2Token(null);
    if (v2Ref.current) {
      v2Ref.current.reset();
    }
  }, []);

  /**
   * v2 상태 리셋 (성공 후 또는 다시 시도할 때)
   */
  const resetV2 = useCallback(() => {
    setIsV2Required(false);
    setV2Token(null);
    if (v2Ref.current) {
      v2Ref.current.reset();
    }
  }, []);

  /**
   * 에러가 v2 필요 에러인지 확인
   */
  const isV2RequiredError = useCallback((error) => {
    return error?.code === ERROR_CODES.RECAPTCHA_V2_REQUIRED ||
           error?.response?.data?.code === ERROR_CODES.RECAPTCHA_V2_REQUIRED;
  }, []);

  return {
    executeRecaptcha,
    showV2,
    isV2Required,
    v2Token,
    v2Ref,
    onV2Change,
    onV2Expired,
    resetV2,
    isV2RequiredError,
    isV2Ready: isV2Required && !!v2Token,
  };
};

export default useRecaptcha;
