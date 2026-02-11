import React, { useRef, useEffect, useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';
import ConsentForm from '../components/auth/ConsentForm';
import OTPVerification from '../components/auth/OTPVerification';
import SignupAccountStep from '../components/auth/SignupAccountStep';
import PasskeyRegistration from '../components/auth/PasskeyRegistration';
import RecoveryForm from '../components/auth/RecoveryForm';
import { useAuth } from '../hooks/useAuth';
import { AUTH_FLOW } from '../utils/constants';

// 플로우 순서 정의 (인덱스가 클수록 앞으로 진행)
const FLOW_ORDER = [
  AUTH_FLOW.IDLE,
  AUTH_FLOW.LOGIN_EMAIL,
  AUTH_FLOW.LOGIN_PASSKEY,
  AUTH_FLOW.SIGNUP_CONSENT,
  AUTH_FLOW.SIGNUP_EMAIL,
  AUTH_FLOW.SIGNUP_OTP,
  AUTH_FLOW.SIGNUP_PASSKEY,
  AUTH_FLOW.SIGNUP_ACCOUNT,
  AUTH_FLOW.RECOVERY_EMAIL,
  AUTH_FLOW.RECOVERY_OTP,
  AUTH_FLOW.RECOVERY_PASSKEY,
];

const getFlowIndex = (flow) => {
  const idx = FLOW_ORDER.indexOf(flow);
  return idx >= 0 ? idx : 0;
};

const AuthPage = () => {
  const {
    authFlow,
    goToSignup,
    goToLogin,
    goToRecovery,
    resetFlow,
  } = useAuth();

  const prevFlowRef = useRef(authFlow);
  const [animClass, setAnimClass] = useState('');

  useEffect(() => {
    const prevFlow = prevFlowRef.current;
    if (prevFlow === authFlow) return;

    const prevIdx = getFlowIndex(prevFlow);
    const currIdx = getFlowIndex(authFlow);

    // 로그인 ↔ 회원가입 ↔ 복구 전환은 fade, 같은 플로우 내 진행은 forward/backward
    const isCrossFlow =
      (prevIdx <= 2 && currIdx >= 3) || // 로그인 → 회원가입/복구
      (prevIdx >= 3 && currIdx <= 2) || // 회원가입/복구 → 로그인
      (prevIdx <= 7 && currIdx >= 8) || // 회원가입 → 복구
      (prevIdx >= 8 && currIdx <= 7);   // 복구 → 회원가입/로그인

    if (isCrossFlow) {
      setAnimClass('auth-step-fade');
    } else if (currIdx > prevIdx) {
      setAnimClass('auth-step-forward');
    } else {
      setAnimClass('auth-step-backward');
    }

    prevFlowRef.current = authFlow;
  }, [authFlow]);

  // 애니메이션 끝나면 클래스 제거
  const handleAnimEnd = () => setAnimClass('');

  const handleSwitchToSignup = () => goToSignup();
  const handleSwitchToLogin = () => goToLogin();
  const handleSwitchToRecovery = () => goToRecovery();
  const handleBack = () => {
    resetFlow();
    goToLogin();
  };

  const renderContent = () => {
    switch (authFlow) {
      case AUTH_FLOW.LOGIN_EMAIL:
      case AUTH_FLOW.LOGIN_PASSKEY:
        return (
          <LoginForm
            onSwitchToSignup={handleSwitchToSignup}
            onSwitchToRecovery={handleSwitchToRecovery}
          />
        );

      case AUTH_FLOW.SIGNUP_CONSENT:
        return <ConsentForm onSwitchToLogin={handleSwitchToLogin} />;

      case AUTH_FLOW.SIGNUP_EMAIL:
        return <SignupForm onSwitchToLogin={handleSwitchToLogin} />;

      case AUTH_FLOW.SIGNUP_OTP:
        return <OTPVerification onBack={handleBack} />;

      case AUTH_FLOW.SIGNUP_ACCOUNT:
        return <SignupAccountStep onBack={handleBack} />;

      case AUTH_FLOW.SIGNUP_PASSKEY:
        return <PasskeyRegistration onBack={handleBack} />;

      case AUTH_FLOW.RECOVERY_EMAIL:
        return <RecoveryForm onSwitchToLogin={handleSwitchToLogin} />;

      case AUTH_FLOW.RECOVERY_OTP:
        return <OTPVerification onBack={handleBack} />;

      case AUTH_FLOW.RECOVERY_PASSKEY:
        return <PasskeyRegistration onBack={handleBack} />;

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
      <div
        key={authFlow}
        className={animClass}
        onAnimationEnd={handleAnimEnd}
      >
        {renderContent()}
      </div>
    </div>
  );
};

export default AuthPage;
