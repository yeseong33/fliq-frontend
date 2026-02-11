import React, { useState, useRef } from 'react';
import toast from '../../utils/toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Key, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { validateEmail } from '../../utils/validation';

const LoginForm = ({ onSwitchToSignup, onSwitchToRecovery }) => {
  const { loginStart, loginFinish, webAuthnSupported, resetFlow } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [shakeField, setShakeField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(false);

  const emailRef = useRef(null);

  const validateForm = () => {
    if (!email) {
      setError('이메일을 입력해주세요.');
      setShakeField(true);
      setTimeout(() => setShakeField(false), 500);
      return false;
    }
    if (!validateEmail(email)) {
      setError('올바른 이메일 주소를 입력해주세요.');
      setShakeField(true);
      setTimeout(() => setShakeField(false), 500);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // 1. 이메일로 로그인 시작 - challenge 발급
      await loginStart({ email });

      // 2. 바로 Passkey 인증 수행
      await loginFinish();

      toast.success('로그인되었습니다.');
      // URL 쿼리 파라미터의 returnUrl로 리다이렉트 (없으면 /main)
      const returnUrl = searchParams.get('returnUrl');
      const isSafe = returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') && !returnUrl.startsWith('/\\');
      navigate(isSafe ? returnUrl : '/main', { replace: true });
    } catch (err) {
      // 실패 시 상태 초기화
      resetFlow();

      if (err.message?.includes('찾을 수 없') || err.code === 'USER_NOT_FOUND') {
        toast.error('등록되지 않은 이메일입니다.');
      } else if (err.code === 'PASSKEY_CANCELLED' || err.name === 'NotAllowedError') {
        toast.error('인증이 취소되었습니다.');
      } else {
        toast.error(err.message || '로그인 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
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
          이메일을 입력하고 Passkey로 로그인하세요
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              이메일
            </label>
            <input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              autoComplete="email webauthn"
              value={email}
              onChange={handleChange}
              onFocus={() => setFocusedField(true)}
              onBlur={() => setFocusedField(false)}
              disabled={loading}
              placeholder="name@example.com"
              className={`block w-full px-4 py-3 border-2 rounded-2xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300 ${
                error
                  ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                  : focusedField
                    ? 'border-blue-500 dark:border-blue-400 bg-white dark:bg-gray-700 ring-4 ring-blue-500/10 scale-[1.02] shadow-lg'
                    : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-gray-700'
              } ${shakeField ? 'animate-shake' : ''} ${loading ? 'opacity-50' : ''}`}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </p>
            )}
          </div>

          <button
            type="submit"
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
                  로그인
                </>
              )}
            </span>
          </button>
        </form>

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
