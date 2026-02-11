import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Users, QrCode, CreditCard, Receipt, Clock, Pencil, FlaskConical, Calculator, Send, Check, ArrowRight, Settings, Plus, PartyPopper, ChevronLeft, ChevronRight, ChevronDown, X, Mic, LogOut, DoorOpen } from 'lucide-react';
import toast from '../../utils/toast';
import logger from '../../utils/logger';
import DOMPurify from 'dompurify';
import { useGathering } from '../../hooks/useGathering';
import { useAuth } from '../../hooks/useAuth';
import { useNavigationStore } from '../../store/navigationStore';
import { formatCurrency, getStatusColor } from '../../utils/helpers';
import { GATHERING_STATUS } from '../../utils/constants';
import { expenseAPI, settlementAPI } from '../../api';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import SequentialTransfer from '../payment/SequentialTransfer';
import SequentialConfirm from '../payment/SequentialConfirm';
import VoiceRecordingOverlay from '../voice/VoiceRecordingOverlay';
import ExpenseDetailModal from './ExpenseDetailModal';
import SettlementItem from './SettlementItem';
import { useVoiceRecording } from '../../hooks/useVoiceRecording';

// XSS 방어를 위한 텍스트 새니타이저
const sanitizeText = (text) => {
  if (!text) return '';
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] });
};

// 축하 애니메이션 컴포넌트
const CelebrationOverlay = ({ show, type = 'send', onComplete }) => {
  useEffect(() => {
    if (show) {
      document.body.classList.add('modal-open');
      const timer = setTimeout(onComplete, 3000);
      return () => {
        clearTimeout(timer);
        document.body.classList.remove('modal-open');
      };
    }
  }, [show, onComplete]);

  if (!show) return null;

  const isReceive = type === 'receive';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center celebration-overlay">
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
              animationDelay: `${Math.random() * 0.1}s`,
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
          10% { opacity: 1; transform: scale(1.2) translateY(0); }
          30% { opacity: 1; transform: scale(1) translateY(-20px); }
          100% { opacity: 0; transform: scale(0.5) translateY(-100px); }
        }
      `}</style>
    </div>
  );
};

const GatheringDetail = ({ gathering, onUpdate }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { setUp } = useNavigationStore();
  const { createPaymentRequest, updateGathering, leaveGathering, closeGathering, loading } = useGathering();
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [totalAmount, setTotalAmount] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [settlements, setSettlements] = useState([]);
  const [settlementsLoading, setSettlementsLoading] = useState(false);
  const [calculatingSettlement, setCalculatingSettlement] = useState(false);
  const [activeTab, setActiveTab] = useState('expense'); // 'expense' | 'members' | 'settlement' | 'settings'
  const [celebrationType, setCelebrationType] = useState(null); // null | 'send' | 'receive'
  const [showSequentialTransfer, setShowSequentialTransfer] = useState(false);
  const [myPendingSettlements, setMyPendingSettlements] = useState([]);
  const [showSequentialConfirm, setShowSequentialConfirm] = useState(false);
  const [myReceiveSettlements, setMyReceiveSettlements] = useState([]);
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const voice = useVoiceRecording();

  // 지출 목록 조회
  const fetchExpenses = async () => {
    if (!gathering?.id) return;
    setExpensesLoading(true);
    try {
      const response = await expenseAPI.getExpensesByGathering(gathering.id);
      const data = response?.data?.data || response?.data || [];
      setExpenses(Array.isArray(data) ? data : []);
    } catch (error) {
      logger.error('Failed to fetch expenses:', error);
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
      logger.error('Failed to fetch settlements:', error);
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
      logger.error('Failed to calculate settlement:', error);
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
      logger.error('Failed to complete settlement:', error);
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
      logger.error('Failed to confirm settlement:', error);
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

      {/* 상단 헤더 - 간소화 */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{gathering.title}</h1>
        {isOwner && (
          <button
            onClick={() => {
              setUp();
              navigate(`/gathering/${gathering.id}/qr`);
            }}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <QrCode size={20} />
          </button>
        )}
      </div>


      {/* 정산 카드 */}
      <SettlementCard
        settlements={settlements}
        user={user}
        onTransfer={(pendingList) => {
          setMyPendingSettlements(pendingList);
          setShowSequentialTransfer(true);
        }}
        onConfirm={(receiveList) => {
          setMyReceiveSettlements(receiveList);
          setShowSequentialConfirm(true);
        }}
      />

      {/* 탭 네비게이션 */}
      <div className="flex bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-1.5 shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.2)]">
        <button
          onClick={() => setActiveTab('expense')}
          className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'expense'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Receipt size={14} />
          지출
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'members'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Users size={14} />
          멤버
        </button>
        <button
          onClick={() => setActiveTab('settlement')}
          className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'settlement'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Calculator size={14} />
          정산
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex items-center justify-center gap-1 py-2.5 text-sm font-medium rounded-xl transition-all ${
            activeTab === 'settings'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-[0_2px_8px_0_rgba(0,0,0,0.08)]'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Settings size={14} />
          설정
        </button>
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === 'expense' && (
        <div className="space-y-4">
          {/* 음성 등록 버튼 */}
          <button
            onClick={() => {
              setShowVoiceOverlay(true);
              voice.startRecording(gathering.id);
            }}
            className="w-full px-5 py-4 bg-blue-500 hover:bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-between transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Mic size={20} className="text-white" />
              </div>
              <div className="text-left">
                <span className="text-white font-medium">음성으로 등록</span>
                <p className="text-white/60 text-xs mt-0.5">말로 간편하게 지출을 기록하세요</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-white/60" />
          </button>

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
              <div className="flex justify-center py-4 text-gray-400 dark:text-gray-500">
                <span className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </div>
            ) : expenses.length > 0 ? (
              <div className="space-y-2">
                {expenses.slice(0, 3).map((expense) => (
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
                {expenses.length > 3 && (
                  <button
                    onClick={() => {
                      setUp();
                      navigate(`/gathering/${gathering.id}/expenses`);
                    }}
                    className="w-full flex justify-center py-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <ChevronDown size={20} />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Receipt size={32} className="mx-auto mb-2 opacity-50" />
                <p>등록된 지출이 없습니다</p>
              </div>
            )}
          </div>

          {/* 직접 입력 버튼 */}
          <button
            onClick={() => {
              setUp();
              navigate(`/gathering/${gathering.id}/expense/new`);
            }}
            className="w-full px-5 py-3 bg-white dark:bg-gray-800/50 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.2)] flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
          >
            <Plus size={16} className="text-gray-400" />
            <span className="text-gray-500 dark:text-gray-400 text-sm">직접 입력</span>
          </button>
        </div>
      )}

      {activeTab === 'members' && (
        <div className="px-5 py-4 bg-white dark:bg-gray-800/50 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.2)]">
          <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">멤버 목록</h3>

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
              <p>아직 멤버가 없습니다</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settlement' && (
        <div className="space-y-4">
          {/* 정산 계산 버튼 (방장 + 지출 존재 시) */}
          {isOwner && expenses.length > 0 && (
            <button
              onClick={handleCalculateSettlement}
              disabled={calculatingSettlement}
              className="w-full px-5 py-4 bg-blue-500 hover:bg-blue-600 disabled:opacity-70 rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-between transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <Calculator size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <span className="text-white font-medium">
                    {settlements.length > 0 ? '다시 계산하기' : '정산하기'}
                  </span>
                  <p className="text-white/60 text-xs mt-0.5">지출 기반으로 정산을 계산합니다</p>
                </div>
              </div>
              {calculatingSettlement ? (
                <span className="loading-dots"><span></span><span></span><span></span></span>
              ) : (
                <ArrowRight size={16} className="text-white/60" />
              )}
            </button>
          )}

          {/* 정산 현황 */}
          <div className="px-5 py-4 bg-white dark:bg-gray-800/50 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.2)]">
            <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">정산 현황</h3>

            {settlementsLoading ? (
              <div className="flex justify-center py-4 text-gray-400 dark:text-gray-500">
                <span className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
              </div>
            ) : settlements.length > 0 ? (
              <div className="space-y-2">
                {settlements.slice(0, 3).map((settlement) => (
                  <SettlementItem
                    key={settlement.id}
                    settlement={settlement}
                    currentUser={user}
                    onComplete={handleCompleteSettlement}
                    onConfirm={handleConfirmSettlement}
                  />
                ))}
                {settlements.length > 3 && (
                  <button
                    onClick={() => {
                      setUp();
                      navigate(`/gathering/${gathering.id}/settlements`);
                    }}
                    className="w-full flex justify-center py-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <ChevronDown size={20} />
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Calculator size={32} className="mx-auto mb-2 opacity-50" />
                <p>정산 내역이 없습니다</p>
                <p className="text-sm mt-1">정산 계산 버튼을 눌러주세요</p>
              </div>
            )}
          </div>
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

          {/* 모임 나가기 / 모임 종료 */}
          {gathering.status !== GATHERING_STATUS.CLOSED && (
            isOwner ? (
              <button
                onClick={() => setShowCloseConfirm(true)}
                className="w-full px-5 py-4 bg-white dark:bg-gray-800/50 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.2)] flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <DoorOpen size={20} className="text-red-500" />
                  <span className="text-red-500">모임 종료</span>
                </div>
                <ArrowRight size={16} className="text-red-300" />
              </button>
            ) : (
              <button
                onClick={() => {
                  if (gathering.status === GATHERING_STATUS.PAYMENT_REQUESTED) {
                    toast.error('정산이 진행 중이라 나갈 수 없습니다.');
                    return;
                  }
                  setShowLeaveConfirm(true);
                }}
                className="w-full px-5 py-4 bg-white dark:bg-gray-800/50 rounded-2xl shadow-[0_2px_8px_0_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_0_rgba(0,0,0,0.2)] flex items-center justify-between hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <LogOut size={20} className="text-red-500" />
                  <span className="text-red-500">모임 나가기</span>
                </div>
                <ArrowRight size={16} className="text-red-300" />
              </button>
            )
          )}
        </div>
      )}

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

      {/* 음성 녹음 오버레이 */}
      <VoiceRecordingOverlay
        isOpen={showVoiceOverlay}
        voiceState={voice.state}
        transcript={voice.transcript}
        partialTranscript={voice.partialTranscript}
        result={voice.result}
        error={voice.error}
        savedExpenseId={voice.savedExpenseId}
        onStop={voice.stopRecording}
        onConfirm={voice.confirm}
        onCancel={() => {
          voice.cancel();
          setShowVoiceOverlay(false);
        }}
        onClose={(count) => {
          setShowVoiceOverlay(false);
          voice.cancel();
          fetchExpenses();
          toast.success(count > 1 ? `${count}건의 지출이 등록되었습니다!` : '지출이 등록되었습니다!');
        }}
      />

      {/* 모임 나가기 확인 모달 */}
      <Modal
        isOpen={showLeaveConfirm}
        onClose={() => setShowLeaveConfirm(false)}
        title="모임 나가기"
      >
        <div className="space-y-6">
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/25">
              <LogOut size={36} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              모임에서 나가시겠습니까?
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              나가면 이 모임의 지출/정산 내역을<br />
              더 이상 볼 수 없습니다.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowLeaveConfirm(false)}
              disabled={loading}
            >
              취소
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={async () => {
                try {
                  await leaveGathering(gathering.id);
                  setShowLeaveConfirm(false);
                  toast.success('모임에서 나갔습니다.');
                  navigate('/main');
                } catch (error) {
                  const errorCode = error?.code || error?.errorCode;
                  if (errorCode === 'G012') {
                    toast.error('정산이 진행 중이라 나갈 수 없습니다.');
                  } else {
                    toast.error(error?.message || '모임 나가기에 실패했습니다.');
                  }
                  setShowLeaveConfirm(false);
                }
              }}
              loading={loading}
            >
              나가기
            </Button>
          </div>
        </div>
      </Modal>

      {/* 모임 종료 확인 모달 (방장 전용) */}
      <Modal
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        title="모임 종료"
      >
        <div className="space-y-6">
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/25">
              <DoorOpen size={36} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              모임을 종료하시겠습니까?
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              종료된 모임은 더 이상<br />
              비용 등록 및 정산이 불가합니다.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowCloseConfirm(false)}
              disabled={loading}
            >
              취소
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={async () => {
                try {
                  await closeGathering(gathering.id);
                  setShowCloseConfirm(false);
                  toast.success('모임이 종료되었습니다.');
                  navigate('/main');
                } catch (error) {
                  toast.error(error?.message || '모임 종료에 실패했습니다.');
                  setShowCloseConfirm(false);
                }
              }}
              loading={loading}
            >
              종료하기
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

// 상단 정산 카드 컴포넌트
const SettlementCard = ({ settlements, user, onTransfer, onConfirm }) => {
  const toSend = settlements.filter(
    (s) => s.fromUser?.id === user?.id || s.fromUser?.email === user?.email
  );
  const toReceive = settlements.filter(
    (s) => s.toUser?.id === user?.id || s.toUser?.email === user?.email
  );

  // 내가 보내야 할 금액 (PENDING 상태만)
  const pendingToSend = toSend.filter(s => s.status === 'PENDING');
  const totalToSend = pendingToSend.reduce((sum, s) => sum + (s.amount || 0), 0);
  const sendCount = pendingToSend.length;

  // 내가 받아야 할 금액 (상대방이 송금 완료한 COMPLETED 상태만)
  const pendingToReceive = toReceive.filter(s => s.status === 'COMPLETED');
  const totalToReceive = pendingToReceive.reduce((sum, s) => sum + (s.amount || 0), 0);
  const receiveCount = pendingToReceive.length;

  // 상태 판단
  const noSettlements = settlements.length === 0;
  const noMySettlements = !noSettlements && toSend.length === 0 && toReceive.length === 0;
  const allCompleted = !noSettlements && !noMySettlements &&
    toSend.every(s => s.status === 'CONFIRMED') &&
    toReceive.every(s => s.status === 'CONFIRMED');

  const handleTransfer = () => {
    if (pendingToSend.length > 0) {
      onTransfer(pendingToSend);
    }
  };

  const handleConfirm = () => {
    if (pendingToReceive.length > 0) {
      onConfirm(pendingToReceive);
    }
  };

  // 1. 송금할 게 있으면 송금 카드 (최우선)
  if (totalToSend > 0) {
    const firstRecipient = pendingToSend[0]?.toUser?.name || '알 수 없음';
    return (
      <button
        onClick={handleTransfer}
        className="w-full px-5 py-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Send className="text-white" size={20} />
            </div>
            <div className="text-left">
              <p className="text-white/80 text-sm">
                {firstRecipient}{sendCount > 1 ? ` 외 ${sendCount - 1}명` : ''}에게
              </p>
              <p className="text-white text-lg font-bold">
                {totalToSend.toLocaleString()}원 보내기
              </p>
            </div>
          </div>
          <ChevronRight className="text-white/60" size={24} />
        </div>
      </button>
    );
  }

  // 2. 받을 게 있으면 수령 확인 카드
  if (totalToReceive > 0) {
    const firstSender = pendingToReceive[0]?.fromUser?.name || '알 수 없음';
    return (
      <button
        onClick={handleConfirm}
        className="w-full px-5 py-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-lg shadow-green-500/20 active:scale-[0.98] transition-transform"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Check className="text-white" size={20} />
            </div>
            <div className="text-left">
              <p className="text-white/80 text-sm">
                {firstSender}{receiveCount > 1 ? ` 외 ${receiveCount - 1}명` : ''}에게서
              </p>
              <p className="text-white text-lg font-bold">
                +{totalToReceive.toLocaleString()}원 확인하기
              </p>
            </div>
          </div>
          <ChevronRight className="text-white/60" size={24} />
        </div>
      </button>
    );
  }

  // 3. 모두 완료
  if (allCompleted) {
    return (
      <div className="w-full px-5 py-4 bg-gray-100 dark:bg-gray-800/50 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Check className="text-gray-400 dark:text-gray-500" size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">정산 완료</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">모든 정산이 완료되었습니다</p>
          </div>
        </div>
      </div>
    );
  }

  // 4. 정산 없거나 내 정산 없음 - 회색 버튼
  return (
    <div className="w-full px-5 py-4 bg-gray-100 dark:bg-gray-800/50 rounded-2xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
          <Clock className="text-gray-400 dark:text-gray-500" size={20} />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {noSettlements ? '정산 대기중' : '정산 내역 없음'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {noSettlements ? '지출 등록 후 정산을 계산해주세요' : '나와 관련된 정산이 없습니다'}
          </p>
        </div>
      </div>
    </div>
  );
};

// 하단 고정 정산 바 컴포넌트 (Portal 사용)
const SettlementBottomBar = ({ settlements, user, onTransfer, onConfirm, transferState, confirmState, isTransferOpen, isConfirmOpen }) => {
  const toSend = settlements.filter(
    (s) => s.fromUser?.id === user?.id || s.fromUser?.email === user?.email
  );
  const toReceive = settlements.filter(
    (s) => s.toUser?.id === user?.id || s.toUser?.email === user?.email
  );

  // 내가 보내야 할 금액 (PENDING 상태만)
  const pendingToSend = toSend.filter(s => s.status === 'PENDING');
  const totalToSend = pendingToSend.reduce((sum, s) => sum + (s.amount || 0), 0);

  // 내가 받아야 할 금액 (상대방이 송금 완료한 COMPLETED 상태만)
  const pendingToReceive = toReceive.filter(s => s.status === 'COMPLETED');
  const totalToReceive = pendingToReceive.reduce((sum, s) => sum + (s.amount || 0), 0);

  // 정산 계산 전
  const noSettlements = settlements.length === 0;
  // 나와 관련된 정산이 없음
  const noMySettlements = !noSettlements && toSend.length === 0 && toReceive.length === 0;
  // 모든 정산 완료
  const allCompleted = !noSettlements && !noMySettlements &&
    toSend.every(s => s.status === 'CONFIRMED') &&
    toReceive.every(s => s.status === 'CONFIRMED');

  const handleTransfer = () => {
    if (pendingToSend.length > 0) {
      onTransfer(pendingToSend);
    }
  };

  const handleConfirm = () => {
    if (pendingToReceive.length > 0) {
      onConfirm(pendingToReceive);
    }
  };

  // 송금 페이지가 열려있을 때 버튼 렌더링
  const renderTransferButtons = () => {
    if (!transferState) return null;
    const { currentSettlement, hasOpenedToss, isProcessing, canSkip, handleTransfer: doTransfer, handleMarkComplete, handleSkip, handleClose } = transferState;

    return (
      <div className="space-y-2">
        {hasOpenedToss ? (
          <button
            onClick={handleMarkComplete}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-green-500/30 transition-colors"
          >
            {isProcessing ? (
              <span className="loading-dots"><span></span><span></span><span></span></span>
            ) : (
              <>
                <Check size={18} />
                <span>송금 완료했어요</span>
              </>
            )}
          </button>
        ) : (
          <button
            onClick={doTransfer}
            disabled={!currentSettlement?.tossDeeplink}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-colors"
          >
            <Send size={18} />
            <span>{currentSettlement?.amount?.toLocaleString()}원 송금</span>
          </button>
        )}
        <button
          onClick={canSkip ? handleSkip : handleClose}
          className="w-full py-2 text-gray-500 dark:text-gray-400 text-sm font-medium flex items-center justify-center gap-1"
        >
          {canSkip ? (
            <>
              다음에 할게요
              <ChevronRight size={14} />
            </>
          ) : (
            '닫기'
          )}
        </button>
      </div>
    );
  };

  // 수령 확인 페이지가 열려있을 때 버튼 렌더링
  const renderConfirmButtons = () => {
    if (!confirmState) return null;
    const { currentSettlement, isCompleted, isProcessing, canSkip, handleConfirm: doConfirm, handleReject, handleSkip, handleClose } = confirmState;

    return (
      <div className="space-y-2">
        {isCompleted ? (
          <>
            <button
              onClick={doConfirm}
              disabled={isProcessing}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-green-500/30 transition-colors"
            >
              {isProcessing ? (
                <span className="loading-dots"><span></span><span></span><span></span></span>
              ) : (
                <>
                  <Check size={18} />
                  <span>+{currentSettlement?.amount?.toLocaleString()}원 확인</span>
                </>
              )}
            </button>
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="w-full py-2 text-red-500 dark:text-red-400 text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-50"
            >
              <X size={14} />
              송금 받지 못했어요
            </button>
          </>
        ) : (
          <>
            <div className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-bold rounded-2xl">
              <Clock size={18} />
              <span>송금 대기 중</span>
            </div>
            <button
              onClick={canSkip ? handleSkip : handleClose}
              className="w-full py-2 text-gray-500 dark:text-gray-400 text-sm font-medium flex items-center justify-center gap-1"
            >
              {canSkip ? (
                <>
                  건너뛰기
                  <ChevronRight size={14} />
                </>
              ) : (
                '닫기'
              )}
            </button>
          </>
        )}
      </div>
    );
  };

  // 기본 버튼 렌더링 - 송금 우선, 없으면 정산 확인, 둘 다 없으면 회색
  const renderDefaultButtons = () => {
    // 송금할 게 있으면 송금 버튼
    if (totalToSend > 0) {
      return (
        <button
          onClick={handleTransfer}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/30 transition-colors"
        >
          <Send size={18} />
          <span>{totalToSend.toLocaleString()}원 송금</span>
        </button>
      );
    }
    // 정산 확인할 게 있으면 정산 버튼
    if (totalToReceive > 0) {
      return (
        <button
          onClick={handleConfirm}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl shadow-lg shadow-green-500/30 transition-colors"
        >
          <Check size={18} />
          <span>+{totalToReceive.toLocaleString()}원 확인</span>
        </button>
      );
    }
    // 모든 정산 완료 - 회색
    if (allCompleted) {
      return (
        <div className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-medium rounded-2xl shadow-lg">
          <Check size={18} />
          <span>모든 정산 완료</span>
        </div>
      );
    }
    // 정산 없음 또는 내 정산 없음 - 회색 버튼
    return (
      <div className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 font-medium rounded-2xl shadow-lg">
        <Clock size={18} />
        <span>{noSettlements ? '정산 대기중' : '정산 내역 없음'}</span>
      </div>
    );
  };

  // 송금/확인 페이지가 열려있을 때만 버튼 표시 (기본 상태는 상단 카드 사용)
  const renderContent = () => {
    if (isTransferOpen) {
      return transferState ? renderTransferButtons() : null;
    }
    if (isConfirmOpen) {
      return confirmState ? renderConfirmButtons() : null;
    }
    // 기본 상태에서는 상단 SettlementCard를 사용하므로 여기서는 null
    return null;
  };

  const content = renderContent();

  // content가 없으면 Portal도 렌더링하지 않음
  if (!content) {
    return null;
  }

  return createPortal(
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] left-0 right-0 px-4 z-[70]">
      <div className="max-w-md mx-auto">
        {content}
      </div>
    </div>,
    document.body
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
            <ChevronLeft size={20} className="text-gray-600 dark:text-gray-300" />
          </button>
          <span className="font-semibold text-gray-900 dark:text-white">
            {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-gray-600 dark:text-gray-300" />
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