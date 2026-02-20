import React, { useState } from 'react';
import toast from '../../utils/toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Key, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const LoginForm = ({ onSwitchToSignup, onSwitchToRecovery }) => {
  const { loginStart, loginFinish, webAuthnSupported, resetFlow } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (loading) return;

    setLoading(true);

    try {
      // 1. Usernameless 로그인 시작 - challenge 발급 (이메일 없이)
      await loginStart();

      // 2. 바로 Passkey 인증 수행 (브라우저가 계정 선택 UI 표시)
      await loginFinish();

      toast.success('로그인되었습니다.');
      // URL 쿼리 파라미터의 returnUrl로 리다이렉트 (없으면 /main)
      const returnUrl = searchParams.get('returnUrl');
      const isSafe = returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') && !returnUrl.startsWith('/\\');
      navigate(isSafe ? returnUrl : '/main', { replace: true });
    } catch (err) {
      // 실패 시 상태 초기화
      resetFlow();

      if (err.code === 'PASSKEY_CANCELLED' || err.name === 'NotAllowedError') {
        toast.error('인증이 취소되었습니다.');
      } else if (err.message?.includes('찾을 수 없') || err.code === 'USER_NOT_FOUND' || err.code === 'CREDENTIAL_NOT_FOUND') {
        toast.error('등록된 Passkey를 찾을 수 없습니다.');
      } else {
        toast.error(err.message || '로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!webAuthnSupported) {
    return (
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h1 className="text-center text-4xl font-bold text-blue-600 dark:text-blue-500">
            Fliq
          </h1>
          <div className="mt-10">
            <div className="card text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/25">
                <AlertTriangle size={36} className="text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Passkey 미지원 브라우저</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                이 브라우저는 Passkey(WebAuthn)를 지원하지 않습니다.
                <br />
                최신 버전의 Chrome, Safari, Firefox, Edge를 사용해주세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <h1 className="text-center text-4xl font-bold text-blue-600 dark:text-blue-500">
          Fliq
        </h1>
        <p className="mt-4 text-center text-gray-500 dark:text-gray-400">
          Passkey로 간편하게 로그인하세요
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <button
          type="button"
          onClick={handleLogin}
          disabled={loading}
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
              <>
                <Key size={20} />
                Passkey로 로그인
              </>
            )}
          </span>
        </button>

        {/* 계정 복구 링크 */}
        <div className="mt-6">
          <button
            type="button"
            onClick={onSwitchToRecovery}
            className="w-full text-center text-sm font-medium text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors"
          >
            Passkey를 분실하셨나요?
          </button>
        </div>

        {/* 회원가입 링크 */}
        <p className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
          계정이 없으신가요?{' '}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-bold text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 underline bg-transparent border-none p-0 cursor-pointer transition-colors"
          >
            회원가입
          </button>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
