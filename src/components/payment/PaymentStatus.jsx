import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import { usePayment } from '../../hooks/usePayment';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { PAYMENT_STATUS, PAYMENT_STATUS_LABELS } from '../../utils/constants';
import Button from '../common/Button';
import logger from '../../utils/logger';

const PaymentStatus = ({ gatheringId, onRetry }) => {
  const { getMyPaymentStatus, loading } = usePayment();
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    loadPaymentStatus();
  }, [gatheringId]);

  const loadPaymentStatus = async () => {
    try {
      const data = await getMyPaymentStatus(gatheringId);
      setPaymentInfo(data);
    } catch (error) {
      logger.error('결제 상태 조회 실패:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case PAYMENT_STATUS.COMPLETED:
        return <CheckCircle className="text-green-500" size={24} />;
      case PAYMENT_STATUS.FAILED:
      case PAYMENT_STATUS.CANCELLED:
        return <XCircle className="text-red-500" size={24} />;
      case PAYMENT_STATUS.PROCESSING:
        return <RefreshCw className="text-blue-500 animate-spin" size={24} />;
      default:
        return <Clock className="text-yellow-500" size={24} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case PAYMENT_STATUS.COMPLETED:
        return 'text-green-600 bg-green-50 border-green-200';
      case PAYMENT_STATUS.FAILED:
      case PAYMENT_STATUS.CANCELLED:
        return 'text-red-600 bg-red-50 border-red-200';
      case PAYMENT_STATUS.PROCESSING:
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  if (loading && !paymentInfo) {
    return null;
  }

  if (!paymentInfo) {
    return (
      <div className="card text-center">
        <p className="text-gray-600">결제 정보를 불러올 수 없습니다.</p>
        <Button 
          variant="secondary" 
          onClick={loadPaymentStatus}
          className="mt-4"
        >
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 결제 상태 */}
      <div className={`card border-2 ${getStatusColor(paymentInfo.status)}`}>
        <div className="flex items-center gap-4 mb-4">
          {getStatusIcon(paymentInfo.status)}
          <div>
            <h3 className="font-semibold text-lg">
              {PAYMENT_STATUS_LABELS[paymentInfo.status]}
            </h3>
            <p className="text-sm opacity-75">
              {paymentInfo.status === PAYMENT_STATUS.COMPLETED && '결제가 성공적으로 완료되었습니다'}
              {paymentInfo.status === PAYMENT_STATUS.PENDING && '결제를 진행해주세요'}
              {paymentInfo.status === PAYMENT_STATUS.PROCESSING && '결제를 처리하고 있습니다'}
              {paymentInfo.status === PAYMENT_STATUS.FAILED && '결제가 실패했습니다'}
              {paymentInfo.status === PAYMENT_STATUS.CANCELLED && '결제가 취소되었습니다'}
            </p>
          </div>
        </div>

        {paymentInfo.failureReason && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">
              <strong>실패 사유:</strong> {paymentInfo.failureReason}
            </p>
          </div>
        )}
      </div>

      {/* 결제 정보 */}
      <div className="card">
        <h3 className="font-semibold mb-4">결제 정보</h3>
        
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">결제 금액</span>
            <span className="font-semibold">{formatCurrency(paymentInfo.amount)}</span>
          </div>
          
          {paymentInfo.externalTransactionId && (
            <div className="flex justify-between">
              <span className="text-gray-600">거래번호</span>
              <span className="font-mono text-sm">{paymentInfo.externalTransactionId}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span className="text-gray-600">요청일시</span>
            <span>{formatDate(paymentInfo.createdAt)}</span>
          </div>
          
          {paymentInfo.completedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">완료일시</span>
              <span>{formatDate(paymentInfo.completedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="space-y-3">
        {(paymentInfo.status === PAYMENT_STATUS.PENDING || 
          paymentInfo.status === PAYMENT_STATUS.FAILED) && (
          <Button fullWidth onClick={onRetry}>
            {paymentInfo.status === PAYMENT_STATUS.FAILED ? '다시 결제하기' : '결제하기'}
          </Button>
        )}
        
        <Button 
          variant="secondary" 
          fullWidth 
          onClick={loadPaymentStatus}
          loading={loading}
        >
          상태 새로고침
        </Button>
      </div>

      {/* 도움말 */}
      <div className="card bg-gray-50">
        <h4 className="font-medium mb-2">도움이 필요하신가요?</h4>
        <p className="text-sm text-gray-600">
          결제에 문제가 있다면 방장에게 문의하거나 고객센터로 연락해주세요.
        </p>
      </div>
    </div>
  );
};

export default PaymentStatus;