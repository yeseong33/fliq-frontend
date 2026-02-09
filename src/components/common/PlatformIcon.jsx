import React, { useState } from 'react';

// 플랫폼별 로고 경로 및 폴백 스타일
const PLATFORM_LOGOS = {
  TOSS: {
    icon: '/logos/platforms/TOSS.png',
    fallback: { bg: 'bg-[#0064FF]', text: 'text-white', label: '토스' },
  },
  KAKAO_PAY: {
    icon: '/logos/platforms/KAKAO_PAY.png',
    fallback: { bg: 'bg-[#FFEB00]', text: 'text-[#3C1E1E]', label: '카카오' },
  },
  NAVER_PAY: {
    icon: '/logos/platforms/NAVER_PAY.png',
    fallback: { bg: 'bg-[#03C75A]', text: 'text-white', label: '네이버' },
  },
};

const DEFAULT_FALLBACK = { bg: 'bg-gray-500', text: 'text-white', label: '?' };

const PlatformIcon = ({ platform, size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const platformData = PLATFORM_LOGOS[platform];
  const fallback = platformData?.fallback || DEFAULT_FALLBACK;
  const iconUrl = platformData?.icon;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const textSizeClasses = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
  };

  // 이미지가 있고 에러가 없으면 이미지 표시
  if (iconUrl && !imageError) {
    return (
      <img
        src={iconUrl}
        alt={fallback.label}
        onError={() => setImageError(true)}
        className={`${sizeClasses[size]} rounded-xl object-cover ${className}`}
      />
    );
  }

  // 이미지가 없거나 에러 시 폴백 표시
  return (
    <div
      className={`
        ${sizeClasses[size]}
        ${textSizeClasses[size]}
        ${fallback.bg}
        ${fallback.text}
        rounded-xl flex items-center justify-center font-bold
        ${className}
      `}
    >
      {fallback.label.slice(0, 2)}
    </div>
  );
};

export default PlatformIcon;
