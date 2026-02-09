import { useState, useEffect, useRef, useCallback } from 'react';

const THRESHOLD = 70;
const MAX_PULL = 130;

// 고무줄 감쇠 - 당길수록 저항 증가
const dampen = (distance) => {
  const ratio = distance / MAX_PULL;
  return MAX_PULL * (1 - Math.exp(-2.5 * ratio));
};

const usePullToRefresh = (onRefresh) => {
  const [state, setState] = useState('idle'); // idle | pulling | ready | refreshing | completing
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const pulling = useRef(false);
  const rafId = useRef(null);

  const getContainer = useCallback(() => document.querySelector('.app-content'), []);

  useEffect(() => {
    const container = getContainer();
    if (!container) return;

    const onTouchStart = (e) => {
      if (state === 'refreshing' || state === 'completing') return;
      if (container.scrollTop > 5) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    };

    const onTouchMove = (e) => {
      if (!pulling.current || state === 'refreshing' || state === 'completing') return;

      const diff = e.touches[0].clientY - startY.current;

      if (diff > 0 && container.scrollTop <= 0) {
        e.preventDefault();
        const dampened = dampen(diff);
        setPullDistance(dampened);
        setState(dampened >= THRESHOLD ? 'ready' : 'pulling');
      } else if (state !== 'idle') {
        setPullDistance(0);
        setState('idle');
      }
    };

    const onTouchEnd = async () => {
      if (!pulling.current) return;
      pulling.current = false;

      if (state === 'ready' && onRefresh) {
        setState('refreshing');
        setPullDistance(THRESHOLD * 0.65);
        try {
          await onRefresh();
        } catch (_) { /* ignore */ }
        setState('completing');
        setPullDistance(0);
        // completing 상태에서 transition 끝난 후 idle
        setTimeout(() => setState('idle'), 350);
      } else {
        setState('idle');
        setPullDistance(0);
      }
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: false });
    container.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [getContainer, onRefresh, state]);

  return { state, pullDistance };
};

export default usePullToRefresh;
