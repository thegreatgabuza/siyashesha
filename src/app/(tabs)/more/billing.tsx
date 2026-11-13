import dayjs from 'dayjs';
import {
  Check,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  Flame,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Platform, Pressable, Text, View } from 'react-native';

import { LegalDocumentModal, type LegalDocKind } from '@/components/security/LegalDocumentModal';
import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useToast } from '@/components/ui/Toast';
import { Txt } from '@/components/ui/Txt';
import { elevation, fonts, radii } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { tapFeedback } from '@/lib/feedback';
import {
  fetchStoreKitCatalog,
  IAP_PRODUCT_IDS,
  purchasePlanWithStoreKit,
  restoreStoreKitPurchases,
  verifyIapReceiptWithBackend,
} from '@/lib/iap';
import { safeBack } from '@/lib/navigation';
import { FREE_RECORD_LIMIT, getPlanEntitlements } from '@/lib/subscription';
import { useI18n } from '@/i18n/useI18n';
import { useAppStore, type SubscriptionPlanId } from '@/store/useAppStore';

export type PlanId = SubscriptionPlanId;

interface Plan {
  id: PlanId;
  productId?: string;
  name: string;
  officialTitle: string;
  price: string;
  durationLabel: string;
  subordinateNote: string;
  badge?: string;
  badgeColor?: string;
  features: string[];
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free Basic',
    officialTitle: 'Siyashesha Health Passport — Free Basic',
    price: 'R0.00',
    durationLabel: 'Free forever (No subscription)',
    subordinateNote: 'Includes full Emergency ICE Card & QR, daily medication reminders, and up to 10 stored records.',
    features: [
      'Digital ICE Emergency Card & QR code',
      'Up to 10 stored health documents in vault',
      'Daily medication reminders & adherence tracking',
      'Basic clinical visit timeline',
    ],
  },
  {
    id: 'annual_premium',
    productId: IAP_PRODUCT_IDS.annual_premium,
    name: 'Annual Pro',
    officialTitle: 'Siyashesha Health Passport Pro — Annual',
    price: 'R149.99 / year',
    durationLabel: '1 Year (Auto-renewing subscription)',
    subordinateNote:
      'Includes 7-day free trial, then R149.99 billed annually (equivalent to R12.50/month). Auto-renews annually unless cancelled.',
    badge: '7-DAY FREE TRIAL · SAVE 38%',
    badgeColor: '#16A34A',
    features: [
      'Everything in Monthly Pro',
      'Save 38% compared to monthly billing',
      'Unlimited encrypted medical records & smart OCR',
      'Full annual health record PDF & DSAR archive export',
    ],
  },
  {
    id: 'monthly_premium',
    productId: IAP_PRODUCT_IDS.monthly_premium,
    name: 'Monthly Pro',
    officialTitle: 'Siyashesha Health Passport Pro — Monthly',
    price: 'R19.99 / month',
    durationLabel: '1 Month (Auto-renewing subscription)',
    subordinateNote: 'Billed monthly at R19.99/month · Flexible month-to-month plan.',
    features: [
      'Unlimited encrypted health documents & OCR',
      'Siyashesha Clinical Assistant with lab explanations',
      'Doctor & clinic PIN-protected QR sharing',
      'Offline biometric cryptographic passport access',
    ],
  },
  {
    id: 'lifetime_premium',
    productId: IAP_PRODUCT_IDS.lifetime_premium,
    name: 'Lifetime Founder Pass',
    officialTitle: 'Siyashesha Health Passport Pro — Lifetime Founder Pass',
    price: 'R299.99 once-off',
    durationLabel: 'Lifetime Access (One-time purchase)',
    subordinateNote: 'Single one-time payment of R299.99 · Never auto-renews.',
    badge: 'FOUNDER PASS',
    badgeColor: '#DC1F26',
    features: [
      'All Pro features with no recurring subscription charges',
      'Permanent access to future Health Passport Pro updates',
      'One-time payment of R299.99 — never pay again',
      'Founder member badge on health passport',
    ],
  },
];

export default function BillingScreen() {
  const t = useTokens();
  const { t: tr } = useI18n();
  const toast = useToast();
  const currentPlan = useAppStore((s) => s.subscriptionPlan);
  const trialEndsAt = useAppStore((s) => s.subscriptionTrialEndsAt);
  const subscriptionExpiresAt = useAppStore((s) => s.subscriptionExpiresAt);
  const subscriptionTransactionId = useAppStore((s) => s.subscriptionTransactionId);
  const recordCount = useAppStore((s) => s.records.length);
  const setCurrentPlan = useAppStore((s) => s.setSubscriptionPlan);
  const verifySubscriptionStatus = useAppStore((s) => s.verifySubscriptionStatus);
  const entitlements = getPlanEntitlements(currentPlan);

  const [restoring, setRestoring] = useState(false);
  const [purchasingPlanId, setPurchasingPlanId] = useState<PlanId | null>(null);
  const [legalDoc, setLegalDoc] = useState<LegalDocKind>(null);

  useEffect(() => {
    void fetchStoreKitCatalog();
    void verifySubscriptionStatus();
  }, [verifySubscriptionStatus]);

  const activePlanData = plans.find((p) => p.id === currentPlan) ?? plans[0];
  const hasActiveTrial = Boolean(trialEndsAt && dayjs(trialEndsAt).isAfter(dayjs()));
  const storeLabel = Platform.OS === 'android' ? 'Google Play' : 'App Store';
  const storeAccountLabel = Platform.OS === 'android' ? 'Google Play account' : 'Apple ID / App Store account';

  const handleChangePlan = async (plan: Plan) => {
    if (plan.id === currentPlan || purchasingPlanId) return;
    tapFeedback();

    if (plan.id === 'free') {
      Alert.alert(
        'Switch to Free Basic',
        'Switch your Health Passport to the Free Basic plan (R0.00)? Your Emergency ICE Card and existing records remain safe, while vault uploads cap at 10 records and Pro features (Smart OCR, Clinical Assistant, PIN sharing, biometric lock & PDF/archive exports) will pause.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Switch to Free',
            onPress: () => {
              setCurrentPlan('free', { startTrial: false });
              toast.show('Active plan updated to Free Basic', 'success');
            },
          },
        ]
      );
      return;
    }

    setPurchasingPlanId(plan.id);
    try {
      const result = await purchasePlanWithStoreKit(plan.id);
      setPurchasingPlanId(null);

      if (result.status === 'purchased') {
        const verification = await verifyIapReceiptWithBackend({
          planId: result.planId,
          productId: result.productId,
          transactionId: result.transactionId,
          transactionReceipt: result.transactionReceipt,
          purchaseToken: result.purchaseToken,
        });
        if (verification.configured && !verification.verified) {
          Alert.alert(
            'Receipt Verification Failed',
            verification.error || 'We could not verify this purchase with the App Store / Google Play.'
          );
          return;
        }
        setCurrentPlan(verification.plan ?? result.planId, {
          startTrial: (verification.plan ?? result.planId) === 'annual_premium',
          expiresAt: verification.expiresAt ?? result.expiresAt,
          productId: verification.productId ?? result.productId,
          transactionId: verification.transactionId ?? result.transactionId,
        });
        toast.show(`Active plan updated to ${plan.name}`, 'success');
        return;
      }

      if (result.status === 'cancelled') {
        return;
      }

      if (__DEV__) {
        Alert.alert(
          'Development Preview Checkout',
          `${plan.officialTitle}\nProduct ID: ${plan.productId}\n\nPrice: ${plan.price}\nLength: ${plan.durationLabel}`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Activate in Dev Preview',
              onPress: () => {
                setCurrentPlan(plan.id, {
                  startTrial: plan.id === 'annual_premium',
                  productId: plan.productId,
                });
                toast.show(`Active plan updated to ${plan.name}`, 'success');
              },
            },
          ]
        );
        return;
      }

      Alert.alert(
        'Store Checkout Unavailable',
        `Could not reach ${storeLabel} to purchase ${plan.officialTitle} (${plan.price}). Please check your internet connection and ${storeAccountLabel}, then try again.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Again', onPress: () => void handleChangePlan(plan) },
        ]
      );
    } catch {
      setPurchasingPlanId(null);
    }
  };

  const handleRestorePurchases = async () => {
    if (restoring) return;
    tapFeedback();
    setRestoring(true);
    try {
      const {
        restoredPlan,
        productId,
        transactionId,
        transactionReceipt,
        purchaseToken,
        expiresAt,
      } = await restoreStoreKitPurchases();
      if (restoredPlan) {
        const verification = await verifyIapReceiptWithBackend({
          planId: restoredPlan,
          productId: productId || '',
          transactionId,
          transactionReceipt,
          purchaseToken,
        });
        setRestoring(false);
        if (verification.configured && !verification.verified) {
          Alert.alert(
            'Restore Verification Failed',
            verification.error || 'We could not verify your previous store receipt.'
          );
          return;
        }
        const effectivePlan = verification.plan ?? restoredPlan;
        const matched = plans.find((p) => p.id === effectivePlan);
        setCurrentPlan(effectivePlan, {
          startTrial: false,
          expiresAt: verification.expiresAt ?? expiresAt,
          productId: verification.productId ?? productId,
          transactionId: verification.transactionId ?? transactionId,
        });
        toast.show(`Restored ${matched?.name ?? 'Pro Plan'}`, 'success');
        return;
      }
      setRestoring(false);
      Alert.alert(
        'Restore Purchases',
        `Your ${storeLabel} receipt status has been verified. Current active tier: ${activePlanData.officialTitle}.`,
        [{ text: 'OK' }]
      );
    } catch {
      setRestoring(false);
    }
  };

  const handleManageStoreSubscriptions = () => {
    tapFeedback();
    const storeUrl =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions';
    Linking.openURL(storeUrl).catch(() => {
      toast.show('Manage subscriptions in your device Account Settings', 'info');
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.canvas }}>
      <ScreenHeader title={tr('billing.title')} onBack={() => safeBack('/(tabs)/more')} />
      <ScreenScroll className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 64 }}>
        {/* Active Subscription Hero Card */}
        <View
          style={[
            {
              backgroundColor: '#0B1E40',
              borderRadius: radii.xl,
              padding: 20,
              marginTop: 8,
              borderWidth: 1,
              borderColor: 'rgba(255, 255, 255, 0.12)',
            },
            elevation[2],
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {entitlements.hasFounderBadge ? (
                <Flame size={16} color="#FBBF24" />
              ) : (
                <Sparkles size={16} color="#FBBF24" />
              )}
              <Txt variant="footnote" color="#FBBF24" style={{ fontFamily: fonts.semibold, letterSpacing: 0.8 }}>
                {entitlements.hasFounderBadge ? tr('billing.founderPass') : tr('billing.currentPlan')}
              </Txt>
            </View>
            <View
              style={{
                backgroundColor: entitlements.hasFounderBadge
                  ? '#DC1F26'
                  : 'rgba(34, 197, 94, 0.2)',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: radii.pill,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <CheckCircle2 size={12} color={entitlements.hasFounderBadge ? '#FFFFFF' : '#4ADE80'} />
              <Txt variant="label" color={entitlements.hasFounderBadge ? '#FFFFFF' : '#4ADE80'}>
                {entitlements.hasFounderBadge
                  ? 'FOUNDER MEMBER'
                  : hasActiveTrial
                  ? 'FREE TRIAL ACTIVE'
                  : 'ACTIVE'}
              </Txt>
            </View>
          </View>

          <Txt variant="title" tone="onNavy" style={{ marginTop: 8 }}>
            {activePlanData.officialTitle}
          </Txt>
          <Txt variant="callout" color="#CBD5E1" style={{ marginTop: 2 }}>
            {activePlanData.price} · {activePlanData.durationLabel}
          </Txt>
          {!entitlements.isPro ? (
            <Txt variant="footnote" color="#38BDF8" style={{ marginTop: 4 }}>
              Vault usage: {recordCount} of {FREE_RECORD_LIMIT} free records stored
            </Txt>
          ) : null}
          {hasActiveTrial && trialEndsAt ? (
            <Txt variant="footnote" color="#38BDF8" style={{ marginTop: 4 }}>
              7-day free trial ends {dayjs(trialEndsAt).format('D MMM YYYY')}
            </Txt>
          ) : !hasActiveTrial &&
            subscriptionExpiresAt &&
            currentPlan !== 'free' &&
            currentPlan !== 'lifetime_premium' ? (
            <Txt variant="footnote" color="#38BDF8" style={{ marginTop: 4 }}>
              Renews / valid until {dayjs(subscriptionExpiresAt).format('D MMM YYYY')}
            </Txt>
          ) : null}
          {subscriptionTransactionId && entitlements.isPro ? (
            <Txt variant="footnote" color="#94A3B8" style={{ marginTop: 2 }}>
              Verified {storeLabel} receipt · Cloud entitlement synced
            </Txt>
          ) : null}

          <View style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.12)', marginVertical: 16 }} />

          <View style={{ gap: 8 }}>
            {activePlanData.features.map((feat) => (
              <View key={feat} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Check size={16} color="#38BDF8" />
                <Txt variant="footnote" tone="onNavy">
                  {feat}
                </Txt>
              </View>
            ))}
          </View>
        </View>

        {/* App Store / Play Store Account Management & Restore Purchases */}
        <View style={{ marginTop: 24 }}>
          <SectionHeader title={`${storeLabel} & Account Management`} />
          <View
            style={[
              {
                borderRadius: radii.xl,
                backgroundColor: t.surface,
                padding: 16,
                gap: 12,
                borderWidth: 1,
                borderColor: t.border,
              },
              elevation[1],
            ]}
          >
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Restore Purchases"
                disabled={restoring}
                onPress={handleRestorePurchases}
                style={{
                  flex: 1,
                  minHeight: 46,
                  borderRadius: radii.lg,
                  backgroundColor: t.surfaceMuted,
                  borderWidth: 1,
                  borderColor: t.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingHorizontal: 12,
                }}
              >
                {restoring ? (
                  <ActivityIndicator size="small" color={t.accent} />
                ) : (
                  <RefreshCw size={15} color={t.accent} />
                )}
                <Txt variant="footnote" style={{ fontFamily: fonts.semibold }}>
                  Restore Purchases
                </Txt>
              </PressableScale>

              <PressableScale
                accessibilityRole="link"
                accessibilityLabel="Manage Subscriptions in App Store"
                onPress={handleManageStoreSubscriptions}
                style={{
                  flex: 1,
                  minHeight: 46,
                  borderRadius: radii.lg,
                  backgroundColor: t.surfaceMuted,
                  borderWidth: 1,
                  borderColor: t.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingHorizontal: 12,
                }}
              >
                <ExternalLink size={15} color={t.accent} />
                <Txt variant="footnote" style={{ fontFamily: fonts.semibold }}>
                  Manage in Store
                </Txt>
              </PressableScale>
            </View>
            <Txt variant="footnote" tone="muted" style={{ fontSize: 11, lineHeight: 16 }}>
              Subscriptions are billed through your {storeAccountLabel} and can be managed or cancelled anytime in your {storeLabel} subscription settings.
            </Txt>
          </View>
        </View>

        {/* Available Plans List (Apple Guideline 3.1.2 Hierarchy) */}
        <View style={{ marginTop: 28 }}>
          <SectionHeader title="Available Plans" />
          <View style={{ gap: 14 }}>
            {plans.map((plan) => {
              const isCurrent = currentPlan === plan.id;
              const isLifetime = plan.id === 'lifetime_premium';
              const isAnnual = plan.id === 'annual_premium';

              return (
                <View
                  key={plan.id}
                  style={[
                    {
                      borderRadius: radii.xl,
                      backgroundColor: t.surface,
                      padding: 18,
                      borderWidth: isCurrent ? 2 : 1,
                      borderColor: isCurrent ? t.accent : t.border,
                    },
                    elevation[1],
                  ]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Txt variant="bodyStrong">{plan.officialTitle}</Txt>
                        {isLifetime ? <Flame size={15} color="#DC1F26" /> : null}
                        {isAnnual ? <Zap size={15} color="#16A34A" /> : null}
                        {plan.badge ? (
                          <View
                            style={{
                              backgroundColor: `${plan.badgeColor ?? t.accent}1A`,
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: radii.pill,
                            }}
                          >
                            <Txt
                              variant="label"
                              color={plan.badgeColor ?? t.accent}
                              style={{ fontFamily: fonts.semibold }}
                            >
                              {plan.badge}
                            </Txt>
                          </View>
                        ) : null}
                      </View>

                      {/* Billed Price & Duration clearly prominent per Guideline 3.1.2 */}
                      <Txt variant="title" style={{ fontFamily: fonts.bold, marginTop: 6 }}>
                        {plan.price}
                      </Txt>
                      <Txt variant="footnote" color={t.accent} style={{ fontFamily: fonts.semibold, marginTop: 2 }}>
                        Duration: {plan.durationLabel}
                      </Txt>
                      <Txt variant="footnote" tone="muted" style={{ marginTop: 4, lineHeight: 16 }}>
                        {plan.subordinateNote}
                      </Txt>
                      {plan.productId ? (
                        <Txt variant="footnote" tone="muted" style={{ marginTop: 3, fontSize: 10 }}>
                          Product ID: {plan.productId}
                        </Txt>
                      ) : null}
                    </View>

                    {isCurrent ? (
                      <View
                        style={{
                          backgroundColor: 'rgba(22, 163, 74, 0.12)',
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: radii.pill,
                        }}
                      >
                        <Txt variant="footnote" color="#16A34A" style={{ fontFamily: fonts.semibold }}>
                          Current
                        </Txt>
                      </View>
                    ) : (
                      <PressableScale
                        disabled={Boolean(purchasingPlanId)}
                        onPress={() => handleChangePlan(plan)}
                        style={{
                          backgroundColor: isLifetime ? '#DC1F26' : t.accent,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: radii.pill,
                          minWidth: 96,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {purchasingPlanId === plan.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Txt variant="footnote" tone="onNavy" style={{ fontFamily: fonts.semibold }}>
                            {plan.id === 'free' ? 'Select Free' : 'Choose Plan'}
                          </Txt>
                        )}
                      </PressableScale>
                    )}
                  </View>

                  <View style={{ height: 1, backgroundColor: t.border, marginVertical: 12 }} />

                  <View style={{ gap: 6 }}>
                    {plan.features.map((feat) => (
                      <View key={feat} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Check size={14} color={isCurrent ? t.accent : '#16A34A'} />
                        <Txt variant="footnote" tone={isCurrent ? 'default' : 'muted'}>
                          {feat}
                        </Txt>
                      </View>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Mandatory Apple Guideline 3.1.2 Subscription Terms & Legal Links */}
        <View
          style={{
            marginTop: 24,
            borderRadius: radii.lg,
            backgroundColor: t.surfaceMuted,
            padding: 14,
            borderWidth: 1,
            borderColor: t.border,
            gap: 6,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <FileCheck2 size={14} color={t.textMuted} />
            <Txt variant="footnote" style={{ fontFamily: fonts.bold }}>
              Auto-Renewable Subscription Disclosure (Guideline 3.1.2)
            </Txt>
          </View>
          <Txt variant="footnote" tone="muted" style={{ fontSize: 11, lineHeight: 16 }}>
            Payment will be charged to your {storeAccountLabel} at the confirmation of purchase. Subscription automatically renews unless it is canceled at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. You can manage and cancel your subscriptions by going to your account settings on the {storeLabel} after purchase.
          </Txt>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 6 }}>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Terms of Use and EULA"
              onPress={() => setLegalDoc('terms')}
            >
              <Text className="font-sans-semibold text-[12px] underline text-brand-700 dark:text-brand-300">
                Terms of Use (EULA)
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Privacy Policy and POPIA Notice"
              onPress={() => setLegalDoc('privacy')}
            >
              <Text className="font-sans-semibold text-[12px] underline text-brand-700 dark:text-brand-300">
                Privacy Policy (POPIA)
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Security Note */}
        <View style={{ marginTop: 18, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 }}>
          <ShieldCheck size={18} color="#16A34A" />
          <Txt variant="footnote" tone="muted" style={{ flex: 1 }}>
            Your Emergency ICE Card and core health records remain accessible even on the Free Basic plan.
          </Txt>
        </View>
      </ScreenScroll>

      <LegalDocumentModal visibleDoc={legalDoc} onClose={() => setLegalDoc(null)} />
    </View>
  );
}
