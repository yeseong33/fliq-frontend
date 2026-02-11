import React, { useState } from 'react';
import { Building2, ChevronRight, ArrowRight } from 'lucide-react';
import toast from '../../utils/toast';
import logger from '../../utils/logger';
import { paymentMethodAPI, PAYMENT_PLATFORMS, BANK_CODES } from '../../api/paymentMethod';
import { useAuth } from '../../hooks/useAuth';

const SignupAccountStep = ({ onBack }) => {
  const { completeSignup } = useAuth();
  const [step, setStep] = useState('intro'); // 'intro' | 'form'
  const [formData, setFormData] = useState({
    platform: 'TOSS',
    bankCode: 'TOSS_BANK',
    accountNumber: '',
    accountHolder: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.accountNumber.trim()) {
      toast.error('계좌번호를 입력해주세요.');
      return;
    }
    if (!formData.accountHolder.trim()) {
      toast.error('예금주명을 입력해주세요.');
      return;
    }
    if (!/^[\d-]+$/.test(formData.accountNumber)) {
      toast.error('올바른 계좌번호를 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await paymentMethodAPI.create(formData);
      toast.success('계좌가 등록되었습니다!');
      completeSignup();
    } catch (error) {
      logger.error('Failed to create payment method:', error);
      toast.error(error.message || '계좌 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    completeSignup();
  };

  if (step === 'intro') {
    return (
      <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-sm">
          <h1 className="text-center text-4xl font-bold text-blue-600 dark:text-blue-500">
            Fliq
          </h1>

          <div className="mt-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25">
              <Building2 className="text-white" size={36} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              정산받을 계좌를 등록하세요
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              모임에서 정산금을 받기 위해<br />계좌 정보가 필요합니다
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-green-500/25">✓</div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">Passkey 등록 완료</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">지문/얼굴 인식 설정됨</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/25">2</div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">송금받을 계좌 등록</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">토스, 카카오페이 등 (선택)</div>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => setStep('form')}
              className="btn-action btn-action-primary w-full py-4 text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2"
            >
              <span className="relative z-10 flex items-center gap-2">
                계좌 등록하기
                <ChevronRight size={20} />
              </span>
            </button>

            <button
              onClick={handleSkip}
              className="w-full py-3 text-gray-500 dark:text-gray-400 font-medium flex items-center justify-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              나중에 할게요
              <ArrowRight size={16} />
            </button>
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
          송금받을 계좌를 등록하세요
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-sm">
        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          {/* 플랫폼 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              송금 플랫폼
            </label>
            <select
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
            >
              {PAYMENT_PLATFORMS.map((platform) => (
                <option key={platform.value} value={platform.value}>
                  {platform.label}
                </option>
              ))}
            </select>
          </div>

          {/* 은행 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              은행
            </label>
            <select
              value={formData.bankCode}
              onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
            >
              {BANK_CODES.map((bank) => (
                <option key={bank.value} value={bank.value}>
                  {bank.label}
                </option>
              ))}
            </select>
          </div>

          {/* 계좌번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              계좌번호
            </label>
            <input
              type="text"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              placeholder="'-' 없이 숫자만 입력"
              maxLength={50}
              disabled={submitting}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 disabled:opacity-50"
            />
          </div>

          {/* 예금주명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              예금주명
            </label>
            <input
              type="text"
              value={formData.accountHolder}
              onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
              placeholder="실명을 입력해주세요"
              maxLength={50}
              disabled={submitting}
              className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-gray-700 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 disabled:opacity-50"
            />
          </div>

          {/* 버튼 */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-action btn-action-primary w-full py-4 text-white font-bold text-lg rounded-2xl disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span className="relative z-10 flex items-center gap-2">
              {submitting ? (
                <span className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              ) : (
                '등록하고 계속하기'
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="w-full py-3 text-gray-500 dark:text-gray-400 font-medium hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            건너뛰기
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignupAccountStep;
