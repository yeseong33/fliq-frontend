import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigationStore } from '../../store/navigationStore';

const PageTransition = ({ children }) => {
  const location = useLocation();
  const { direction, updatePath, resetDirection } = useNavigationStore();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      // 첫 렌더링 시에는 현재 경로만 설정
      updatePath(location.pathname);
      isFirstRender.current = false;
      return;
    }

    // 경로 변경 시 방향 업데이트
    updatePath(location.pathname);

    // 애니메이션 완료 후 방향 리셋
    const timer = setTimeout(() => {
      resetDirection();
    }, 250);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // 애니메이션 클래스 결정
  const getAnimationClass = () => {
    switch (direction) {
      case 'back':
        return 'page-enter-from-left';
      case 'forward':
        return 'page-enter-from-right';
      case 'up':
        return 'page-enter-from-bottom';
      case 'down':
        return 'page-enter-from-top';
      default:
        return '';
    }
  };

  return (
    <div className={`page-transition ${getAnimationClass()}`}>
      {children}
    </div>
  );
};

export default PageTransition;
