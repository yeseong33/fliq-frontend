import React, { useState, useMemo } from 'react';
import { Check, ChevronRight, Info } from 'lucide-react';
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
  const [showNotice, setShowNotice] = useState(false);
  const [saving, setSaving] = useState(false);

  const requiredTypes = useMemo(
    () => CONSENT_TYPES.filter((c) => c.required),
    []
  );

  const allRequiredAgreed = requiredTypes.every((c) => agreed[c.type]);

  const handleAcceptRequired = () => {
    setAgreed(
      Object.fromEntries(CONSENT_TYPES.map((c) => [c.type, c.required]))
    );
    setShowNotice(true);
  };

  const handleSaveAndProceed = async (consents) => {
    setSaving(true);
    try {
      await consentAPI.saveAll(consents);
      setConsentChecked(true);
      toast.success('약관 동의가 완료되었습니다.');
    } catch (error) {
      toast.error(error.message || '약관 동의 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleProceed = () => {
    setShowNotice(false);
    const consents = CONSENT_TYPES.map((c) => ({
      type: c.type,
      agreed: c.required || agreed[c.type],
      version: c.version,
    }));
    handleSaveAndProceed(consents);
  };

  const handleNext = () => {
    const consents = CONSENT_TYPES.map((c) => ({
      type: c.type,
      agreed: agreed[c.type],
      version: c.version,
    }));
    handleSaveAndProceed(consents);
  };

  const handleToggle = (type) => {
    setAgreed((prev) => ({ ...prev, [type]: !prev[type] }));
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
          {/* 꼭 필요한 것만 동의할게요 */}
          <button
            type="button"
            onClick={handleAcceptRequired}
            className="w-full flex items-center gap-3 p-4 mb-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border-2 border-blue-200 dark:border-blue-800 transition-all duration-200 hover:bg-blue-100 dark:hover:bg-blue-900/30"
          >
            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600" />
            <span className="font-bold text-gray-900 dark:text-white">
              꼭 필요한 것만 동의할게요
            </span>
          </button>

          {/* 개별 약관 항목 */}
          <div className="space-y-2 mb-6">
            {CONSENT_TYPES.map((consent) => {
              const isExpanded = expandedType === consent.type;
              return (
                <div
                  key={consent.type}
                  className={`rounded-xl transition-all duration-200 ${
                    isExpanded
                      ? 'bg-gray-50 dark:bg-gray-800/70 ring-1 ring-gray-200 dark:ring-gray-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3 p-3">
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
                        setExpandedType(isExpanded ? null : consent.type)
                      }
                      className={`px-2 py-1 text-xs shrink-0 transition-colors ${
                        isExpanded
                          ? 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                          : 'text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300'
                      }`}
                    >
                      {isExpanded ? '접기' : '보기'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="px-3 pb-3">
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                        <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2 px-1">
                          {consent.summary}
                        </p>
                        <div className="max-h-52 overflow-y-auto rounded-lg bg-white dark:bg-gray-800 p-3 ring-1 ring-gray-100 dark:ring-gray-700">
                          <pre className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-wrap font-sans">
                            {consent.content}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 다음 버튼 */}
          <button
            type="button"
            onClick={handleNext}
            disabled={!allRequiredAgreed || saving}
            className="w-full py-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-bold text-lg rounded-2xl transition-colors"
          >
            {saving ? (
              <span className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
            ) : (
              '다음'
            )}
          </button>
        </div>
      </div>

      {/* 선택 약관 안내 모달 */}
      {showNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8">
          <div className="absolute inset-0 bg-black/30 animate-[fadeIn_0.2s_ease-out]" />
          <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl max-w-sm w-full animate-[fadeIn_0.2s_ease-out] text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Info size={24} className="text-blue-500" />
            </div>
            <p className="text-base font-medium text-gray-900 dark:text-white mb-1">
              나중에 필요해지면, 저희가 다시 요청드릴게요
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
              선택 항목은 마이페이지에서 언제든 변경할 수 있어요
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowNotice(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                더 확인하기
              </button>
              <button
                type="button"
                onClick={handleProceed}
                disabled={saving}
                className="flex-1 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                이대로 진행하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsentRequiredPage;
