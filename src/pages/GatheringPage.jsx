import React, { useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGathering } from '../hooks/useGathering';
import { useAuth } from '../hooks/useAuth';
import { GATHERING_STATUS } from '../utils/constants';
import Button from '../components/common/Button';
import GatheringDetail from '../components/gathering/GatheringDetail';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullToRefresh from '../components/common/PullToRefresh';

const GatheringPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentGathering, getGathering, loading, clearCurrentGathering } = useGathering();

  useEffect(() => {
    // id가 유효한 값인지 확인 (undefined 문자열이나 빈 값 제외)
    if (id && id !== 'undefined' && id !== 'null') {
      loadGathering();
    } else if (id === 'undefined' || id === 'null') {
      // 잘못된 id로 접근 시 홈으로 리다이렉트
      navigate('/main');
    }

    return () => {
      clearCurrentGathering();
    };
  }, [id]);

  const loadGathering = useCallback(async () => {
    try {
      await getGathering(id);
      // 최근 본 모임 ID 저장
      localStorage.setItem('lastViewedGatheringId', id);
    } catch (error) {
      toast.error('모임 정보를 불러올 수 없습니다.');
      navigate('/');
    }
  }, [id, getGathering, navigate]);

  const { state: pullState, pullDistance } = usePullToRefresh(loadGathering);

  const handleGatheringUpdate = (updatedGathering) => {
    // 상태가 업데이트되면 다시 로딩
    loadGathering();
  };

  const handlePaymentClick = () => {
    navigate(`/payment/${id}`);
  };

  const isOwner = currentGathering?.owner?.email === user?.email;
  const canPay = currentGathering?.status === GATHERING_STATUS.PAYMENT_REQUESTED;

  if (loading && !currentGathering) {
    return null;
  }

  if (!currentGathering) {
    return (
      <div className="page">
        <div className="page-content">
          <div className="card text-center">
            <p className="text-gray-600">존재하지 않는 모임입니다.</p>
            <Button 
              variant="secondary" 
              onClick={() => navigate('/')}
              className="mt-4"
            >
              홈으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <PullToRefresh state={pullState} pullDistance={pullDistance}>
      <div className="page-content">
        <GatheringDetail
          gathering={currentGathering}
          onUpdate={handleGatheringUpdate}
        />

        {/* 결제하기 버튼 (참여자용) */}
        {!isOwner && canPay && (
          <div className="fixed bottom-0 left-0 right-0 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/50">
            <div className="max-w-md mx-auto">
              <Button
                fullWidth
                size="lg"
                onClick={handlePaymentClick}
                className="flex items-center justify-center gap-2"
              >
                <CreditCard size={20} />
                결제하기
              </Button>
            </div>
          </div>
        )}
      </div>
      </PullToRefresh>
    </div>
  );
};

export default GatheringPage;