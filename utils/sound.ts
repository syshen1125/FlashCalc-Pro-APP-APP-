
import { SoundType } from '../types';

let audioCtx: AudioContext | null = null;

export const initAudio = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const playBeep = (
  frequency: number = 1000, 
  duration: number = 0.08, 
  volume: number = 0.5,
  type: SoundType = SoundType.CLASSIC
) => {
  if (!audioCtx) initAudio();
  if (!audioCtx) return;

  try {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Map SoundType to OscillatorNode.type
    switch (type) {
      case SoundType.DIGITAL:
        oscillator.type = 'square';
        break;
      case SoundType.SOFT:
        oscillator.type = 'triangle';
        break;
      case SoundType.SHARP:
        oscillator.type = 'sawtooth';
        break;
      case SoundType.CLASSIC:
      default:
        oscillator.type = 'sine';
        break;
    }

    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    
    // Smooth attack and release to avoid clicking
    // Use the passed volume for the peak gain
    const now = audioCtx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);
    
    oscillator.start();
    oscillator.stop(now + duration + 0.05);
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

export const speakText = (text: string, volume: number) => {
  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.volume = volume;
  utterance.rate = 1.0;

  // Attempt to find a UK English voice
  const voices = window.speechSynthesis.getVoices();
  const ukVoice = voices.find(v => v.lang === 'en-GB' || v.name.includes('UK') || v.name.includes('Great Britain'));
  
  if (ukVoice) {
    utterance.voice = ukVoice;
  }

  window.speechSynthesis.speak(utterance);
};

export const stopSpeech = () => {
  window.speechSynthesis.cancel();
};
