import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { useGathering } from '../hooks/useGathering';
import { useAuth } from '../hooks/useAuth';
import { GATHERING_STATUS } from '../utils/constants';
import Header from '../components/common/Header';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import GatheringDetail from '../components/gathering/GatheringDetail';
import PaymentHistory from '../components/payment/PaymentHistory';

const GatheringPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentGathering, getGathering, loading, clearCurrentGathering } = useGathering();
  const [activeTab, setActiveTab] = useState('details');

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

  const loadGathering = async () => {
    try {
      await getGathering(id);
    } catch (error) {
      toast.error('모임 정보를 불러올 수 없습니다.');
      navigate('/');
    }
  };

  const handleGatheringUpdate = (updatedGathering) => {
    // 상태가 업데이트되면 다시 로딩
    loadGathering();
  };

  const handlePaymentClick = () => {
    navigate(`/payment/${id}`);
  };

  const isOwner = currentGathering?.owner?.email === user?.email;
  const canPay = currentGathering?.status === GATHERING_STATUS.PAYMENT_REQUESTED;
  const hasPaymentRequest = currentGathering?.totalAmount != null;

  if (loading && !currentGathering) {
    return (
      <div className="page">
        <Header title="모임" showBack={true} showProfile={true} />
        <div className="page-content">
          <Loading message="모임 정보를 불러오고 있습니다..." />
        </div>
      </div>
    );
  }

  if (!currentGathering) {
    return (
      <div className="page">
        <Header title="모임을 찾을 수 없습니다" showBack={true} />
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
      <Header
        title=""
        showBack={true}
        showProfile={true}
      />
      
      <div className="page-content">
        {/* 탭 네비게이션 */}
        <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <button
              onClick={() => setActiveTab('details')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'details'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              모임 정보
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === 'payments'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              결제 현황
            </button>
          </div>

        {/* 탭 콘텐츠 */}
        {activeTab === 'details' && (
          <GatheringDetail 
            gathering={currentGathering}
            onUpdate={handleGatheringUpdate}
          />
        )}
        
        {activeTab === 'payments' && (
          <PaymentHistory gatheringId={currentGathering.id} />
        )}

        {/* 결제하기 버튼 (참여자용) */}
        {!isOwner && canPay && (
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200/50 dark:border-gray-700/50">
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
    </div>
  );
};

export default GatheringPage;