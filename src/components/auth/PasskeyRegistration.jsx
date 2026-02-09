import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AUTH_FLOW } from '../../utils/constants';

const PasskeyRegistration = ({ onBack }) => {
  const navigate = useNavigate();
  const {
    authFlow,
    flowData,
    signupPasskeyFinish,
    recoveryPasskeyFinish,
    resetFlow,
  } = useAuth();

  const isSignup = authFlow === AUTH_FLOW.SIGNUP_PASSKEY;
  const isRecovery = authFlow === AUTH_FLOW.RECOVERY_PASSKEY;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 컴포넌트 마운트 시 자동으로 Passkey 등록 시작
  useEffect(() => {
    if ((isSignup || isRecovery) && flowData?.passkeyOptions) {
      handleRegisterPasskey();
    }
  }, []);

  const handleRegisterPasskey = async () => {
    setLoading(true);
    setError('');

    try {
      if (isSignup) {
        await signupPasskeyFinish();
        toast.success('Passkey 등록이 완료되었습니다!');
        // 회원가입은 계좌 등록 화면으로 이동 (authFlow가 SIGNUP_ACCOUNT로 변경됨)
      } else if (isRecovery) {
        await recoveryPasskeyFinish();
        toast.success('Passkey가 재등록되었습니다!');
        navigate('/main', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Passkey 등록에 실패했습니다.');
      setLoading(false);
    }
  };

  const handleCancel = () => {
    resetFlow();
    if (onBack) {
      onBack();
    } else {
      navigate('/auth', { replace: true });
    }
  };

  const handleRetry = () => {
    setError('');
    handleRegisterPasskey();
  };

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h1 className="text-center text-4xl font-bold text-blue-600 dark:text-blue-500">
          Fliq
        </h1>
        <div className="text-center mt-6">
          {/* Passkey 아이콘 */}
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {isRecovery ? '새 Passkey 등록' : 'Passkey 등록'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {loading
              ? '기기의 인증 방법을 사용하여 Passkey를 등록해주세요.'
              : error
                ? '등록에 실패했습니다. 다시 시도해주세요.'
                : '버튼을 눌러 Passkey를 등록하세요.'}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">

        {/* 로딩 상태 */}
        {loading && (
          <div className="flex flex-col items-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25 animate-pulse">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                />
              </svg>
            </div>
            <p className="mt-4 text-gray-500 dark:text-gray-400 text-sm">
              기기에서 인증을 완료해주세요...
            </p>
          </div>
        )}

        {/* 에러 상태 */}
        {error && !loading && (
          <div className="mb-6">
            <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/25">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm text-red-700 dark:text-red-300 pt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 버튼 */}
        {!loading && (
          <div className="space-y-3">
            {error ? (
              <button
                type="button"
                onClick={handleRetry}
                className="btn-action btn-action-primary w-full py-4 text-white font-bold text-lg rounded-2xl flex items-center justify-center"
              >
                <span className="relative z-10">다시 시도</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRegisterPasskey}
                className="btn-action btn-action-primary w-full py-4 text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Passkey 등록하기
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCancel}
              className="w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-2xl transition-all duration-300"
            >
              취소
            </button>
          </div>
        )}

        {/* 안내 문구 */}
        <p className="mt-8 text-xs text-gray-400 dark:text-gray-500 text-center">
          Passkey는 Touch ID, Face ID, Windows Hello 등<br />
          기기의 생체 인증을 사용합니다.
        </p>
      </div>
    </div>
  );
};

export default PasskeyRegistration;
