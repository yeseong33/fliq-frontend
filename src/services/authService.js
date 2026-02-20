import { authAPI } from '../api';
import { STORAGE_KEYS } from '../utils/constants';
import {
  parseCreationOptions,
  parseRequestOptions,
  bufferToBase64URL,
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable
} from '../utils/webauthn';
import { parseWebAuthnError } from '../utils/errorCodes';

export const authService = {
  // ==================== 회원가입 플로우 ====================

  /**
   * 회원가입 시작 - 이메일로 OTP 발송
   * @param {{ email: string, name: string, recaptchaToken?: string, recaptchaVersion?: string }} data
   */
  async signupStart({ email, name, recaptchaToken, recaptchaVersion }) {
    const response = await authAPI.signupStart({ email, name, recaptchaToken, recaptchaVersion });
    return response.data;
  },

  /**
   * 회원가입 OTP 검증 → signupToken 반환
   */
  async signupVerify({ email, otpCode }) {
    const response = await authAPI.signupVerify({ email, otpCode });
    const { signupToken } = response.data.data;

    // sessionStorage에 signupToken 저장 (탭 닫힘 시 삭제)
    sessionStorage.setItem(STORAGE_KEYS.SIGNUP_TOKEN, signupToken);

    return response.data;
  },

  /**
   * Passkey 등록 시작 (challenge 발급)
   */
  async signupPasskeyStart() {
    const signupToken = sessionStorage.getItem(STORAGE_KEYS.SIGNUP_TOKEN);
    if (!signupToken) {
      throw new Error('회원가입 세션이 만료되었습니다. 처음부터 다시 시도해주세요.');
    }

    const response = await authAPI.signupPasskeyStart({ signupToken });
    return response.data.data; // PasskeyRegistrationOptionsResponse
  },

  /**
   * Passkey 등록 수행 및 완료
   */
  async signupPasskeyFinish(passkeyOptions) {
    const signupToken = sessionStorage.getItem(STORAGE_KEYS.SIGNUP_TOKEN);
    if (!signupToken) {
      throw new Error('회원가입 세션이 만료되었습니다. 처음부터 다시 시도해주세요.');
    }

    try {
      // WebAuthn API로 Passkey 생성
      const publicKey = parseCreationOptions(passkeyOptions);
      const credential = await navigator.credentials.create({ publicKey });

      // API 스펙에 맞게 데이터 추출
      const clientDataJSON = bufferToBase64URL(credential.response.clientDataJSON);
      const attestationObject = bufferToBase64URL(credential.response.attestationObject);

      // 서버로 전송하여 등록 완료 및 JWT 발급
      const response = await authAPI.signupPasskeyFinish({
        signupToken,
        clientDataJSON,
        attestationObject,
      });

      const { accessToken, refreshToken, user } = response.data.data;

      // 토큰 저장 및 signupToken 삭제
      sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, `Bearer ${accessToken}`);
      if (refreshToken) {
        sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
      this.setStoredUser(user);
      sessionStorage.removeItem(STORAGE_KEYS.SIGNUP_TOKEN);

      return { accessToken, user };
    } catch (error) {
      // WebAuthn 에러 파싱
      if (error.name && ['NotSupportedError', 'NotAllowedError', 'InvalidStateError', 'SecurityError'].includes(error.name)) {
        const parsedError = parseWebAuthnError(error);
        const webAuthnError = new Error(parsedError.message);
        webAuthnError.code = parsedError.code;
        throw webAuthnError;
      }
      throw error;
    }
  },

  // ==================== 로그인 플로우 ====================

  /**
   * 로그인 시작 - 인증 challenge 발급
   * @param {{ email?: string }} data - email이 없으면 usernameless 로그인
   */
  async loginStart({ email } = {}) {
    const response = await authAPI.loginStart(email ? { email } : {});
    return response.data.data; // LoginStartResponse (includes challengeKey)
  },

  /**
   * Passkey 인증 수행 및 로그인 완료
   * @param {Object} passkeyOptions - 서버에서 받은 인증 옵션 (challengeKey 포함)
   */
  async loginFinish(passkeyOptions) {
    try {
      const { challengeKey, ...webAuthnOptions } = passkeyOptions;

      // WebAuthn API로 Passkey 인증
      const publicKey = parseRequestOptions(webAuthnOptions);
      const credential = await navigator.credentials.get({ publicKey });

      // API 스펙에 맞게 데이터 추출
      const credentialId = credential.id;
      const clientDataJSON = bufferToBase64URL(credential.response.clientDataJSON);
      const authenticatorData = bufferToBase64URL(credential.response.authenticatorData);
      const signature = bufferToBase64URL(credential.response.signature);
      const userHandle = credential.response.userHandle
        ? bufferToBase64URL(credential.response.userHandle)
        : undefined;

      // 서버로 전송하여 JWT 발급 (challengeKey 포함)
      const response = await authAPI.loginFinish({
        challengeKey,
        credentialId,
        clientDataJSON,
        authenticatorData,
        signature,
        userHandle,
      });

      const { accessToken, refreshToken, user } = response.data.data;

      // 토큰 저장
      sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, `Bearer ${accessToken}`);
      if (refreshToken) {
        sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
      this.setStoredUser(user);

      return { accessToken, user };
    } catch (error) {
      // WebAuthn 에러 파싱
      if (error.name && ['NotSupportedError', 'NotAllowedError', 'InvalidStateError', 'SecurityError'].includes(error.name)) {
        const parsedError = parseWebAuthnError(error);
        const webAuthnError = new Error(parsedError.message);
        webAuthnError.code = parsedError.code;
        throw webAuthnError;
      }
      throw error;
    }
  },

  // ==================== 계정 복구 플로우 ====================

  /**
   * 계정 복구 시작 - OTP 발송
   * @param {{ email: string, recaptchaToken?: string, recaptchaVersion?: string }} data
   */
  async recoveryStart({ email, recaptchaToken, recaptchaVersion }) {
    const response = await authAPI.recoveryStart({ email, recaptchaToken, recaptchaVersion });
    return response.data;
  },

  /**
   * 계정 복구 OTP 검증 → recoveryToken 반환
   */
  async recoveryVerify({ email, otpCode }) {
    const response = await authAPI.recoveryVerify({ email, otpCode });
    const { recoveryToken } = response.data.data;

    // sessionStorage에 recoveryToken 저장
    sessionStorage.setItem(STORAGE_KEYS.RECOVERY_TOKEN, recoveryToken);

    return response.data;
  },

  /**
   * 새 Passkey 등록 시작 (challenge 발급)
   */
  async recoveryPasskeyStart() {
    const recoveryToken = sessionStorage.getItem(STORAGE_KEYS.RECOVERY_TOKEN);
    if (!recoveryToken) {
      throw new Error('복구 세션이 만료되었습니다. 처음부터 다시 시도해주세요.');
    }

    const response = await authAPI.recoveryPasskeyStart({ recoveryToken });
    return response.data.data; // PasskeyRegistrationOptionsResponse
  },

  /**
   * 새 Passkey 등록 수행 및 완료
   */
  async recoveryPasskeyFinish(passkeyOptions) {
    const recoveryToken = sessionStorage.getItem(STORAGE_KEYS.RECOVERY_TOKEN);
    if (!recoveryToken) {
      throw new Error('복구 세션이 만료되었습니다. 처음부터 다시 시도해주세요.');
    }

    try {
      // WebAuthn API로 Passkey 생성
      const publicKey = parseCreationOptions(passkeyOptions);
      const credential = await navigator.credentials.create({ publicKey });

      // API 스펙에 맞게 데이터 추출
      const clientDataJSON = bufferToBase64URL(credential.response.clientDataJSON);
      const attestationObject = bufferToBase64URL(credential.response.attestationObject);

      // 서버로 전송하여 등록 완료 및 JWT 발급
      const response = await authAPI.recoveryPasskeyFinish({
        recoveryToken,
        clientDataJSON,
        attestationObject,
      });

      const { accessToken, refreshToken, user } = response.data.data;

      // 토큰 저장 및 recoveryToken 삭제
      sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, `Bearer ${accessToken}`);
      if (refreshToken) {
        sessionStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      }
      this.setStoredUser(user);
      sessionStorage.removeItem(STORAGE_KEYS.RECOVERY_TOKEN);

      return { accessToken, user };
    } catch (error) {
      // WebAuthn 에러 파싱
      if (error.name && ['NotSupportedError', 'NotAllowedError', 'InvalidStateError', 'SecurityError'].includes(error.name)) {
        const parsedError = parseWebAuthnError(error);
        const webAuthnError = new Error(parsedError.message);
        webAuthnError.code = parsedError.code;
        throw webAuthnError;
      }
      throw error;
    }
  },

  // ==================== OTP 재발송 ====================

  /**
   * 회원가입 OTP 재발송
   * @param {{ email: string, name: string, recaptchaToken?: string, recaptchaVersion?: string }} data
   */
  async resendSignupOTP({ email, name, recaptchaToken, recaptchaVersion }) {
    const response = await authAPI.signupStart({ email, name, recaptchaToken, recaptchaVersion });
    return response.data;
  },

  /**
   * 계정 복구 OTP 재발송
   * @param {{ email: string, recaptchaToken?: string, recaptchaVersion?: string }} data
   */
  async resendRecoveryOTP({ email, recaptchaToken, recaptchaVersion }) {
    const response = await authAPI.recoveryStart({ email, recaptchaToken, recaptchaVersion });
    return response.data;
  },

  // ==================== WebAuthn 지원 확인 ====================

  isWebAuthnSupported() {
    return isWebAuthnSupported();
  },

  async isPlatformAuthenticatorAvailable() {
    return isPlatformAuthenticatorAvailable();
  },

  // ==================== 기타 유틸리티 ====================

  async logout() {
    const refreshToken = sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    // 서버에서 Refresh Token 폐기 (실패해도 로컬 정리 진행)
    if (refreshToken) {
      try {
        await authAPI.logout({ refreshToken });
      } catch {
        // 네트워크 오류 등 무시
      }
    }

    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.SIGNUP_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.RECOVERY_TOKEN);
  },

  /**
   * 강제 로그아웃 (401 refresh 실패 시, API 호출 없이 로컬만 정리)
   */
  forceLogout() {
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.SIGNUP_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.RECOVERY_TOKEN);
  },

  isAuthenticated() {
    return !!sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },

  getStoredUser() {
    const userStr = sessionStorage.getItem(STORAGE_KEYS.USER);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      sessionStorage.removeItem(STORAGE_KEYS.USER);
      return null;
    }
  },

  setStoredUser(user) {
    sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  clearSignupSession() {
    sessionStorage.removeItem(STORAGE_KEYS.SIGNUP_TOKEN);
  },

  clearRecoverySession() {
    sessionStorage.removeItem(STORAGE_KEYS.RECOVERY_TOKEN);
  },

  hasSignupToken() {
    return !!sessionStorage.getItem(STORAGE_KEYS.SIGNUP_TOKEN);
  },

  hasRecoveryToken() {
    return !!sessionStorage.getItem(STORAGE_KEYS.RECOVERY_TOKEN);
  },
};
