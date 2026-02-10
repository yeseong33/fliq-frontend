import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Calculator } from 'lucide-react';
import { useNavigationStore } from '../store/navigationStore';
import { useAuth } from '../hooks/useAuth';
import { settlementAPI } from '../api';
import SettlementItem from '../components/gathering/SettlementItem';

const SettlementListPage = () => {
  const { id: gatheringId } = useParams();
  const navigate = useNavigate();
  const { setDown } = useNavigationStore();
  const { user } = useAuth();
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSettlements = async () => {
    try {
      const gatheringResponse = await settlementAPI.getByGathering(gatheringId);
      const gatheringSettlements = gatheringResponse?.data?.data || gatheringResponse?.data || [];

      const toSendResponse = await settlementAPI.getMyToSend();
      const toSendSettlements = toSendResponse?.data?.data || toSendResponse?.data || [];

      const toReceiveResponse = await settlementAPI.getMyToReceive();
      const toReceiveSettlements = toReceiveResponse?.data?.data || toReceiveResponse?.data || [];

      const mergedSettlements = gatheringSettlements.map(settlement => {
        const toSendMatch = toSendSettlements.find(s => s.id === settlement.id);
        if (toSendMatch) {
          return {
            ...settlement,
            status: toSendMatch.status,
            toUserPaymentMethod: toSendMatch.toUserPaymentMethod,
            tossDeeplink: toSendMatch.tossDeeplink,
          };
        }
        const toReceiveMatch = toReceiveSettlements.find(s => s.id === settlement.id);
        if (toReceiveMatch) {
          return {
            ...settlement,
            status: toReceiveMatch.status,
            toUserPaymentMethod: toReceiveMatch.toUserPaymentMethod,
            tossDeeplink: toReceiveMatch.tossDeeplink,
          };
        }
        return settlement;
      });

      setSettlements(Array.isArray(mergedSettlements) ? mergedSettlements : []);
    } catch (error) {
      console.error('Failed to fetch settlements:', error);
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gatheringId) {
      fetchSettlements();
    }
  }, [gatheringId]);

  const handleBack = () => {
    setDown();
    navigate(-1);
  };

  const handleCompleteSettlement = async (settlementId) => {
    try {
      await settlementAPI.complete(settlementId);
      await fetchSettlements();
    } catch (error) {
      console.error('Failed to complete settlement:', error);
    }
  };

  const handleConfirmSettlement = async (settlementId) => {
    try {
      await settlementAPI.confirm(settlementId);
      await fetchSettlements();
    } catch (error) {
      console.error('Failed to confirm settlement:', error);
    }
  };

  return (
    <div className="page">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
            정산 현황
          </h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="page-content">
        {loading ? (
          <div className="flex justify-center py-12 text-gray-400 dark:text-gray-500">
            <span className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </span>
          </div>
        ) : settlements.length > 0 ? (
          <div className="space-y-4 pb-8">
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                총 {settlements.length}건
              </span>
            </div>

            <div className="px-4 space-y-2">
              {settlements.map((settlement) => (
                <SettlementItem
                  key={settlement.id}
                  settlement={settlement}
                  currentUser={user}
                  onComplete={handleCompleteSettlement}
                  onConfirm={handleConfirmSettlement}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500 dark:text-gray-400">
            <Calculator size={32} className="mx-auto mb-2 opacity-50" />
            <p>정산 내역이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettlementListPage;
