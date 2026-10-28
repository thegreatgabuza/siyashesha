import { Platform } from 'react-native';

// Web Speech API interfaces
interface SpeechRecognitionResult {
  readonly length: number;
  [index: number]: {
    readonly transcript: string;
    readonly confidence: number;
  };
  readonly isFinal: boolean;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

let activeRecognition: SpeechRecognitionInstance | null = null;

export function isSpeechRecognitionSupported(): boolean {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
  return true; // Native iOS & Android support via expo-audio + Gemini Speech AI
}

export function isWebSpeechSupported(): boolean {
  return Platform.OS === 'web' && typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function isNativeRecordingSupported(): boolean {
  return Platform.OS !== 'web';
}

export interface VoiceDictationOptions {
  lang?: string;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError?: (errorMessage: string) => void;
  onEnd?: () => void;
}

/**
 * Starts speech recognition on supported platforms (Web Speech API).
 * Returns a cancel/stop function.
 */
export function startVoiceDictation(options: VoiceDictationOptions): () => void {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    options.onError?.('Native voice typing is supported via the device microphone key on your keyboard.');
    return () => {};
  }

  const SpeechRecognitionConstructor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionConstructor) {
    options.onError?.('Speech recognition is not supported in this browser. Try Chrome or Safari.');
    return () => {};
  }

  try {
    if (activeRecognition) {
      activeRecognition.abort();
      activeRecognition = null;
    }

    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = options.lang ?? 'en-ZA';

    let finalTranscript = '';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const res = event.results[i];
        if (res && res[0]) {
          if (res.isFinal) {
            finalTranscript += `${res[0].transcript} `;
          } else {
            interimTranscript += res[0].transcript;
          }
        }
      }
      const fullText = (finalTranscript + interimTranscript).trim();
      options.onResult(fullText, interimTranscript.length === 0);
    };

    recognition.onerror = (err) => {
      if (err.error === 'no-speech') return;
      options.onError?.(`Microphone error: ${err.error}`);
    };

    recognition.onend = () => {
      activeRecognition = null;
      options.onEnd?.();
    };

    recognition.start();
    activeRecognition = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {
        // Ignore stop error
      }
      activeRecognition = null;
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    options.onError?.(message);
    return () => {};
  }
}

export function stopVoiceDictation(): void {
  if (activeRecognition) {
    try {
      activeRecognition.stop();
    } catch {
      // Ignore
    }
    activeRecognition = null;
  }
}

/** Pre-composed clinical prompts to help patients dictate structured thoughts */
export const CLINICAL_VOICE_TEMPLATES = [
  {
    title: 'Consultation Questions',
    text: 'Ask doctor at next visit: 1) Can we adjust my medication dosage? 2) Are the mild dizzy spells related? 3) When should I do my next blood test?',
  },
  {
    title: 'Symptom & Vitals Log',
    text: 'Felt lightheaded around 3 PM after lunch. Checked blood pressure: 128/82. Resting heart rate was 74 bpm. Drank a glass of water and rested for 15 minutes.',
  },
  {
    title: 'Medication Observations',
    text: 'Took morning Metformin with breakfast. No stomach discomfort today. Remembering to take doses on time since setting up phone reminders.',
  },
  {
    title: 'Lifestyle & Exercise',
    text: 'Completed a 30-minute brisk walk after supper. Energy levels were great and breathing felt steady throughout.',
  },
];
