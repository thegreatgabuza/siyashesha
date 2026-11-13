import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { createRemoteJWKSet, jwtVerify } from 'https://esm.sh/jose@5.9.6';

declare const Deno: {
  env: {
    get: (key: string) => string | undefined;
  };
};

export interface VerifiedCaller {
  userId: string;
  token: string;
}

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getRemoteJwks(jwksUrl: string) {
  let cached = jwksCache.get(jwksUrl);
  if (!cached) {
    cached = createRemoteJWKSet(new URL(jwksUrl));
    jwksCache.set(jwksUrl, cached);
  }
  return cached;
}

/**
 * Resolves allowlisted Clerk JWKS URLs strictly from server-side Edge Function secrets.
 * Never derives JWKS dynamically from an untrusted incoming JWT's `iss` claim.
 */
function resolveConfiguredClerkIssuers(): Array<{ jwksUrl: string; issuer?: string }> {
  const results: Array<{ jwksUrl: string; issuer?: string }> = [];
  const explicitJwks = (Deno.env.get('CLERK_JWKS_URL') ?? '').trim();
  const explicitIssuer = (Deno.env.get('CLERK_ISSUER') ?? '').trim();

  if (explicitJwks) {
    results.push({
      jwksUrl: explicitJwks,
      issuer: explicitIssuer && !explicitIssuer.includes(',') ? explicitIssuer.replace(/\/+$/, '') : undefined,
    });
  }

  if (explicitIssuer) {
    for (const raw of explicitIssuer.split(',')) {
      const cleaned = raw.trim().replace(/\/+$/, '');
      if (cleaned.startsWith('https://')) {
        results.push({
          jwksUrl: `${cleaned}/.well-known/jwks.json`,
          issuer: cleaned,
        });
      }
    }
  }

  return results;
}

export function createServiceRoleClient() {
  const supabaseUrl = (Deno.env.get('SUPABASE_URL') ?? '').trim();
  const serviceRoleKey = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '').trim();
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Cryptographically authenticates the caller's Bearer JWT and rejects anonymous (`anon`) tokens.
 */
export async function verifyAuthenticatedCaller(
  req: Request
): Promise<{ ok: true; caller: VerifiedCaller } | { ok: false; status: number; error: string }> {
  const authHeader = (req.headers.get('authorization') ?? '').trim();
  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    return { ok: false, status: 401, error: 'Missing Bearer authorization token.' };
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return { ok: false, status: 401, error: 'Empty Bearer authorization token.' };
  }

  const anonKey = (Deno.env.get('SUPABASE_ANON_KEY') ?? '').trim();
  if (anonKey && token === anonKey) {
    return {
      ok: false,
      status: 401,
      error: 'Anonymous API key cannot access this endpoint. Please sign in first.',
    };
  }

  // 1. Verify Clerk RS256 session JWT against allowlisted server-configured JWKS
  const clerkConfigs = resolveConfiguredClerkIssuers();
  for (const clerkConfig of clerkConfigs) {
    try {
      const jwks = getRemoteJwks(clerkConfig.jwksUrl);
      const { payload } = await jwtVerify(
        token,
        jwks,
        clerkConfig.issuer ? { issuer: clerkConfig.issuer } : undefined
      );
      const sub = typeof payload.sub === 'string' ? payload.sub.trim() : '';
      const role = typeof payload.role === 'string' ? payload.role : '';
      if (sub && role !== 'anon') {
        return { ok: true, caller: { userId: sub, token } };
      }
    } catch {
      // Try next issuer or Supabase fallback
    }
  }

  // 2. Verify Supabase HS256 JWT (if SUPABASE_JWT_SECRET secret is set)
  const supabaseJwtSecret = (Deno.env.get('SUPABASE_JWT_SECRET') ?? '').trim();
  if (supabaseJwtSecret) {
    try {
      const secretKey = new TextEncoder().encode(supabaseJwtSecret);
      const { payload } = await jwtVerify(token, secretKey);
      const sub = typeof payload.sub === 'string' ? payload.sub.trim() : '';
      const role = typeof payload.role === 'string' ? payload.role : '';
      if (sub && role !== 'anon') {
        return { ok: true, caller: { userId: sub, token } };
      }
    } catch {
      // Continue to GoTrue user check
    }
  }

  // 3. Fallback: ask Supabase Auth (GoTrue) to validate the JWT directly
  const adminClient = createServiceRoleClient();
  if (adminClient) {
    try {
      const { data, error } = await adminClient.auth.getUser(token);
      if (!error && data?.user?.id) {
        return { ok: true, caller: { userId: data.user.id, token } };
      }
    } catch {
      // Fall through to 401
    }
  }

  return {
    ok: false,
    status: 401,
    error: 'Invalid or expired authentication session.',
  };
}

export async function enforceRateLimit(
  rateKey: string,
  maxRequests: number,
  windowSeconds: number
): Promise<{ allowed: true; remaining: number } | { allowed: false; retryAfterSeconds: number }> {
  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return { allowed: true, remaining: maxRequests };
  }

  const { data, error } = await adminClient.rpc('check_api_rate_limit', {
    p_key: rateKey,
    p_max_requests: maxRequests,
    p_window_seconds: windowSeconds,
  });

  if (error || !data || typeof data !== 'object') {
    // Fail open only if ledger table isn't migrated yet, otherwise respect RPC denial
    return { allowed: true, remaining: maxRequests };
  }

  if ((data as any).allowed === false) {
    return {
      allowed: false,
      retryAfterSeconds: Number((data as any).retryAfterSeconds) || 60,
    };
  }

  return { allowed: true, remaining: Number((data as any).remaining) || 0 };
}
