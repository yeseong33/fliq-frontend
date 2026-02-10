let stream = null;
let recorder = null;
let lastChunkPromise = null;

export const audioRecorderService = {
  async requestPermission() {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: false,
        channelCount: 1,
        sampleRate: { ideal: 16000 },
      },
    });
    return stream;
  },

  startRecording(onChunk) {
    if (!stream) throw new Error('마이크 권한이 없습니다. requestPermission()을 먼저 호출하세요.');

    lastChunkPromise = null;

    recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm',
      audioBitsPerSecond: 128000,
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        lastChunkPromise = e.data.arrayBuffer().then((buf) => onChunk(buf));
      }
    };

    recorder.start(250);
    return recorder;
  },

  async stopRecording() {
    await new Promise((resolve) => {
      if (!recorder || recorder.state === 'inactive') {
        resolve();
        return;
      }
      recorder.onstop = () => resolve();
      recorder.stop();
    });
    // 마지막 청크 전송 완료까지 대기
    if (lastChunkPromise) {
      await lastChunkPromise;
      lastChunkPromise = null;
    }
  },

  releaseStream() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      stream = null;
    }
    recorder = null;
  },
};
