/**
 * Supabase Edge Function: `gemini-proxy`
 *
 * Server-side proxy for Google Gemini API requests (`assistant`, `vision_ocr`,
 * `clinical_ner`, `translate`, `transcribe`) so `GEMINI_API_KEY` stays in
 * Supabase Edge Function secrets (`supabase secrets set GEMINI_API_KEY=...`)
 * and is never embedded in client mobile binaries.
 *
 * Hardened for production:
 * - Rejects unauthenticated callers and raw `anon` key requests
 * - Enforces per-user sliding-window rate limits via `check_api_rate_limit`
 * - Enforces maximum request size and model/feature allowlists
 */

import { enforceRateLimit, verifyAuthenticatedCaller } from '../_shared/auth.ts';

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-clerk-user-id',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ALLOWED_MODELS = new Set([
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite-preview',
]);

const DEFAULT_FALLBACK_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite-preview',
];

const ALLOWED_FEATURES = new Set([
  'assistant',
  'vision_ocr',
  'clinical_ner',
  'translate',
  'transcribe',
]);

const MAX_BODY_BYTES = 1024 * 1024; // 1 MB cap for base64 document scans / audio payloads

interface ProxyRequestBody {
  models?: string[];
  payload?: Record<string, unknown>;
  feature?: string;
}

function jsonResponse(body: Record<string, unknown>, status: number, extraHeaders?: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json', ...(extraHeaders ?? {}) },
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed. Use POST.' }, 405);
  }

  const geminiApiKey = (Deno.env.get('GEMINI_API_KEY') ?? '').trim();
  if (!geminiApiKey) {
    return jsonResponse(
      { ok: false, error: 'GEMINI_API_KEY secret is not configured on the Supabase Edge Function.' },
      503
    );
  }

  const authResult = await verifyAuthenticatedCaller(req);
  if (!authResult.ok) {
    return jsonResponse({ ok: false, error: authResult.error }, authResult.status);
  }

  const contentLength = Number(req.headers.get('content-length') || '0');
  if (contentLength > MAX_BODY_BYTES) {
    return jsonResponse({ ok: false, error: 'Request payload exceeds maximum 1 MB limit.' }, 413);
  }

  let rawText = '';
  try {
    rawText = await req.text();
  } catch {
    return jsonResponse({ ok: false, error: 'Unable to read request body.' }, 400);
  }

  if (rawText.length > MAX_BODY_BYTES) {
    return jsonResponse({ ok: false, error: 'Request payload exceeds maximum 1 MB limit.' }, 413);
  }

  let body: ProxyRequestBody;
  try {
    body = JSON.parse(rawText) as ProxyRequestBody;
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON request body.' }, 400);
  }

  if (!body.payload || typeof body.payload !== 'object' || Array.isArray(body.payload)) {
    return jsonResponse({ ok: false, error: 'Missing Gemini generation payload.' }, 400);
  }

  const feature =
    typeof body.feature === 'string' && ALLOWED_FEATURES.has(body.feature)
      ? body.feature
      : 'assistant';

  const rate = await enforceRateLimit(
    `gemini:${authResult.caller.userId}:${feature}`,
    40,
    600
  );
  if (!rate.allowed) {
    return jsonResponse(
      { ok: false, error: 'Rate limit exceeded. Please wait before trying again.' },
      429,
      { 'Retry-After': String(rate.retryAfterSeconds) }
    );
  }

  const requestedModels = Array.isArray(body.models)
    ? body.models.filter((m) => typeof m === 'string' && ALLOWED_MODELS.has(m))
    : [];
  const modelsToTry =
    requestedModels.length > 0 ? requestedModels : DEFAULT_FALLBACK_MODELS;

  for (const model of modelsToTry) {
    try {
      const upstreamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;
      const upstreamRes = await fetch(upstreamUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body.payload),
      });

      if (upstreamRes.status === 200) {
        const data = await upstreamRes.json();
        return jsonResponse({ ok: true, modelUsed: model, data }, 200);
      }
    } catch {
      // Try next fallback model
    }
  }

  return jsonResponse({ ok: false, error: 'All upstream Gemini models failed or timed out.' }, 502);
});
