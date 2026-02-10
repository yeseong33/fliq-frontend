import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Check, X, Loader, MessageCircle, Receipt } from 'lucide-react';
import { VOICE_STATE } from '../../store/voiceStore';

const CATEGORY_LABELS = {
  FOOD: '음식',
  TRANSPORT: '교통',
  ACCOMMODATION: '숙박',
  ENTERTAINMENT: '오락',
  SHOPPING: '쇼핑',
  OTHER: '기타',
};

const VALID_CATEGORIES = new Set(Object.keys(CATEGORY_LABELS));
const VALID_SHARE_TYPES = new Set(['EQUAL', 'CUSTOM', 'PERCENTAGE']);
const MAX_AMOUNT = 100_000_000;
const MAX_DESCRIPTION_LENGTH = 200;
const MAX_LOCATION_LENGTH = 100;

const VoiceRecordingOverlay = ({ isOpen, voiceState, transcript, result, error, savedExpenseId, onStop, onConfirm, onCancel, onClose }) => {
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  // 녹음 타이머
  useEffect(() => {
    if (voiceState === VOICE_STATE.LISTENING) {
      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [voiceState]);

  // CONFIRMED 시 자동 닫기
  useEffect(() => {
    if (voiceState === VOICE_STATE.CONFIRMED && savedExpenseId) {
      const count = Array.isArray(savedExpenseId) ? savedExpenseId.length : 1;
      const timer = setTimeout(() => onClose(count), 2500);
      return () => clearTimeout(timer);
    }
  }, [voiceState, savedExpenseId, onClose]);

  // 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // parsed는 이제 배열 (복수 지출 지원)
  const parsedItems = result?.parsed;
  const isMultiple = Array.isArray(parsedItems) && parsedItems.length > 1;

  const v = (field) => (field && typeof field === 'object' && 'value' in field) ? field.value : field;

  const toConfirmData = (item) => {
    const amount = Number(v(item.totalAmount)) || 0;
    const desc = String(v(item.description) || '').slice(0, MAX_DESCRIPTION_LENGTH);
    const loc = v(item.location) ? String(v(item.location)).slice(0, MAX_LOCATION_LENGTH) : null;
    const cat = VALID_CATEGORIES.has(v(item.category)) ? v(item.category) : 'OTHER';
    const share = VALID_SHARE_TYPES.has(v(item.shareType)) ? v(item.shareType) : 'EQUAL';

    return {
      totalAmount: Math.min(Math.max(amount, 1), MAX_AMOUNT),
      description: desc,
      location: loc,
      category: cat,
      paidAt: v(item.paidAt) || Date.now(),
      shareType: share,
    };
  };

  const handleConfirm = () => {
    if (!parsedItems || !Array.isArray(parsedItems)) return;
    if (isMultiple) {
      onConfirm(parsedItems.map(toConfirmData));
    } else {
      onConfirm(toConfirmData(parsedItems[0]));
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm">
      {/* 닫기 버튼 */}
      <button
        onClick={onCancel}
        className="absolute top-4 right-4 p-2 text-white/60 hover:text-white transition-colors"
      >
        <X size={24} />
      </button>

      {/* 연결 대기 중 (서버 권한 확인) */}
      {voiceState === VOICE_STATE.IDLE && !error && (
        <div className="flex flex-col items-center gap-6">
          <Loader size={40} className="text-white animate-spin" />
          <p className="text-white text-lg font-medium">연결 중...</p>
        </div>
      )}

      {/* LISTENING */}
      {voiceState === VOICE_STATE.LISTENING && (
        <div className="flex flex-col items-center gap-6">
          <p className="text-white/60 text-sm">{formatTime(elapsed)}</p>
          <button
            onClick={onStop}
            className="relative w-32 h-32 active:scale-90 transition-transform"
          >
            <div className="absolute inset-0 bg-blue-500 rounded-full animate-pulse" />
            <div className="absolute -inset-4 rounded-full border-2 border-blue-400/30 animate-ping" />
            <div className="relative flex items-center justify-center w-full h-full">
              <Mic size={48} className="text-white" />
            </div>
          </button>
          <p className="text-white text-lg font-medium">듣고 있어요...</p>
          <p className="text-white/40 text-xs">탭하여 완료</p>
        </div>
      )}

      {/* PARTIAL - 분석 중 */}
      {voiceState === VOICE_STATE.PARTIAL && (
        <div className="flex flex-col items-center gap-6 px-6 max-w-sm">
          <Loader size={40} className="text-white animate-spin" />
          <p className="text-white text-lg font-medium">분석 중...</p>
          {transcript && (
            <div className="bg-white/10 rounded-2xl p-4 w-full">
              <p className="text-white/80 text-sm text-center">"{transcript}"</p>
            </div>
          )}
        </div>
      )}

      {/* FINAL - 비지출 메시지 */}
      {voiceState === VOICE_STATE.FINAL && result?.type === 'message' && (
        <div className="flex flex-col items-center gap-4 px-6 max-w-sm">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center">
            <MessageCircle size={32} className="text-blue-400" />
          </div>
          <p className="text-white text-lg font-medium text-center">{result.message}</p>
          {transcript && (
            <div className="bg-white/10 rounded-xl p-3 w-full">
              <p className="text-white/60 text-xs mb-1">인식된 텍스트</p>
              <p className="text-white/80 text-sm">"{transcript}"</p>
            </div>
          )}
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors mt-2"
          >
            닫기
          </button>
        </div>
      )}

      {/* FINAL - 결과 확인 */}
      {voiceState === VOICE_STATE.FINAL && result?.type !== 'message' && parsedItems?.length > 0 && (
        <div className="flex flex-col items-center gap-4 px-6 w-full max-w-sm">
          <p className="text-white text-lg font-medium mb-2">
            {isMultiple ? `${parsedItems.length}건의 지출` : '결과 확인'}
          </p>

          {transcript && (
            <div className="bg-white/10 rounded-xl p-3 w-full">
              <p className="text-white/60 text-xs mb-1">인식된 텍스트</p>
              <p className="text-white/80 text-sm">"{transcript}"</p>
            </div>
          )}

          <div className={`w-full space-y-3 ${isMultiple ? 'max-h-[50vh] overflow-y-auto' : ''}`}>
            {parsedItems.map((item, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full space-y-3">
                {isMultiple && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">지출 {idx + 1}</p>
                )}
                <div className="text-center">
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {v(item.totalAmount)?.toLocaleString()}원
                  </p>
                </div>

                {v(item.description) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">설명</span>
                    <span className="text-gray-900 dark:text-white">{v(item.description)}</span>
                  </div>
                )}
                {v(item.category) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">카테고리</span>
                    <span className="text-gray-900 dark:text-white">
                      {CATEGORY_LABELS[v(item.category)] || v(item.category)}
                    </span>
                  </div>
                )}
                {v(item.location) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">장소</span>
                    <span className="text-gray-900 dark:text-white">{v(item.location)}</span>
                  </div>
                )}
                {v(item.shareType) && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">정산 방식</span>
                    <span className="text-gray-900 dark:text-white">
                      {v(item.shareType) === 'EQUAL' ? '균등 분배' : v(item.shareType)}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Check size={18} />
              {isMultiple ? `${parsedItems.length}건 확인` : '확인'}
            </button>
          </div>
        </div>
      )}

      {/* CONFIRMED - 등록 완료 애니메이션 */}
      {voiceState === VOICE_STATE.CONFIRMED && (
        <>
          <div className="relative voice-celebration-scale-in">
            {/* 글로우 효과 */}
            <div className="absolute -inset-4 rounded-3xl blur-xl opacity-30 voice-celebration-glow bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500" />

            {/* 카드 */}
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl px-12 py-10 shadow-2xl">
              {/* 체크 아이콘 */}
              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 rounded-full flex items-center justify-center voice-celebration-check bg-gradient-to-br from-green-500 to-emerald-600">
                  <Receipt size={36} className="text-white" strokeWidth={2.5} />
                </div>
              </div>

              {/* 텍스트 */}
              <div className="text-center voice-celebration-text">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  등록 완료!
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                  {Array.isArray(savedExpenseId) && savedExpenseId.length > 1
                    ? `${savedExpenseId.length}건의 지출이 등록되었습니다`
                    : '지출이 등록되었습니다'}
                </p>
              </div>
            </div>
          </div>

          {/* 파티클 효과 */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute voice-celebration-particle"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${10 + Math.random() * 80}%`,
                  width: `${4 + Math.random() * 8}px`,
                  height: `${4 + Math.random() * 8}px`,
                  background: ['#10B981', '#34D399', '#6EE7B7', '#059669', '#047857'][i % 5],
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  animationDelay: `${Math.random() * 0.3}s`,
                }}
              />
            ))}
          </div>

          <style>{`
            .voice-celebration-scale-in {
              animation: voiceCelebScaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
            }
            .voice-celebration-check {
              animation: voiceCelebCheckPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards;
              transform: scale(0);
            }
            .voice-celebration-text {
              animation: voiceCelebFadeUp 0.5s ease-out 0.4s forwards;
              opacity: 0;
            }
            .voice-celebration-glow {
              animation: voiceCelebGlow 2s ease-in-out infinite;
            }
            .voice-celebration-particle {
              animation: voiceCelebParticle 2s ease-out forwards;
              opacity: 0;
            }
            @keyframes voiceCelebScaleIn {
              from { opacity: 0; transform: scale(0.8) translateY(20px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes voiceCelebCheckPop {
              from { transform: scale(0) rotate(-45deg); }
              to { transform: scale(1) rotate(0deg); }
            }
            @keyframes voiceCelebFadeUp {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes voiceCelebGlow {
              0%, 100% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(1.05); }
            }
            @keyframes voiceCelebParticle {
              0% { opacity: 0; transform: scale(0) translateY(0); }
              10% { opacity: 1; transform: scale(1.2) translateY(0); }
              30% { opacity: 1; transform: scale(1) translateY(-20px); }
              100% { opacity: 0; transform: scale(0.5) translateY(-100px); }
            }
          `}</style>
        </>
      )}

      {/* Error */}
      {error && voiceState === VOICE_STATE.IDLE && (
        <div className="flex flex-col items-center gap-4 px-6 max-w-sm">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <X size={32} className="text-red-400" />
          </div>
          <p className="text-white text-lg font-medium">오류 발생</p>
          <p className="text-white/60 text-sm text-center">{error}</p>
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRecordingOverlay;
