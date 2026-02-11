import React, { useState } from 'react';
import { Building2, X, ChevronRight } from 'lucide-react';
import { paymentMethodAPI, PAYMENT_PLATFORMS, BANK_CODES } from '../../api/paymentMethod';
import toast from '../../utils/toast';
import logger from '../../utils/logger';

const AccountRequiredModal = ({ isOpen, onClose, onSuccess, title = '계좌 등록이 필요합니다' }) => {
  const [step, setStep] = useState('info'); // 'info' | 'form'
  const [formData, setFormData] = useState({
    platform: 'TOSS',
    bankCode: 'TOSS_BANK',
    accountNumber: '',
    accountHolder: '',
  });
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

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
      onSuccess?.();
      onClose();
    } catch (error) {
      logger.error('Failed to create payment method:', error);
      toast.error(error.message || '계좌 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep('info');
    setFormData({
      platform: 'TOSS',
      bankCode: 'TOSS_BANK',
      accountNumber: '',
      accountHolder: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {step === 'info' ? (
          <>
            {/* 헤더 이미지 */}
            <div className="h-32 bg-gradient-to-br from-blue-500 to-indigo-600 relative">
              <button
                type="button"
                onClick={handleClose}
                className="absolute top-3 right-3 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors z-10"
              >
                <X className="text-white" size={20} />
              </button>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Building2 className="text-white" size={32} />
                </div>
              </div>
            </div>

            {/* 내용 */}
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                {title}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-center mb-6">
                정산금을 받기 위해 계좌 정보가 필요합니다.<br />
                지금 바로 등록해주세요.
              </p>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">계좌 정보 입력</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">모임 참여 완료</span>
                </div>
              </div>

              <button
                onClick={() => setStep('form')}
                className="btn-action btn-action-primary w-full py-4 text-white font-semibold rounded-2xl flex items-center justify-center gap-2"
              >
                <span className="relative z-10 flex items-center gap-2">
                  계좌 등록하기
                  <ChevronRight size={20} />
                </span>
              </button>
            </div>
          </>
        ) : (
          <>
            {/* 폼 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
              <button
                onClick={() => setStep('info')}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                이전
              </button>
              <h3 className="font-semibold text-gray-900 dark:text-white">계좌 등록</h3>
              <button
                type="button"
                onClick={handleClose}
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* 폼 */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* 플랫폼 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  송금 플랫폼
                </label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  은행
                </label>
                <select
                  value={formData.bankCode}
                  onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  계좌번호
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  placeholder="'-' 없이 숫자만 입력"
                  maxLength={50}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* 예금주명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  예금주명
                </label>
                <input
                  type="text"
                  value={formData.accountHolder}
                  onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                  placeholder="실명을 입력해주세요"
                  maxLength={50}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>

              {/* 버튼 */}
              <button
                type="submit"
                disabled={submitting}
                className="btn-action btn-action-primary w-full py-4 disabled:opacity-50 text-white font-semibold rounded-2xl flex items-center justify-center gap-2 mt-6"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {submitting ? (
                    <span className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  ) : (
                    '등록 완료'
                  )}
                </span>
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default AccountRequiredModal;
