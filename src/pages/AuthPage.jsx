import React from 'react';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';
import OTPVerification from '../components/auth/OTPVerification';
import SignupAccountStep from '../components/auth/SignupAccountStep';
import PasskeyRegistration from '../components/auth/PasskeyRegistration';
import RecoveryForm from '../components/auth/RecoveryForm';
import { useAuth } from '../hooks/useAuth';
import { AUTH_FLOW } from '../utils/constants';

const AuthPage = () => {
  // 인증 완료 후 리다이렉트는 App.jsx의 RedirectFromAuth에서 처리
  const {
    authFlow,
    goToSignup,
    goToLogin,
    goToRecovery,
    resetFlow,
  } = useAuth();


  const handleSwitchToSignup = () => {
    goToSignup();
  };

  const handleSwitchToLogin = () => {
    goToLogin();
  };

  const handleSwitchToRecovery = () => {
    goToRecovery();
  };

  const handleBack = () => {
    resetFlow();
    goToLogin();
  };

  const renderContent = () => {
    switch (authFlow) {
      // 로그인 플로우
      case AUTH_FLOW.LOGIN_EMAIL:
      case AUTH_FLOW.LOGIN_PASSKEY:
        return (
          <LoginForm
            onSwitchToSignup={handleSwitchToSignup}
            onSwitchToRecovery={handleSwitchToRecovery}
          />
        );

      // 회원가입 플로우
      case AUTH_FLOW.SIGNUP_EMAIL:
        return <SignupForm onSwitchToLogin={handleSwitchToLogin} />;

      case AUTH_FLOW.SIGNUP_OTP:
        return <OTPVerification onBack={handleBack} />;

      case AUTH_FLOW.SIGNUP_ACCOUNT:
        return <SignupAccountStep onBack={handleBack} />;

      case AUTH_FLOW.SIGNUP_PASSKEY:
        return <PasskeyRegistration onBack={handleBack} />;

      // 계정 복구 플로우
      case AUTH_FLOW.RECOVERY_EMAIL:
        return <RecoveryForm onSwitchToLogin={handleSwitchToLogin} />;

      case AUTH_FLOW.RECOVERY_OTP:
        return <OTPVerification onBack={handleBack} />;

      case AUTH_FLOW.RECOVERY_PASSKEY:
        return <PasskeyRegistration onBack={handleBack} />;

      // 기본값: 로그인 화면
      case AUTH_FLOW.IDLE:
      default:
        return (
          <LoginForm
            onSwitchToSignup={handleSwitchToSignup}
            onSwitchToRecovery={handleSwitchToRecovery}
          />
        );
    }
  };

  return (
    <div className="page bg-white dark:bg-gray-900 transition-colors duration-200">
      {renderContent()}
    </div>
  );
};

export default AuthPage;
