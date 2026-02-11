import React, { useState, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { Camera, X } from 'lucide-react';
import toast from '../../utils/toast';
import logger from '../../utils/logger';
import { useGathering } from '../../hooks/useGathering';
import { GATHERING_ERROR_CODES } from '../../utils/errorCodes';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';

const QRCodeScanner = ({ isOpen, onClose, onSuccess, onPaymentMethodRequired }) => {
  const { joinGathering, loading } = useGathering();
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationRef = useRef(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    if (isOpen && !showManualInput) {
      startCamera();
    }

    return () => {
      stopScanning();
      stopCamera();
    };
  }, [isOpen, showManualInput]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          startScanning();
        };
      }
      setCameraError('');
    } catch (error) {
      logger.error('카메라 접근 실패:', error);
      setCameraError('카메라에 접근할 수 없습니다. 직접 코드를 입력해주세요.');
      setShowManualInput(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startScanning = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const scan = () => {
      if (!video.videoWidth || !video.videoHeight || isProcessingRef.current) {
        animationRef.current = requestAnimationFrame(scan);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      if (code && code.data) {
        isProcessingRef.current = true;
        stopScanning();
        handleJoinWithCode(code.data);
        return;
      }

      animationRef.current = requestAnimationFrame(scan);
    };

    animationRef.current = requestAnimationFrame(scan);
  }, []);

  const stopScanning = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  };

  const handleJoinWithCode = async (qrCode) => {
    if (!qrCode.trim()) {
      toast.error('QR 코드를 입력해주세요.');
      isProcessingRef.current = false;
      return;
    }

    try {
      const gathering = await joinGathering(qrCode.trim());
      toast.success('모임에 참여했습니다.');
      onSuccess(gathering);
      handleClose();
    } catch (error) {
      if (error.code === GATHERING_ERROR_CODES.PAYMENT_METHOD_REQUIRED) {
        handleClose();
        onPaymentMethodRequired?.();
        return;
      }
      toast.error(error.message);
      // 실패 시 다시 스캔 재개
      isProcessingRef.current = false;
      if (!showManualInput && streamRef.current) {
        startScanning();
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    handleJoinWithCode(manualCode);
  };

  const handleClose = () => {
    stopScanning();
    stopCamera();
    setManualCode('');
    setShowManualInput(false);
    setCameraError('');
    isProcessingRef.current = false;
    onClose();
  };

  const toggleInputMethod = () => {
    if (showManualInput) {
      setShowManualInput(false);
      startCamera();
    } else {
      stopScanning();
      stopCamera();
      setShowManualInput(true);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="모임 참여">
      <div className="space-y-4">
        {/* QR 디코딩용 숨김 캔버스 */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {!showManualInput ? (
          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
              {cameraError ? (
                <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
                  <div>
                    <Camera size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{cameraError}</p>
                  </div>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}

              {/* QR 스캔 가이드 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-white rounded-lg relative">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-red-500 rounded-tl"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-red-500 rounded-tr"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-red-500 rounded-bl"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-red-500 rounded-br"></div>
                </div>
              </div>
            </div>

            <p className="text-center text-sm text-gray-600 dark:text-gray-300">
              QR 코드를 프레임 안에 맞춰주세요
            </p>
          </div>
        ) : (
          <form onSubmit={handleManualSubmit}>
            <Input
              label="QR 코드 직접 입력"
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="QR 코드를 입력하세요"
              required
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
              className="mt-4"
            >
              참여하기
            </Button>
          </form>
        )}

        <Button
          variant="outline"
          fullWidth
          onClick={toggleInputMethod}
          className="bg-gray-100 dark:bg-gray-700"
        >
          {showManualInput ? '카메라로 스캔' : '직접 입력'}
        </Button>
      </div>
    </Modal>
  );
};

export default QRCodeScanner;
