import React, { useState, useEffect } from 'react';
import toast from '../../utils/toast';
import logger from '../../utils/logger';
import { expenseAPI } from '../../api';
import Button from '../common/Button';
import Modal from '../common/Modal';

const ExpenseDetailModal = ({ isOpen, onClose, expense, onDelete, categoryLabels, gathering, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [participantShares, setParticipantShares] = useState([]);

  // 참여자 목록 초기화
  useEffect(() => {
    if (isOpen && expense && gathering) {
      const allParticipants = [];

      // 방장 추가
      if (gathering.owner) {
        const isIncluded = expense.participants?.some(p => p.user?.id === gathering.owner.id);
        const participantData = expense.participants?.find(p => p.user?.id === gathering.owner.id);
        allParticipants.push({
          userId: gathering.owner.id,
          userName: gathering.owner.name || '방장',
          isOwner: true,
          included: isIncluded,
          shareAmount: participantData?.shareAmount || 0,
        });
      }

      // 나머지 참여자 추가
      if (gathering.participants) {
        gathering.participants.forEach(p => {
          const participantId = p.user?.id || p.id;
          if (participantId !== gathering.owner?.id) {
            const isIncluded = expense.participants?.some(ep => ep.user?.id === participantId);
            const participantData = expense.participants?.find(ep => ep.user?.id === participantId);
            allParticipants.push({
              userId: participantId,
              userName: p.user?.name || p.name || '알 수 없음',
              isOwner: false,
              included: isIncluded,
              shareAmount: participantData?.shareAmount || 0,
            });
          }
        });
      }

      setParticipantShares(allParticipants);
      setIsEditing(false);
    }
  }, [isOpen, expense, gathering]);

  if (!expense) return null;

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleToggleParticipant = (userId) => {
    setParticipantShares(prev => prev.map(p =>
      p.userId === userId ? { ...p, included: !p.included } : p
    ));
  };

  const handleDelete = async () => {
    if (!confirm('이 지출을 삭제하시겠습니까?')) return;

    setLoading(true);
    try {
      await expenseAPI.delete(expense.id);
      toast.success('지출이 삭제되었습니다.');
      onDelete?.();
      onClose();
    } catch (error) {
      logger.error('Delete error:', error);
      toast.error(error.response?.data?.message || '삭제 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const includedParticipants = participantShares.filter(p => p.included);
    if (includedParticipants.length === 0) {
      toast.error('최소 1명의 참여자를 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      // 기존 지출 삭제 후 새로 생성
      await expenseAPI.delete(expense.id);

      const requestData = {
        gatheringId: expense.gatheringId,
        totalAmount: expense.totalAmount,
        description: expense.description || undefined,
        location: expense.location || undefined,
        category: expense.category,
        paidAt: expense.paidAt,
        receiptImageUrl: expense.receiptImageUrl || undefined,
        shareType: 'EQUAL',
        participants: includedParticipants.map(p => ({
          userId: p.userId,
          shareValue: 0,
        })),
      };

      await expenseAPI.create(requestData);
      toast.success('지출이 수정되었습니다.');
      onUpdate?.();
      onClose();
    } catch (error) {
      logger.error('Update error:', error);
      toast.error(error.response?.data?.message || '수정 실패');
    } finally {
      setLoading(false);
    }
  };

  const includedCount = participantShares.filter(p => p.included).length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="지출 상세">
      <div className="space-y-4">
        {/* 금액 */}
        <div className="text-center py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {expense.totalAmount?.toLocaleString()}원
          </div>
          <span className="inline-block mt-2 text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
            {categoryLabels[expense.category] || expense.category}
          </span>
        </div>

        {/* 상세 정보 */}
        <div className="space-y-3 text-sm">
          {expense.description && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">설명</span>
              <span className="text-gray-900 dark:text-white">{expense.description}</span>
            </div>
          )}
          {expense.location && (
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">위치</span>
              <span className="text-gray-900 dark:text-white">{expense.location}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">결제자</span>
            <span className="text-gray-900 dark:text-white">{expense.payer?.name || '알 수 없음'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">결제 시간</span>
            <span className="text-gray-900 dark:text-white">{formatDateTime(expense.paidAt)}</span>
          </div>
        </div>

        {/* 참여자 */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              참여자 {isEditing && `(${includedCount}명 선택)`}
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              {isEditing ? '취소' : '수정'}
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {participantShares.map((p) => (
              <div key={p.userId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {isEditing ? (
                  <>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={p.included}
                        onChange={() => handleToggleParticipant(p.userId)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                    <span className={`flex-1 ml-3 text-sm ${p.included ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500 line-through'}`}>
                      {p.userName}
                      {p.isOwner && <span className="ml-1 text-xs bg-black text-white px-1.5 py-0.5 rounded">방장</span>}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-sm text-gray-900 dark:text-white">
                      {p.userName}
                      {p.isOwner && <span className="ml-1 text-xs bg-black text-white px-1.5 py-0.5 rounded">방장</span>}
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {p.shareAmount?.toLocaleString()}원
                    </span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 pt-2">
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => setIsEditing(false)}
              >
                취소
              </Button>
              <Button
                type="button"
                fullWidth
                onClick={handleSave}
                loading={loading}
              >
                저장
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={handleDelete}
                loading={loading}
                className="!text-red-600 dark:!text-red-400"
              >
                삭제
              </Button>
              <Button type="button" fullWidth onClick={onClose}>
                닫기
              </Button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ExpenseDetailModal;
