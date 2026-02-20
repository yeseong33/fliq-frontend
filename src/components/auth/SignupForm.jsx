import React, { useState, useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import toast from '../../utils/toast';
import { UserPlus, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useRecaptcha } from '../../hooks/useRecaptcha';
import { validateEmail, validateName } from '../../utils/validation';
import { RECAPTCHA } from '../../utils/constants';

const SignupForm = ({ onSwitchToLogin }) => {
  const { signupStart, webAuthnSupported } = useAuth();
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

  const [formData, setFormData] = useState({
    email: '',
    name: '',
  });
  const [errors, setErrors] = useState({});
  const [shakeFields, setShakeFields] = useState({});
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  const nameRef = useRef(null);
  const emailRef = useRef(null);

  const validateForm = () => {
    const newErrors = {};
    const newShakeFields = {};

    if (!formData.name) {
      newErrors.name = '이름을 입력해주세요.';
      newShakeFields.name = true;
    } else if (!validateName(formData.name)) {
      newErrors.name = '올바른 이름을 입력해주세요.';
      newShakeFields.name = true;
    }

    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.';
      newShakeFields.email = true;
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '올바른 이메일 주소를 입력해주세요.';
      newShakeFields.email = true;
    }

    setErrors(newErrors);
    setShakeFields(newShakeFields);

    if (Object.keys(newShakeFields).length > 0) {
      setTimeout(() => setShakeFields({}), 500);
    }

    return Object.keys(newErrors).length === 0;
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
    try {
      // reCAPTCHA 토큰 생성
      const { token: recaptchaToken, version: recaptchaVersion } = await executeRecaptcha('signup');

      await signupStart({
        email: formData.email,
        name: formData.name,
        recaptchaToken,
        recaptchaVersion,
      });

      // 성공 시 v2 상태 리셋
      resetV2();
      toast.success('인증번호를 전송했습니다. 이메일을 확인해주세요.');
    } catch (error) {
      // v2 필요 에러인 경우
      if (isV2RequiredError(error)) {
        showV2();
      } else {
        toast.error(error.message || '회원가입 요청 중 오류가 발생했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleKeyDown = (e, nextRef) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef?.current) {
        nextRef.current.focus();
      }
    }
  };

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };

  const getInputClassName = (fieldName) => {
    const hasError = errors[fieldName];
    const isFocused = focusedField === fieldName;
    const isShaking = shakeFields[fieldName];

    return `block w-full px-4 py-3 border-2 rounded-2xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 transition-all duration-300 ${
      hasError
        ? 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
        : isFocused
          ? 'border-blue-500 dark:border-blue-400 bg-white dark:bg-gray-700 ring-4 ring-blue-500/10 scale-[1.02] shadow-lg'
          : 'border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:bg-white dark:focus:bg-gray-700'
    } ${isShaking ? 'animate-shake' : ''} ${loading ? 'opacity-50' : ''}`;
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
          새 계정을 만들어 시작하세요
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              이름
            </label>
            <input
              ref={nameRef}
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              onKeyDown={(e) => handleKeyDown(e, emailRef)}
              onFocus={() => handleFocus('name')}
              onBlur={handleBlur}
              disabled={loading}
              className={getInputClassName('name')}
              placeholder="이름을 입력해주세요"
            />
            {errors.name && (
              <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              이메일
            </label>
            <input
              ref={emailRef}
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              onFocus={() => handleFocus('email')}
              onBlur={handleBlur}
              disabled={loading}
              className={getInputClassName('email')}
              placeholder="name@example.com"
            />
            {errors.email && (
              <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.email}
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
                <>
                  <UserPlus size={20} />
                  인증번호 받기
                </>
              )}
            </span>
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            이미 계정이 있으신가요?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-bold text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 underline bg-transparent border-none p-0 cursor-pointer transition-colors"
            >
              로그인
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

export default SignupForm;
