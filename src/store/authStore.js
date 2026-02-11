import { create } from 'zustand';
import { authService } from '../services/authService';
import { consentAPI } from '../api/consent';
import { STORAGE_KEYS, AUTH_FLOW } from '../utils/constants';

export const useAuthStore = create((set, get) => ({
  // 사용자 정보
  user: null,
  isAuthenticated: false,
  initializing: true, // 앱 초기화 전용
  loading: false,     // 개별 작업용

  // 인증 플로우 상태
  authFlow: AUTH_FLOW.IDLE,
  flowData: {
    email: null,
    name: null,
    passkeyOptions: null,
    consents: null,
  },
  error: null,

  // WebAuthn 지원 여부
  webAuthnSupported: false,

  // 약관 동의 확인 (기존 사용자용)
  consentChecked: false,
  needsConsent: false,

  // ==================== 초기화 ====================

  initialize: async () => {
    // 이미 초기화 완료된 경우 스킵 (불필요한 재파싱 및 리렌더 방지)
    if (!get().initializing) return;

    try {
      const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const storedUser = authService.getStoredUser();
      const webAuthnSupported = authService.isWebAuthnSupported();

      if (!token || !storedUser) {
        sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        sessionStorage.removeItem(STORAGE_KEYS.USER);

        set({
          isAuthenticated: false,
          user: null,
          initializing: false,
          webAuthnSupported,
        });
        return;
      }

      // 필수 약관 동의 여부 확인
      // 명시적으로 allRequiredAgreed: false 일 때만 동의 페이지 표시
      let consentChecked = true;
      let needsConsent = false;
      try {
        const res = await consentAPI.checkRequired();
        const data = res.data?.data || res.data;
        if (data?.allRequiredAgreed === false) {
          consentChecked = false;
          needsConsent = true;
        }
      } catch {
        // 약관 API 실패 시 통과 (서버 미구현 등)
      }

      set({
        isAuthenticated: true,
        user: storedUser,
        initializing: false,
        webAuthnSupported,
        consentChecked,
        needsConsent,
      });
    } catch (error) {
      sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      sessionStorage.removeItem(STORAGE_KEYS.USER);

      set({
        isAuthenticated: false,
        user: null,
        initializing: false,
        webAuthnSupported: authService.isWebAuthnSupported(),
      });
    }
  },

  // ==================== 회원가입 플로우 ====================

  /**
   * 회원가입 시작 - 이메일 입력 → OTP 발송
   * @param {{ email: string, name: string, recaptchaToken?: string, recaptchaVersion?: string }} data
   */
  signupStart: async ({ email, name, recaptchaToken, recaptchaVersion }) => {
    set({ loading: true, error: null });
    try {
      await authService.signupStart({ email, name, recaptchaToken, recaptchaVersion });

      set({
        loading: false,
        authFlow: AUTH_FLOW.SIGNUP_OTP,
        flowData: { ...get().flowData, email, name },
      });

      return { success: true };
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  /**
   * 회원가입 OTP 검증 → Passkey 등록으로 이동
   */
  signupVerify: async ({ otpCode }) => {
    const { email } = get().flowData;
    set({ loading: true, error: null });

    try {
      await authService.signupVerify({ email, otpCode });

      // OTP 검증 후 바로 Passkey 등록 시작 (challenge 발급)
      const passkeyOptions = await authService.signupPasskeyStart();

      set({
        loading: false,
        authFlow: AUTH_FLOW.SIGNUP_PASSKEY,
        flowData: { ...get().flowData, passkeyOptions },
      });

      return { success: true };
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  /**
   * Passkey 등록 완료 → 계좌 등록 화면으로 (선택)
   */
  signupPasskeyFinish: async () => {
    const { passkeyOptions, consents } = get().flowData;
    set({ loading: true, error: null });

    try {
      const { user } = await authService.signupPasskeyFinish(passkeyOptions);

      // 인증 완료 후 약관 동의 전송
      if (consents) {
        try {
          await consentAPI.saveAll(consents);
        } catch {
          // 약관 저장 실패 시에도 회원가입은 완료 처리
        }
      }

      set({
        loading: false,
        isAuthenticated: true,
        user,
        authFlow: AUTH_FLOW.SIGNUP_ACCOUNT, // 계좌 등록 화면으로
        flowData: { email: null, name: null, passkeyOptions: null, consents: null },
        consentChecked: true,
        needsConsent: false,
      });

      return { success: true };
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  /**
   * 계좌 등록 완료/스킵 → 회원가입 완료
   */
  completeSignup: () => {
    set({
      authFlow: AUTH_FLOW.IDLE,
    });
  },

  // ==================== 로그인 플로우 ====================

  /**
   * 로그인 시작 - Passkey 인증 프롬프트
   * @param {{ email?: string }} data - email이 없으면 usernameless 로그인
   */
  loginStart: async ({ email } = {}) => {
    set({ loading: true, error: null });

    try {
      // 인증 옵션 발급 (email이 없으면 usernameless 로그인)
      const passkeyOptions = await authService.loginStart(email ? { email } : {});

      set({
        loading: false,
        authFlow: AUTH_FLOW.LOGIN_PASSKEY,
        flowData: { ...get().flowData, email: email || null, passkeyOptions },
      });

      return { success: true, passkeyOptions };
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  /**
   * Passkey 인증 완료 → 로그인 완료
   */
  loginFinish: async () => {
    const { passkeyOptions } = get().flowData;
    set({ loading: true, error: null });

    try {
      const { user } = await authService.loginFinish(passkeyOptions);

      // 로그인 시 필수 약관 동의 여부 확인
      // 명시적으로 allRequiredAgreed: false 일 때만 동의 페이지 표시
      let consentChecked = true;
      let needsConsent = false;
      try {
        const res = await consentAPI.checkRequired();
        const data = res.data?.data || res.data;
        if (data?.allRequiredAgreed === false) {
          consentChecked = false;
          needsConsent = true;
        }
      } catch {
        // 약관 API 실패 시 통과
      }

      set({
        loading: false,
        isAuthenticated: true,
        user,
        authFlow: AUTH_FLOW.IDLE,
        flowData: { email: null, name: null, passkeyOptions: null, consents: null },
        consentChecked,
        needsConsent,
      });

      return { success: true };
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // ==================== 계정 복구 플로우 ====================

  /**
   * 계정 복구 시작 - 이메일 입력 → OTP 발송
   * @param {{ email: string, recaptchaToken?: string, recaptchaVersion?: string }} data
   */
  recoveryStart: async ({ email, recaptchaToken, recaptchaVersion }) => {
    set({ loading: true, error: null });

    try {
      await authService.recoveryStart({ email, recaptchaToken, recaptchaVersion });

      set({
        loading: false,
        authFlow: AUTH_FLOW.RECOVERY_OTP,
        flowData: { ...get().flowData, email },
      });

      return { success: true };
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  /**
   * 계정 복구 OTP 검증 → 새 Passkey 등록 화면으로
   */
  recoveryVerify: async ({ otpCode }) => {
    const { email } = get().flowData;
    set({ loading: true, error: null });

    try {
      await authService.recoveryVerify({ email, otpCode });

      // 새 Passkey 등록 시작 (challenge 발급)
      const passkeyOptions = await authService.recoveryPasskeyStart();

      set({
        loading: false,
        authFlow: AUTH_FLOW.RECOVERY_PASSKEY,
        flowData: { ...get().flowData, passkeyOptions },
      });

      return { success: true };
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  /**
   * 새 Passkey 등록 완료 → 로그인 완료
   */
  recoveryPasskeyFinish: async () => {
    const { passkeyOptions } = get().flowData;
    set({ loading: true, error: null });

    try {
      const { user } = await authService.recoveryPasskeyFinish(passkeyOptions);

      set({
        loading: false,
        isAuthenticated: true,
        user,
        authFlow: AUTH_FLOW.IDLE,
        flowData: { email: null, name: null, passkeyOptions: null, consents: null },
      });

      return { success: true };
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // ==================== OTP 재발송 ====================

  /**
   * OTP 재발송
   * @param {{ recaptchaToken?: string, recaptchaVersion?: string }} options
   */
  resendOTP: async ({ recaptchaToken, recaptchaVersion } = {}) => {
    const { authFlow, flowData } = get();
    const { email, name } = flowData;
    set({ loading: true, error: null });

    try {
      if (authFlow === AUTH_FLOW.SIGNUP_OTP) {
        await authService.resendSignupOTP({ email, name, recaptchaToken, recaptchaVersion });
      } else if (authFlow === AUTH_FLOW.RECOVERY_OTP) {
        await authService.resendRecoveryOTP({ email, recaptchaToken, recaptchaVersion });
      }

      set({ loading: false });
      return { success: true };
    } catch (error) {
      set({ loading: false, error: error.message });
      throw error;
    }
  },

  // ==================== 플로우 전환 ====================

  setAuthFlow: (flow) => {
    set({ authFlow: flow, error: null });
  },

  goToSignup: () => {
    set({
      authFlow: AUTH_FLOW.SIGNUP_CONSENT,
      flowData: { email: null, name: null, passkeyOptions: null, consents: null },
      error: null,
    });
  },

  goToLogin: () => {
    set({
      authFlow: AUTH_FLOW.LOGIN_EMAIL,
      flowData: { email: null, name: null, passkeyOptions: null, consents: null },
      error: null,
    });
  },

  goToRecovery: () => {
    set({
      authFlow: AUTH_FLOW.RECOVERY_EMAIL,
      flowData: { email: null, name: null, passkeyOptions: null, consents: null },
      error: null,
    });
  },

  /**
   * 약관 동의 저장 → 이메일 입력으로 전환 (회원가입 플로우)
   */
  acceptConsents: (consents) => {
    set({
      authFlow: AUTH_FLOW.SIGNUP_EMAIL,
      flowData: { ...get().flowData, consents },
      error: null,
    });
  },

  /**
   * 기존 사용자 약관 동의 확인 완료
   */
  setConsentChecked: (checked) => {
    set({ consentChecked: checked, needsConsent: !checked });
  },

  resetFlow: () => {
    authService.clearSignupSession();
    authService.clearRecoverySession();
    set({
      authFlow: AUTH_FLOW.IDLE,
      flowData: { email: null, name: null, passkeyOptions: null, consents: null },
      error: null,
    });
  },

  // ==================== 로그아웃 ====================

  logout: () => {
    authService.logout();
    set({
      user: null,
      isAuthenticated: false,
      authFlow: AUTH_FLOW.IDLE,
      flowData: { email: null, name: null, passkeyOptions: null, consents: null },
      error: null,
      consentChecked: false,
      needsConsent: false,
    });
  },

  // ==================== 에러 처리 ====================

  setError: (error) => {
    set({ error });
  },

  clearError: () => {
    set({ error: null });
  },
}));
