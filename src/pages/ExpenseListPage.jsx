import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Receipt } from 'lucide-react';
import { useNavigationStore } from '../store/navigationStore';
import { useGathering } from '../hooks/useGathering';
import { expenseAPI } from '../api';
import ExpenseDetailModal from '../components/gathering/ExpenseDetailModal';
import logger from '../utils/logger';

const CATEGORY_LABELS = {
  FOOD: '음식',
  CAFE: '카페',
  DRINK: '술/음료',
  TRANSPORT: '교통',
  TAXI: '택시',
  PARKING: '주차',
  ACCOMMODATION: '숙박',
  ENTERTAINMENT: '오락',
  CULTURE: '문화',
  SPORTS: '운동',
  SHOPPING: '쇼핑',
  GROCERY: '장보기',
  OTHER: '기타',
};

const formatDateTime = (timestamp) => {
  if (!timestamp) return '-';
  const date = new Date(timestamp);
  return date.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const ExpenseListPage = () => {
  const { id: gatheringId } = useParams();
  const navigate = useNavigate();
  const { setDown } = useNavigationStore();
  const { currentGathering, getGathering } = useGathering();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedExpense, setSelectedExpense] = useState(null);

  // 모임 정보 로드
  useEffect(() => {
    if (gatheringId && (!currentGathering || String(currentGathering.id) !== String(gatheringId))) {
      getGathering(gatheringId);
    }
  }, [gatheringId, currentGathering?.id]);

  const fetchExpenses = async () => {
    try {
      const response = await expenseAPI.getExpensesByGathering(gatheringId);
      const data = response?.data?.data || response?.data || [];
      setExpenses(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error('Failed to fetch expenses:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gatheringId) {
      fetchExpenses();
    }
  }, [gatheringId]);

  const handleBack = () => {
    setDown();
    navigate(-1);
  };

  const totalAmount = expenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0);

  return (
    <div className="page">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleBack}
            aria-label="뒤로 가기"
            className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            지출 내역
          </h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="flex justify-center py-12 text-gray-400 dark:text-gray-500" role="status" aria-label="지출 내역 로딩 중">
            <span className="loading-dots" aria-hidden="true">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </div>
        ) : expenses.length > 0 ? (
          <div className="space-y-4 pb-8">
            {/* 총액 */}
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                총 {expenses.length}건
              </span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {totalAmount.toLocaleString()}원
              </span>
            </div>

            {/* 지출 목록 */}
            <div className="px-4 space-y-3">
              {expenses.map((expense) => (
                <div
                  key={expense.id}
                  onClick={() => setSelectedExpense(expense)}
                  className="p-4 bg-white dark:bg-gray-800/50 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.2)] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all active:scale-[0.99]"
                >
                  {/* 상단: 금액 + 카테고리 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {expense.totalAmount?.toLocaleString()}원
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg">
                      {CATEGORY_LABELS[expense.category] || expense.category}
                    </span>
                  </div>

                  {/* 설명 */}
                  {expense.description && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{expense.description}</p>
                  )}

                  {/* 상세 정보 */}
                  <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex justify-between">
                      <span>결제자</span>
                      <span className="text-gray-700 dark:text-gray-300">{expense.payer?.name || '알 수 없음'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>결제 시간</span>
                      <span className="text-gray-700 dark:text-gray-300">{formatDateTime(expense.paidAt || expense.createdAt)}</span>
                    </div>
                    {expense.participants && expense.participants.length > 0 && (
                      <div className="flex justify-between">
                        <span>참여자</span>
                        <span className="text-gray-700 dark:text-gray-300">
                          {expense.participants.map(p => p.user?.name || '알 수 없음').join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <Receipt size={32} className="mx-auto mb-2 opacity-50" />
            <p>등록된 지출이 없습니다</p>
          </div>
        )}
      </div>

      {/* 지출 상세 모달 */}
      <ExpenseDetailModal
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
        onDelete={fetchExpenses}
        onUpdate={fetchExpenses}
        categoryLabels={CATEGORY_LABELS}
        gathering={currentGathering}
        settlementLocked={currentGathering?.status === 'PAYMENT_REQUESTED'}
      />
    </div>
  );
};

export default ExpenseListPage;
