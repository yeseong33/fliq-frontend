import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, LogOut, ChevronRight, Sun, Moon, CreditCard, UserX } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { userAPI } from '../api/user';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Input from '../components/common/Input';
import toast from '../utils/toast';
import usePullToRefresh from '../hooks/usePullToRefresh';
import PullToRefresh from '../components/common/PullToRefresh';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleRefresh = useCallback(async () => {
    // 프로필 페이지는 로컬 상태만 사용하므로 짧은 딜레이로 새로고침 느낌
    await new Promise(r => setTimeout(r, 300));
  }, []);

  const { state: pullState, pullDistance } = usePullToRefresh(handleRefresh);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      await userAPI.deleteMe();
      toast.success('회원 탈퇴가 완료되었습니다.');
      logout();
      navigate('/auth', { replace: true });
    } catch (error) {
      toast.error(error.message || '회원 탈퇴에 실패했습니다.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleNameUpdate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error('이름을 입력해주세요.');
      return;
    }
    if (trimmed.length > 50) {
      toast.error('이름은 50자 이내로 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await userAPI.updateMe({ name: trimmed });
      const updatedUser = res.data?.data || res.data;
      // 스토어 및 sessionStorage 업데이트
      useAuthStore.setState({ user: { ...user, name: updatedUser.name || trimmed } });
      sessionStorage.setItem('user', JSON.stringify({ ...user, name: updatedUser.name || trimmed }));
      toast.success('이름이 변경되었습니다.');
      setShowNameEdit(false);
    } catch (error) {
      toast.error(error.message || '이름 변경에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <PullToRefresh state={pullState} pullDistance={pullDistance}>
      <div className="page-content">
        {/* 타이틀 */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          마이
        </h1>

        {/* 프로필 카드 */}
        <div className="card mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25">
              <User size={32} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {user?.name || '사용자'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
          </div>

          {/* 정보 목록 */}
          <div className="space-y-1">
            <button
              onClick={() => {
                setNewName(user?.name || '');
                setShowNameEdit(true);
              }}
              className="w-full flex items-center justify-between p-4 -mx-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                  <User size={20} className="text-gray-500 dark:text-gray-400" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-500 dark:text-gray-400">이름</div>
                  <div className="font-medium text-gray-900 dark:text-white">{user?.name || '-'}</div>
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </button>

            <div className="flex items-center p-4 -mx-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center shrink-0">
                  <Mail size={20} className="text-gray-500 dark:text-gray-400" />
                </div>
                <div className="text-left min-w-0">
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    이메일
                    <span className="text-gray-400 dark:text-gray-500">· 변경 불가</span>
                  </div>
                  <div className="font-medium text-gray-900 dark:text-white truncate">{user?.email || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 결제 수단 */}
        <div className="card mb-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">결제</h3>
          <button
            onClick={() => navigate('/payment-methods')}
            className="w-full flex items-center justify-between p-4 -mx-2 -my-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/25">
                <CreditCard size={20} className="text-white" />
              </div>
              <div className="text-left">
                <span className="font-medium text-gray-900 dark:text-white">계좌 설정</span>
                <p className="text-sm text-gray-500 dark:text-gray-400">정산받을 계좌를 등록하세요</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>

        {/* 설정 */}
        <div className="card mb-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">설정</h3>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-4 -mx-2 -my-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isDark
                  ? 'bg-indigo-500 shadow-lg shadow-indigo-500/25'
                  : 'bg-amber-500 shadow-lg shadow-amber-500/25'
              }`}>
                {isDark ? (
                  <Moon size={20} className="text-white" />
                ) : (
                  <Sun size={20} className="text-white" />
                )}
              </div>
              <span className="font-medium text-gray-900 dark:text-white">다크 모드</span>
            </div>
            <div className={`w-12 h-7 rounded-full transition-colors duration-300 ${isDark ? 'bg-blue-500' : 'bg-gray-300'}`}>
              <div className={`w-6 h-6 bg-white rounded-full shadow transform transition-transform duration-300 mt-0.5 ${isDark ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
            </div>
          </button>
        </div>

        {/* 로그아웃 */}
        <div className="card mb-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 p-4 -mx-2 -my-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all duration-200"
          >
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center">
              <LogOut size={20} />
            </div>
            <span className="font-medium">로그아웃</span>
          </button>
        </div>

        {/* 회원 탈퇴 */}
        <div className="card">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center gap-3 p-4 -mx-2 -my-2 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl transition-all duration-200"
          >
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
              <UserX size={20} />
            </div>
            <span className="font-medium">회원 탈퇴</span>
          </button>
        </div>
      </div>
      </PullToRefresh>

      {/* 이름 수정 모달 */}
      <Modal
        isOpen={showNameEdit}
        onClose={() => setShowNameEdit(false)}
        title="이름 변경"
      >
        <div className="space-y-4">
          <Input
            label="새 이름"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="이름을 입력하세요"
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowNameEdit(false)}
            >
              취소
            </Button>
            <Button
              fullWidth
              onClick={handleNameUpdate}
              loading={loading}
            >
              저장
            </Button>
          </div>
        </div>
      </Modal>

      {/* 회원 탈퇴 확인 모달 */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="회원 탈퇴"
      >
        <div className="space-y-6">
          <div className="text-center py-4">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/25">
              <UserX size={36} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              정말 탈퇴하시겠습니까?
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              탈퇴 시 계좌 정보와 로그인 정보가 삭제됩니다.<br />
              모임 및 정산 기록은 익명화되어 보존됩니다.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleteLoading}
            >
              취소
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleDeleteAccount}
              loading={deleteLoading}
            >
              탈퇴하기
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;
