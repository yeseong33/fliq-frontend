import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Zap, User } from 'lucide-react';
import toast from '../../utils/toast';
import { useNavigationStore } from '../../store/navigationStore';

const LAST_VIEWED_KEY = 'lastViewedGatheringId';

// 탭 위치 인덱스 (왼쪽에서 오른쪽)
const getTabIndex = (pathname) => {
  if (pathname === '/main' || pathname === '/') return 0;
  if (pathname.startsWith('/gathering')) return 1;
  if (pathname === '/profile') return 2;
  return -1;
};

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [lastViewedId, setLastViewedId] = useState(null);
  const { setBack, setForward, fullscreenModal } = useNavigationStore();

  // localStorage에서 최근 본 모임 ID 로드
  useEffect(() => {
    const stored = localStorage.getItem(LAST_VIEWED_KEY);
    setLastViewedId(stored);
  }, [location.pathname]);

  // 탭 이동 시 방향 설정 후 네비게이트
  const navigateWithDirection = (targetPath) => {
    const currentIndex = getTabIndex(location.pathname);
    const targetIndex = getTabIndex(targetPath);

    if (targetIndex > currentIndex) {
      setForward();
    } else if (targetIndex < currentIndex) {
      setBack();
    }

    navigate(targetPath);
  };

  const handleNowClick = () => {
    if (lastViewedId) {
      navigateWithDirection(`/gathering/${lastViewedId}`);
    } else {
      toast('최근 본 모임이 없어요', { icon: '🕐' });
    }
  };

  // 바텀 네비게이션을 표시할 페이지들
  const showOnPaths = ['/main', '/profile'];
  const isGatheringDetail = /^\/gathering\/[^/]+$/.test(location.pathname);
  const shouldShow = showOnPaths.some(p => location.pathname.startsWith(p)) || isGatheringDetail;

  if (!shouldShow || fullscreenModal) return null;

  return (
    <nav className="bottom-nav">
      <div className="max-w-md mx-auto flex">
        {/* 홈 */}
        <button
          onClick={() => navigateWithDirection('/main')}
          className={`flex-1 flex flex-col items-center justify-center py-4 transition-colors ${
            location.pathname === '/main' || location.pathname === '/'
              ? 'text-blue-500'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          <Home size={24} strokeWidth={location.pathname === '/main' ? 2.5 : 2} />
          <span className={`text-xs mt-1 ${location.pathname === '/main' ? 'font-semibold' : 'font-medium'}`}>
            홈
          </span>
        </button>

        {/* 지금 (최근 본 모임) */}
        <button
          onClick={handleNowClick}
          className={`flex-1 flex flex-col items-center justify-center py-4 transition-colors ${
            location.pathname.startsWith('/gathering')
              ? 'text-blue-500'
              : lastViewedId
                ? 'text-gray-400 dark:text-gray-500'
                : 'text-gray-300 dark:text-gray-600'
          }`}
        >
          <Zap size={24} strokeWidth={location.pathname.startsWith('/gathering') ? 2.5 : 2} />
          <span className={`text-xs mt-1 ${location.pathname.startsWith('/gathering') ? 'font-semibold' : 'font-medium'} ${!lastViewedId && !location.pathname.startsWith('/gathering') ? 'opacity-50' : ''}`}>
            지금
          </span>
        </button>

        {/* 마이 */}
        <button
          onClick={() => navigateWithDirection('/profile')}
          className={`flex-1 flex flex-col items-center justify-center py-4 transition-colors ${
            location.pathname === '/profile'
              ? 'text-blue-500'
              : 'text-gray-400 dark:text-gray-500'
          }`}
        >
          <User size={24} strokeWidth={location.pathname === '/profile' ? 2.5 : 2} />
          <span className={`text-xs mt-1 ${location.pathname === '/profile' ? 'font-semibold' : 'font-medium'}`}>
            마이
          </span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
