import React, { useState, useMemo } from 'react';
import { Check, ChevronRight, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { consentAPI } from '../api/consent';
import { CONSENT_TYPES } from '../utils/constants';
import toast from '../utils/toast';

const ConsentRequiredPage = () => {
  const setConsentChecked = useAuthStore((s) => s.setConsentChecked);
  const [agreed, setAgreed] = useState(() =>
    Object.fromEntries(CONSENT_TYPES.map((c) => [c.type, false]))
  );
  const [expandedType, setExpandedType] = useState(null);
  const [loading, setLoading] = useState(false);

  const requiredTypes = useMemo(
    () => CONSENT_TYPES.filter((c) => c.required),
    []
  );

  const allRequiredAgreed = requiredTypes.every((c) => agreed[c.type]);
  const allAgreed = CONSENT_TYPES.every((c) => agreed[c.type]);

  const handleToggleAll = () => {
    const next = !allAgreed;
    setAgreed(Object.fromEntries(CONSENT_TYPES.map((c) => [c.type, next])));
  };

  const handleToggle = (type) => {
    setAgreed((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allRequiredAgreed) return;

    setLoading(true);
    try {
      const consents = CONSENT_TYPES.map((c) => ({
        type: c.type,
        agreed: agreed[c.type],
      }));
      await consentAPI.saveAll(consents);
      setConsentChecked(true);
      toast.success('약관 동의가 완료되었습니다.');
    } catch (error) {
      toast.error(error.message || '약관 동의 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page bg-white dark:bg-gray-900 transition-colors duration-200">
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h1 className="text-center text-4xl font-bold text-blue-600 dark:text-blue-500">
            Fliq
          </h1>
          <p className="mt-4 text-center text-gray-500 dark:text-gray-400">
            서비스 이용을 위해 새로운 약관에 동의해주세요
          </p>
        </div>

        <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
          <form onSubmit={handleSubmit} noValidate>
            {/* 전체 동의 */}
            <button
              type="button"
              onClick={handleToggleAll}
              className="w-full flex items-center gap-3 p-4 mb-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 transition-all duration-200"
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-200 ${
                  allAgreed
                    ? 'bg-blue-500 text-white'
                    : 'bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'
                }`}
              >
                {allAgreed && <Check size={16} />}
              </div>
              <span className="font-bold text-gray-900 dark:text-white">
                전체 동의
              </span>
            </button>

            {/* 개별 약관 항목 */}
            <div className="space-y-2 mb-6">
              {CONSENT_TYPES.map((consent) => (
                <div key={consent.type}>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <button
                      type="button"
                      onClick={() => handleToggle(consent.type)}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors duration-200 ${
                          agreed[consent.type]
                            ? 'bg-blue-500 text-white'
                            : 'bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {agreed[consent.type] && <Check size={14} />}
                      </div>
                      <span className="text-sm text-gray-700 dark:text-gray-300 text-left">
                        <span
                          className={`${
                            consent.required
                              ? 'text-blue-500 dark:text-blue-400'
                              : 'text-gray-400 dark:text-gray-500'
                          } font-medium`}
                        >
                          [{consent.required ? '필수' : '선택'}]
                        </span>{' '}
                        {consent.label}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedType(
                          expandedType === consent.type ? null : consent.type
                        )
                      }
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      <ChevronRight
                        size={16}
                        className={`transition-transform duration-200 ${
                          expandedType === consent.type ? 'rotate-90' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {expandedType === consent.type && (
                    <div className="mx-3 mb-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-h-40 overflow-y-auto">
                      {consent.label} 내용은 서비스 출시 전 업데이트됩니다.
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 동의 버튼 */}
            <button
              type="submit"
              disabled={!allRequiredAgreed || loading}
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
                    <ArrowRight size={20} />
                    동의하고 계속하기
                  </>
                )}
              </span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConsentRequiredPage;
