import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const {
    // 사용자 정보
    user,
    loading,
    isAuthenticated,

    // 인증 플로우 상태
    authFlow,
    flowData,
    error,
    webAuthnSupported,

    // 초기화
    initialize,

    // 회원가입 플로우
    signupStart,
    signupVerify,
    signupPasskeyFinish,
    completeSignup,

    // 로그인 플로우
    loginStart,
    loginFinish,

    // 계정 복구 플로우
    recoveryStart,
    recoveryVerify,
    recoveryPasskeyFinish,

    // OTP 재발송
    resendOTP,

    // 플로우 전환
    setAuthFlow,
    goToSignup,
    goToLogin,
    goToRecovery,
    resetFlow,

    // 약관 동의
    acceptConsents,
    setConsentChecked,
    consentChecked,
    needsConsent,

    // 로그아웃
    logout,

    // 에러 처리
    setError,
    clearError,
  } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    // 사용자 정보
    user,
    loading,
    isAuthenticated,

    // 인증 플로우 상태
    authFlow,
    flowData,
    error,
    webAuthnSupported,

    // 회원가입 플로우
    signupStart,
    signupVerify,
    signupPasskeyFinish,
    completeSignup,

    // 로그인 플로우
    loginStart,
    loginFinish,

    // 계정 복구 플로우
    recoveryStart,
    recoveryVerify,
    recoveryPasskeyFinish,

    // OTP 재발송
    resendOTP,

    // 플로우 전환
    setAuthFlow,
    goToSignup,
    goToLogin,
    goToRecovery,
    resetFlow,

    // 약관 동의
    acceptConsents,
    setConsentChecked,
    consentChecked,
    needsConsent,

    // 로그아웃
    logout,

    // 에러 처리
    setError,
    clearError,
  };
};
