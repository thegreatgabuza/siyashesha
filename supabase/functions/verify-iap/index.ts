/**
 * Supabase Edge Function: `verify-iap`
 *
 * Server-side In-App Purchase & Subscription verification for Apple App Store
 * and Google Play Billing, plus single-use 7-day trial activation.
 *
 * Never trusts client-claimed subscription plans without cryptographic store
 * verification (`APPLE_SHARED_SECRET` / `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`).
 */

import { SignJWT, importPKCS8 } from 'https://esm.sh/jose@5.9.6';

import {
  createServiceRoleClient,
  enforceRateLimit,
  verifyAuthenticatedCaller,
} from '../_shared/auth.ts';

declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

type PlanId = 'free' | 'monthly_premium' | 'annual_premium' | 'lifetime_premium';

const PRODUCT_TO_PLAN: Record<string, Exclude<PlanId, 'free'>> = {
  'za.co.siyashesha.healthpassport.monthly_premium': 'monthly_premium',
  'za.co.siyashesha.healthpassport.annual_premium': 'annual_premium',
  'za.co.siyashesha.healthpassport.lifetime_premium': 'lifetime_premium',
};

const PACKAGE_NAME = 'za.co.siyashesha.healthpassport';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

async function verifyAppleReceipt(params: {
  receiptData: string;
  productId?: string;
  sharedSecret: string;
}): Promise<{
  ok: boolean;
  statusCode?: number;
  plan?: Exclude<PlanId, 'free'>;
  productId?: string;
  transactionId?: string;
  originalTransactionId?: string;
  expiresAt?: string;
  error?: string;
}> {
  const callEndpoint = async (url: string) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        'receipt-data': params.receiptData,
        password: params.sharedSecret,
        'exclude-old-transactions': true,
      }),
    });
    return (await res.json()) as Record<string, any>;
  };

  let payload = await callEndpoint('https://buy.itunes.apple.com/verifyReceipt');
  if (payload?.status === 21007) {
    payload = await callEndpoint('https://sandbox.itunes.apple.com/verifyReceipt');
  }

  if (payload?.status !== 0) {
    return {
      ok: false,
      statusCode: Number(payload?.status ?? -1),
      error: `Apple receipt verification returned status ${payload?.status ?? 'unknown'}.`,
    };
  }

  const latestReceipts: Record<string, any>[] = Array.isArray(payload.latest_receipt_info)
    ? payload.latest_receipt_info
    : Array.isArray(payload.receipt?.in_app)
      ? payload.receipt.in_app
      : [];

  const nowMs = Date.now();
  const validItems = latestReceipts
    .filter((item) => {
      const pid = String(item?.product_id ?? '');
      if (!(pid in PRODUCT_TO_PLAN)) return false;
      if (item?.cancellation_date_ms) return false;
      if (pid.endsWith('lifetime_premium')) return true;
      const expMs = Number(item?.expires_date_ms ?? 0);
      return expMs > nowMs;
    })
    .sort((a, b) => Number(b?.expires_date_ms ?? 0) - Number(a?.expires_date_ms ?? 0));

  const chosen =
    validItems.find((item) => item?.product_id === 'za.co.siyashesha.healthpassport.lifetime_premium') ??
    validItems.find((item) => !params.productId || item?.product_id === params.productId) ??
    validItems[0];

  if (!chosen) {
    return { ok: false, error: 'No active non-expired Apple In-App Purchase found in receipt.' };
  }

  const productId = String(chosen.product_id);
  const plan = PRODUCT_TO_PLAN[productId];
  const expiresMs = Number(chosen.expires_date_ms ?? 0);

  return {
    ok: true,
    plan,
    productId,
    transactionId: chosen.transaction_id ? String(chosen.transaction_id) : undefined,
    originalTransactionId: chosen.original_transaction_id
      ? String(chosen.original_transaction_id)
      : undefined,
    expiresAt: expiresMs > 0 ? new Date(expiresMs).toISOString() : undefined,
  };
}

async function fetchGooglePlayAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson) as {
    client_email: string;
    private_key: string;
    token_uri?: string;
  };
  const key = await importPKCS8(sa.private_key, 'RS256');
  const nowSec = Math.floor(Date.now() / 1000);
  const assertion = await new SignJWT({
    scope: 'https://www.googleapis.com/auth/androidpublisher',
  })
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(sa.client_email)
    .setSubject(sa.client_email)
    .setAudience(sa.token_uri || 'https://oauth2.googleapis.com/token')
    .setIssuedAt(nowSec)
    .setExpirationTime(nowSec + 3600)
    .sign(key);

  const tokenRes = await fetch(sa.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error(tokenData.error || 'Failed to obtain Google Play OAuth token.');
  }
  return tokenData.access_token;
}

async function verifyGooglePlayPurchase(params: {
  productId: string;
  purchaseToken: string;
  serviceAccountJson: string;
}): Promise<{
  ok: boolean;
  plan?: Exclude<PlanId, 'free'>;
  productId?: string;
  transactionId?: string;
  expiresAt?: string;
  error?: string;
}> {
  const plan = PRODUCT_TO_PLAN[params.productId];
  if (!plan) {
    return { ok: false, error: 'Unsupported Google Play product ID.' };
  }

  const accessToken = await fetchGooglePlayAccessToken(params.serviceAccountJson);
  const encodedPkg = encodeURIComponent(PACKAGE_NAME);
  const encodedToken = encodeURIComponent(params.purchaseToken);

  if (plan === 'lifetime_premium') {
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodedPkg}/purchases/products/${encodeURIComponent(params.productId)}/tokens/${encodedToken}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = (await res.json()) as Record<string, any>;
    if (!res.ok || Number(data.purchaseState) !== 0) {
      return { ok: false, error: 'Google Play one-time product purchase is not in purchased state.' };
    }
    return {
      ok: true,
      plan,
      productId: params.productId,
      transactionId: data.orderId ? String(data.orderId) : undefined,
    };
  }

  const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodedPkg}/purchases/subscriptionsv2/tokens/${encodedToken}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await res.json()) as Record<string, any>;
  if (!res.ok) {
    return { ok: false, error: 'Google Play subscription verification failed.' };
  }

  const state = String(data.subscriptionState || '');
  const isActive =
    state === 'SUBSCRIPTION_STATE_ACTIVE' ||
    state === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD';
  if (!isActive) {
    return { ok: false, error: `Google Play subscription is not active (${state}).` };
  }

  const lineItem = Array.isArray(data.lineItems) ? data.lineItems[0] : undefined;
  const resolvedProductId = String(lineItem?.productId || params.productId);
  const resolvedPlan = PRODUCT_TO_PLAN[resolvedProductId] ?? plan;
  const expiryTime = typeof lineItem?.expiryTime === 'string' ? lineItem.expiryTime : undefined;

  return {
    ok: true,
    plan: resolvedPlan,
    productId: resolvedProductId,
    transactionId: data.latestOrderId ? String(data.latestOrderId) : undefined,
    expiresAt: expiryTime,
  };
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed. Use POST.' }, 405);
  }

  const auth = await verifyAuthenticatedCaller(req);
  if (!auth.ok) {
    return jsonResponse({ ok: false, error: auth.error }, auth.status);
  }

  const rate = await enforceRateLimit(`iap:${auth.caller.userId}`, 25, 600);
  if (!rate.allowed) {
    return jsonResponse({ ok: false, error: 'Too many billing verification attempts.' }, 429);
  }

  const adminClient = createServiceRoleClient();
  if (!adminClient) {
    return jsonResponse({ ok: false, error: 'Supabase service role is not configured.' }, 503);
  }

  let body: Record<string, any>;
  try {
    body = (await req.json()) as Record<string, any>;
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid JSON request body.' }, 400);
  }

  const action = String(body.action || 'status');
  const userId = auth.caller.userId;

  if (action === 'status') {
    const { data, error } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return jsonResponse({ ok: false, error: 'Failed to read subscription status.' }, 500);
    }

    if (!data) {
      return jsonResponse({
        ok: true,
        plan: 'free',
        source: 'free',
        verificationStatus: 'none',
      }, 200);
    }

    return jsonResponse({
      ok: true,
      plan: data.plan,
      source: data.source,
      productId: data.product_id ?? undefined,
      transactionId: data.transaction_id ?? undefined,
      trialEndsAt: data.trial_ends_at ?? undefined,
      expiresAt: data.expires_at ?? undefined,
      verificationStatus: data.verification_status,
    }, 200);
  }

  if (action === 'start_trial') {
    const { data: existing } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (existing?.trial_started_at) {
      const trialStillActive =
        existing.trial_ends_at && new Date(existing.trial_ends_at).getTime() > Date.now();
      return jsonResponse({
        ok: Boolean(trialStillActive),
        alreadyClaimed: true,
        plan: trialStillActive ? existing.plan : 'free',
        trialEndsAt: existing.trial_ends_at,
        verificationStatus: existing.verification_status,
      }, 200);
    }

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await adminClient.from('subscriptions').upsert({
      user_id: userId,
      plan: 'annual_premium',
      source: 'trial',
      product_id: 'za.co.siyashesha.healthpassport.annual_premium',
      trial_started_at: now.toISOString(),
      trial_ends_at: trialEndsAt,
      verified_at: now.toISOString(),
      verification_status: 'trial',
    });

    if (error) {
      return jsonResponse({ ok: false, error: 'Failed to activate 7-day trial.' }, 500);
    }

    return jsonResponse({
      ok: true,
      alreadyClaimed: false,
      plan: 'annual_premium',
      trialEndsAt,
      verificationStatus: 'trial',
    }, 200);
  }

  if (action === 'verify') {
    const platform = body.platform === 'android' ? 'android' : 'ios';
    const productId = typeof body.productId === 'string' ? body.productId.trim() : '';

    if (platform === 'ios') {
      const sharedSecret = (Deno.env.get('APPLE_SHARED_SECRET') ?? '').trim();
      const receiptData = typeof body.transactionReceipt === 'string' ? body.transactionReceipt.trim() : '';

      if (!sharedSecret) {
        return jsonResponse(
          {
            ok: false,
            configured: false,
            verificationStatus: 'unverified_pending',
            error: 'APPLE_SHARED_SECRET is not configured on the Supabase Edge Function.',
          },
          503
        );
      }

      if (!receiptData) {
        return jsonResponse({ ok: false, error: 'Missing Apple transaction receipt.' }, 400);
      }

      const verified = await verifyAppleReceipt({ receiptData, productId, sharedSecret });
      if (!verified.ok || !verified.plan) {
        return jsonResponse({ ok: false, error: verified.error || 'Apple receipt verification failed.' }, 402);
      }

      const nowIso = new Date().toISOString();
      await adminClient.from('subscriptions').upsert({
        user_id: userId,
        plan: verified.plan,
        source: 'apple_app_store',
        product_id: verified.productId,
        transaction_id: verified.transactionId ?? null,
        original_transaction_id: verified.originalTransactionId ?? null,
        expires_at: verified.expiresAt ?? null,
        verified_at: nowIso,
        verification_status: 'verified',
      });

      return jsonResponse({
        ok: true,
        plan: verified.plan,
        source: 'apple_app_store',
        productId: verified.productId,
        transactionId: verified.transactionId,
        expiresAt: verified.expiresAt,
        verificationStatus: 'verified',
      }, 200);
    }

    const serviceAccountJson = (Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON') ?? '').trim();
    const purchaseToken = typeof body.purchaseToken === 'string' ? body.purchaseToken.trim() : '';

    if (!serviceAccountJson) {
      return jsonResponse(
        {
          ok: false,
          configured: false,
          verificationStatus: 'unverified_pending',
          error: 'GOOGLE_PLAY_SERVICE_ACCOUNT_JSON is not configured on the Supabase Edge Function.',
        },
        503
      );
    }

    if (!purchaseToken || !productId) {
      return jsonResponse({ ok: false, error: 'Missing Google Play productId or purchaseToken.' }, 400);
    }

    const verified = await verifyGooglePlayPurchase({
      productId,
      purchaseToken,
      serviceAccountJson,
    });
    if (!verified.ok || !verified.plan) {
      return jsonResponse({ ok: false, error: verified.error || 'Google Play verification failed.' }, 402);
    }

    const nowIso = new Date().toISOString();
    await adminClient.from('subscriptions').upsert({
      user_id: userId,
      plan: verified.plan,
      source: 'google_play',
      product_id: verified.productId,
      transaction_id: verified.transactionId ?? null,
      expires_at: verified.expiresAt ?? null,
      verified_at: nowIso,
      verification_status: 'verified',
    });

    return jsonResponse({
      ok: true,
      plan: verified.plan,
      source: 'google_play',
      productId: verified.productId,
      transactionId: verified.transactionId,
      expiresAt: verified.expiresAt,
      verificationStatus: 'verified',
    }, 200);
  }

  return jsonResponse({ ok: false, error: `Unsupported action: ${action}` }, 400);
});
