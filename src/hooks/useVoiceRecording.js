import { useCallback, useRef } from 'react';
import { realtimeService } from '../services/realtimeService';
import { audioRecorderService } from '../services/audioRecorderService';
import { useVoiceStore, VOICE_STATE } from '../store/voiceStore';

export const useVoiceRecording = () => {
  const {
    state,
    transcript,
    result,
    error,
    savedExpenseId,
    setState,
    setTranscript,
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
        socket.off('transcript:final');
        socket.off('result');
        socket.off('saved');
        socket.off('error');

        socket.on('state', ({ state: s }) => setState(s));
        socket.on('transcript:final', ({ text }) => setTranscript(text));
        socket.on('result', (data) => setResult(data));
        socket.on('saved', ({ expenseId }) => {
          socket.off('state');
          setSavedExpenseId(expenseId);
        });
        socket.on('error', ({ message }) => setError(message));

        // 연결 대기
        await new Promise((resolve, reject) => {
          if (socket.connected) {
            resolve();
            return;
          }
          socket.once('connect', resolve);
          socket.once('connect_error', (err) => reject(new Error(err.message || '서버 연결 실패')));
        });

        // audio:start 전송
        socket.emit('audio:start', { gatheringId });

        // 녹음 시작 (청크 전송)
        audioRecorderService.startRecording((buf) => {
          socket.emit('audio:chunk', { chunk: buf });
        });

        setState(VOICE_STATE.LISTENING);
      } catch (err) {
        setError(err.message || '녹음 시작 실패');
        audioRecorderService.releaseStream();
        realtimeService.disconnect();
      }
    },
    [reset, setState, setTranscript, setResult, setError, setSavedExpenseId],
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
    result,
    error,
    savedExpenseId,
    startRecording,
    stopRecording,
    confirm,
    cancel,
  };
};
