import { useCallback, useRef } from 'react';
import { realtimeService } from '../services/realtimeService';
import { audioRecorderService } from '../services/audioRecorderService';
import { useVoiceStore, VOICE_STATE } from '../store/voiceStore';
import { VOICE_ERROR_MESSAGES } from '../utils/errorCodes';

export const useVoiceRecording = () => {
  const {
    state,
    transcript,
    partialTranscript,
    result,
    error,
    savedExpenseId,
    setState,
    setTranscript,
    setPartialTranscript,
    setResult,
    setError,
    setSavedExpenseId,
    reset,
  } = useVoiceStore();

  const requestIdRef = useRef(null);

  const startRecording = useCallback(
    async (gatheringId) => {
      try {
        reset();

        await audioRecorderService.requestPermission();

        const socket = realtimeService.connect();

        // 이벤트 리스너 등록
        socket.off('state');
        socket.off('transcript:partial');
        socket.off('transcript:final');
        socket.off('result');
        socket.off('saved');
        socket.off('error');

        socket.on('state', ({ state: s }) => setState(s));
        socket.on('transcript:partial', ({ text }) => setPartialTranscript(text));
        socket.on('transcript:final', ({ text }) => setTranscript(text));
        socket.on('result', (data) => setResult(data));
        socket.on('saved', ({ expenseId }) => {
          socket.off('state');
          setSavedExpenseId(expenseId);
        });
        socket.on('error', ({ code, message }) => {
          setError(VOICE_ERROR_MESSAGES[code] || message);
        });

        // 연결 대기
        await new Promise((resolve, reject) => {
          if (socket.connected) {
            resolve();
            return;
          }
          socket.once('connect', resolve);
          socket.once('connect_error', (err) => reject(new Error(err.message || '서버 연결 실패')));
        });

        // audio:start 전송 (gatheringId는 정수 필수, mimeType으로 서버에 포맷 전달)
        socket.emit('audio:start', {
          gatheringId: Number(gatheringId),
          mimeType: audioRecorderService.getMimeType() || undefined,
        });

        // 서버가 권한 확인 후 LISTENING 상태를 보내면 녹음 시작
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('서버 응답 시간 초과')), 10000);
          const onState = ({ state: s }) => {
            if (s === VOICE_STATE.LISTENING) {
              clearTimeout(timeout);
              socket.off('state', onState);
              resolve();
            }
          };
          const onError = ({ code, message }) => {
            clearTimeout(timeout);
            socket.off('state', onState);
            reject(new Error(VOICE_ERROR_MESSAGES[code] || message));
          };
          socket.on('state', onState);
          socket.once('error', onError);
        });

        // 녹음 시작 (청크 전송)
        audioRecorderService.startRecording((buf) => {
          socket.emit('audio:chunk', { chunk: buf });
        });
      } catch (err) {
        setError(err.message || '녹음 시작 실패');
        audioRecorderService.releaseStream();
        realtimeService.disconnect();
      }
    },
    [reset, setState, setTranscript, setPartialTranscript, setResult, setError, setSavedExpenseId],
  );

  const stopRecording = useCallback(async () => {
    setState(VOICE_STATE.PARTIAL);
    await audioRecorderService.stopRecording();

    requestIdRef.current = crypto.randomUUID();
    const socket = realtimeService.getSocket();
    if (socket?.connected) {
      socket.emit('audio:end', { requestId: requestIdRef.current });
    }

    audioRecorderService.releaseStream();
  }, [setState]);

  const confirm = useCallback(
    (data) => {
      const socket = realtimeService.getSocket();
      if (socket?.connected) {
        // data는 단일 객체 또는 배열 모두 가능
        socket.emit('confirm', {
          requestId: requestIdRef.current,
          data,
        });
      }
    },
    [],
  );

  const cancel = useCallback(() => {
    const socket = realtimeService.getSocket();
    if (socket?.connected) {
      socket.emit('cancel');
    }
    audioRecorderService.stopRecording().then(() => audioRecorderService.releaseStream());
    realtimeService.disconnect();
    reset();
  }, [reset]);

  return {
    state,
    transcript,
    partialTranscript,
    result,
    error,
    savedExpenseId,
    startRecording,
    stopRecording,
    confirm,
    cancel,
  };
};
