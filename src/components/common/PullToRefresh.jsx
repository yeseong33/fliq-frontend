import React from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';

const THRESHOLD = 70;

const PullToRefresh = ({ state, pullDistance, children }) => {
  const isActive = state !== 'idle';
  const isRefreshing = state === 'refreshing';
  const isReady = state === 'ready';
  const isCompleting = state === 'completing';
  const progress = Math.min(pullDistance / THRESHOLD, 1);

  return (
    <div className="relative">
      {/* 인디케이터 */}
      <div
        role={isRefreshing ? 'status' : undefined}
        aria-label={isRefreshing ? '새로고침 중' : undefined}
        className="flex items-center justify-center overflow-hidden"
        style={{
          height: isActive ? (isRefreshing ? 52 : isCompleting ? 0 : pullDistance * 0.55) : 0,
          transition: state === 'pulling' || state === 'ready'
            ? 'none'
            : 'height 0.35s cubic-bezier(0.2, 0, 0, 1)',
        }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            opacity: isRefreshing || isCompleting ? 1 : progress,
            transform: `scale(${isRefreshing ? 1 : 0.5 + progress * 0.5})`,
            transition: isRefreshing
              ? 'transform 0.3s ease'
              : 'none',
          }}
        >
          <div
            className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg
              ${isReady
                ? 'bg-blue-500 shadow-blue-500/30'
                : isRefreshing
                  ? 'bg-blue-500 shadow-blue-500/30'
                  : 'bg-white dark:bg-gray-800 shadow-gray-300/40 dark:shadow-black/30'
              }`}
            style={{
              transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
            }}
          >
            {isRefreshing ? (
              <RefreshCw
                size={17}
                className="text-white animate-spin"
                style={{ animationDuration: '0.8s' }}
              />
            ) : (
              <ArrowDown
                size={17}
                className={`transition-all duration-200 ${
                  isReady ? 'text-white rotate-180' : 'text-gray-400 dark:text-gray-500'
                }`}
                style={{
                  transform: isReady
                    ? 'rotate(180deg)'
                    : `rotate(${progress * 180}deg)`,
                }}
              />
            )}
          </div>
        </div>
      </div>
      {children}
    </div>
  );
};

export default PullToRefresh;
