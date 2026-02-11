import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, XCircle, Users, Calculator, Send, Check, ArrowRight, Wallet } from 'lucide-react';
import toast from '../../utils/toast';
import logger from '../../utils/logger';
import { usePayment } from '../../hooks/usePayment';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { PAYMENT_STATUS, PAYMENT_STATUS_LABELS } from '../../utils/constants';
import { settlementAPI } from '../../api';
import SequentialTransfer from './SequentialTransfer';

const PaymentHistory = ({ gatheringId }) => {
  const { getGatheringPayments, loading } = usePayment();
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [settlementsLoading, setSettlementsLoading] = useState(false);
  const [showSequentialTransfer, setShowSequentialTransfer] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);

  // 개별 송금하기 클릭 핸들러
  const handleOpenTransfer = (settlement) => {
    setSelectedSettlement(settlement);
    setShowSequentialTransfer(true);
  };

  // 전체 송금하기 클릭 핸들러
  const handleOpenAllTransfer = () => {
    setSelectedSettlement(null);
    setShowSequentialTransfer(true);
  };

  useEffect(() => {
    loadPayments();
    loadSettlements();
  }, [gatheringId]);

  const loadPayments = async () => {
    try {
      const data = await getGatheringPayments(gatheringId);
      setPayments(data);
    } catch (error) {
      logger.error('결제 내역 조회 실패:', error);
    }
  };

  const loadSettlements = async () => {
    if (!gatheringId) return;
    setSettlementsLoading(true);
    try {
      const response = await settlementAPI.getByGathering(gatheringId);
      const data = response?.data?.data || response?.data || [];
      setSettlements(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error('정산 내역 조회 실패:', error);
      setSettlements([]);
    } finally {
      setSettlementsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case PAYMENT_STATUS.COMPLETED:
        return <CheckCircle className="text-green-500" size={16} />;
      case PAYMENT_STATUS.FAILED:
      case PAYMENT_STATUS.CANCELLED:
        return <XCircle className="text-red-500" size={16} />;
      default:
        return <Clock className="text-yellow-500" size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case PAYMENT_STATUS.COMPLETED:
        return 'status-completed';
      case PAYMENT_STATUS.FAILED:
      case PAYMENT_STATUS.CANCELLED:
        return 'status-failed';
      default:
        return 'status-pending';
    }
  };

  const getSettlementStatusLabel = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return '정산완료';
      case 'COMPLETED':
        return '송금완료';
      case 'PENDING':
      default:
        return '대기중';
    }
  };

  const getSettlementStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case 'COMPLETED':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case 'PENDING':
      default:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
    }
  };

  // 정산 액션 핸들러
  const handleCompleteSettlement = async (settlementId) => {
    try {
      await settlementAPI.complete(settlementId);
      toast.success('송금 완료 처리되었습니다!');
      // 송금 성공 시 수령 확인까지 자동 처리
      try {
        await settlementAPI.confirm(settlementId);
        toast.success('수령 확인까지 자동 처리되었습니다!');
      } catch (confirmError) {
        logger.error('Auto confirm failed:', confirmError);
      }
      await loadSettlements();
    } catch (error) {
      logger.error('Failed to complete settlement:', error);
      toast.error(error.message || '처리 실패');
    }
  };

  const handleConfirmSettlement = async (settlementId) => {
    try {
      await settlementAPI.confirm(settlementId);
      toast.success('수령 확인되었습니다!');
      await loadSettlements();
    } catch (error) {
      logger.error('Failed to confirm settlement:', error);
      toast.error(error.message || '처리 실패');
    }
  };

  // 정산 통계
  const confirmedCount = settlements.filter(s => s.status === 'CONFIRMED').length;
  const completedCount = settlements.filter(s => s.status === 'COMPLETED').length;
  const pendingCount = settlements.filter(s => s.status === 'PENDING').length;
  const totalSettlements = settlements.length;
  const settlementRate = totalSettlements > 0 ? (((confirmedCount + completedCount) / totalSettlements) * 100).toFixed(0) : 0;

  // 내 정산
  const myToSend = settlements.filter(
    (s) => s.fromUser?.id === user?.id || s.fromUser?.email === user?.email
  );
  const myToReceive = settlements.filter(
    (s) => s.toUser?.id === user?.id || s.toUser?.email === user?.email
  );
  const others = settlements.filter(
    (s) =>
      !(s.fromUser?.id === user?.id || s.fromUser?.email === user?.email) &&
      !(s.toUser?.id === user?.id || s.toUser?.email === user?.email)
  );

  if (loading && settlementsLoading) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* 정산 현황 요약 */}
      <div className="card">
        <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          <Calculator size={20} />
          정산 현황
        </h3>

        {totalSettlements > 0 ? (
          <>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{confirmedCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">완료</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{completedCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">송금완료</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{pendingCount}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">대기</p>
              </div>
            </div>

            {/* 진행률 바 */}
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-500 dark:text-gray-400">정산 진행률</span>
                <span className="font-medium text-gray-900 dark:text-white">{settlementRate}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${settlementRate}%` }}
                />
              </div>
            </div>

            {/* 총 정산 금액 */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">총 정산 금액</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatCurrency(settlements.reduce((sum, s) => sum + (s.amount || 0), 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">정산 완료 금액</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {formatCurrency(
                      settlements
                        .filter(s => s.status === 'CONFIRMED' || s.status === 'COMPLETED')
                        .reduce((sum, s) => sum + (s.amount || 0), 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">미정산 금액</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {formatCurrency(
                      settlements
                        .filter(s => s.status === 'PENDING')
                        .reduce((sum, s) => sum + (s.amount || 0), 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            정산 내역이 없습니다
          </div>
        )}
      </div>

      {/* 정산 상세 목록 */}
      {totalSettlements > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">정산 상세</h3>

          <div className="space-y-5">
            {/* 내가 보내야 할 정산 */}
            {myToSend.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Send size={16} className="text-red-500 dark:text-red-400" />
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      보내야 할 정산
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      ({myToSend.length}건)
                    </span>
                  </div>
                  {myToSend.filter(s => s.status === 'PENDING').length > 1 && (
                    <button
                      onClick={handleOpenAllTransfer}
                      className="btn-press btn-press-primary flex items-center gap-1.5 px-3 py-1.5 text-white text-sm font-medium rounded-full shadow-md hover:shadow-lg"
                    >
                      <span className="btn-content flex items-center gap-1.5">
                        <Wallet size={14} />
                        전체 송금
                      </span>
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {myToSend.map((s) => (
                    <SettlementRow key={s.id} settlement={s} currentUser={user} onTransfer={handleOpenTransfer} onConfirm={handleConfirmSettlement} />
                  ))}
                </div>
              </div>
            )}

            {/* 내가 받아야 할 정산 */}
            {myToReceive.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Check size={16} className="text-green-500 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    받아야 할 정산
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    ({myToReceive.length}건)
                  </span>
                </div>
                <div className="space-y-2">
                  {myToReceive.map((s) => (
                    <SettlementRow key={s.id} settlement={s} currentUser={user} onConfirm={handleConfirmSettlement} />
                  ))}
                </div>
              </div>
            )}

            {/* 기타 정산 */}
            {others.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ArrowRight size={16} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    기타 정산
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    ({others.length}건)
                  </span>
                </div>
                <div className="space-y-2">
                  {others.map((s) => (
                    <SettlementRow key={s.id} settlement={s} currentUser={user} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 결제 내역 목록 (기존 payment 데이터) */}
      {payments.length > 0 && (
        <div className="card">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">참여자별 결제 상태</h3>

          <div className="space-y-2">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(payment.status)}
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">참여자 #{payment.participantId}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(payment.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(payment.amount)}</p>
                  <span className={`status-badge ${getStatusColor(payment.status)} text-xs`}>
                    {PAYMENT_STATUS_LABELS[payment.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 순차 송금 모달 */}
      {showSequentialTransfer && (
        <SequentialTransfer
          settlements={selectedSettlement ? [selectedSettlement] : myToSend}
          onClose={() => {
            setShowSequentialTransfer(false);
            setSelectedSettlement(null);
          }}
          onComplete={loadSettlements}
        />
      )}
    </div>
  );
};

// 정산 행 컴포넌트
const SettlementRow = ({ settlement, currentUser, onTransfer, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const isSender = settlement.fromUser?.id === currentUser?.id || settlement.fromUser?.email === currentUser?.email;
  const isReceiver = settlement.toUser?.id === currentUser?.id || settlement.toUser?.email === currentUser?.email;

  const handleTransfer = () => {
    if (onTransfer) {
      onTransfer(settlement);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(settlement.id);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-sm">
          <span className={`font-medium ${isSender ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
            {settlement.fromUser?.name || '알 수 없음'}
            {isSender && <span className="text-xs ml-1">(나)</span>}
          </span>
          <ArrowRight size={14} className="text-gray-400" />
          <span className={`font-medium ${isReceiver ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
            {settlement.toUser?.name || '알 수 없음'}
            {isReceiver && <span className="text-xs ml-1">(나)</span>}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          {settlement.amount?.toLocaleString()}원
        </span>

        {isSender ? (
          <button
            onClick={settlement.status === 'PENDING' ? handleTransfer : undefined}
            disabled={settlement.status !== 'PENDING'}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              settlement.status === 'PENDING'
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-default'
            }`}
          >
            {settlement.status === 'PENDING' ? <Send size={14} /> : <Check size={14} />}
            {settlement.status === 'PENDING' ? '송금하기' : settlement.status === 'COMPLETED' ? '송금완료' : '정산완료'}
          </button>
        ) : isReceiver ? (
          <button
            onClick={settlement.status === 'COMPLETED' ? handleConfirm : undefined}
            disabled={loading || settlement.status !== 'COMPLETED'}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              settlement.status === 'COMPLETED'
                ? 'bg-green-500 text-white hover:bg-green-600 disabled:opacity-50'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-default'
            }`}
          >
            {loading ? (
              <span className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
            ) : (
              <>
                {settlement.status === 'CONFIRMED' ? <Check size={14} /> : <Clock size={14} />}
                {settlement.status === 'PENDING' ? '송금 대기중' : settlement.status === 'COMPLETED' ? '수령확인' : '정산완료'}
              </>
            )}
          </button>
        ) : (
          <span className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg ${
            settlement.status === 'CONFIRMED'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
              : settlement.status === 'COMPLETED'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
          }`}>
            {settlement.status === 'CONFIRMED' ? <Check size={14} /> : settlement.status === 'COMPLETED' ? <Send size={14} /> : <Clock size={14} />}
            {settlement.status === 'PENDING' ? '대기중' : settlement.status === 'COMPLETED' ? '송금완료' : '정산완료'}
          </span>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;