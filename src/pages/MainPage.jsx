import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, QrCode } from 'lucide-react';
import { useGathering } from '../hooks/useGathering';
import { useAuthStore } from '../store/authStore';
import { useAccountCheck } from '../hooks/useAccountCheck';
import GatheringList from '../components/gathering/GatheringList';
import AccountRequiredModal from '../components/common/AccountRequiredModal';

const MainPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { gatherings, getMyGatherings, loading, initialize } = useGathering();
  const { hasAccount, refetch: refetchAccount } = useAccountCheck();
  const [showAccountModal, setShowAccountModal] = React.useState(false);

  // 컴포넌트가 언마운트될 때 gathering store 초기화
  useEffect(() => {
    return () => {
      initialize();
    };
  }, []);

  // 인증 상태가 변경될 때마다 모임 목록 로드
  useEffect(() => {
    if (isAuthenticated && user) {
      loadGatherings();
    }
  }, [isAuthenticated, user]);

  const loadGatherings = async () => {
    try {
      await getMyGatherings();
    } catch (error) {
      console.error('모임 목록 조회 실패:', error);
    }
  };

  // 계좌 체크 후 모임 생성
  const handleCreateClick = () => {
    if (hasAccount) {
      navigate('/gathering/new');
    } else {
      setShowAccountModal(true);
    }
  };

  // 계좌 등록 완료 후 처리
  const handleAccountSuccess = async () => {
    await refetchAccount();
    navigate('/gathering/new');
  };

  return (
    <div className="page">
      <div className="page-content">
        {/* 타이틀 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            내 모임
          </h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/join')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <QrCode size={20} />
              <span>참여</span>
            </button>
            <button
              onClick={handleCreateClick}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors"
            >
              <Plus size={20} />
              <span>만들기</span>
            </button>
          </div>
        </div>

        {/* 모임 목록 */}
        <GatheringList
          gatherings={gatherings}
          loading={loading}
        />
      </div>

      {/* 계좌 등록 모달 */}
      <AccountRequiredModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onSuccess={handleAccountSuccess}
        title="모임을 만들려면 계좌가 필요해요"
      />
    </div>
  );
};

export default MainPage;