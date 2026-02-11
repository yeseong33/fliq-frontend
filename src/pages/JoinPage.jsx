import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Camera, Keyboard } from 'lucide-react';
import toast from '../utils/toast';
import logger from '../utils/logger';
import { useGathering } from '../hooks/useGathering';
import { GATHERING_ERROR_CODES } from '../utils/errorCodes';
import Button from '../components/common/Button';

const JoinPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { joinGathering, loading } = useGathering();
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [autoJoining, setAutoJoining] = useState(!!searchParams.get('qr'));
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const autoJoinAttempted = useRef(false);

  // URL의 ?qr= 파라미터로 자동 조인
  useEffect(() => {
    const qrCode = searchParams.get('qr');
    if (!qrCode || autoJoinAttempted.current) return;
    autoJoinAttempted.current = true;

    (async () => {
      try {
        const gathering = await joinGathering(qrCode.trim());
        toast.success('모임에 참여했습니다!');
        navigate(`/gathering/${gathering.id}`, { replace: true });
      } catch (error) {
        if (error.code === GATHERING_ERROR_CODES.PAYMENT_METHOD_REQUIRED) {
          toast.error('계좌를 먼저 등록해주세요');
          navigate('/payment-methods/add');
          return;
        }
        toast.error(error.message);
        setAutoJoining(false);
      }
    })();
  }, [searchParams, joinGathering, navigate]);

  useEffect(() => {
    if (autoJoining) return;
    if (!showManualInput) {
      startCamera();
    }

    return () => {
      stopCamera();
    };
  }, [showManualInput, autoJoining]);

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
      }
      setCameraError('');
    } catch (error) {
      logger.error('카메라 접근 실패:', error);
      setCameraError('카메라에 접근할 수 없습니다');
      setShowManualInput(true);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleJoinWithCode = async (qrCode) => {
    if (!qrCode.trim()) {
      toast.error('QR 코드를 입력해주세요');
      return;
    }

    try {
      const gathering = await joinGathering(qrCode.trim());
      toast.success('모임에 참여했습니다!');
      navigate(`/gathering/${gathering.id}`);
    } catch (error) {
      if (error.code === GATHERING_ERROR_CODES.PAYMENT_METHOD_REQUIRED) {
        toast.error('계좌를 먼저 등록해주세요');
        navigate('/payment-methods/add');
        return;
      }
      toast.error(error.message);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    handleJoinWithCode(manualCode);
  };

  if (autoJoining) {
    return (
      <div className="page">
        <div className="page-content flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-white">
            모임에 참여하는 중...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-content">
        {/* 타이틀 */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            모임 참여
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            QR 코드를 스캔하거나 코드를 입력하세요
          </p>
        </div>

        {!showManualInput ? (
          <>
            {/* 카메라 뷰 */}
            <div className="relative bg-black rounded-3xl overflow-hidden aspect-square max-w-sm mx-auto">
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
                <div className="w-56 h-56 relative">
                  {/* 코너 마커 */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                </div>
              </div>
            </div>

            {/* 수동 입력 버튼 */}
            <button
              onClick={() => {
                stopCamera();
                setShowManualInput(true);
              }}
              className="flex items-center justify-center gap-2 w-full mt-6 py-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Keyboard size={20} />
              <span>코드 직접 입력</span>
            </button>
          </>
        ) : (
          <>
            {/* 수동 입력 폼 */}
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  참여 코드
                </label>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="QR 코드 또는 참여 코드 입력"
                  className="w-full px-4 py-4 text-lg rounded-2xl border-2 border-gray-200 dark:border-gray-700
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                    placeholder-gray-400 dark:placeholder-gray-500
                    focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10
                    transition-all duration-200"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                fullWidth
                size="lg"
                loading={loading}
              >
                참여하기
              </Button>
            </form>

            {/* 카메라로 전환 */}
            <button
              onClick={() => setShowManualInput(false)}
              className="flex items-center justify-center gap-2 w-full mt-4 py-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <Camera size={20} />
              <span>카메라로 스캔</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default JoinPage;
