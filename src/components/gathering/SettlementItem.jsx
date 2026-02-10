import React, { useState } from 'react';
import { ArrowRight, Send, Check, Clock } from 'lucide-react';

const SettlementItem = ({ settlement, currentUser, onComplete, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const isSender = settlement.fromUser?.id === currentUser?.id || settlement.fromUser?.email === currentUser?.email;
  const isReceiver = settlement.toUser?.id === currentUser?.id || settlement.toUser?.email === currentUser?.email;

  const handleComplete = async () => {
    setLoading(true);
    try {
      await onComplete(settlement.id);
    } finally {
      setLoading(false);
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

        {/* 액션 버튼 */}
        {isSender ? (
          <button
            onClick={settlement.status === 'PENDING' ? handleComplete : undefined}
            disabled={loading || settlement.status !== 'PENDING'}
            className={`flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              settlement.status === 'PENDING'
                ? 'bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50'
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
                {settlement.status === 'PENDING' ? <Send size={14} /> : <Check size={14} />}
                {settlement.status === 'PENDING' ? '송금하기' : settlement.status === 'COMPLETED' ? '송금완료' : '정산완료'}
              </>
            )}
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

export default SettlementItem;
