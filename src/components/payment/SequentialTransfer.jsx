import React, { useState, useEffect, useCallback } from 'react';
import { X, Send, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { getBankName } from '../../utils/tossDeeplink';
import { settlementAPI } from '../../api';
import toast from 'react-hot-toast';

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
  const progress = totalCount > 0 ? ((completedCount) / totalCount) * 100 : 0;
  const hasOpenedToss = currentSettlement && openedTossIds.has(currentSettlement.id);

  // 모든 송금 완료 시 바로 닫기
  useEffect(() => {
    if (completedCount === totalCount && totalCount > 0) {
      setTimeout(() => {
        onComplete?.();
        onClose();
      }, 300);
    }
  }, [completedCount, totalCount]);

  // 토스로 송금하기
  const handleTransfer = useCallback(() => {
    if (!currentSettlement?.tossDeeplink) {
      toast.error('수신자의 계좌 정보가 없습니다');
      return;
    }

    window.location.href = currentSettlement.tossDeeplink;

    // 토스 앱 열었음을 기록
    setOpenedTossIds(prev => new Set([...prev, currentSettlement.id]));
  }, [currentSettlement]);

  // 송금 완료 처리
  const handleMarkComplete = async () => {
    if (!currentSettlement || isProcessing) return;

    setIsProcessing(true);
    try {
      await settlementAPI.complete(currentSettlement.id);

      // 애니메이션 시작
      setIsAnimating(true);
      setCompletedIds(prev => new Set([...prev, currentSettlement.id]));

      // 다음 카드로 이동
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
  };

  // 건너뛰기
  const handleSkip = () => {
    if (currentIndex < totalCount - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsAnimating(false);
        setCurrentIndex(prev => prev + 1);
        // 건너뛴 항목도 openedToss에서 제거하여 다음에 다시 시작할 수 있게
        setOpenedTossIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(currentSettlement?.id);
          return newSet;
        });
      }, 300);
    }
  };

  // 보낼 정산이 없는 경우
  if (totalCount === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4">
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center">
            <ChevronLeft className="text-gray-600 dark:text-gray-400" size={24} />
          </button>
          <div className="text-gray-900 dark:text-white font-medium">송금</div>
          <div className="w-10" />
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
            <Check className="text-green-500" size={40} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            보낼 정산이 없습니다
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            모든 정산이 완료되었거나<br />대기 중인 송금이 없습니다.
          </p>
        </div>

        {/* 하단 버튼 */}
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

  return (
    <div className="fixed inset-0 z-50 bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center">
          <ChevronLeft className="text-gray-600 dark:text-gray-400" size={24} />
        </button>
        <div className="text-gray-900 dark:text-white font-medium">
          송금 ({currentIndex + 1}/{totalCount})
        </div>
        <div className="w-10" />
      </div>

      {/* 진행 바 */}
      <div className="px-6 mb-2">
        <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }}
          />
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        {/* 카드 스택 영역 */}
        <div className="relative w-full max-w-sm">
          {/* 뒤 카드들 (미리보기) */}
          {pendingSettlements.slice(currentIndex + 1, currentIndex + 3).map((_, idx) => (
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
            <div className="h-32 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 relative overflow-hidden">
              {/* 장식 원들 */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Send className="text-white" size={36} />
                </div>
              </div>
            </div>

            {/* 카드 내용 */}
            <div className="p-6">
              {/* 수신자 정보 */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
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
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-5 mb-6">
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">송금 금액</div>
                  <div className="text-4xl font-bold text-gray-900 dark:text-white">
                    {currentSettlement?.amount?.toLocaleString()}
                    <span className="text-xl font-normal text-gray-400 ml-1">원</span>
                  </div>
                </div>
              </div>

              {/* 송금 버튼 */}
              {hasOpenedToss ? (
                <button
                  onClick={handleMarkComplete}
                  disabled={isProcessing}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-500/25"
                >
                  {isProcessing ? (
                    <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Check size={22} />
                      송금 완료했어요
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleTransfer}
                  disabled={!currentSettlement?.tossDeeplink}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-lg rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/25"
                >
                  <Send size={22} />
                  {currentSettlement?.amount?.toLocaleString()}원 송금하기
                </button>
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

export default SequentialTransfer;
