import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from '../utils/toast';
import { useGathering } from '../hooks/useGathering';
import { PAYMENT_STATUS } from '../utils/constants';
import Header from '../components/common/Header';
import PaymentForm from '../components/payment/PaymentForm';
import PaymentStatus from '../components/payment/PaymentStatus';

const PaymentPage = () => {
  const { gatheringId } = useParams();
  const navigate = useNavigate();
  const { currentGathering, getGathering, loading } = useGathering();
  const [currentView, setCurrentView] = useState('loading'); // 'loading', 'form', 'status'

  useEffect(() => {
    if (gatheringId) {
      loadGathering();
    }
  }, [gatheringId]);

  const loadGathering = async () => {
    try {
      await getGathering(gatheringId);
      setCurrentView('form');
    } catch {
      toast.error('모임 정보를 불러올 수 없습니다.');
      navigate('/');
    }
  };

  const handlePaymentSuccess = () => {
    toast.success('결제가 완료되었습니다!');
    setCurrentView('status');
  };

  const handleRetryPayment = () => {
    setCurrentView('form');
  };

  if (loading || currentView === 'loading') {
    return null;
  }

  if (!currentGathering) {
    return (
      <div className="page">
        <Header title="결제" showBack={true} />
        <div className="page-content">
          <div className="card text-center">
            <p className="text-gray-600">모임 정보를 찾을 수 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <Header 
        title={currentView === 'form' ? '결제하기' : '결제 상태'} 
        showBack={true} 
      />
      
      <div className="page-content">
        {currentView === 'form' && (
          <PaymentForm 
            gathering={currentGathering}
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}
        
        {currentView === 'status' && (
          <PaymentStatus 
            gatheringId={gatheringId}
            onRetry={handleRetryPayment}
          />
        )}
      </div>
    </div>
  );
};

export default PaymentPage;