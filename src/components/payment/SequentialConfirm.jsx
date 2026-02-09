import React, { useState, useEffect, useCallback } from 'react';
import { Check, Clock, ArrowDownLeft } from 'lucide-react';
import { settlementAPI } from '../../api';
import toast from 'react-hot-toast';

const SequentialConfirm = ({ settlements, onClose, onComplete, onStateChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processedIds, setProcessedIds] = useState(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // PENDING + COMPLETED 상태만 대상 (CONFIRMED 제외)
  const targetSettlements = settlements.filter(s => s.status === 'PENDING' || s.status === 'COMPLETED');
  const totalCount = targetSettlements.length;
  const currentSettlement = targetSettlements[currentIndex];
  const processedCount = processedIds.size;
  const isCompleted = currentSettlement?.status === 'COMPLETED';

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

  // 다음 카드로 이동
  const goNext = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      if (currentIndex < totalCount - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }, 500);
  }, [currentIndex, totalCount]);

  // 수령 확인
  const handleConfirm = useCallback(async () => {
    if (!currentSettlement || isProcessing) return;

    setIsProcessing(true);
    try {
      await settlementAPI.confirm(currentSettlement.id);

      const newProcessedIds = new Set([...processedIds, currentSettlement.id]);
      setProcessedIds(newProcessedIds);

      // 마지막 항목이면 바로 완료 처리
      if (newProcessedIds.size === totalCount) {
        toast.success('모든 수령 확인 완료!');
        setIsAnimating(true);
        setTimeout(() => {
          onComplete?.();
          onClose();
        }, 500);
        return;
      }

      goNext();
      toast.success('수령 확인!');
    } catch (error) {
      console.error('Failed to confirm settlement:', error);
      toast.error('처리에 실패했습니다');
    } finally {
      setIsProcessing(false);
    }
  }, [currentSettlement, isProcessing, goNext, processedIds, totalCount, onComplete, onClose]);

  // 송금 받지 못했어요 (reject)
  const handleReject = useCallback(async () => {
    if (!currentSettlement || isProcessing) return;

    setIsProcessing(true);
    try {
      await settlementAPI.reject(currentSettlement.id, '송금 미수령');

      const newProcessedIds = new Set([...processedIds, currentSettlement.id]);
      setProcessedIds(newProcessedIds);

      // 마지막 항목이면 바로 완료 처리
      if (newProcessedIds.size === totalCount) {
        toast.success('모든 처리 완료!');
        setTimeout(() => {
          onComplete?.();
          onClose();
        }, 500);
        return;
      }

      goNext();
      toast.success('재요청되었습니다');
    } catch (error) {
      console.error('Failed to reject settlement:', error);
      toast.error('처리에 실패했습니다');
    } finally {
      setIsProcessing(false);
    }
  }, [currentSettlement, isProcessing, goNext, processedIds, totalCount, onComplete, onClose]);

  // 건너뛰기
  const handleSkip = useCallback(() => {
    if (currentIndex < totalCount - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
        setCurrentIndex(prev => prev + 1);
      }, 300);
    }
  }, [currentIndex, totalCount]);

  // 닫기 핸들러
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // 상태를 부모에게 전달
  useEffect(() => {
    if (onStateChange && currentSettlement) {
      onStateChange({
        currentSettlement,
        isCompleted,
        isProcessing,
        canSkip: currentIndex < totalCount - 1,
        handleConfirm,
        handleReject,
        handleSkip,
        handleClose,
      });
    }
  }, [currentSettlement, isCompleted, isProcessing, currentIndex, totalCount, handleConfirm, handleReject, handleSkip, handleClose, onStateChange]);

  // 모든 카드 처리 시 닫기
  useEffect(() => {
    if (processedCount === totalCount && totalCount > 0) {
      setTimeout(() => {
        onComplete?.();
        onClose();
      }, 300);
    }
  }, [processedCount, totalCount, onComplete, onClose]);

  // 대상이 없는 경우
  if (totalCount === 0) {
    return (
      <div
        className="fixed inset-0 z-[60] bg-white dark:bg-gray-900 flex flex-col overflow-hidden"
        style={{ height: '100dvh' }}
      >
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
            <Check className="text-green-500" size={32} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            확인할 정산이 없습니다
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-6">
            모든 수령이 확인되었거나<br />대기 중인 정산이 없습니다.
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
    <div className="fixed inset-0 z-[60] bg-white dark:bg-gray-900 flex flex-col overflow-hidden" style={{ height: '100dvh', touchAction: 'none' }}>
      {/* 프로그래스 바 */}
      <div className="shrink-0 px-5 pt-4" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)' }}>
        <div className="flex gap-1.5">
          {Array.from({ length: totalCount }, (_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                i <= currentIndex ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 카드 영역 */}
      <div className="flex-1 flex items-center justify-center px-5 min-h-0">
        <div className="w-full max-w-sm">
          <div
            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg transition-all duration-500 ${
              isAnimating ? 'animate-card-fly-up' : ''
            }`}
          >
            <div className="h-20 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 relative rounded-t-2xl overflow-hidden">
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-white/10 rounded-full" />
              <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/10 rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <ArrowDownLeft className="text-white" size={18} />
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="text-center mb-3">
                <div className="inline-flex items-center justify-center w-9 h-9 bg-gray-100 dark:bg-gray-700 rounded-full mb-1">
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                    {currentSettlement?.fromUser?.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="text-base font-bold text-gray-900 dark:text-white">
                  {currentSettlement?.fromUser?.name || '알 수 없음'}
                </div>
                {isCompleted ? (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                    <Check size={10} />
                    송금 완료됨
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-xs rounded-full">
                    <Clock size={10} />
                    아직 송금되지 않음
                  </div>
                )}
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3">
                <div className="text-center">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">받을 금액</div>
                  <div className="text-xl font-bold text-gray-900 dark:text-white">
                    +{currentSettlement?.amount?.toLocaleString()}
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

      {/* 하단 버튼 영역 여백 */}
      <div className="shrink-0" style={{ height: 'calc(130px + env(safe-area-inset-bottom))' }} />
    </div>
  );
};

export default SequentialConfirm;
