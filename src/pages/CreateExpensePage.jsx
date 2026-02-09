import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGathering } from '../hooks/useGathering';
import { useNavigationStore } from '../store/navigationStore';
import { expenseAPI } from '../api';
import Button from '../components/common/Button';

const CATEGORIES = [
  { value: 'FOOD', label: '식사', icon: '🍽️' },
  { value: 'TRANSPORT', label: '교통', icon: '🚗' },
  { value: 'ACCOMMODATION', label: '숙박', icon: '🏨' },
  { value: 'ENTERTAINMENT', label: '오락', icon: '🎮' },
  { value: 'SHOPPING', label: '쇼핑', icon: '🛍️' },
  { value: 'OTHER', label: '기타', icon: '📦' },
];

const MAX_AMOUNT = 99999999;

const CreateExpensePage = () => {
  const { id: gatheringId } = useParams();
  const navigate = useNavigate();
  const { setDown } = useNavigationStore();
  const { currentGathering, getGathering } = useGathering();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    totalAmount: '',
    description: '',
    category: 'FOOD',
    paidAt: Date.now(),
  });
  const [participantShares, setParticipantShares] = useState([]);

  // 모임 정보 로드
  useEffect(() => {
    if (gatheringId && (!currentGathering || String(currentGathering.id) !== String(gatheringId))) {
      getGathering(gatheringId);
    }
  }, [gatheringId, currentGathering?.id]);

  // 참여자 목록 초기화
  useEffect(() => {
    if (currentGathering) {
      const allParticipants = [];

      // 방장 추가
      if (currentGathering.owner) {
        allParticipants.push({
          userId: currentGathering.owner.id,
          userName: currentGathering.owner.name || '방장',
          isOwner: true,
          included: true,
        });
      }

      // 나머지 참여자 추가 (방장 제외)
      if (currentGathering.participants) {
        currentGathering.participants.forEach(p => {
          const participantId = p.user?.id || p.id;
          if (participantId !== currentGathering.owner?.id) {
            allParticipants.push({
              userId: participantId,
              userName: p.user?.name || p.name || '알 수 없음',
              isOwner: false,
              included: true,
            });
          }
        });
      }

      setParticipantShares(allParticipants);
    }
  }, [currentGathering]);

  const handleBack = () => {
    setDown();
    navigate(`/gathering/${gatheringId}`);
  };

  const handleInputChange = (field, value) => {
    if (field === 'totalAmount') {
      const raw = value.replace(/,/g, '').replace(/[^0-9]/g, '');
      setFormData(prev => ({ ...prev, [field]: raw }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const formattedAmount = formData.totalAmount
    ? Number(formData.totalAmount).toLocaleString()
    : '';

  const handleToggleParticipant = (userId) => {
    setParticipantShares(prev => prev.map(p =>
      p.userId === userId ? { ...p, included: !p.included } : p
    ));
  };

  const handleToggleAll = () => {
    const allIncluded = participantShares.every(p => p.included);
    setParticipantShares(prev => prev.map(p => ({ ...p, included: !allIncluded })));
  };

  const handleSubmit = async () => {
    const amount = parseFloat(formData.totalAmount);
    if (!formData.totalAmount || isNaN(amount) || amount <= 0) {
      toast.error('금액을 입력해주세요');
      return;
    }
    if (amount > MAX_AMOUNT) {
      toast.error(`최대 금액은 ${MAX_AMOUNT.toLocaleString()}원입니다`);
      return;
    }

    const includedParticipants = participantShares.filter(p => p.included);
    if (includedParticipants.length === 0) {
      toast.error('최소 1명의 참여자를 선택해주세요');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        gatheringId: gatheringId,
        totalAmount: amount,
        description: formData.description || undefined,
        category: formData.category,
        paidAt: formData.paidAt,
        shareType: 'EQUAL',
        participants: includedParticipants.map(p => ({
          userId: p.userId,
          shareValue: 0,
        })),
      };

      await expenseAPI.create(requestData);
      toast.success('지출이 등록되었습니다');
      setDown();
      navigate(`/gathering/${gatheringId}`);
    } catch (error) {
      console.error('Expense Error:', error);
      toast.error(error.response?.data?.message || '지출 등록에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const includedCount = participantShares.filter(p => p.included).length;
  const perPersonAmount = includedCount > 0 && formData.totalAmount
    ? Math.ceil(parseFloat(formData.totalAmount) / includedCount)
    : 0;

  // 모임 정보가 아직 없으면 로딩 표시
  if (!currentGathering || String(currentGathering.id) !== String(gatheringId)) {
    return (
      <div className="page">
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              지출 등록
            </h1>
            <div className="w-10" />
          </div>
        </div>
        <div className="flex justify-center py-12 text-gray-400 dark:text-gray-500">
          <span className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            지출 등록
          </h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="page-content">
        <div className="space-y-6 pb-24">
          {/* 금액 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              금액
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={formattedAmount}
                onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                placeholder="0"
                className="w-full pl-4 pr-12 py-4 text-2xl font-bold text-right border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-medium text-gray-400 pointer-events-none">
                원
              </span>
            </div>
            {formData.totalAmount && includedCount > 0 && (
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-2 text-right">
                1인당 {perPersonAmount.toLocaleString()}원
              </p>
            )}
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              메모 <span className="text-gray-400 font-normal">(선택)</span>
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="예: 점심 식사, 택시비"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              카테고리
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleInputChange('category', cat.value)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    formData.category === cat.value
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {cat.icon} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 참여자 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                함께한 사람 <span className="text-blue-500">{includedCount}명</span>
              </label>
              <button
                type="button"
                onClick={handleToggleAll}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {participantShares.every(p => p.included) ? '전체 해제' : '전체 선택'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {participantShares.map(p => (
                <button
                  key={p.userId}
                  type="button"
                  onClick={() => handleToggleParticipant(p.userId)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    p.included
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
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
                    <span className="text-xs bg-gray-900 dark:bg-gray-600 text-white px-1.5 py-0.5 rounded">
                      방장
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-md mx-auto">
          <Button
            type="button"
            fullWidth
            size="lg"
            loading={loading}
            onClick={handleSubmit}
            disabled={!formData.totalAmount || includedCount === 0}
          >
            등록하기
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreateExpensePage;
