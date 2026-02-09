import React, { useState, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useRecaptcha } from '../../hooks/useRecaptcha';
import { validateEmail } from '../../utils/validation';
import { RECAPTCHA } from '../../utils/constants';

const RecoveryForm = ({ onSwitchToLogin }) => {
  const { recoveryStart, webAuthnSupported } = useAuth();
  const {
    executeRecaptcha,
    showV2,
    isV2Required,
    v2Ref,
    onV2Change,
    onV2Expired,
    resetV2,
    isV2RequiredError,
    isV2Ready,
  } = useRecaptcha();

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

    // v2가 필요한데 아직 완료 안됐으면 경고
    if (isV2Required && !isV2Ready) {
      toast.error('보안 인증을 완료해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // reCAPTCHA 토큰 생성
      const { token: recaptchaToken, version: recaptchaVersion } = await executeRecaptcha('recovery');

      await recoveryStart({ email, recaptchaToken, recaptchaVersion });

      // 성공 시 v2 상태 리셋
      resetV2();
      toast.success('인증번호를 전송했습니다. 이메일을 확인해주세요.');
    } catch (err) {
      // v2 필요 에러인 경우
      if (isV2RequiredError(err)) {
        showV2();
      } else {
        toast.error(err.message || '요청 중 오류가 발생했습니다.');
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
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
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
          이메일 인증 후 새 Passkey를 등록합니다
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              이메일 주소
            </label>
            <input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={handleChange}
              onFocus={() => setFocusedField(true)}
              onBlur={() => setFocusedField(false)}
              disabled={loading}
              placeholder="가입한 이메일 주소를 입력하세요"
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

          {/* reCAPTCHA v2 (필요 시에만 표시) */}
          {isV2Required && RECAPTCHA.V2_SITE_KEY && (
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={v2Ref}
                sitekey={RECAPTCHA.V2_SITE_KEY}
                onChange={onV2Change}
                onExpired={onV2Expired}
                theme="light"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (isV2Required && !isV2Ready)}
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
                '인증번호 받기'
              )}
            </span>
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-bold text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 underline bg-transparent border-none p-0 cursor-pointer transition-colors"
            >
              로그인으로 돌아가기
            </button>
          </p>

          {/* reCAPTCHA 안내 문구 (배지 숨김 시 필수) */}
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
            이 사이트는 reCAPTCHA로 보호되며{' '}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-500">
              개인정보처리방침
            </a>
            과{' '}
            <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-500">
              이용약관
            </a>
            이 적용됩니다.
          </p>
        </form>
      </div>
    </div>
  );
};

export default RecoveryForm;
