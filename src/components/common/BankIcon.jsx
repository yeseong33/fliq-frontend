import React, { useState } from 'react';

// 은행별 로고 경로 및 폴백 스타일
const BANK_LOGOS = {
  TOSS_BANK: {
    icon: '/logos/banks/TOSS.png',
    fallback: { bg: 'bg-[#0064FF]', text: 'text-white', label: '토스' },
  },
  KB: {
    icon: '/logos/banks/KB.png',
    fallback: { bg: 'bg-[#FFBC00]', text: 'text-[#5A3827]', label: '국민' },
  },
  SHINHAN: {
    icon: '/logos/banks/SHINHAN.png',
    fallback: { bg: 'bg-[#0046FF]', text: 'text-white', label: '신한' },
  },
  WOORI: {
    icon: '/logos/banks/WOORI.png',
    fallback: { bg: 'bg-[#0066B3]', text: 'text-white', label: '우리' },
  },
  HANA: {
    icon: '/logos/banks/HANA.png',
    fallback: { bg: 'bg-[#009490]', text: 'text-white', label: '하나' },
  },
  NH: {
    icon: '/logos/banks/NH.png',
    fallback: { bg: 'bg-[#02A54F]', text: 'text-white', label: '농협' },
  },
  IBK: {
    icon: '/logos/banks/IBK.png',
    fallback: { bg: 'bg-[#0066B3]', text: 'text-white', label: '기업' },
  },
  SC: {
    icon: null,
    fallback: { bg: 'bg-[#00AF50]', text: 'text-white', label: 'SC' },
  },
  CITI: {
    icon: null,
    fallback: { bg: 'bg-[#003B70]', text: 'text-white', label: '씨티' },
  },
  KAKAO_BANK: {
    icon: '/logos/banks/KAKAO_BANK.png',
    fallback: { bg: 'bg-[#FFEB00]', text: 'text-[#3C1E1E]', label: '카카오' },
  },
  K_BANK: {
    icon: '/logos/banks/K_BANK.png',
    fallback: { bg: 'bg-[#5B33F3]', text: 'text-white', label: '케이' },
  },
  BUSAN: {
    icon: null,
    fallback: { bg: 'bg-[#0066B3]', text: 'text-white', label: '부산' },
  },
  DAEGU: {
    icon: null,
    fallback: { bg: 'bg-[#0066CC]', text: 'text-white', label: '대구' },
  },
  KWANGJU: {
    icon: null,
    fallback: { bg: 'bg-[#007CC2]', text: 'text-white', label: '광주' },
  },
  JEONBUK: {
    icon: null,
    fallback: { bg: 'bg-[#009639]', text: 'text-white', label: '전북' },
  },
  JEJU: {
    icon: null,
    fallback: { bg: 'bg-[#FF6B00]', text: 'text-white', label: '제주' },
  },
  GYEONGNAM: {
    icon: null,
    fallback: { bg: 'bg-[#D50032]', text: 'text-white', label: '경남' },
  },
  SUHYUP: {
    icon: null,
    fallback: { bg: 'bg-[#007CC2]', text: 'text-white', label: '수협' },
  },
  SAEMAUL: {
    icon: null,
    fallback: { bg: 'bg-[#0066B3]', text: 'text-white', label: '새마을' },
  },
  SHINHYUP: {
    icon: null,
    fallback: { bg: 'bg-[#0066CC]', text: 'text-white', label: '신협' },
  },
  POST: {
    icon: null,
    fallback: { bg: 'bg-[#EF4123]', text: 'text-white', label: '우체국' },
  },
};

const DEFAULT_FALLBACK = { bg: 'bg-gray-500', text: 'text-white', label: '?' };

const BankIcon = ({ bankCode, size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const bank = BANK_LOGOS[bankCode];
  const fallback = bank?.fallback || DEFAULT_FALLBACK;
  const iconUrl = bank?.icon;

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

export default BankIcon;
