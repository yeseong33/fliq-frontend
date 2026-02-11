import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from '../utils/toast';
import logger from '../utils/logger';
import DOMPurify from 'dompurify';
import Header from '../components/common/Header';
import BankIcon from '../components/common/BankIcon';
import PlatformIcon from '../components/common/PlatformIcon';
import { paymentMethodAPI, BANK_CODES } from '../api/paymentMethod';

// XSS 방어
const sanitizeText = (text) => {
  if (!text) return '';
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
};

const AddPaymentMethodPage = () => {
  const navigate = useNavigate();
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
    // 계좌번호 검증 (숫자와 하이픈만)
    if (!/^[\d-]+$/.test(formData.accountNumber)) {
      toast.error('올바른 계좌번호를 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await paymentMethodAPI.create(formData);
      toast.success('계좌가 등록되었습니다.');
      navigate('/payment-methods', { replace: true });
    } catch (error) {
      logger.error('Failed to create payment method:', error);
      toast.error(sanitizeText(error.message) || '계좌 등록에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <Header title="계좌 등록" showBack />

      <div className="page-content">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 플랫폼 - 현재 토스만 지원 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              송금 플랫폼
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 rounded-2xl border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20 flex flex-col items-center gap-2">
                <PlatformIcon platform="TOSS" size="md" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  토스
                </span>
              </div>
            </div>
          </div>

          {/* 은행 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              은행
            </label>
            <div className="flex items-center gap-3">
              <BankIcon bankCode={formData.bankCode} size="lg" />
              <select
                value={formData.bankCode}
                onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                className="flex-1 px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-600
                  bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                  focus:outline-none focus:bg-white dark:focus:bg-gray-700
                  focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                  transition-all duration-200"
              >
                {BANK_CODES.map((bank) => (
                  <option key={bank.value} value={bank.value}>
                    {bank.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 계좌번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              계좌번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              placeholder="'-' 없이 숫자만 입력"
              maxLength={50}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-600
                bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:bg-white dark:focus:bg-gray-700
                focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                transition-all duration-200"
            />
          </div>

          {/* 예금주명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              예금주명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.accountHolder}
              onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
              placeholder="예금주 이름을 입력해주세요"
              maxLength={50}
              className="w-full px-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-600
                bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white
                placeholder-gray-400 dark:placeholder-gray-500
                focus:outline-none focus:bg-white dark:focus:bg-gray-700
                focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                transition-all duration-200"
            />
          </div>

          {/* 안내 문구 */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              등록된 계좌로 정산 금액을 송금받을 수 있습니다.
              토스를 통해 빠른 송금이 지원됩니다.
            </p>
          </div>

          {/* 등록 버튼 */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-action btn-action-primary w-full py-4 text-white font-bold text-lg rounded-2xl disabled:opacity-50 flex items-center justify-center"
          >
            <span className="relative z-10">
              {submitting ? (
                <span className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              ) : (
                '등록하기'
              )}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddPaymentMethodPage;
