import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Save } from 'lucide-react';
import { consentAPI } from '../api/consent';
import { CONSENT_TYPES } from '../utils/constants';
import toast from '../utils/toast';

const ConsentManagePage = () => {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalAgreed, setOriginalAgreed] = useState({});

  useEffect(() => {
    const fetchConsents = async () => {
      try {
        const res = await consentAPI.getMyConsents();
        const data = res.data?.data || res.data;
        const consentList = Array.isArray(data) ? data : data?.consents || [];

        const agreedMap = {};
        CONSENT_TYPES.forEach((c) => {
          const found = consentList.find((item) => item.type === c.type);
          agreedMap[c.type] = found ? found.agreed : false;
        });

        setAgreed(agreedMap);
        setOriginalAgreed(agreedMap);
      } catch {
        // API 실패 시 모두 false로 초기화
        const agreedMap = Object.fromEntries(
          CONSENT_TYPES.map((c) => [c.type, false])
        );
        setAgreed(agreedMap);
        setOriginalAgreed(agreedMap);
      } finally {
        setLoading(false);
      }
    };

    fetchConsents();
  }, []);

  useEffect(() => {
    const changed = CONSENT_TYPES.some(
      (c) => agreed[c.type] !== originalAgreed[c.type]
    );
    setHasChanges(changed);
  }, [agreed, originalAgreed]);

  const handleToggle = (type) => {
    // 필수 항목은 토글 불가
    const consent = CONSENT_TYPES.find((c) => c.type === type);
    if (consent?.required) return;

    setAgreed((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const consents = CONSENT_TYPES.map((c) => ({
        type: c.type,
        agreed: agreed[c.type],
      }));
      await consentAPI.saveAll(consents);
      setOriginalAgreed({ ...agreed });
      setHasChanges(false);
      toast.success('약관 동의 설정이 저장되었습니다.');
    } catch (error) {
      toast.error(error.message || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page-content">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              약관 및 동의 관리
            </h1>
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-content">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-900 dark:text-white" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            약관 및 동의 관리
          </h1>
        </div>

        {/* 약관 목록 */}
        <div className="card mb-4">
          <div className="space-y-1">
            {CONSENT_TYPES.map((consent) => (
              <button
                key={consent.type}
                onClick={() => handleToggle(consent.type)}
                disabled={consent.required}
                className={`w-full flex items-center justify-between p-4 -mx-2 rounded-2xl transition-all duration-200 ${
                  consent.required
                    ? 'opacity-60 cursor-default'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors duration-200 ${
                      agreed[consent.type]
                        ? 'bg-blue-500 text-white'
                        : 'bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {agreed[consent.type] && <Check size={14} />}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {consent.label}
                    </div>
                    <div className="text-xs text-gray-400 dark:text-gray-500">
                      {consent.required ? '필수 동의' : '선택 동의'}
                    </div>
                  </div>
                </div>
                <div
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    agreed[consent.type]
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {agreed[consent.type] ? '동의' : '미동의'}
                </div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mb-6 px-2">
          필수 약관은 서비스 이용을 위해 반드시 동의가 필요하며 변경할 수 없습니다.
        </p>

        {/* 저장 버튼 */}
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-action btn-action-primary w-full py-4 text-white font-bold text-lg rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span className="relative z-10 flex items-center gap-2">
              {saving ? (
                <span className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              ) : (
                <>
                  <Save size={20} />
                  변경사항 저장
                </>
              )}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ConsentManagePage;
