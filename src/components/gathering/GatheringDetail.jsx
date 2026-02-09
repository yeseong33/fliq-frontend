import React, { useState, useEffect, useRef } from 'react';
import { Users, QrCode, CreditCard, Receipt, Clock, Pencil, FlaskConical, Calculator, Send, Check, ArrowRight, Settings, Plus, PartyPopper } from 'lucide-react';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import { useGathering } from '../../hooks/useGathering';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency, getStatusColor } from '../../utils/helpers';
import { GATHERING_STATUS } from '../../utils/constants';
import { expenseAPI, settlementAPI } from '../../api';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import QRCodeDisplay from './QRCodeDisplay';
import SequentialTransfer from '../payment/SequentialTransfer';
import SequentialConfirm from '../payment/SequentialConfirm';

// XSS 방어를 위한 텍스트 새니타이저
const sanitizeText = (text) => {
  if (!text) return '';
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
};

// 축하 애니메이션 컴포넌트
const CelebrationOverlay = ({ show, type = 'send', onComplete }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  const isReceive = type === 'receive';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center celebration-overlay">
      {/* 배경 블러 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm celebration-fade-in" />

      {/* 메인 카드 */}
      <div className="relative celebration-scale-in">
        {/* 글로우 효과 */}
        <div className={`absolute -inset-4 rounded-3xl blur-xl opacity-30 celebration-glow ${
          isReceive
            ? 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500'
            : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500'
        }`} />

        {/* 카드 */}
        <div className="relative bg-white dark:bg-gray-800 rounded-3xl px-12 py-10 shadow-2xl">
          {/* 체크 아이콘 */}
          <div className="flex justify-center mb-6">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center celebration-check ${
              isReceive
                ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                : 'bg-gradient-to-br from-blue-500 to-blue-600'
            }`}>
              <Check size={40} className="text-white" strokeWidth={3} />
            </div>
          </div>

          {/* 텍스트 */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {isReceive ? '수령 완료' : '송금 완료'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              정산이 완료되었습니다
            </p>
          </div>
        </div>
      </div>

      {/* 파티클 효과 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute celebration-particle"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              background: isReceive
                ? ['#10B981', '#34D399', '#6EE7B7', '#059669', '#047857'][i % 5]
                : ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B'][i % 5],
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              animationDelay: `${Math.random() * 0.5}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        .celebration-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .celebration-scale-in {
          animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        .celebration-check {
          animation: checkPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards;
          transform: scale(0);
        }
        .celebration-glow {
          animation: glow 2s ease-in-out infinite;
        }
        .celebration-particle {
          animation: particle 2s ease-out forwards;
          opacity: 0;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes checkPop {
          from { transform: scale(0) rotate(-45deg); }
          to { transform: scale(1) rotate(0deg); }
        }
        @keyframes glow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }
        @keyframes particle {
          0% { opacity: 0; transform: scale(0) translateY(0); }
          20% { opacity: 1; transform: scale(1) translateY(0); }
          100% { opacity: 0; transform: scale(0.5) translateY(-100px); }
        }
      `}</style>
    </div>
  );
};

const GatheringDetail = ({ gathering, onUpdate }) => {
  const { user } = useAuth();
  const { createPaymentRequest, updateGathering, loading } = useGathering();
  const [showQR, setShowQR] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [showExpenseTest, setShowExpenseTest] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [totalAmount, setTotalAmount] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [settlements, setSettlements] = useState([]);
  const [settlementsLoading, setSettlementsLoading] = useState(false);
  const [calculatingSettlement, setCalculatingSettlement] = useState(false);
  const [activeTab, setActiveTab] = useState('expense'); // 'expense' | 'participants' | 'settings'
  const [celebrationType, setCelebrationType] = useState(null); // null | 'send' | 'receive'
  const [showSequentialTransfer, setShowSequentialTransfer] = useState(false);
  const [myPendingSettlements, setMyPendingSettlements] = useState([]);
  const [showSequentialConfirm, setShowSequentialConfirm] = useState(false);
  const [myReceiveSettlements, setMyReceiveSettlements] = useState([]);

  // 지출 목록 조회
  const fetchExpenses = async () => {
    if (!gathering?.id) return;
    setExpensesLoading(true);
    try {
      const response = await expenseAPI.getExpensesByGathering(gathering.id);
      const data = response?.data?.data || response?.data || [];
      setExpenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      setExpenses([]);
    } finally {
      setExpensesLoading(false);
    }
  };

  // 정산 목록 조회 (모임별 + 내 정산 정보 병합)
  const fetchSettlements = async () => {
    if (!gathering?.id) return;
    setSettlementsLoading(true);
    try {
      // 모임별 정산 목록 조회
      const gatheringResponse = await settlementAPI.getByGathering(gathering.id);
      const gatheringSettlements = gatheringResponse?.data?.data || gatheringResponse?.data || [];

      // 내가 보내야 할 정산 목록 조회 (계좌 정보 포함)
      const toSendResponse = await settlementAPI.getMyToSend();
      const toSendSettlements = toSendResponse?.data?.data || toSendResponse?.data || [];

      // 내가 받아야 할 정산 목록 조회 (계좌 정보 포함)
      const toReceiveResponse = await settlementAPI.getMyToReceive();
      const toReceiveSettlements = toReceiveResponse?.data?.data || toReceiveResponse?.data || [];

      // 모임별 정산에 계좌 정보 및 최신 상태 병합
      const mergedSettlements = gatheringSettlements.map(settlement => {
        // /my/to-send에서 같은 정산 찾기
        const toSendMatch = toSendSettlements.find(s => s.id === settlement.id);
        if (toSendMatch) {
          return {
            ...settlement,
            status: toSendMatch.status, // 최신 상태 반영
            toUserPaymentMethod: toSendMatch.toUserPaymentMethod,
            tossDeeplink: toSendMatch.tossDeeplink,
          };
        }
        // /my/to-receive에서 같은 정산 찾기
        const toReceiveMatch = toReceiveSettlements.find(s => s.id === settlement.id);
        if (toReceiveMatch) {
          return {
            ...settlement,
            status: toReceiveMatch.status, // 최신 상태 반영
            toUserPaymentMethod: toReceiveMatch.toUserPaymentMethod,
            tossDeeplink: toReceiveMatch.tossDeeplink,
          };
        }
        return settlement;
      });

      setSettlements(Array.isArray(mergedSettlements) ? mergedSettlements : []);
    } catch (error) {
      console.error('Failed to fetch settlements:', error);
      setSettlements([]);
    } finally {
      setSettlementsLoading(false);
    }
  };

  // 정산 계산 (Expense 기반으로 Settlement 생성)
  const handleCalculateSettlement = async () => {
    if (!gathering?.id) return;
    setCalculatingSettlement(true);
    try {
      await settlementAPI.calculate(gathering.id);
      toast.success('정산이 계산되었습니다!');
      await fetchSettlements();
    } catch (error) {
      console.error('Failed to calculate settlement:', error);
      toast.error(sanitizeText(error.response?.data?.message) || '정산 계산 실패');
    } finally {
      setCalculatingSettlement(false);
    }
  };

  // 정산 완료 (송금자가 호출)
  const handleCompleteSettlement = async (settlementId) => {
    try {
      await settlementAPI.complete(settlementId);
      toast.success('송금 완료 처리되었습니다!');
      await fetchSettlements();
    } catch (error) {
      console.error('Failed to complete settlement:', error);
      toast.error(error.response?.data?.message || '처리 실패');
    }
  };

  // 정산 확인 (수령자가 호출)
  const handleConfirmSettlement = async (settlementId) => {
    try {
      await settlementAPI.confirm(settlementId);
      toast.success('수령 확인되었습니다!');
      await fetchSettlements();
    } catch (error) {
      console.error('Failed to confirm settlement:', error);
      toast.error(error.response?.data?.message || '처리 실패');
    }
  };

  // 모임 변경 시 지출/정산 목록 조회
  useEffect(() => {
    fetchExpenses();
    fetchSettlements();
  }, [gathering?.id]);

  // 페이지 포커스 시 자동 갱신
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && gathering?.id) {
        fetchExpenses();
        fetchSettlements();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [gathering?.id]);

  const CATEGORY_LABELS = {
    FOOD: '음식',
    TRANSPORT: '교통',
    ACCOMMODATION: '숙박',
    ENTERTAINMENT: '오락',
    SHOPPING: '쇼핑',
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

  // 시간 포맷 (심플)
  const formatTimeSimple = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes().toString().padStart(2, '0');
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = dayNames[date.getDay()];
    const ampm = hour < 12 ? '오전' : '오후';
    const hour12 = hour % 12 || 12;
    return { month, day, dayName, time: `${ampm} ${hour12}:${minute}`, date };
  };

  // participantCount가 없으면 participants 배열 길이 사용
  const participantCount = gathering?.participantCount ?? gathering?.participants?.length ?? 0;

  const isOwner = gathering?.owner?.email === user?.email;
  const canRequestPayment = gathering?.status === GATHERING_STATUS.ACTIVE &&
                           participantCount > 0;

  // 금액 검증 상수
  const MAX_AMOUNT = 99999999; // 최대 1억 미만

  const handlePaymentRequest = async (e) => {
    e.preventDefault();

    const amount = parseFloat(totalAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('올바른 금액을 입력해주세요.');
      return;
    }
    if (amount > MAX_AMOUNT) {
      toast.error(`최대 금액은 ${MAX_AMOUNT.toLocaleString()}원입니다.`);
      return;
    }
    // 소수점 2자리 초과 검증
    if (!/^\d+(\.\d{1,2})?$/.test(totalAmount)) {
      toast.error('소수점 2자리까지만 입력 가능합니다.');
      return;
    }

    try {
      const updatedGathering = await createPaymentRequest(gathering.id, amount);
      toast.success('결제 요청이 생성되었습니다.');
      onUpdate(updatedGathering);
      setShowPaymentForm(false);
      setTotalAmount('');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case GATHERING_STATUS.ACTIVE:
        return '👥';
      case GATHERING_STATUS.PAYMENT_REQUESTED:
        return '💰';
      case GATHERING_STATUS.COMPLETED:
        return '✅';
      case GATHERING_STATUS.CLOSED:
        return '🔒';
      default:
        return status;
    }
  };

  if (!gathering) return null;

  // 날짜 포맷
  const formatDateCompact = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return `${month}/${day}(${dayNames[date.getDay()]})`;
  };

  return (
    <div className="space-y-4">
      {/* 축하 애니메이션 */}
      <CelebrationOverlay show={!!celebrationType} type={celebrationType} onComplete={() => setCelebrationType(null)} />

      {/* 순차 송금 모달 */}
      {showSequentialTransfer && (
        <SequentialTransfer
          settlements={myPendingSettlements}
          onClose={() => setShowSequentialTransfer(false)}
          onComplete={() => {
            fetchSettlements();
            setCelebrationType('send');
          }}
        />
      )}

      {/* 순차 수령 확인 모달 */}
      {showSequentialConfirm && (
        <SequentialConfirm
          settlements={myReceiveSettlements}
          onClose={() => setShowSequentialConfirm(false)}
          onComplete={() => {
            fetchSettlements();
            setCelebrationType('receive');
          }}
        />
      )}

      {/* 상단 헤더 */}
      <div className="px-5 py-4 bg-white dark:bg-gray-800/50 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.2)]">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{gathering.title}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
              {formatDateCompact(gathering.startAt) && (
                <span>
                  {formatDateCompact(gathering.startAt)}
                  {gathering.endAt && ` - ${formatDateCompact(gathering.endAt)}`}
                </span>
              )}
              <span>·</span>
              <span className="flex items-center gap-1">
                <Users size={14} />
                {participantCount}명
              </span>
            </div>
          </div>
          {isOwner && (
            <button
              onClick={() => setShowQR(true)}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <QrCode size={20} />
            </button>
          )}
        </div>
      </div>

      {/* 정산 현황 (간소화) */}
      {(() => {
        const toSend = settlements.filter(
          (s) => s.fromUser?.id === user?.id || s.fromUser?.email === user?.email
        );
        const toReceive = settlements.filter(
          (s) => s.toUser?.id === user?.id || s.toUser?.email === user?.email
        );

        // 내가 보내야 할 금액 (PENDING 상태만)
        const pendingToSend = toSend.filter(s => s.status === 'PENDING');
        const totalToSend = pendingToSend.reduce((sum, s) => sum + (s.amount || 0), 0);

        // 내가 받아야 할 금액 (PENDING + COMPLETED 상태)
        const pendingToReceive = toReceive.filter(s => s.status === 'PENDING' || s.status === 'COMPLETED');
        const totalToReceive = pendingToReceive.reduce((sum, s) => sum + (s.amount || 0), 0);

        // 송금 완료된 금액 (내가 보낸 것)
        const completedToSend = toSend.filter(s => s.status === 'COMPLETED' || s.status === 'CONFIRMED');
        const totalCompleted = completedToSend.reduce((sum, s) => sum + (s.amount || 0), 0);

        // 수령 완료된 금액 (내가 받은 것)
        const confirmedToReceive = toReceive.filter(s => s.status === 'CONFIRMED');
        const totalReceived = confirmedToReceive.reduce((sum, s) => sum + (s.amount || 0), 0);

        // 순차 송금 화면 열기
        const handleOpenTransfer = () => {
          if (pendingToSend.length === 0) return;
          setMyPendingSettlements(pendingToSend);
          setShowSequentialTransfer(true);
        };

        // 순차 수령 확인 화면 열기
        const handleOpenConfirm = () => {
          if (pendingToReceive.length === 0) return;
          setMyReceiveSettlements(pendingToReceive);
          setShowSequentialConfirm(true);
        };

        // 정산이 없거나 나와 관련 없으면 표시 안함
        if (settlements.length === 0 || (toSend.length === 0 && toReceive.length === 0)) {
          return null;
        }

        // 내 실제 지출 (모든 지출에서 내 분담금 합계)
        const myTotalExpense = expenses.reduce((sum, expense) => {
          const myShare = expense.participants?.find(
            p => p.user?.id === user?.id || p.user?.email === user?.email
          );
          return sum + (myShare?.shareAmount || 0);
        }, 0);

        return (
          <div className="space-y-4">
            {/* 송금 버튼 or 완료 표시 */}
            {toSend.length > 0 && (
              totalToSend > 0 ? (
                <button
                  onClick={handleOpenTransfer}
                  className="btn-action btn-action-primary w-full flex items-center justify-center gap-3 py-5 text-white font-bold text-xl rounded-2xl shadow-[0_4px_14px_0_rgba(59,130,246,0.4)]"
                >
                  <span className="relative z-10 flex items-center gap-3">
                    <Send size={22} />
                    {totalToSend.toLocaleString()}원 송금하기
                  </span>
                </button>
              ) : (
                <div className="w-full flex items-center justify-center gap-3 py-5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold text-xl rounded-2xl shadow-[0_4px_14px_0_rgba(59,130,246,0.15)]">
                  <Check size={22} />
                  송금 완료
                </div>
              )
            )}

            {/* 받을 금액 (있을 때만) */}
            {toReceive.length > 0 && totalToReceive > 0 && (
              <button
                onClick={handleOpenConfirm}
                className="btn-action btn-action-success w-full flex items-center justify-center gap-3 py-5 text-white font-bold text-xl rounded-2xl shadow-[0_4px_14px_0_rgba(34,197,94,0.4)]"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <Check size={22} />
                  +{totalToReceive.toLocaleString()}원 수령 확인
                </span>
              </button>
            )}

            {/* 내 지출 (실제 분담금 합계) */}
            {myTotalExpense > 0 && (
              <div className="flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.2)]">
                <span className="text-gray-500 dark:text-gray-400">내 지출</span>
                <span className="font-bold text-lg text-gray-900 dark:text-white">
                  {myTotalExpense.toLocaleString()}원
                </span>
              </div>
            )}
          </div>
        );
      })()}

      {/* 탭 네비게이션 */}
      {/* 탭 네비게이션 */}
      <div className="flex bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-1.5 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.2)]">
        <button
          onClick={() => setActiveTab('expense')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'expense'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Receipt size={16} />
          지출
        </button>
        <button
          onClick={() => setActiveTab('participants')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'participants'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Users size={16} />
          참여자
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'settings'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Settings size={16} />
          설정
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'expense' && (
        <div className="space-y-4">
          {/* 지출 내역 */}
          <div className="px-5 py-4 bg-white dark:bg-gray-800/50 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">지출 내역</h3>
              {expenses.length > 0 && (
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  총 {expenses.reduce((sum, e) => sum + (e.totalAmount || 0), 0).toLocaleString()}원
                </span>
              )}
            </div>
            {expensesLoading ? (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                로딩 중...
              </div>
            ) : expenses.length > 0 ? (
              <div className="space-y-2">
                {expenses.map((expense) => (
                  <div
                    key={expense.id}
                    onClick={() => setSelectedExpense(expense)}
                    className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {expense.totalAmount?.toLocaleString()}원
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg">
                        {CATEGORY_LABELS[expense.category] || expense.category}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDateTime(expense.paidAt || expense.createdAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Receipt size={32} className="mx-auto mb-2 opacity-50" />
                <p>등록된 지출이 없습니다</p>
              </div>
            )}
          </div>

          {/* 정산 계산 버튼 (방장 + 지출 존재 시) */}
          {isOwner && expenses.length > 0 && (
            <Button
              fullWidth
              variant="secondary"
              onClick={handleCalculateSettlement}
              loading={calculatingSettlement}
              className="flex items-center justify-center gap-2"
            >
              <Calculator size={18} />
              정산 계산
            </Button>
          )}
        </div>
      )}

      {activeTab === 'participants' && (
        <div className="px-5 py-4 bg-white dark:bg-gray-800/50 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.2)]">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">참여자 목록</h3>

          {gathering.participants && gathering.participants.length > 0 ? (
            <div className="space-y-2">
              {gathering.participants.map((participant, index) => (
                <div key={participant.id} className="flex items-center justify-between p-3.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-200">
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {sanitizeText(participant.user?.name || participant.name) || '알 수 없음'}
                    </span>
                    {(participant.user?.email || participant.email) === gathering.owner?.email && (
                      <span className="text-xs bg-gray-900 dark:bg-gray-600 text-white px-2 py-1 rounded-lg">방장</span>
                    )}
                  </div>

                  {gathering.status === GATHERING_STATUS.PAYMENT_REQUESTED && (
                    <span className={`text-xs px-2 py-1 rounded-lg ${getStatusColor(participant.paymentStatus)}`}>
                      {participant.paymentStatus === 'COMPLETED' ? '결제완료' : '결제대기'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Users size={32} className="mx-auto mb-2 opacity-50" />
              <p>아직 참여자가 없습니다</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-4">
          {/* 모임 정보 */}
          <div className="px-5 py-4 bg-white dark:bg-gray-800/50 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.2)]">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">모임 정보</h3>
            <div className="space-y-3 text-sm">
              {gathering.description && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">설명</span>
                  <p className="text-gray-900 dark:text-white mt-1">{sanitizeText(gathering.description)}</p>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">방장</span>
                <span className="text-gray-900 dark:text-white">{sanitizeText(gathering.owner?.name) || '알 수 없음'}</span>
              </div>
              {gathering.totalAmount && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">총 금액</span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(gathering.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">1인당</span>
                    <span className="text-gray-900 dark:text-white">{formatCurrency(gathering.amountPerPerson)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 일정 수정 */}
          {isOwner && (
            <button
              onClick={() => setShowTimeEdit(true)}
              className="w-full px-5 py-4 bg-white dark:bg-gray-800/50 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.2)] flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
            >
              <div className="flex items-center gap-3">
                <Clock size={20} className="text-gray-400" />
                <span className="text-gray-900 dark:text-white">일정 수정</span>
              </div>
              <ArrowRight size={16} className="text-gray-400" />
            </button>
          )}

          {/* 지출 등록 */}
          <button
            onClick={() => setShowExpenseTest(true)}
            className="w-full px-5 py-4 bg-white dark:bg-gray-800/50 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.2)] flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
          >
            <div className="flex items-center gap-3">
              <Plus size={20} className="text-gray-400" />
              <span className="text-gray-900 dark:text-white">지출 등록</span>
            </div>
            <ArrowRight size={16} className="text-gray-400" />
          </button>
        </div>
      )}

      {/* 플로팅 버튼 - 지출 추가 */}
      <button
        onClick={() => setShowExpenseTest(true)}
        className="btn-fab fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-2xl flex items-center justify-center z-40 shadow-[0_4px_14px_0_rgba(59,130,246,0.4)]"
      >
        <Plus size={28} />
      </button>

      {/* QR 코드 모달 */}
      <QRCodeDisplay
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        gathering={gathering}
        onRefresh={onUpdate}
      />

      {/* 결제 요청 모달 */}
      <Modal 
        isOpen={showPaymentForm}
        onClose={() => setShowPaymentForm(false)}
        title="결제 요청하기"
      >
        <form onSubmit={handlePaymentRequest}>
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              총 결제 금액을 입력하면 참여자 수에 따라 자동으로 분할됩니다.
            </p>
            
            <Input
              label="총 결제 금액"
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              placeholder="50000"
              min="1"
              required
            />
            
            {totalAmount && participantCount > 0 && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-sm">
                  <p className="text-gray-600 dark:text-gray-300">참여자: {participantCount}명</p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    개인 분담금: {formatCurrency(parseFloat(totalAmount) / participantCount)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              onClick={() => setShowPaymentForm(false)}
            >
              취소
            </Button>
            <Button
              type="submit"
              fullWidth
              loading={loading}
            >
              요청하기
            </Button>
          </div>
        </form>
      </Modal>

      {/* 시간 수정 모달 */}
      <TimeEditModal
        isOpen={showTimeEdit}
        onClose={() => setShowTimeEdit(false)}
        startAt={gathering.startAt}
        endAt={gathering.endAt}
        onSave={async (startAt, endAt) => {
          const updatedGathering = await updateGathering(gathering.id, { startAt, endAt });
          onUpdate(updatedGathering);
          setShowTimeEdit(false);
        }}
        loading={loading}
      />

      {/* 지출 테스트 모달 */}
      <ExpenseTestModal
        isOpen={showExpenseTest}
        onClose={() => setShowExpenseTest(false)}
        gathering={gathering}
        onSuccess={fetchExpenses}
      />

      {/* 지출 상세 모달 */}
      <ExpenseDetailModal
        isOpen={!!selectedExpense}
        onClose={() => setSelectedExpense(null)}
        expense={selectedExpense}
        onDelete={fetchExpenses}
        onUpdate={fetchExpenses}
        categoryLabels={CATEGORY_LABELS}
        gathering={gathering}
      />
    </div>
  );
};

// 지출 상세 모달 컴포넌트
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
      console.error('Delete error:', error);
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
      console.error('Update error:', error);
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

// 시간 수정 모달 컴포넌트 (달력 범위 선택)
const TimeEditModal = ({ isOpen, onClose, startAt, endAt, onSave, loading }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [startHour, setStartHour] = useState(12);
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(18);
  const [endMinute, setEndMinute] = useState(0);
  const [selecting, setSelecting] = useState('start'); // 'start' | 'end'

  const days = ['일', '월', '화', '수', '목', '금', '토'];

  // 모달 열릴 때 초기값 설정
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      if (startAt) {
        const s = new Date(startAt);
        setStartDate(new Date(s.getFullYear(), s.getMonth(), s.getDate()));
        setStartHour(s.getHours());
        setStartMinute(s.getMinutes());
        setViewDate(new Date(s.getFullYear(), s.getMonth(), 1));
      } else {
        setStartDate(null);
        setStartHour(12);
        setStartMinute(0);
        setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
      }
      if (endAt) {
        const e = new Date(endAt);
        setEndDate(new Date(e.getFullYear(), e.getMonth(), e.getDate()));
        setEndHour(e.getHours());
        setEndMinute(e.getMinutes());
      } else {
        setEndDate(null);
        setEndHour(18);
        setEndMinute(0);
      }
      setSelecting('start');
    }
  }, [isOpen, startAt, endAt]);

  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectDay = (day) => {
    const selected = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);

    if (selecting === 'start') {
      setStartDate(selected);
      // 시작일이 종료일보다 후면 종료일 초기화
      if (endDate && selected > endDate) {
        setEndDate(null);
      }
      setSelecting('end');
    } else {
      // 종료일이 시작일보다 전이면 시작일로 설정
      if (startDate && selected < startDate) {
        setStartDate(selected);
        setEndDate(null);
        setSelecting('end');
      } else {
        setEndDate(selected);
        setSelecting('start');
      }
    }
  };

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const isInRange = (day) => {
    if (!startDate || !endDate) return false;
    const current = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    return current > startDate && current < endDate;
  };

  const isStart = (day) => {
    if (!startDate) return false;
    const current = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    return isSameDay(current, startDate);
  };

  const isEnd = (day) => {
    if (!endDate) return false;
    const current = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    return isSameDay(current, endDate);
  };

  const isToday = (day) => {
    const today = new Date();
    return today.getDate() === day &&
           today.getMonth() === viewDate.getMonth() &&
           today.getFullYear() === viewDate.getFullYear();
  };

  const handleSave = () => {
    const start = startDate
      ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), startHour, startMinute).getTime()
      : null;
    const end = endDate
      ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), endHour, endMinute).getTime()
      : null;
    onSave(start, end);
  };

  const formatSelectedDate = (date) => {
    if (!date) return '선택 안됨';
    return `${date.getMonth() + 1}/${date.getDate()} (${days[date.getDay()]})`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="모임 기간 설정">
      <div className="space-y-4">
        {/* 선택된 기간 표시 */}
        <div className="flex items-center justify-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div
            className={`text-center px-3 py-1 rounded cursor-pointer transition-colors ${
              selecting === 'start'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => setSelecting('start')}
          >
            <div className="text-xs opacity-70">시작</div>
            <div className="font-medium">{formatSelectedDate(startDate)}</div>
          </div>
          <span className="text-gray-400">→</span>
          <div
            className={`text-center px-3 py-1 rounded cursor-pointer transition-colors ${
              selecting === 'end'
                ? 'bg-blue-500 text-white'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
            onClick={() => setSelecting('end')}
          >
            <div className="text-xs opacity-70">종료</div>
            <div className="font-medium">{formatSelectedDate(endDate)}</div>
          </div>
        </div>

        {/* 달력 헤더 */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            ‹
          </button>
          <span className="font-semibold text-gray-900 dark:text-white">
            {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            ›
          </button>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-0">
          {days.map((day) => (
            <div key={day} className="h-8 flex items-center justify-center text-xs font-medium text-gray-500 dark:text-gray-400">
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-0">
          {Array.from({ length: firstDayOfMonth }, (_, i) => (
            <div key={`empty-${i}`} className="h-10" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const start = isStart(day);
            const end = isEnd(day);
            const inRange = isInRange(day);
            const today = isToday(day);
            const isSameStartEnd = start && end; // 당일 선택

            return (
              <button
                key={day}
                type="button"
                onClick={() => handleSelectDay(day)}
                className={`
                  h-10 text-sm font-medium transition-all relative
                  hover:bg-gray-100 dark:hover:bg-gray-700
                  ${start || end ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-700 dark:text-gray-300'}
                  ${today && !start && !end ? 'text-blue-500 dark:text-blue-400' : ''}
                `}
              >
                {day}
                {/* 시작/종료 점 */}
                {(start || end) && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
                )}
                {/* 범위 선 (당일 선택이 아닐 때만) */}
                {!isSameStartEnd && (inRange || (start && endDate) || (end && startDate)) && (
                  <span className={`absolute bottom-[5px] h-0.5 bg-blue-400 dark:bg-blue-500 ${
                    start ? 'left-1/2 right-0' : end ? 'left-0 right-1/2' : 'left-0 right-0'
                  }`} />
                )}
              </button>
            );
          })}
        </div>

        {/* 시간 선택 */}
        <div className="flex gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
          <TimePicker
            label="시작"
            hour={startHour}
            minute={startMinute}
            onHourChange={setStartHour}
            onMinuteChange={setStartMinute}
          />
          <TimePicker
            label="종료"
            hour={endHour}
            minute={endMinute}
            onHourChange={setEndHour}
            onMinuteChange={setEndMinute}
          />
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" fullWidth onClick={onClose}>
            취소
          </Button>
          <Button type="button" fullWidth loading={loading} onClick={handleSave}>
            저장
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// 지출 등록 모달 컴포넌트
const ExpenseTestModal = ({ isOpen, onClose, gathering, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    totalAmount: '',
    description: '',
    category: 'FOOD',
    paidAt: Date.now(),
  });
  const [participantShares, setParticipantShares] = useState([]);

  const CATEGORIES = [
    { value: 'FOOD', label: '식사', icon: '🍽️' },
    { value: 'TRANSPORT', label: '교통', icon: '🚗' },
    { value: 'ACCOMMODATION', label: '숙박', icon: '🏨' },
    { value: 'ENTERTAINMENT', label: '오락', icon: '🎮' },
    { value: 'SHOPPING', label: '쇼핑', icon: '🛍️' },
    { value: 'OTHER', label: '기타', icon: '📦' },
  ];

  // 모달 열릴 때 참여자 목록 초기화 (방장 포함)
  useEffect(() => {
    if (isOpen && gathering) {
      const allParticipants = [];

      // 방장 추가
      if (gathering.owner) {
        allParticipants.push({
          userId: gathering.owner.id,
          userName: gathering.owner.name || '방장',
          isOwner: true,
          included: true,
        });
      }

      // 나머지 참여자 추가 (방장 제외)
      if (gathering.participants) {
        gathering.participants.forEach(p => {
          const participantId = p.user?.id || p.id;
          if (participantId !== gathering.owner?.id) {
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
      // 폼 초기화
      setFormData({
        totalAmount: '',
        description: '',
        category: 'FOOD',
        paidAt: Date.now(),
      });
    }
  }, [isOpen, gathering]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const MAX_AMOUNT = 99999999;

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
        gatheringId: gathering.id,
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
      onSuccess?.();
      onClose();
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="지출 등록">
      <div className="space-y-5">
        {/* 금액 입력 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            금액
          </label>
          <div className="relative">
            <input
              type="number"
              inputMode="numeric"
              value={formData.totalAmount}
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

        {/* 버튼 */}
        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
            className="dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            취소
          </Button>
          <Button
            type="button"
            fullWidth
            loading={loading}
            onClick={handleSubmit}
            disabled={!formData.totalAmount || includedCount === 0}
          >
            등록하기
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// 정산 아이템 컴포넌트
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

// 시간 선택 컴포넌트
const TimePicker = ({ label, hour, minute, onHourChange, onMinuteChange }) => {
  const [showPicker, setShowPicker] = useState(false);
  const hourRef = React.useRef(null);
  const minuteRef = React.useRef(null);

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 10, 20, 30, 40, 50];

  // 스크롤 위치 조정
  useEffect(() => {
    if (showPicker) {
      if (hourRef.current) {
        const selectedEl = hourRef.current.querySelector(`[data-value="${hour}"]`);
        if (selectedEl) selectedEl.scrollIntoView({ block: 'center' });
      }
      if (minuteRef.current) {
        const selectedEl = minuteRef.current.querySelector(`[data-value="${minute}"]`);
        if (selectedEl) selectedEl.scrollIntoView({ block: 'center' });
      }
    }
  }, [showPicker, hour, minute]);

  const adjustTime = (delta) => {
    const total = hour * 60 + minute + delta;
    if (total >= 0 && total < 24 * 60) {
      onHourChange(Math.floor(total / 60));
      onMinuteChange(total % 60);
    }
  };

  return (
    <div className="flex-1 text-center relative">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <div className="flex items-center justify-center gap-2 mt-1">
        <button
          type="button"
          onClick={() => adjustTime(-10)}
          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="text-lg font-medium text-gray-900 dark:text-white w-16 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {hour.toString().padStart(2, '0')}:{minute.toString().padStart(2, '0')}
        </button>
        <button
          type="button"
          onClick={() => adjustTime(10)}
          className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          +
        </button>
      </div>

      {/* 스크롤 Picker 모달 */}
      {showPicker && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowPicker(false)} />
          <div className="fixed inset-x-4 bottom-4 z-50 bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 max-w-sm mx-auto">
            <div className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{label} 시간</div>
            <div className="flex justify-center gap-2">
              {/* 시간 */}
              <div
                ref={hourRef}
                className="h-48 w-16 overflow-y-auto"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <style>{`div::-webkit-scrollbar { display: none; }`}</style>
                <div className="py-20">
                  {hours.map((h) => (
                    <button
                      key={h}
                      type="button"
                      data-value={h}
                      onClick={() => onHourChange(h)}
                      className={`w-full py-2 text-lg rounded-lg transition-colors ${
                        hour === h
                          ? 'bg-blue-500 text-white font-bold'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {h.toString().padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
              <span className="self-center text-2xl text-gray-400">:</span>
              {/* 분 */}
              <div
                ref={minuteRef}
                className="h-48 w-16 overflow-y-auto"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                <div className="py-20">
                  {minutes.map((m) => (
                    <button
                      key={m}
                      type="button"
                      data-value={m}
                      onClick={() => onMinuteChange(m)}
                      className={`w-full py-2 text-lg rounded-lg transition-colors ${
                        minute === m
                          ? 'bg-blue-500 text-white font-bold'
                          : 'text-gray-400 dark:text-gray-500'
                      }`}
                    >
                      {m.toString().padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="w-full mt-4 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors"
            >
              확인
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default GatheringDetail;