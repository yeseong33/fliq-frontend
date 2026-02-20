import api from './config';

export const authAPI = {
  // ==================== 회원가입 ====================

  /**
   * 회원가입 시작 - 이메일로 OTP 발송
   * @param {{ email: string, name: string, recaptchaToken?: string, recaptchaVersion?: string }} data
   */
  signupStart: (data) => {
    return api.post('/auth/signup/start', data);
  },

  /**
   * 회원가입 OTP 검증 → signupToken 반환
   * @param {{ email: string, otpCode: string }} data
   */
  signupVerify: (data) => {
    return api.post('/auth/signup/verify', data);
  },

  /**
   * Passkey 등록 시작 (challenge 발급)
   * @param {{ signupToken: string }} data
   */
  signupPasskeyStart: (data) => {
    return api.post('/auth/signup/passkey/start', data);
  },

  /**
   * Passkey 등록 완료 + JWT 발급
   * @param {{ signupToken: string, clientDataJSON: string, attestationObject: string }} data
   */
  signupPasskeyFinish: (data) => {
    return api.post('/auth/signup/passkey/finish', data);
  },

  // ==================== 로그인 ====================

  /**
   * 로그인 시작 - 인증 challenge 발급
   * @param {{ email: string }} data
   */
  loginStart: (data) => {
    return api.post('/auth/login/start', data);
  },

  /**
   * 로그인 완료 - Passkey 인증 후 JWT 발급
   * @param {{ credentialId: string, clientDataJSON: string, authenticatorData: string, signature: string, userHandle?: string }} data
   */
  loginFinish: (data) => {
    return api.post('/auth/login/finish', data);
  },

  // ==================== 계정 복구 ====================

  /**
   * 계정 복구 시작 - OTP 발송
   * @param {{ email: string, recaptchaToken?: string, recaptchaVersion?: string }} data
   */
  recoveryStart: (data) => {
    return api.post('/auth/recovery/start', data);
  },

  /**
   * 계정 복구 OTP 검증 → recoveryToken 반환
   * @param {{ email: string, otpCode: string }} data
   */
  recoveryVerify: (data) => {
    return api.post('/auth/recovery/verify', data);
  },

  /**
   * 새 Passkey 등록 시작 (challenge 발급)
   * @param {{ recoveryToken: string }} data
   */
  recoveryPasskeyStart: (data) => {
    return api.post('/auth/recovery/passkey/start', data);
  },

  /**
   * 새 Passkey 등록 완료 + JWT 발급
   * @param {{ recoveryToken: string, clientDataJSON: string, attestationObject: string }} data
   */
  recoveryPasskeyFinish: (data) => {
    return api.post('/auth/recovery/passkey/finish', data);
  },

  // ==================== 토큰 갱신 ====================

  /**
   * Refresh Token으로 Access Token 갱신 (토큰 rotation)
   * @param {{ refreshToken: string }} data
   * @returns {{ accessToken: string, refreshToken: string }}
   */
  refresh: (data) => {
    return api.post('/auth/refresh', data);
  },

  // ==================== 로그아웃 ====================

  /**
   * 로그아웃 - 서버에서 Refresh Token 폐기
   * @param {{ refreshToken?: string }} data
   */
  logout: (data) => {
    return api.post('/auth/logout', data);
  },
};
