import { getCurrentUserId, isSupabaseConfigured, supabase } from '@/lib/supabase';

export function isGeminiConfigured(): boolean {
  return isSupabaseConfigured;
}

export interface GeminiProxyOptions {
  models: string[];
  payload: Record<string, any>;
  timeoutMs?: number;
  feature?: 'assistant' | 'vision_ocr' | 'clinical_ner' | 'translate' | 'transcribe';
}

export interface GeminiProxyResult {
  json: any;
  modelUsed: string;
}

/**
 * Invokes Google Gemini strictly via the server-side Supabase Edge Function (`gemini-proxy`).
 * All API keys (`GEMINI_API_KEY`) reside exclusively in Supabase Edge Function secrets
 * and are never present in client env files or mobile app bundles.
 */
export async function invokeGeminiGenerateContent(
  options: GeminiProxyOptions
): Promise<GeminiProxyResult> {
  const { models, payload, timeoutMs = 8000, feature = 'assistant' } = options;
  const modelsToTry = Array.from(new Set(models.filter(Boolean)));

  if (!isSupabaseConfigured) {
    throw new Error('Supabase Edge Function proxy is not configured.');
  }

  const userId = await getCurrentUserId().catch(() => '');
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
      body: {
        models: modelsToTry,
        payload,
        feature,
      },
      headers: userId ? { 'x-clerk-user-id': userId } : undefined,
    });

    clearTimeout(timeoutId);

    if (!error && data?.ok && data?.data) {
      return {
        json: data.data,
        modelUsed: data.modelUsed || modelsToTry[0] || 'gemini-3.1-flash-lite',
      };
    }

    throw new Error(error?.message || data?.error || 'Gemini proxy request failed.');
  } finally {
    clearTimeout(timeoutId);
  }
}
