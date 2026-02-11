import React, { useState, useEffect, useCallback } from 'react';
import { Send, Check, ChevronRight } from 'lucide-react';
import { getBankName } from '../../utils/tossDeeplink';
import { settlementAPI } from '../../api';
import { useNavigationStore } from '../../store/navigationStore';
import toast from '../../utils/toast';
import logger from '../../utils/logger';

const SequentialTransfer = ({ settlements, onClose, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState(new Set());
  const [openedTossIds, setOpenedTossIds] = useState(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const pendingSettlements = settlements.filter(s => s.status === 'PENDING');
  const totalCount = pendingSettlements.length;
  const currentSettlement = pendingSettlements[currentIndex];
  const completedCount = completedIds.size;
  const hasOpenedToss = currentSettlement && openedTossIds.has(currentSettlement.id);
  const canSkip = currentIndex < totalCount - 1;

  // 토스로 송금하기
  const handleTransfer = useCallback(() => {
    if (!currentSettlement?.tossDeeplink) {
      toast.error('수신자의 계좌 정보가 없습니다');
      return;
    }

    window.location.href = currentSettlement.tossDeeplink;
    setOpenedTossIds(prev => new Set([...prev, currentSettlement.id]));
  }, [currentSettlement]);

  // 송금 완료 처리
  const handleMarkComplete = useCallback(async () => {
    if (!currentSettlement || isProcessing) return;

    setIsProcessing(true);
    try {
      await settlementAPI.complete(currentSettlement.id);

      const newCompletedIds = new Set([...completedIds, currentSettlement.id]);
      setCompletedIds(newCompletedIds);

      const isLastCard = currentIndex === totalCount - 1;

      // 마지막 항목이면 바로 완료 처리
      if (newCompletedIds.size === totalCount || isLastCard) {
        toast.success('모든 송금 완료!');
        setIsAnimating(true);
        setTimeout(() => {
          onComplete?.();
          onClose();
        }, 500);
        return;
      }

      // 다음 항목으로 이동
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
        setCurrentIndex(prev => prev + 1);
      }, 500);

      toast.success('송금 완료!');
    } catch (error) {
      logger.error('Failed to complete settlement:', error);
      toast.error('처리에 실패했습니다');
    } finally {
      setIsProcessing(false);
    }
  }, [currentSettlement, isProcessing, totalCount, currentIndex, completedIds, onComplete, onClose]);

  // 건너뛰기
  const handleSkip = useCallback(() => {
    if (currentIndex < totalCount - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
        setCurrentIndex(prev => prev + 1);
        setOpenedTossIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(currentSettlement?.id);
          return newSet;
        });
      }, 300);
    }
  }, [currentIndex, totalCount, currentSettlement?.id]);

  // 닫기 핸들러
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const { openFullscreenModal, closeFullscreenModal } = useNavigationStore();

  // 배경 스크롤 방지 & 바텀 네비 숨김
  useEffect(() => {
    document.body.classList.add('modal-open');
    openFullscreenModal();
    return () => {
      document.body.classList.remove('modal-open');
      closeFullscreenModal();
    };
  }, []);

  // 모든 송금 완료 시 바로 닫기
  useEffect(() => {
    if (completedCount === totalCount && totalCount > 0) {
      setTimeout(() => {
        onComplete?.();
        onClose();
      }, 300);
    }
  }, [completedCount, totalCount, onComplete, onClose]);

  // 보낼 정산이 없는 경우
  if (totalCount === 0) {
    return (
      <div className="fixed inset-0 z-[60] bg-white dark:bg-gray-900 flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <Check className="text-green-500" size={32} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            보낼 정산이 없습니다
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
            모든 정산이 완료되었거나<br />대기 중인 송금이 없습니다.
          </p>
          <button
            onClick={handleClose}
            className="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
            type="button"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="fixed inset-0 z-[60] bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
      {/* 프로그래스 바 */}
      <div className="shrink-0 px-5 pt-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>
        <div className="flex gap-1.5">
          {Array.from({ length: totalCount }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= currentIndex ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 카드 영역 - 중앙 정렬 */}
      <div className="flex-1 flex items-center justify-center px-5 min-h-0">
        <div className="w-full max-w-sm mx-auto">
          <div
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg transition-all duration-500 ${
              isAnimating ? 'animate-card-fly-up' : ''
            }`}
          >
            <div className="h-20 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 relative rounded-t-2xl overflow-hidden">
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/10 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Send className="text-white" size={18} />
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="text-center mb-3">
                <div className="inline-flex items-center justify-center w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-full mb-1">
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                    {currentSettlement?.toUser?.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="text-base font-bold text-gray-900 dark:text-white">
                  {currentSettlement?.toUser?.name || '알 수 없음'}
                </div>
                {currentSettlement?.toUserPaymentMethod ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {getBankName(currentSettlement.toUserPaymentMethod.bankCode)}{' '}
                    {currentSettlement.toUserPaymentMethod.accountNumber}
                  </div>
                ) : (
                  <div className="text-xs text-red-500">계좌 정보 없음</div>
                )}
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">송금 금액</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    {currentSettlement?.amount?.toLocaleString()}
                    <span className="text-sm font-normal text-gray-400 ml-1">원</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {totalCount - currentIndex > 1 && (
            <div className="text-center mt-2 text-xs text-gray-400 dark:text-gray-500">
              {totalCount - currentIndex - 1}건 더 있어요
            </div>
          )}
        </div>
      </div>

    </div>

      {/* 하단 버튼 - 별도 fixed 컨테이너 */}
      <div className="fixed bottom-0 left-0 right-0 z-[61] bg-white dark:bg-gray-900 px-4 pt-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
        <div className="max-w-sm mx-auto space-y-2">
          {hasOpenedToss ? (
            <button
              onClick={handleMarkComplete}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-green-500/30 transition-colors"
            >
              {isProcessing ? (
                <span className="loading-dots"><span></span><span></span><span></span></span>
              ) : (
                <>
                  <Check size={18} />
                  <span>송금 완료했어요</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleTransfer}
              disabled={!currentSettlement?.tossDeeplink}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-colors"
            >
              <Send size={18} />
              <span>{currentSettlement?.amount?.toLocaleString()}원 송금</span>
            </button>
          )}
          <button
            onClick={canSkip ? handleSkip : handleClose}
            className="w-full py-2 text-gray-500 dark:text-gray-400 text-sm font-medium flex items-center justify-center gap-1"
          >
            {canSkip ? (
              <>
                다음에 할게요
                <ChevronRight size={14} />
              </>
            ) : (
              '닫기'
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default SequentialTransfer;
