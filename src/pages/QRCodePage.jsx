import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2, Download, Copy, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';
import toast from 'react-hot-toast';
import logger from '../utils/logger';
import { useGathering } from '../hooks/useGathering';
import { useNavigationStore } from '../store/navigationStore';
import { copyToClipboard, shareUrl, getRemainingTime } from '../utils/helpers';
import { gatheringAPI } from '../api';
import Button from '../components/common/Button';

const QRCodePage = () => {
  const { id: gatheringId } = useParams();
  const navigate = useNavigate();
  const { setDown } = useNavigationStore();
  const { currentGathering, getGathering } = useGathering();
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [remainingTime, setRemainingTime] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // 모임 정보 로드
  useEffect(() => {
    if (gatheringId && (!currentGathering || String(currentGathering.id) !== String(gatheringId))) {
      getGathering(gatheringId);
    }
  }, [gatheringId, currentGathering?.id]);

  // QR 코드 생성
  useEffect(() => {
    if (currentGathering?.qrCode) {
      generateQRCode(currentGathering.qrCode);
    }
  }, [currentGathering?.qrCode]);

  // 타이머 업데이트
  useEffect(() => {
    if (!currentGathering?.qrExpiresAt) return;

    const updateTimer = () => {
      const time = getRemainingTime(currentGathering.qrExpiresAt);
      setRemainingTime(time);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [currentGathering?.qrExpiresAt]);

  const handleBack = () => {
    setDown();
    navigate(`/gathering/${gatheringId}`);
  };

  const generateQRCode = async (qrCode) => {
    try {
      const url = await QRCode.toDataURL(qrCode, {
        width: 280,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(url);
    } catch (error) {
      logger.error('QR 코드 생성 실패:', error);
      toast.error('QR 코드 생성에 실패했습니다.');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${currentGathering.title} - Fliq`,
      text: `${currentGathering.title} 모임에 참여하세요!`,
      url: `${window.location.origin}/join?qr=${encodeURIComponent(currentGathering.qrCode)}`
    };

    const success = await shareUrl(shareData.url, shareData.title);
    if (success) {
      toast.success('공유되었습니다.');
    }
  };

  const handleCopyQR = async () => {
    const success = await copyToClipboard(currentGathering.qrCode);
    if (success) {
      toast.success('QR 코드가 복사되었습니다.');
    }
  };

  const handleDownload = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `${currentGathering.title}-QR코드.png`;
    link.href = qrCodeUrl;
    link.click();
    toast.success('QR 코드가 다운로드되었습니다.');
  };

  const handleRefreshQR = async () => {
    if (!currentGathering?.id) return;

    setRefreshing(true);
    try {
      const response = await gatheringAPI.refreshQR(currentGathering.id);
      const updatedGathering = response.data?.data || response.data;
      toast.success('QR 코드가 갱신되었습니다.');
      // 모임 정보 다시 로드
      await getGathering(gatheringId);
    } catch (error) {
      logger.error('QR 코드 갱신 실패:', error);
      toast.error('QR 코드 갱신에 실패했습니다.');
    } finally {
      setRefreshing(false);
    }
  };

  const isExpired = remainingTime === null;

  // 로딩 중
  if (!currentGathering || String(currentGathering.id) !== String(gatheringId)) {
    return (
      <div className="page">
        <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              QR 코드
            </h1>
            <div className="w-10" />
          </div>
        </div>
        <div className="flex justify-center py-12 text-gray-400 dark:text-gray-500">
          <span className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
      </div>
    );
  }

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
            QR 코드
          </h1>
          <div className="w-10" />
        </div>
      </div>

      <div className="page-content">
        <div className="flex flex-col items-center py-6">
          {/* 모임 제목 */}
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            {currentGathering.title}
          </h2>

          {/* QR 코드 */}
          {qrCodeUrl && (
            <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-64 h-64"
              />
            </div>
          )}

          {/* 타이머 / 만료 */}
          <div className="mb-6 text-center">
            {remainingTime && !isExpired ? (
              <div className="text-gray-600 dark:text-gray-400">
                <p className="text-lg font-medium">
                  {remainingTime.minutes}분 {remainingTime.seconds}초
                </p>
                <p className="text-sm mt-1">후 만료됩니다</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-red-500 font-medium mb-3">QR 코드가 만료되었습니다</p>
                <Button
                  onClick={handleRefreshQR}
                  loading={refreshing}
                  className="flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} />
                  QR 코드 갱신
                </Button>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          {!isExpired && (
            <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-6">
              <Button
                variant="secondary"
                onClick={handleShare}
                className="flex items-center justify-center gap-2"
              >
                <Share2 size={18} />
                공유
              </Button>

              <Button
                variant="secondary"
                onClick={handleDownload}
                className="flex items-center justify-center gap-2"
              >
                <Download size={18} />
                저장
              </Button>
            </div>
          )}

          {/* 코드 복사 */}
          <div className="w-full max-w-xs p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 text-center">
              참여 코드
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-center text-lg font-mono bg-white dark:bg-gray-700 p-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
                {currentGathering.qrCode}
              </code>
              <button
                onClick={handleCopyQR}
                className="p-3 bg-white dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-xl border border-gray-200 dark:border-gray-600 transition-colors"
              >
                <Copy size={18} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodePage;
