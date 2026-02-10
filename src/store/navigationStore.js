import { create } from 'zustand';

// 페이지 깊이 정의 (낮을수록 상위 페이지)
const PAGE_DEPTH = {
  '/auth': 0,
  '/main': 1,
  '/profile': 2,
  '/payment-methods': 2,
  '/payment-methods/add': 3,
  '/gathering/new': 2,
  '/gathering': 2,  // /gathering/:id
  '/payment': 3,    // /payment/:gatheringId
};

const getPageDepth = (pathname) => {
  // 정확히 매칭되는 경우
  if (PAGE_DEPTH[pathname] !== undefined) {
    return PAGE_DEPTH[pathname];
  }

  // 동적 라우트 매칭
  if (pathname.match(/^\/gathering\/[^/]+\/expenses$/)) return 3;
  if (pathname.match(/^\/gathering\/[^/]+\/settlements$/)) return 3;
  if (pathname.startsWith('/gathering/')) return 2;
  if (pathname.startsWith('/payment/')) return 3;

  return 1; // 기본값
};

export const useNavigationStore = create((set, get) => ({
  direction: 'none', // 'forward' | 'back' | 'up' | 'down' | 'none'
  previousPath: null,
  currentPath: null,
  manualDirection: null, // 수동으로 설정된 방향
  fullscreenModal: false, // 전체화면 모달 열림 여부 (BottomNav 숨김용)

  // 경로 변경 시 방향 계산
  updatePath: (newPath) => {
    const { currentPath, manualDirection } = get();

    // 수동으로 설정된 방향이 있으면 사용
    if (manualDirection) {
      set({
        direction: manualDirection,
        previousPath: currentPath,
        currentPath: newPath,
        manualDirection: null, // 사용 후 초기화
      });
      return;
    }

    // 자동 방향 감지
    const previousDepth = getPageDepth(currentPath || '/');
    const newDepth = getPageDepth(newPath);

    let direction = 'none';
    if (newDepth > previousDepth) {
      direction = 'forward';
    } else if (newDepth < previousDepth) {
      direction = 'back';
    } else if (currentPath !== newPath) {
      direction = 'forward'; // 같은 깊이면 forward
    }

    set({
      direction,
      previousPath: currentPath,
      currentPath: newPath,
    });
  },

  // 명시적으로 뒤로가기 설정 (다음 네비게이션에 적용)
  setBack: () => set({ manualDirection: 'back' }),

  // 명시적으로 앞으로가기 설정
  setForward: () => set({ manualDirection: 'forward' }),

  // 명시적으로 위로 올라오기 설정 (아래에서 위로)
  setUp: () => set({ manualDirection: 'up' }),

  // 명시적으로 아래로 내려가기 설정 (위에서 아래로)
  setDown: () => set({ manualDirection: 'down' }),

  // 애니메이션 완료 후 리셋
  resetDirection: () => set({ direction: 'none' }),

  // 전체화면 모달 제어
  openFullscreenModal: () => set({ fullscreenModal: true }),
  closeFullscreenModal: () => set({ fullscreenModal: false }),
}));
