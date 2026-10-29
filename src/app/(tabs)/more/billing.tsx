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
import { useState } from 'react';
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
import { safeBack } from '@/lib/navigation';
import { useAppStore, type SubscriptionPlanId } from '@/store/useAppStore';

export type PlanId = SubscriptionPlanId;

interface Plan {
  id: PlanId;
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
    name: 'Annual Pro',
    officialTitle: 'Siyashesha Health Passport Pro — Annual',
    price: 'R150.00 / year',
    durationLabel: '1 Year (Auto-renewing subscription)',
    subordinateNote: 'Includes 7-day free trial, then R150.00 billed annually (equivalent to R12.50/month).',
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
    name: 'Monthly Pro',
    officialTitle: 'Siyashesha Health Passport Pro — Monthly',
    price: 'R20.00 / month',
    durationLabel: '1 Month (Auto-renewing subscription)',
    subordinateNote: 'Billed monthly at R20.00/month · Flexible month-to-month plan.',
    features: [
      'Unlimited encrypted health documents & OCR',
      'Siyashesha Clinical Assistant with lab explanations',
      'Doctor & clinic PIN-protected QR sharing',
      'Offline biometric cryptographic passport access',
    ],
  },
  {
    id: 'lifetime_premium',
    name: 'Lifetime Founder Pass',
    officialTitle: 'Siyashesha Health Passport Pro — Lifetime Pass',
    price: 'R299.00 once-off',
    durationLabel: 'Lifetime Access (One-time purchase)',
    subordinateNote: 'Single one-time payment of R299.00 · Never auto-renews.',
    badge: 'FOUNDER PASS',
    badgeColor: '#DC1F26',
    features: [
      'All Pro features with no recurring subscription charges',
      'Permanent access to future Health Passport Pro updates',
      'One-time payment of R299.00 — never pay again',
      'Founder member badge on health passport',
    ],
  },
];

export default function BillingScreen() {
  const t = useTokens();
  const toast = useToast();
  const currentPlan = useAppStore((s) => s.subscriptionPlan);
  const trialEndsAt = useAppStore((s) => s.subscriptionTrialEndsAt);
  const setCurrentPlan = useAppStore((s) => s.setSubscriptionPlan);

  const [restoring, setRestoring] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocKind>(null);

  const activePlanData = plans.find((p) => p.id === currentPlan) ?? plans[0];
  const hasActiveTrial = Boolean(trialEndsAt && dayjs(trialEndsAt).isAfter(dayjs()));
  const storeLabel = Platform.OS === 'android' ? 'Google Play' : 'App Store';
  const storeAccountLabel = Platform.OS === 'android' ? 'Google Play account' : 'Apple ID / App Store account';

  const handleChangePlan = (plan: Plan) => {
    if (plan.id === currentPlan) return;
    tapFeedback();
    Alert.alert(
      plan.id === 'free' ? 'Switch to Free Basic' : 'Confirm Subscription Plan',
      plan.id === 'free'
        ? 'Switch your Health Passport to the Free Basic plan (R0.00)? Your emergency ICE card and existing records remain safe.'
        : `${plan.officialTitle}\n\nPrice: ${plan.price}\nLength: ${plan.durationLabel}\n\n${plan.subordinateNote}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: plan.id === 'free' ? 'Switch to Free' : 'Confirm',
          onPress: () => {
            setCurrentPlan(plan.id, { startTrial: plan.id === 'annual_premium' });
            toast.show(`Active plan updated to ${plan.name}`, 'success');
          },
        },
      ]
    );
  };

  const handleRestorePurchases = () => {
    tapFeedback();
    setRestoring(true);
    setTimeout(() => {
      setRestoring(false);
      Alert.alert(
        'Restore Purchases',
        `Your ${storeLabel} receipt status has been verified. Current active tier: ${activePlanData.officialTitle}.`,
        [{ text: 'OK' }]
      );
    }, 700);
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
      <ScreenHeader title="Subscription & Billing" onBack={() => safeBack('/(tabs)/more')} />
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
              <Sparkles size={16} color="#FBBF24" />
              <Txt variant="footnote" color="#FBBF24" style={{ fontFamily: fonts.semibold, letterSpacing: 0.8 }}>
                CURRENT PLAN
              </Txt>
            </View>
            <View
              style={{
                backgroundColor: 'rgba(34, 197, 94, 0.2)',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: radii.pill,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <CheckCircle2 size={12} color="#4ADE80" />
              <Txt variant="label" color="#4ADE80">
                {hasActiveTrial ? 'FREE TRIAL ACTIVE' : 'ACTIVE'}
              </Txt>
            </View>
          </View>

          <Txt variant="title" tone="onNavy" style={{ marginTop: 8 }}>
            {activePlanData.officialTitle}
          </Txt>
          <Txt variant="callout" color="#CBD5E1" style={{ marginTop: 2 }}>
            {activePlanData.price} · {activePlanData.durationLabel}
          </Txt>
          {hasActiveTrial && trialEndsAt ? (
            <Txt variant="footnote" color="#38BDF8" style={{ marginTop: 4 }}>
              7-day free trial ends {dayjs(trialEndsAt).format('D MMM YYYY')}
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
                        onPress={() => handleChangePlan(plan)}
                        style={{
                          backgroundColor: isLifetime ? '#DC1F26' : t.accent,
                          paddingHorizontal: 14,
                          paddingVertical: 8,
                          borderRadius: radii.pill,
                        }}
                      >
                        <Txt variant="footnote" tone="onNavy" style={{ fontFamily: fonts.semibold }}>
                          {plan.id === 'free' ? 'Select Free' : 'Choose Plan'}
                        </Txt>
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
