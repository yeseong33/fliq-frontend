import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User } from 'lucide-react';
import { useNavigationStore } from '../../store/navigationStore';

const Header = ({ title, showBack = false, showProfile = false, transparent = false }) => {
  const navigate = useNavigate();
  const { setBack } = useNavigationStore();

  const handleBack = () => {
    setBack(); // 뒤로가기 방향 설정
    navigate(-1);
  };

  return (
    <div className={`sticky top-0 z-50 transition-all duration-300 ${
      transparent
        ? 'bg-transparent'
        : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50'
    }`}>
      <div className="max-w-md mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={handleBack}
              aria-label="뒤로 가기"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 text-gray-900 dark:text-white"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          <h1 className="text-base font-medium text-gray-900 dark:text-white">{title}</h1>
        </div>

        <div className="flex items-center gap-2">
          {showProfile && (
            <button
              onClick={() => navigate('/profile')}
              aria-label="프로필"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200"
            >
              <User size={22} className="text-gray-600 dark:text-gray-300" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;
