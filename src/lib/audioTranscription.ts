import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { invokeGeminiGenerateContent, isGeminiConfigured } from '@/lib/geminiProxy';
import { useAppStore } from '@/store/useAppStore';

const STALLED_MODELS = new Set([
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-transcribe',
  'gemini-flash-latest',
]);

const TRANSCRIPTION_MODELS = [
  process.env.EXPO_PUBLIC_GEMINI_MODEL,
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite-preview',
].filter((m): m is string => typeof m === 'string' && m.length > 0 && !STALLED_MODELS.has(m));

/**
 * Normalizes audio MIME types to those supported by Google Gemini inlineData:
 * audio/wav, audio/mp3, audio/aiff, audio/aac, audio/ogg, audio/flac, audio/mp4, audio/x-m4a.
 * Note: 'audio/m4a' and 'audio/webm' are rejected by the Gemini API and must be mapped to
 * 'audio/mp4' and 'audio/ogg' respectively.
 */
function normalizeGeminiAudioMime(rawMimeOrUri: string): string {
  const clean = rawMimeOrUri.toLowerCase().split(';')[0].trim();

  if (clean.includes('wav')) return 'audio/wav';
  if (clean.includes('mp3') || clean.includes('mpeg')) return 'audio/mp3';
  if (clean.includes('flac')) return 'audio/flac';
  if (clean.includes('aiff')) return 'audio/aiff';
  if (clean.includes('ogg') || clean.includes('webm') || clean.includes('opus')) return 'audio/ogg';
  if (clean.includes('aac') || clean.includes('3gp')) return 'audio/aac';
  if (clean.includes('m4a') || clean.includes('mp4')) return 'audio/mp4';

  return 'audio/mp4';
}

/** Converts local file URI to base64 string and resolves a Gemini-compatible MIME type */
async function readAudioAsBase64(uri: string): Promise<{ base64Data: string; mimeType: string }> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    const mimeType = normalizeGeminiAudioMime(blob.type || uri);
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return { base64Data, mimeType };
  }

  // Ensure file:// prefix on native paths if missing
  const normalizedUri =
    uri.startsWith('file://') || uri.startsWith('content://') ? uri : `file://${uri}`;

  const base64Data = await FileSystem.readAsStringAsync(normalizedUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  return {
    base64Data,
    mimeType: normalizeGeminiAudioMime(normalizedUri),
  };
}

/**
 * Extracts transcript text from Gemini API response candidate parts.
 * Handles both `part.audioTranscription.text` (from `gemini-3.5-transcribe`)
 * and standard `part.text` (from `gemini-3.5-flash` / multimodal models).
 */
function extractTranscriptFromResponse(json: any): string | null {
  const parts = json?.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) return null;

  for (const part of parts) {
    if (typeof part?.audioTranscription?.text === 'string' && part.audioTranscription.text.trim()) {
      return part.audioTranscription.text.trim();
    }
    if (typeof part?.text === 'string' && part.text.trim()) {
      return part.text.trim();
    }
  }
  return null;
}

/**
 * Transcribes recorded speech using Google Gemini's multimodal audio API.
 * Supports multilingual South African languages (English, isiZulu, Afrikaans).
 */
export async function transcribeAudioWithGemini(
  audioUri: string,
  preferredLanguage: string = 'en-ZA'
): Promise<string> {
  if (!useAppStore.getState().aiConsentGranted) {
    throw new Error('Explicit AI consent is required before sending voice audio to Google Gemini.');
  }
  if (!isGeminiConfigured()) {
    throw new Error('Google Gemini AI service is not configured.');
  }

  const { base64Data, mimeType } = await readAudioAsBase64(audioUri);
  if (!base64Data) {
    throw new Error('Recorded audio file was empty.');
  }

  const languagePrompt =
    preferredLanguage.startsWith('zu')
      ? 'The patient may be speaking isiZulu or code-switching with South African English.'
      : preferredLanguage.startsWith('af')
      ? 'The patient may be speaking Afrikaans or bilingual English/Afrikaans.'
      : 'The patient is speaking English (South African context).';

  const prompt = `You are a medical speech-to-text dictation transcriber for the Siyashesha Health Passport app.
${languagePrompt}
Listen to the patient's voice note carefully.
Transcribe the verbatim spoken words cleanly and accurately into text.
Preserve medication names, clinical terms, symptoms, and numbers exactly as spoken.
Do NOT output any markdown commentary, timestamps, or conversational responses. Return ONLY the verbatim transcript text.`;

  // Deduplicate model list
  const modelsToTry = Array.from(new Set(TRANSCRIPTION_MODELS));
  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 800,
      thinkingConfig: {
        thinkingBudget: 0,
      },
    },
  };

  try {
    const { json } = await invokeGeminiGenerateContent({
      models: modelsToTry,
      payload,
      timeoutMs: 12000,
      feature: 'transcribe',
    });
    const transcript = extractTranscriptFromResponse(json);
    if (transcript) {
      return transcript;
    }
  } catch (err) {
    console.warn('[GeminiAudio] Transcription error:', err);
  }

  throw new Error('Could not transcribe audio. Please try again.');
}
