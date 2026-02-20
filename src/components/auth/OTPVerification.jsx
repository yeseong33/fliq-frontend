import React, { useState, useEffect, useRef } from 'react';
import toast from '../../utils/toast';
import { useAuth } from '../../hooks/useAuth';
import { validateOTP } from '../../utils/validation';
import { AUTH_FLOW } from '../../utils/constants';

const OTPVerification = ({ onBack }) => {
  const { authFlow, flowData, signupVerify, recoveryVerify, resendOTP, goToLogin } = useAuth();

  const email = flowData?.email;
  const isSignup = authFlow === AUTH_FLOW.SIGNUP_OTP;
  const isRecovery = authFlow === AUTH_FLOW.RECOVERY_OTP;

  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5분
  const [resendCooldown, setResendCooldown] = useState(0);

  const formRef = useRef(null);
  const [focusedField, setFocusedField] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!otpCode) {
      setError('인증 코드를 입력해주세요.');
      triggerShake();
      return;
    }

    if (!validateOTP(otpCode)) {
      setError('6자리 숫자를 입력해주세요.');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isSignup) {
        await signupVerify({ otpCode });
        toast.success('이메일 인증이 완료되었습니다. Passkey를 등록해주세요.');
      } else if (isRecovery) {
        await recoveryVerify({ otpCode });
        toast.success('이메일 인증이 완료되었습니다. 새 Passkey를 등록해주세요.');
      }
    } catch (err) {
      setError(err.message || '인증에 실패했습니다.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    try {
      await resendOTP();
      toast.success('인증 코드를 재발송했습니다.');
      setCountdown(300);
      setResendCooldown(60);
    } catch (err) {
      toast.error(err.message || '재발송에 실패했습니다.');
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      goToLogin();
    }
  };

  const handleChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpCode(value);
    if (error) setError('');

    // 6자리 입력 완료 시 자동 제출
    if (value.length === 6 && countdown > 0) {
      setTimeout(() => {
        formRef.current?.requestSubmit();
      }, 300);
    }
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h1 className="text-center text-4xl font-bold text-blue-600 dark:text-blue-500">
          Fliq
        </h1>
        <div className="text-center mt-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">이메일 인증</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">{email}로 발송된</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">6자리 인증 코드를 입력해주세요</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label
              htmlFor="otp"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              인증 코드
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              value={otpCode}
              onChange={handleChange}
              onFocus={() => setFocusedField(true)}
              onBlur={() => setFocusedField(false)}
              placeholder="123456"
              maxLength={6}
              disabled={loading}
              className={`block w-full px-4 py-3 border-2 rounded-2xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-center text-2xl tracking-widest font-mono transition-all duration-300 ${
                error
                  ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                  : focusedField
                    ? 'border-blue-500 dark:border-blue-400 bg-white dark:bg-gray-700 ring-4 ring-blue-500/10 scale-[1.02] shadow-lg'
                    : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-gray-700'
              } ${shake ? 'animate-shake' : ''} ${loading ? 'opacity-50' : ''}`}
            />
            {error && (
              <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                남은 시간: <span className="font-bold text-blue-500">{formatTime(countdown)}</span>
              </p>
            ) : (
              <p role="alert" className="text-red-500 dark:text-red-400 text-sm font-medium">인증 시간이 만료되었습니다.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || otpCode.length !== 6 || countdown === 0}
            className="btn-action btn-action-primary w-full py-4 text-white font-bold text-lg rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span className="relative z-10 flex items-center gap-2">
              {loading ? (
                <span className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              ) : (
                '인증 확인'
              )}
            </span>
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-2xl transition-all duration-300"
            >
              이전
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-2xl transition-all duration-300 disabled:opacity-50"
            >
              {resendCooldown > 0 ? `재발송 (${resendCooldown}초)` : '재발송'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OTPVerification;
