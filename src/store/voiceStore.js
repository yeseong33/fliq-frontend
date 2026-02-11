import { create } from 'zustand';

export const VOICE_STATE = {
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  PARTIAL: 'PARTIAL',
  FINAL: 'FINAL',
  CONFIRMED: 'CONFIRMED',
};

export const useVoiceStore = create((set) => ({
  state: VOICE_STATE.IDLE,
  transcript: '',
  partialTranscript: '',
  result: null,
  error: null,
  savedExpenseId: null,

  setState: (state) => set({ state }),
  setTranscript: (transcript) => set({ transcript, partialTranscript: '' }),
  setPartialTranscript: (text) => set({ partialTranscript: text }),
  setResult: (result) => set({ result }),
  setError: (error) => set({ error, state: VOICE_STATE.IDLE }),
  setSavedExpenseId: (savedExpenseId) => set({ savedExpenseId, state: VOICE_STATE.CONFIRMED }),

  reset: () =>
    set({
      state: VOICE_STATE.IDLE,
      transcript: '',
      partialTranscript: '',
      result: null,
      error: null,
      savedExpenseId: null,
    }),
}));
