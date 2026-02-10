import React, { useState, useRef, useCallback } from 'react';
import { Check, X, RotateCcw } from 'lucide-react';

const SWIPE_THRESHOLD = 100;
const FLY_OUT_DURATION = 300;
const SPRING_BACK_DURATION = 300;
const MAX_ROTATION = 15;
const VERTICAL_DAMPING = 0.3;
const MAX_VISIBLE_CARDS = 3;

const SwipeableExpenseCards = ({ items, transcript, v, toConfirmData, CATEGORY_LABELS, onComplete, onCancel }) => {
  const [phase, setPhase] = useState('swiping'); // 'swiping' | 'summary'
  const [currentIndex, setCurrentIndex] = useState(0);
  const [decisions, setDecisions] = useState([]); // { accepted: boolean }[]
  const [dragState, setDragState] = useState({ x: 0, y: 0, isDragging: false });
  const [flyOut, setFlyOut] = useState(null); // { direction: 'left'|'right' }
  const isAnimatingRef = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const cardRef = useRef(null);

  const totalItems = items.length;

  // --- Gesture handling ---
  const handleDragStart = useCallback((clientX, clientY) => {
    if (isAnimatingRef.current || phase !== 'swiping') return;
    startPos.current = { x: clientX, y: clientY };
    setDragState({ x: 0, y: 0, isDragging: true });
  }, [phase]);

  const handleDragMove = useCallback((clientX, clientY) => {
    if (!dragState.isDragging || isAnimatingRef.current) return;
    const dx = clientX - startPos.current.x;
    const dy = (clientY - startPos.current.y) * VERTICAL_DAMPING;
    setDragState(prev => ({ ...prev, x: dx, y: dy }));
  }, [dragState.isDragging]);

  const triggerSwipe = useCallback((direction) => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;
    const accepted = direction === 'right';

    setFlyOut({ direction });
    setDragState(prev => ({ ...prev, isDragging: false }));

    setTimeout(() => {
      setDecisions(prev => [...prev, { accepted }]);
      setFlyOut(null);
      setDragState({ x: 0, y: 0, isDragging: false });

      const nextIndex = currentIndex + 1;
      if (nextIndex >= totalItems) {
        setCurrentIndex(nextIndex);
        setPhase('summary');
      } else {
        setCurrentIndex(nextIndex);
      }
      isAnimatingRef.current = false;
    }, FLY_OUT_DURATION);
  }, [currentIndex, totalItems]);

  const handleDragEnd = useCallback(() => {
    if (!dragState.isDragging || isAnimatingRef.current) return;
    const { x } = dragState;
    if (Math.abs(x) > SWIPE_THRESHOLD) {
      triggerSwipe(x > 0 ? 'right' : 'left');
    } else {
      // Spring back
      setDragState({ x: 0, y: 0, isDragging: false });
    }
  }, [dragState, triggerSwipe]);

  // Touch events
  const onTouchStart = useCallback((e) => {
    const touch = e.touches[0];
    handleDragStart(touch.clientX, touch.clientY);
  }, [handleDragStart]);

  const onTouchMove = useCallback((e) => {
    const touch = e.touches[0];
    handleDragMove(touch.clientX, touch.clientY);
  }, [handleDragMove]);

  const onTouchEnd = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  // Mouse events
  const onMouseDown = useCallback((e) => {
    handleDragStart(e.clientX, e.clientY);
  }, [handleDragStart]);

  const onMouseMove = useCallback((e) => {
    handleDragMove(e.clientX, e.clientY);
  }, [handleDragMove]);

  const onMouseUp = useCallback(() => {
    handleDragEnd();
  }, [handleDragEnd]);

  const onMouseLeave = useCallback(() => {
    if (dragState.isDragging) handleDragEnd();
  }, [dragState.isDragging, handleDragEnd]);

  // --- Card style computation ---
  const getCardStyle = (stackIndex) => {
    if (stackIndex === 0) {
      // Current card
      if (flyOut) {
        const flyX = flyOut.direction === 'right' ? window.innerWidth : -window.innerWidth;
        const flyRotation = flyOut.direction === 'right' ? 30 : -30;
        return {
          transform: `translate(${flyX}px, 0px) rotate(${flyRotation}deg)`,
          transition: `transform ${FLY_OUT_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          zIndex: MAX_VISIBLE_CARDS + 1,
        };
      }
      const rotation = (dragState.x / window.innerWidth) * MAX_ROTATION;
      const springTransition = !dragState.isDragging && !flyOut
        ? `transform ${SPRING_BACK_DURATION}ms cubic-bezier(0.34, 1.56, 0.64, 1)`
        : 'none';
      return {
        transform: `translate(${dragState.x}px, ${dragState.y}px) rotate(${rotation}deg)`,
        transition: springTransition,
        zIndex: MAX_VISIBLE_CARDS + 1,
        cursor: 'grab',
      };
    }

    // Background cards: move closer when dragging
    const dragProgress = Math.min(Math.abs(dragState.x) / SWIPE_THRESHOLD, 1);
    const baseScale = 1 - stackIndex * 0.05;
    const targetScale = 1 - (stackIndex - 1) * 0.05;
    const scale = baseScale + (targetScale - baseScale) * dragProgress * 0.5;
    const baseY = stackIndex * 12;
    const targetY = (stackIndex - 1) * 12;
    const translateY = baseY + (targetY - baseY) * dragProgress * 0.5;

    return {
      transform: `translateY(${translateY}px) scale(${scale})`,
      transition: dragState.isDragging ? 'transform 50ms ease-out' : `transform ${SPRING_BACK_DURATION}ms ease-out`,
      zIndex: MAX_VISIBLE_CARDS - stackIndex,
    };
  };

  // --- Overlay indicator ---
  const getOverlayOpacity = () => {
    if (!dragState.isDragging && !flyOut) return 0;
    return Math.min(Math.abs(dragState.x) / (SWIPE_THRESHOLD * 1.5), 0.7);
  };

  // --- Reset for re-selection ---
  const handleReset = () => {
    setPhase('swiping');
    setCurrentIndex(0);
    setDecisions([]);
    setDragState({ x: 0, y: 0, isDragging: false });
    setFlyOut(null);
    isAnimatingRef.current = false;
  };

  // --- Submit accepted items ---
  const handleSubmit = () => {
    const acceptedItems = items
      .filter((_, idx) => decisions[idx]?.accepted)
      .map(item => toConfirmData(item));

    if (acceptedItems.length === 0) {
      onCancel();
      return;
    }
    onComplete(acceptedItems.length === 1 ? acceptedItems[0] : acceptedItems);
  };

  // --- Progress dots ---
  const renderProgressDots = () => (
    <div className="flex items-center gap-1.5">
      {items.map((_, idx) => {
        if (idx < decisions.length) {
          // Processed
          return (
            <div
              key={idx}
              className={`w-2 h-2 rounded-full ${decisions[idx].accepted ? 'bg-green-400' : 'bg-red-400'}`}
            />
          );
        }
        if (idx === currentIndex && phase === 'swiping') {
          // Current
          return <div key={idx} className="w-4 h-2 rounded-full bg-white" />;
        }
        // Unprocessed
        return <div key={idx} className="w-2 h-2 rounded-full bg-white/30" />;
      })}
    </div>
  );

  // --- Render card content ---
  const renderCardContent = (item, idx) => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 w-full space-y-3 select-none">
      {totalItems > 1 && (
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
  );

  // ========== SUMMARY PHASE ==========
  if (phase === 'summary') {
    const acceptedItems = items.filter((_, idx) => decisions[idx]?.accepted);
    const rejectedCount = decisions.filter(d => !d.accepted).length;

    return (
      <div className="flex flex-col items-center gap-4 px-6 w-full max-w-sm animate-card-stack-enter">
        {acceptedItems.length === 0 ? (
          <>
            <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center">
              <X size={32} className="text-gray-400" />
            </div>
            <p className="text-white text-lg font-medium">선택된 지출이 없습니다</p>
            <p className="text-white/60 text-sm">모든 지출을 건너뛰었습니다</p>
            <div className="flex gap-3 w-full mt-4">
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                다시 선택
              </button>
              <button
                onClick={onCancel}
                className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
              >
                닫기
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="text-white text-lg font-medium">
              {acceptedItems.length}건 등록 / {rejectedCount}건 건너뛰기
            </p>

            <div className="w-full space-y-2 max-h-[40vh] overflow-y-auto">
              {items.map((item, idx) => {
                const accepted = decisions[idx]?.accepted;
                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      accepted
                        ? 'bg-green-500/10 border border-green-500/20'
                        : 'bg-white/5 border border-white/10 opacity-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        accepted ? 'bg-green-500' : 'bg-red-500/50'
                      }`}>
                        {accepted ? <Check size={14} className="text-white" /> : <X size={14} className="text-white" />}
                      </div>
                      <span className="text-white text-sm">
                        {v(item.description) || `지출 ${idx + 1}`}
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${accepted ? 'text-white' : 'text-white/50'}`}>
                      {v(item.totalAmount)?.toLocaleString()}원
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 w-full mt-4">
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw size={16} />
                다시 선택
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Check size={18} />
                {acceptedItems.length}건 등록하기
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // ========== SWIPING PHASE ==========
  const visibleCards = items.slice(currentIndex, currentIndex + MAX_VISIBLE_CARDS);
  const overlayOpacity = getOverlayOpacity();
  const isRightSwipe = dragState.x > 0;

  return (
    <div className="flex flex-col items-center gap-4 px-6 w-full max-w-sm">
      {/* Header: counter + progress dots */}
      <div className="flex flex-col items-center gap-2 shrink-0">
        <p className="text-white text-lg font-medium">
          {currentIndex + 1} / {totalItems}
        </p>
        {renderProgressDots()}
      </div>

      {/* Transcript */}
      {transcript && (
        <div className="bg-white/10 rounded-xl p-3 w-full shrink-0">
          <p className="text-white/60 text-xs mb-1">인식된 텍스트</p>
          <p className="text-white/80 text-sm">"{transcript}"</p>
        </div>
      )}

      {/* Card Stack */}
      <div
        className="relative w-full"
        style={{ minHeight: '220px' }}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      >
        {visibleCards.map((item, stackIndex) => {
          const actualIndex = currentIndex + stackIndex;
          const isCurrent = stackIndex === 0;
          const style = getCardStyle(stackIndex);

          return (
            <div
              key={actualIndex}
              ref={isCurrent ? cardRef : undefined}
              className={`${stackIndex === 0 ? 'relative' : 'absolute inset-x-0 top-0'}`}
              style={{
                ...style,
                touchAction: isCurrent ? 'none' : 'auto',
                userSelect: 'none',
              }}
              onTouchStart={isCurrent ? onTouchStart : undefined}
              onTouchMove={isCurrent ? onTouchMove : undefined}
              onTouchEnd={isCurrent ? onTouchEnd : undefined}
              onMouseDown={isCurrent ? onMouseDown : undefined}
            >
              {/* Swipe overlay indicator */}
              {isCurrent && overlayOpacity > 0 && (
                <div
                  className={`absolute inset-0 rounded-2xl z-10 flex items-center justify-center pointer-events-none ${
                    isRightSwipe ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ opacity: overlayOpacity }}
                >
                  <div className="flex flex-col items-center gap-1">
                    {isRightSwipe ? (
                      <>
                        <Check size={40} className="text-white" strokeWidth={3} />
                        <span className="text-white font-bold text-lg">등록</span>
                      </>
                    ) : (
                      <>
                        <X size={40} className="text-white" strokeWidth={3} />
                        <span className="text-white font-bold text-lg">건너뛰기</span>
                      </>
                    )}
                  </div>
                </div>
              )}

              {renderCardContent(item, actualIndex)}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-8 shrink-0 mt-2">
        <button
          onClick={() => triggerSwipe('left')}
          className="w-14 h-14 rounded-full border-2 border-red-400 flex items-center justify-center text-red-400 hover:bg-red-400/10 active:scale-90 transition-all"
          aria-label="건너뛰기"
        >
          <X size={28} strokeWidth={2.5} />
        </button>
        <button
          onClick={() => triggerSwipe('right')}
          className="w-14 h-14 rounded-full border-2 border-green-400 flex items-center justify-center text-green-400 hover:bg-green-400/10 active:scale-90 transition-all"
          aria-label="등록"
        >
          <Check size={28} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
};

export default SwipeableExpenseCards;
