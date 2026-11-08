/**
 * Supabase Edge Function: `gemini-proxy`
 *
 * Server-side proxy for Google Gemini API requests (`assistant`, `vision_ocr`,
 * `clinical_ner`, `translate`, `transcribe`) so `GEMINI_API_KEY` stays in
 * Supabase Edge Function secrets (`supabase secrets set GEMINI_API_KEY=...`)
 * and is never embedded in client mobile binaries.
 */

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

interface ProxyRequestBody {
  models?: string[];
  payload?: Record<string, unknown>;
  feature?: string;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ ok: false, error: 'Method not allowed. Use POST.' }),
      {
        status: 405,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }

  const geminiApiKey = (Deno.env.get('GEMINI_API_KEY') ?? '').trim();
  if (!geminiApiKey) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: 'GEMINI_API_KEY secret is not configured on the Supabase Edge Function.',
      }),
      {
        status: 503,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }

  // Require either a Supabase/Clerk Authorization header or apikey header
  const authHeader = req.headers.get('authorization') ?? '';
  const apiKeyHeader = req.headers.get('apikey') ?? '';
  if (!authHeader && !apiKeyHeader) {
    return new Response(
      JSON.stringify({ ok: false, error: 'Missing authorization headers.' }),
      {
        status: 401,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }

  let body: ProxyRequestBody;
  try {
    body = (await req.json()) as ProxyRequestBody;
  } catch {
    return new Response(
      JSON.stringify({ ok: false, error: 'Invalid JSON request body.' }),
      {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
    );
  }

  if (!body.payload || typeof body.payload !== 'object') {
    return new Response(
      JSON.stringify({ ok: false, error: 'Missing Gemini generation payload.' }),
      {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      }
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
        return new Response(
          JSON.stringify({
            ok: true,
            modelUsed: model,
            data,
          }),
          {
            status: 200,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          }
        );
      }
    } catch {
      // Try next fallback model
    }
  }

  return new Response(
    JSON.stringify({
      ok: false,
      error: 'All upstream Gemini models failed or timed out.',
    }),
    {
      status: 502,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    }
  );
});
