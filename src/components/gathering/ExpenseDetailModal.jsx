import React, { useState, useEffect } from 'react';
import toast from '../../utils/toast';
import logger from '../../utils/logger';
import { expenseAPI } from '../../api';
import { EXPENSE_ERROR_CODES } from '../../utils/errorCodes';
import Button from '../common/Button';
import Modal from '../common/Modal';

const CATEGORIES = [
  { value: 'FOOD', label: '식사', icon: '🍽️' },
  { value: 'CAFE', label: '카페', icon: '☕' },
  { value: 'DRINK', label: '술/음료', icon: '🍺' },
  { value: 'TRANSPORT', label: '교통', icon: '🚗' },
  { value: 'TAXI', label: '택시', icon: '🚕' },
  { value: 'PARKING', label: '주차', icon: '🅿️' },
  { value: 'ACCOMMODATION', label: '숙박', icon: '🏨' },
  { value: 'ENTERTAINMENT', label: '오락', icon: '🎮' },
  { value: 'CULTURE', label: '문화', icon: '🎬' },
  { value: 'SPORTS', label: '운동', icon: '⚽' },
  { value: 'SHOPPING', label: '쇼핑', icon: '🛍️' },
  { value: 'GROCERY', label: '장보기', icon: '🛒' },
  { value: 'OTHER', label: '기타', icon: '📦' },
];

const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map(c => [c.value, c]));
const MAX_AMOUNT = 99999999;

const ExpenseDetailModal = ({ isOpen, onClose, expense, onDelete, categoryLabels, gathering, onUpdate, settlementLocked }) => {
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [participantShares, setParticipantShares] = useState([]);
  const [editData, setEditData] = useState({
    totalAmount: '',
    description: '',
    category: 'FOOD',
    location: '',
  });

  // 참여자 목록 및 편집 데이터 초기화
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
      setEditData({
        totalAmount: String(expense.totalAmount || ''),
        description: expense.description || '',
        category: expense.category || 'FOOD',
        location: expense.location || '',
      });
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

  const handleToggleAll = () => {
    const allIncluded = participantShares.every(p => p.included);
    setParticipantShares(prev => prev.map(p => ({ ...p, included: !allIncluded })));
  };

  const handleAmountChange = (value) => {
    const raw = value.replace(/,/g, '').replace(/[^0-9]/g, '');
    setEditData(prev => ({ ...prev, totalAmount: raw }));
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
      const code = error.code || error.response?.data?.code;
      if (code === EXPENSE_ERROR_CODES.LOCKED_BY_SETTLEMENT) {
        toast.error('정산이 진행 중이라 삭제할 수 없습니다.');
      } else {
        toast.error(error.message || '삭제 실패');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const amount = parseFloat(editData.totalAmount);
    if (!editData.totalAmount || isNaN(amount) || amount <= 0) {
      toast.error('금액을 입력해주세요.');
      return;
    }
    if (amount > MAX_AMOUNT) {
      toast.error(`최대 금액은 ${MAX_AMOUNT.toLocaleString()}원입니다.`);
      return;
    }

    const includedParticipants = participantShares.filter(p => p.included);
    if (includedParticipants.length === 0) {
      toast.error('최소 1명의 참여자를 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        totalAmount: amount,
        description: editData.description || undefined,
        location: editData.location || undefined,
        category: editData.category,
        paidAt: expense.paidAt,
        receiptImageUrl: expense.receiptImageUrl || undefined,
        shareType: 'EQUAL',
        participants: includedParticipants.map(p => ({
          userId: p.userId,
          shareValue: 0,
        })),
      };

      await expenseAPI.update(expense.id, requestData);
      toast.success('지출이 수정되었습니다.');
      onUpdate?.();
      onClose();
    } catch (error) {
      logger.error('Update error:', error);
      const code = error.code || error.response?.data?.code;
      if (code === EXPENSE_ERROR_CODES.LOCKED_BY_SETTLEMENT) {
        toast.error('정산이 진행 중이라 수정할 수 없습니다.');
      } else {
        toast.error(error.message || '수정 실패');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = () => {
    setEditData({
      totalAmount: String(expense.totalAmount || ''),
      description: expense.description || '',
      category: expense.category || 'FOOD',
      location: expense.location || '',
    });
    // 참여자 상태도 원본 기준으로 리셋
    setParticipantShares(prev => prev.map(p => ({
      ...p,
      included: expense.participants?.some(ep => ep.user?.id === p.userId) || false,
    })));
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    // 원본 데이터로 복원
    setEditData({
      totalAmount: String(expense.totalAmount || ''),
      description: expense.description || '',
      category: expense.category || 'FOOD',
      location: expense.location || '',
    });
    setParticipantShares(prev => prev.map(p => ({
      ...p,
      included: expense.participants?.some(ep => ep.user?.id === p.userId) || false,
    })));
    setIsEditing(false);
  };

  const includedCount = participantShares.filter(p => p.included).length;
  const formattedEditAmount = editData.totalAmount
    ? Number(editData.totalAmount).toLocaleString()
    : '';
  const perPersonAmount = includedCount > 0 && editData.totalAmount
    ? Math.ceil(parseFloat(editData.totalAmount) / includedCount)
    : 0;

  const catInfo = CATEGORY_MAP[expense.category];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? '지출 수정' : '지출 상세'}>
      <div className="space-y-4">
        {/* 금액 */}
        {isEditing ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">금액</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={formattedEditAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0"
                className="w-full pl-4 pr-12 py-3 text-xl font-bold text-right border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-medium text-gray-400 pointer-events-none">
                원
              </span>
            </div>
            {editData.totalAmount && includedCount > 0 && (
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1 text-right">
                1인당 {perPersonAmount.toLocaleString()}원
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {expense.totalAmount?.toLocaleString()}원
            </div>
            <span className="inline-block mt-2 text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
              {catInfo ? `${catInfo.icon} ${catInfo.label}` : (categoryLabels[expense.category] || expense.category)}
            </span>
          </div>
        )}

        {/* 카테고리 (편집 모드) */}
        {isEditing && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">카테고리</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setEditData(prev => ({ ...prev, category: cat.value }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    editData.category === cat.value
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 상세 정보 */}
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                메모 <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <input
                type="text"
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="예: 점심 식사, 택시비"
                maxLength={200}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                장소 <span className="text-gray-400 font-normal">(선택)</span>
              </label>
              <input
                type="text"
                value={editData.location}
                onChange={(e) => setEditData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="예: 강남역, 홍대"
                maxLength={100}
                className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
        ) : (
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
        )}

        {/* 참여자 */}
        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              참여자 {isEditing && `(${includedCount}명 선택)`}
            </div>
            {isEditing && (
              <button
                type="button"
                onClick={handleToggleAll}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {participantShares.every(p => p.included) ? '전체 해제' : '전체 선택'}
              </button>
            )}
          </div>
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              {participantShares.map(p => (
                <button
                  key={p.userId}
                  type="button"
                  onClick={() => handleToggleParticipant(p.userId)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    p.included
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    p.included
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400'
                  }`}>
                    {p.userName.charAt(0)}
                  </span>
                  <span className={p.included ? '' : 'line-through'}>
                    {p.userName}
                  </span>
                  {p.isOwner && (
                    <span className="text-xs bg-gray-900 dark:bg-gray-600 text-white px-1 py-0.5 rounded">방장</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {participantShares.filter(p => p.included).map((p) => (
                <div key={p.userId} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <span className="text-sm text-gray-900 dark:text-white">
                    {p.userName}
                    {p.isOwner && <span className="ml-1 text-xs bg-black text-white px-1.5 py-0.5 rounded">방장</span>}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {p.shareAmount?.toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 pt-2">
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={handleCancelEdit}
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
          ) : settlementLocked ? (
            <>
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2 flex-1">
                정산 진행 중에는 수정/삭제할 수 없습니다
              </p>
              <Button type="button" fullWidth onClick={onClose}>
                닫기
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
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={handleStartEdit}
              >
                수정
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
