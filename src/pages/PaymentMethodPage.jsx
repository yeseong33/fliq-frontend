import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Plus, Trash2, Check, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import Header from '../components/common/Header';
import Button from '../components/common/Button';
import { paymentMethodAPI, BANK_CODES } from '../api/paymentMethod';

// XSS 방어
const sanitizeText = (text) => {
  if (!text) return '';
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
};

const PaymentMethodPage = () => {
  const navigate = useNavigate();
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  // 결제 수단 목록 조회
  const fetchPaymentMethods = async () => {
    try {
      const response = await paymentMethodAPI.getMyPaymentMethods();
      setPaymentMethods(response.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
      toast.error('결제 수단 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  // 페이지 포커스 시 자동 갱신
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchPaymentMethods();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // 카드 클릭 시 기본 결제 수단으로 설정
  const handleCardClick = async (method) => {
    if (method.isDefault) return;

    if (!confirm('이 계좌를 기본 계좌로 설정할까요?')) return;

    try {
      await paymentMethodAPI.setDefault(method.id);
      toast.success('기본 계좌로 설정되었습니다.');
      fetchPaymentMethods();
    } catch (error) {
      console.error('Failed to set default:', error);
      toast.error(sanitizeText(error.message) || '설정에 실패했습니다.');
    }
  };

  // 결제 수단 삭제
  const handleDelete = async (id) => {
    if (!confirm('이 결제 수단을 삭제하시겠습니까?')) return;

    try {
      await paymentMethodAPI.delete(id);
      toast.success('결제 수단이 삭제되었습니다.');
      fetchPaymentMethods();
    } catch (error) {
      console.error('Failed to delete:', error);
      toast.error(sanitizeText(error.message) || '삭제에 실패했습니다.');
    }
  };

  // 은행명 가져오기
  const getBankLabel = (value) => {
    return BANK_CODES.find(b => b.value === value)?.label || value;
  };

  return (
    <div className="page">
      <Header title="결제 수단 관리" showBack={true} />

      <div className="page-content">
        {/* 등록된 결제 수단 목록 */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white">내 계좌</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
              {paymentMethods.length}개
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-12 text-gray-400 dark:text-gray-500">
              <span className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </div>
          ) : paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  onClick={() => handleCardClick(method)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                    method.isDefault
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 active:scale-[0.98]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        method.isDefault
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {method.isDefault ? <Check size={20} /> : <Building2 size={20} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {sanitizeText(getBankLabel(method.bankCode))}
                          </span>
                          {method.isDefault && (
                            <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                              기본
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {sanitizeText(method.accountNumber)}
                        </div>
                      </div>
                    </div>

                    {paymentMethods.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(method.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
                계좌를 탭하면 기본 계좌로 설정됩니다
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <CreditCard size={36} className="text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">등록된 계좌가 없습니다</h3>
              <p className="text-gray-500 dark:text-gray-400">
                정산 시 송금받을 계좌를 등록해주세요
              </p>
            </div>
          )}
        </div>

        {/* 추가 버튼 */}
        <Button
          fullWidth
          size="lg"
          onClick={() => navigate('/payment-methods/add')}
          className="flex items-center justify-center gap-2"
        >
          <Plus size={22} />
          계좌 추가
        </Button>
      </div>
    </div>
  );
};

export default PaymentMethodPage;
