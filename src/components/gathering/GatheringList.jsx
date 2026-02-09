import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CreditCard, Calendar } from 'lucide-react';
import { formatCurrency, formatSmartDate, getStatusColor } from '../../utils/helpers';
import { GATHERING_STATUS } from '../../utils/constants';

const GatheringList = ({ gatherings, loading }) => {
  const navigate = useNavigate();

  const handleGatheringClick = (gathering) => {
    navigate(`/gathering/${gathering.id}`);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case GATHERING_STATUS.ACTIVE:
        return { emoji: '👥', text: '모집중' };
      case GATHERING_STATUS.PAYMENT_REQUESTED:
        return { emoji: '💰', text: '정산중' };
      case GATHERING_STATUS.COMPLETED:
        return { emoji: '✅', text: '완료' };
      case GATHERING_STATUS.CLOSED:
        return { emoji: '🔒', text: '종료' };
      default:
        return { emoji: '📋', text: status };
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-lg w-3/4 mb-3"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded-lg w-2/3"></div>
              </div>
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-full ml-4"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (gatherings.length === 0) {
    return (
      <div className="card text-center py-16">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <Users size={36} className="text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">모임이 없습니다</h3>
        <p className="text-gray-500 dark:text-gray-400">새로운 모임을 만들어보세요</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {gatherings.map((gathering) => {
        const status = getStatusLabel(gathering.status);
        const startInfo = formatSmartDate(gathering.startAt);
        const endInfo = formatSmartDate(gathering.endAt);

        return (
          <div
            key={gathering.id}
            className="card cursor-pointer hover:scale-[1.02] transition-all duration-300"
            onClick={() => handleGatheringClick(gathering)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate mb-1">
                  {gathering.title}
                </h3>
                {gathering.description && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2">
                    {gathering.description}
                  </p>
                )}
              </div>

              {gathering.status !== GATHERING_STATUS.ACTIVE && (
                <span className={`flex-shrink-0 ml-4 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(gathering.status)}`}>
                  {status.emoji} {status.text}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                  <Users size={16} className="text-gray-400" />
                  <span>{gathering.participantCount ?? gathering.participants?.length ?? 0}명</span>
                </div>

                {gathering.totalAmount && (
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                    <CreditCard size={16} className="text-gray-400" />
                    <span className="font-medium">{formatCurrency(gathering.amountPerPerson)}</span>
                  </div>
                )}
              </div>

              {startInfo && (
                <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl">
                  <Calendar size={14} className="text-blue-500 dark:text-blue-400" />
                  <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                    {startInfo.month}/{startInfo.day}
                    {endInfo && (endInfo.month !== startInfo.month || endInfo.day !== startInfo.day) &&
                      ` - ${endInfo.month}/${endInfo.day}`
                    }
                  </span>
                </div>
              )}
            </div>

            {gathering.owner && (
              <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  방장: {gathering.owner.name}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GatheringList;
