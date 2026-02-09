import React, { useState, useEffect, useCallback } from 'react';
import { Send, Check, ChevronLeft } from 'lucide-react';
import { getBankName } from '../../utils/tossDeeplink';
import { settlementAPI } from '../../api';
import toast from 'react-hot-toast';

const SequentialTransfer = ({ settlements, onClose, onComplete, onStateChange }) => {
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

  // body 스크롤 막기 + 터치 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.top = `-${window.scrollY}px`;

    return () => {
      const scrollY = document.body.style.top;
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.top = '';
      window.scrollTo(0, parseInt(scrollY || '0') * -1);
    };
  }, []);

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

      setIsAnimating(true);
      setCompletedIds(prev => new Set([...prev, currentSettlement.id]));

      setTimeout(() => {
        setIsAnimating(false);
        if (currentIndex < totalCount - 1) {
          setCurrentIndex(prev => prev + 1);
        }
      }, 500);

      toast.success('송금 완료!');
    } catch (error) {
      console.error('Failed to complete settlement:', error);
      toast.error('처리에 실패했습니다');
    } finally {
      setIsProcessing(false);
    }
  }, [currentSettlement, isProcessing, currentIndex, totalCount]);

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

  // 상태를 부모에게 전달
  useEffect(() => {
    if (onStateChange && currentSettlement) {
      onStateChange({
        currentSettlement,
        hasOpenedToss,
        isProcessing,
        canSkip: currentIndex < totalCount - 1,
        handleTransfer,
        handleMarkComplete,
        handleSkip,
      });
    }
  }, [currentSettlement, hasOpenedToss, isProcessing, currentIndex, totalCount, handleTransfer, handleMarkComplete, handleSkip, onStateChange]);

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
      <div
        className="fixed inset-0 z-40 bg-white dark:bg-gray-900 flex flex-col overflow-hidden"
        style={{ height: '100dvh', touchAction: 'none' }}
      >
        <div className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] h-14 flex-shrink-0">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center -ml-2">
            <ChevronLeft className="text-gray-600 dark:text-gray-400" size={24} />
          </button>
          <div className="text-gray-900 dark:text-white font-medium">송금</div>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <Check className="text-green-500" size={32} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            보낼 정산이 없습니다
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            모든 정산이 완료되었거나<br />대기 중인 송금이 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-40 bg-white dark:bg-gray-900 flex flex-col overflow-hidden"
      style={{ height: '100dvh', touchAction: 'none' }}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 pt-[env(safe-area-inset-top)] h-14 flex-shrink-0">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center -ml-2">
          <ChevronLeft className="text-gray-600 dark:text-gray-400" size={24} />
        </button>
        <div className="text-gray-900 dark:text-white font-medium">
          송금 {currentIndex + 1}/{totalCount}
        </div>
        <div className="w-10" />
      </div>

      {/* 진행 바 */}
      <div className="px-4 pb-3 flex-shrink-0">
        <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* 메인 콘텐츠 - 카드만 표시 */}
      <div className="px-4 flex-shrink-0">
        <div className="max-w-sm mx-auto">
          <div
            className={`bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden transition-all duration-500 ${
              isAnimating ? 'animate-card-fly-up' : ''
            }`}
          >
            {/* 카드 상단 그라데이션 */}
            <div className="h-28 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Send className="text-white" size={28} />
                </div>
              </div>
            </div>

            {/* 카드 내용 */}
            <div className="p-5">
              {/* 수신자 정보 */}
              <div className="text-center mb-5">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full mb-2">
                  <span className="text-lg font-bold text-gray-600 dark:text-gray-300">
                    {currentSettlement?.toUser?.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {currentSettlement?.toUser?.name || '알 수 없음'}
                </div>
                {currentSettlement?.toUserPaymentMethod ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {getBankName(currentSettlement.toUserPaymentMethod.bankCode)}{' '}
                    {currentSettlement.toUserPaymentMethod.accountNumber}
                  </div>
                ) : (
                  <div className="text-sm text-red-500">계좌 정보 없음</div>
                )}
              </div>

              {/* 금액 */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-4">
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">송금 금액</div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {currentSettlement?.amount?.toLocaleString()}
                    <span className="text-lg font-normal text-gray-400 ml-1">원</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 남은 카드 표시 */}
          {totalCount - currentIndex > 1 && (
            <div className="text-center mt-3 text-sm text-gray-400 dark:text-gray-500">
              {totalCount - currentIndex - 1}건 더 있어요
            </div>
          )}
        </div>
      </div>

      {/* 하단 버튼은 SettlementBottomBar에서 렌더링 */}
    </div>
  );
};

export default SequentialTransfer;
