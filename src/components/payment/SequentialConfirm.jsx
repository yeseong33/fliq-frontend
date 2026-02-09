import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Check, X, Clock, ArrowDownLeft } from 'lucide-react';
import { settlementAPI } from '../../api';
import toast from 'react-hot-toast';

const SequentialConfirm = ({ settlements, onClose, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [processedIds, setProcessedIds] = useState(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // PENDING + COMPLETED 상태만 대상 (CONFIRMED 제외)
  const targetSettlements = settlements.filter(s => s.status === 'PENDING' || s.status === 'COMPLETED');
  const totalCount = targetSettlements.length;
  const currentSettlement = targetSettlements[currentIndex];
  const processedCount = processedIds.size;

  // 모든 카드 처리 시 닫기
  useEffect(() => {
    if (processedCount === totalCount && totalCount > 0) {
      setTimeout(() => {
        onComplete?.();
        onClose();
      }, 300);
    }
  }, [processedCount, totalCount]);

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
  const handleConfirm = async () => {
    if (!currentSettlement || isProcessing) return;

    setIsProcessing(true);
    try {
      await settlementAPI.confirm(currentSettlement.id);
      setProcessedIds(prev => new Set([...prev, currentSettlement.id]));
      goNext();
      toast.success('수령 확인!');
    } catch (error) {
      console.error('Failed to confirm settlement:', error);
      toast.error('처리에 실패했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

  // 송금 받지 못했어요 (reject)
  const handleReject = async () => {
    if (!currentSettlement || isProcessing) return;

    setIsProcessing(true);
    try {
      await settlementAPI.reject(currentSettlement.id, '송금 미수령');
      setProcessedIds(prev => new Set([...prev, currentSettlement.id]));
      goNext();
      toast.success('재요청되었습니다');
    } catch (error) {
      console.error('Failed to reject settlement:', error);
      toast.error('처리에 실패했습니다');
    } finally {
      setIsProcessing(false);
    }
  };

  // 건너뛰기
  const handleSkip = () => {
    if (currentIndex < totalCount - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
        setCurrentIndex(prev => prev + 1);
      }, 300);
    }
  };

  // 대상이 없는 경우
  if (totalCount === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 flex flex-col">
        <div className="flex items-center justify-between p-4">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center">
            <ChevronLeft className="text-gray-600 dark:text-gray-400" size={24} />
          </button>
          <div className="text-gray-900 dark:text-white font-medium">수령 확인</div>
          <div className="w-10" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
            <Check className="text-green-500" size={40} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            확인할 정산이 없습니다
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            모든 수령이 확인되었거나<br />대기 중인 정산이 없습니다.
          </p>
        </div>

        <div className="p-6 pb-8">
          <button
            onClick={onClose}
            className="w-full py-4 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-2xl"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = currentSettlement?.status === 'COMPLETED';
  const isPending = currentSettlement?.status === 'PENDING';

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center">
          <ChevronLeft className="text-gray-600 dark:text-gray-400" size={24} />
        </button>
        <div className="text-gray-900 dark:text-white font-medium">
          수령 확인 ({currentIndex + 1}/{totalCount})
        </div>
        <div className="w-10" />
      </div>

      {/* 진행 바 */}
      <div className="px-6 mb-2">
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* 카드 스택 영역 */}
        <div className="relative w-full max-w-sm">
          {/* 뒤 카드들 (미리보기) */}
          {targetSettlements.slice(currentIndex + 1, currentIndex + 3).map((_, idx) => (
            <div
              key={idx}
              className="absolute inset-x-4 top-0 h-full bg-white dark:bg-gray-800 rounded-3xl shadow-lg"
              style={{
                transform: `translateY(${(idx + 1) * 12}px) scale(${1 - (idx + 1) * 0.04})`,
                opacity: 1 - (idx + 1) * 0.25,
                zIndex: 10 - idx,
              }}
            />
          ))}

          {/* 현재 카드 */}
          <div
            className={`relative bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden transition-all duration-500 ${
              isAnimating ? 'animate-card-fly-up' : ''
            }`}
            style={{ zIndex: 20 }}
          >
            {/* 카드 상단 */}
            <div className="h-32 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 relative overflow-hidden">
              {/* 장식 원들 */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <ArrowDownLeft className="text-white" size={36} />
                </div>
              </div>
            </div>

            {/* 카드 내용 */}
            <div className="p-6">
              {/* 송금자 정보 */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
                  <span className="text-lg font-bold text-gray-600 dark:text-gray-300">
                    {currentSettlement?.fromUser?.name?.charAt(0) || '?'}
                  </span>
                </div>
                <div className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {currentSettlement?.fromUser?.name || '알 수 없음'}
                </div>
                {/* 상태 배지 */}
                {isCompleted ? (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm rounded-full">
                    <Check size={14} />
                    송금 완료됨
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 text-sm rounded-full">
                    <Clock size={14} />
                    아직 송금되지 않음
                  </div>
                )}
              </div>

              {/* 금액 */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-5 mb-6">
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">받을 금액</div>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white">
                    {currentSettlement?.amount?.toLocaleString()}
                    <span className="text-xl font-normal text-gray-400 ml-1">원</span>
                  </div>
                </div>
              </div>

              {/* 상태별 버튼 */}
              {isCompleted ? (
                <div className="space-y-3">
                  {/* 수령 확인 버튼 */}
                  <button
                    onClick={handleConfirm}
                    disabled={isProcessing}
                    className="btn-action btn-action-success w-full py-4 disabled:opacity-50 text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {isProcessing ? (
                        <span className="loading-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </span>
                      ) : (
                        <>
                          <Check size={22} />
                          수령 확인
                        </>
                      )}
                    </span>
                  </button>
                  {/* 송금 받지 못했어요 버튼 */}
                  <button
                    onClick={handleReject}
                    disabled={isProcessing}
                    className="w-full py-3 text-red-500 dark:text-red-400 font-medium text-sm flex items-center justify-center gap-1 hover:text-red-600 dark:hover:text-red-300 transition-colors disabled:opacity-50"
                  >
                    <X size={16} />
                    송금 받지 못했어요
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-full py-4 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 font-medium text-lg rounded-2xl flex items-center justify-center gap-2">
                    <Clock size={22} />
                    송금 대기 중
                  </div>
                  <button
                    onClick={currentIndex < totalCount - 1 ? handleSkip : onClose}
                    className="w-full py-4 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 font-semibold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                  >
                    {currentIndex < totalCount - 1 ? (
                      <>
                        건너뛰기
                        <ChevronRight size={18} />
                      </>
                    ) : (
                      '닫기'
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 건너뛰기 */}
      {currentIndex < totalCount - 1 && (
        <div className="p-6 pb-8">
          <button
            onClick={handleSkip}
            className="w-full py-4 text-gray-500 dark:text-gray-400 font-medium flex items-center justify-center gap-1 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            다음에 할게요
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SequentialConfirm;
