import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Share2, Download, Copy, RefreshCw } from 'lucide-react';
import toast from '../../utils/toast';
import logger from '../../utils/logger';
import { copyToClipboard, shareUrl, getRemainingTime } from '../../utils/helpers';
import { gatheringAPI } from '../../api';
import Button from '../common/Button';
import Modal from '../common/Modal';

const QRCodeDisplay = ({ isOpen, onClose, gathering, onRefresh }) => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [remainingTime, setRemainingTime] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (gathering?.qrCode) {
      generateQRCode(gathering.qrCode);
    }
  }, [gathering]);

  useEffect(() => {
    if (!gathering?.qrExpiresAt) return;

    const updateTimer = () => {
      const time = getRemainingTime(gathering.qrExpiresAt);
      setRemainingTime(time);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [gathering?.qrExpiresAt]);

  const generateQRCode = async (qrCode) => {
    try {
      const url = await QRCode.toDataURL(qrCode, {
        width: 256,
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
      title: `${gathering.title} - Fliq`,
      text: `${gathering.title} 모임에 참여하세요!`,
      url: `${window.location.origin}/join?qr=${gathering.qrCode}`
    };

    const success = await shareUrl(shareData.url, shareData.title);
    if (success) {
      toast.success('공유되었습니다.');
    }
  };

  const handleCopyQR = async () => {
    const success = await copyToClipboard(gathering.qrCode);
    if (success) {
      toast.success('QR 코드가 클립보드에 복사되었습니다.');
    }
  };

  const handleDownload = () => {
    if (!qrCodeUrl) return;

    const link = document.createElement('a');
    link.download = `${gathering.title}-QR코드.png`;
    link.href = qrCodeUrl;
    link.click();
    toast.success('QR 코드가 다운로드되었습니다.');
  };

  const isExpired = remainingTime === null;

  const handleRefreshQR = async () => {
    if (!gathering?.id) return;

    setRefreshing(true);
    try {
      const response = await gatheringAPI.refreshQR(gathering.id);
      const updatedGathering = response.data?.data || response.data;
      toast.success('QR 코드가 갱신되었습니다.');
      if (onRefresh) {
        onRefresh(updatedGathering);
      }
    } catch (error) {
      logger.error('QR 코드 갱신 실패:', error);
      toast.error('QR 코드 갱신에 실패했습니다.');
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="QR 코드">
      <div className="text-center">
        {qrCodeUrl && (
          <div className="bg-white p-4 rounded-lg border-2 border-gray-100 mb-4">
            <img 
              src={qrCodeUrl} 
              alt="QR Code" 
              className="w-full max-w-64 mx-auto"
            />
          </div>
        )}

        <div className="mb-4">
          {remainingTime && !isExpired ? (
            <div className="text-sm text-gray-600">
              <p>남은 시간: {remainingTime.minutes}분 {remainingTime.seconds}초</p>
              <p className="text-xs mt-1">QR 코드는 5분 후 만료됩니다</p>
            </div>
          ) : (
            <div className="text-sm text-red-500">
              <p>QR 코드가 만료되었습니다</p>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRefreshQR}
                loading={refreshing}
                className="mt-2 flex items-center justify-center gap-2 mx-auto"
              >
                <RefreshCw size={14} />
                QR 코드 갱신
              </Button>
            </div>
          )}
        </div>

        {!isExpired && (
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="secondary" 
              onClick={handleShare}
              className="flex items-center justify-center gap-2"
            >
              <Share2 size={16} />
              공유
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={handleDownload}
              className="flex items-center justify-center gap-2"
            >
              <Download size={16} />
              저장
            </Button>
          </div>
        )}

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            참여자는 QR 코드를 스캔하거나 코드를 직접 입력할 수 있습니다
          </p>
          <div className="flex items-center gap-2 mt-2">
            <code className="flex-1 text-xs bg-white p-2 rounded border">
              {gathering?.qrCode}
            </code>
            <button 
              onClick={handleCopyQR}
              className="p-2 hover:bg-gray-200 rounded"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default QRCodeDisplay;