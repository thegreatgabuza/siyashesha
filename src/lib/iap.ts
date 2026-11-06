import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { SubscriptionPlanId } from '@/store/useAppStore';

export type PaidPlanId = Exclude<SubscriptionPlanId, 'free'>;

export interface IapProductSpec {
  planId: PaidPlanId;
  productId: string;
  type: 'subs' | 'in-app';
  officialTitle: string;
  shortName: string;
  defaultPrice: string;
  durationLabel: string;
  hasFreeTrial: boolean;
  subordinateBreakdown: string;
  ctaLabel: string;
  ctaSublabel: string;
}

export const IAP_PRODUCT_IDS: Record<PaidPlanId, string> = {
  annual_premium: 'za.co.siyashesha.healthpassport.annual_premium',
  monthly_premium: 'za.co.siyashesha.healthpassport.monthly_premium',
  lifetime_premium: 'za.co.siyashesha.healthpassport.lifetime_premium',
};

export const IAP_PRODUCT_SPECS: Record<PaidPlanId, IapProductSpec> = {
  annual_premium: {
    planId: 'annual_premium',
    productId: IAP_PRODUCT_IDS.annual_premium,
    type: 'subs',
    officialTitle: 'Siyashesha Health Passport Pro — Annual',
    shortName: 'Annual Pro',
    defaultPrice: 'R149.99 / year',
    durationLabel: '1 Year (Auto-renewing)',
    hasFreeTrial: true,
    subordinateBreakdown:
      '7-day free trial, then R149.99 billed annually (equivalent to R12.50/month). Auto-renews annually unless cancelled.',
    ctaLabel: 'Start 7-Day Free Trial — Then R149.99/yr',
    ctaSublabel: 'R0.00 due today · Auto-renews at R149.99/year after 7 days · Cancel anytime',
  },
  monthly_premium: {
    planId: 'monthly_premium',
    productId: IAP_PRODUCT_IDS.monthly_premium,
    type: 'subs',
    officialTitle: 'Siyashesha Health Passport Pro — Monthly',
    shortName: 'Monthly Pro',
    defaultPrice: 'R19.99 / month',
    durationLabel: '1 Month (Auto-renewing)',
    hasFreeTrial: false,
    subordinateBreakdown: 'Billed monthly at R19.99/month · Flexible month-to-month plan',
    ctaLabel: 'Subscribe for R19.99 / month',
    ctaSublabel: 'Billed monthly · Cancel anytime in Account Settings',
  },
  lifetime_premium: {
    planId: 'lifetime_premium',
    productId: IAP_PRODUCT_IDS.lifetime_premium,
    type: 'in-app',
    officialTitle: 'Siyashesha Health Passport Pro — Lifetime Founder Pass',
    shortName: 'Lifetime Founder Pass',
    defaultPrice: 'R299.99 once-off',
    durationLabel: 'Lifetime Access (One-time purchase)',
    hasFreeTrial: false,
    subordinateBreakdown:
      'Single one-time payment of R299.99 · No recurring subscription charges',
    ctaLabel: 'Unlock Lifetime Access — R299.99',
    ctaSublabel: 'One-time payment · Own Pro forever with no renewals',
  },
};

export function planIdFromProductId(productId?: string | null): PaidPlanId | null {
  if (!productId) return null;
  if (productId === IAP_PRODUCT_IDS.lifetime_premium || productId.endsWith('.lifetime_premium')) {
    return 'lifetime_premium';
  }
  if (productId === IAP_PRODUCT_IDS.annual_premium || productId.endsWith('.annual_premium')) {
    return 'annual_premium';
  }
  if (productId === IAP_PRODUCT_IDS.monthly_premium || productId.endsWith('.monthly_premium')) {
    return 'monthly_premium';
  }
  return null;
}

const isExpoGo = Constants.appOwnership === 'expo';

/** Dynamically loads `expo-iap` on native standalone / TestFlight builds. */
async function getExpoIap(): Promise<typeof import('expo-iap') | null> {
  if (Platform.OS === 'web' || isExpoGo) {
    return null;
  }
  try {
    return await import('expo-iap');
  } catch {
    return null;
  }
}

let isConnected = false;

async function ensureIapConnection(): Promise<typeof import('expo-iap') | null> {
  const iap = await getExpoIap();
  if (!iap) return null;
  try {
    if (!isConnected) {
      await iap.initConnection();
      isConnected = true;
    }
    return iap;
  } catch (err) {
    console.warn('[IAP] Failed to initialize StoreKit / Billing connection:', err);
    return null;
  }
}

export interface StoreKitProductMap {
  annual_premium?: { displayPrice?: string; title?: string };
  monthly_premium?: { displayPrice?: string; title?: string };
  lifetime_premium?: { displayPrice?: string; title?: string };
}

/**
 * Fetches live StoreKit 2 / Google Play Billing product metadata for the 3 Siyashesha SKUs.
 */
export async function fetchStoreKitCatalog(): Promise<StoreKitProductMap> {
  const result: StoreKitProductMap = {};
  const iap = await ensureIapConnection();
  if (!iap) return result;

  try {
    const subs = await iap.fetchProducts({
      skus: [IAP_PRODUCT_IDS.annual_premium, IAP_PRODUCT_IDS.monthly_premium],
      type: 'subs',
    });
    for (const item of subs ?? []) {
      const planId = planIdFromProductId((item as any)?.id || (item as any)?.productId);
      if (planId) {
        result[planId] = {
          displayPrice: (item as any)?.displayPrice,
          title: (item as any)?.title,
        };
      }
    }
  } catch (err) {
    console.warn('[IAP] Subscription catalog fetch:', err);
  }

  try {
    const inApps = await iap.fetchProducts({
      skus: [IAP_PRODUCT_IDS.lifetime_premium],
      type: 'in-app',
    });
    for (const item of inApps ?? []) {
      const planId = planIdFromProductId((item as any)?.id || (item as any)?.productId);
      if (planId) {
        result[planId] = {
          displayPrice: (item as any)?.displayPrice,
          title: (item as any)?.title,
        };
      }
    }
  } catch (err) {
    console.warn('[IAP] Non-consumable catalog fetch:', err);
  }

  return result;
}

export type PurchaseResult =
  | { status: 'purchased'; planId: PaidPlanId; productId: string; transactionId?: string }
  | { status: 'cancelled' }
  | { status: 'store_unavailable'; reason: string };

/**
 * Launches the native Apple StoreKit 2 (TestFlight / App Store) or Google Play purchase sheet
 * for the specified Siyashesha plan.
 */
export async function purchasePlanWithStoreKit(planId: PaidPlanId): Promise<PurchaseResult> {
  const spec = IAP_PRODUCT_SPECS[planId];
  const iap = await ensureIapConnection();
  if (!iap) {
    return {
      status: 'store_unavailable',
      reason: 'Native StoreKit is not available in this environment.',
    };
  }

  try {
    // Pre-fetch the SKU so StoreKit 2 / Google Play Billing has the product and offerToken cached
    const fetchedProducts = await iap
      .fetchProducts({
        skus: [spec.productId],
        type: spec.type,
      })
      .catch(() => []);

    // On Android (Google Play Billing v6+), auto-renewing subscriptions require `subscriptionOffers: [{ sku, offerToken }]`
    let androidOfferToken: string | undefined;
    if (Platform.OS === 'android' && spec.type === 'subs' && Array.isArray(fetchedProducts)) {
      const productItem: any = fetchedProducts[0];
      const offers: any[] =
        productItem?.subscriptionOffers ||
        productItem?.subscriptionOfferDetailsAndroid ||
        [];
      if (offers.length > 0) {
        const trialOffer = spec.hasFreeTrial
          ? offers.find((o) =>
              String(o?.offerId || o?.paymentMode || '')
                .toLowerCase()
                .includes('free')
            )
          : undefined;
        const chosenOffer = trialOffer || offers[0];
        androidOfferToken =
          chosenOffer?.offerTokenAndroid || chosenOffer?.offerToken || undefined;
      }
    }

    return await new Promise<PurchaseResult>((resolve) => {
      let settled = false;
      let updateSub: { remove: () => void } | null = null;
      let errorSub: { remove: () => void } | null = null;

      const cleanup = () => {
        try {
          updateSub?.remove();
        } catch {}
        try {
          errorSub?.remove();
        } catch {}
      };

      const finish = (outcome: PurchaseResult) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(outcome);
      };

      updateSub = iap.purchaseUpdatedListener(async (purchase) => {
        const matchedPlan =
          planIdFromProductId(purchase?.productId || (purchase as any)?.id) ?? planId;
        try {
          await iap.finishTransaction({ purchase, isConsumable: false });
        } catch (err) {
          console.warn('[IAP] finishTransaction warning:', err);
        }
        finish({
          status: 'purchased',
          planId: matchedPlan,
          productId: purchase?.productId || spec.productId,
          transactionId: purchase?.id,
        });
      });

      errorSub = iap.purchaseErrorListener((error) => {
        if (
          iap.isUserCancelledError?.(error) ||
          error?.code === 'user-cancelled' ||
          String(error?.message || '').toLowerCase().includes('cancel')
        ) {
          finish({ status: 'cancelled' });
          return;
        }
        finish({
          status: 'store_unavailable',
          reason: error?.message || 'StoreKit could not complete the purchase.',
        });
      });

      iap
        .requestPurchase({
          type: spec.type,
          request: {
            apple: { sku: spec.productId },
            google: {
              skus: [spec.productId],
              ...(spec.type === 'subs' && androidOfferToken
                ? {
                    subscriptionOffers: [
                      { sku: spec.productId, offerToken: androidOfferToken },
                    ],
                  }
                : {}),
            },
          },
        } as any)
        .then(async (res: any) => {
          // On iOS StoreKit 2, ExpoIapModule.requestPurchase awaits the native purchase sheet
          // and resolves once the sheet closes. Give listeners 250ms to fire first.
          if (Platform.OS === 'ios') {
            setTimeout(async () => {
              if (settled) return;
              const purchaseItem = Array.isArray(res) ? res[0] : res;
              if (purchaseItem && (purchaseItem.productId || purchaseItem.id)) {
                const matchedPlan =
                  planIdFromProductId(purchaseItem.productId || purchaseItem.id) ?? planId;
                try {
                  await iap.finishTransaction({ purchase: purchaseItem, isConsumable: false });
                } catch {}
                finish({
                  status: 'purchased',
                  planId: matchedPlan,
                  productId: purchaseItem.productId || spec.productId,
                  transactionId: purchaseItem.id,
                });
              } else {
                finish({ status: 'cancelled' });
              }
            }, 250);
          }
        })
        .catch((err: any) => {
          if (
            iap.isUserCancelledError?.(err) ||
            err?.code === 'user-cancelled' ||
            String(err?.message || '').toLowerCase().includes('cancel')
          ) {
            finish({ status: 'cancelled' });
            return;
          }
          finish({
            status: 'store_unavailable',
            reason: err?.message || 'Product not yet active in StoreKit sandbox.',
          });
        });
    });
  } catch (err: any) {
    return {
      status: 'store_unavailable',
      reason: err?.message || 'StoreKit purchase request failed.',
    };
  }
}

/**
 * Restores completed purchases and active subscriptions from Apple StoreKit 2 / Google Play.
 */
export async function restoreStoreKitPurchases(): Promise<{
  restoredPlan: PaidPlanId | null;
  productId?: string;
}> {
  const iap = await ensureIapConnection();
  if (!iap) {
    return { restoredPlan: null };
  }

  try {
    await iap.restorePurchases().catch(() => {});
    const purchases = await iap.getAvailablePurchases();

    // Priority order: Lifetime -> Annual -> Monthly
    const priority: PaidPlanId[] = ['lifetime_premium', 'annual_premium', 'monthly_premium'];
    const foundPlans = new Map<PaidPlanId, string>();

    for (const p of purchases ?? []) {
      const sku = p?.productId || (p as any)?.id;
      const matched = planIdFromProductId(sku);
      if (matched) {
        foundPlans.set(matched, sku);
        await iap.finishTransaction({ purchase: p, isConsumable: false }).catch(() => {});
      }
    }

    for (const pId of priority) {
      if (foundPlans.has(pId)) {
        return { restoredPlan: pId, productId: foundPlans.get(pId) };
      }
    }
  } catch (err) {
    console.warn('[IAP] Restore purchases error:', err);
  }

  return { restoredPlan: null };
}
