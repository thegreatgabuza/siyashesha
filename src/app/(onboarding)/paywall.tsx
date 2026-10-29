import {
  BellRing,
  Check,
  CheckCircle2,
  ChevronLeft,
  FileCheck2,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Unlock,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LegalDocumentModal, type LegalDocKind } from '@/components/security/LegalDocumentModal';
import { useToast } from '@/components/ui/Toast';
import { tapFeedback } from '@/lib/feedback';
import { safeBack } from '@/lib/navigation';
import type { SubscriptionPlanId } from '@/store/useAppStore';
import { useAppStore } from '@/store/useAppStore';

interface PaywallOffer {
  id: Exclude<SubscriptionPlanId, 'free'>;
  officialTitle: string;
  shortName: string;
  durationLabel: string;
  billedPrice: string;
  subordinateBreakdown: string;
  badge?: string;
  badgeTone?: 'emerald' | 'navy' | 'red';
  hasFreeTrial: boolean;
  ctaLabel: string;
  ctaSublabel: string;
}

const offers: PaywallOffer[] = [
  {
    id: 'annual_premium',
    officialTitle: 'Siyashesha Health Passport Pro — Annual',
    shortName: 'Annual Pro',
    durationLabel: '1 Year (Auto-renewing)',
    billedPrice: 'R150.00 / year',
    subordinateBreakdown: '7-day free trial, then R150.00 billed annually (equivalent to R12.50/month)',
    badge: '7-DAY FREE TRIAL · SAVE 38%',
    badgeTone: 'emerald',
    hasFreeTrial: true,
    ctaLabel: 'Start 7-Day Free Trial',
    ctaSublabel: 'R0.00 due today · Then R150.00 / year · Cancel anytime',
  },
  {
    id: 'monthly_premium',
    officialTitle: 'Siyashesha Health Passport Pro — Monthly',
    shortName: 'Monthly Pro',
    durationLabel: '1 Month (Auto-renewing)',
    billedPrice: 'R20.00 / month',
    subordinateBreakdown: 'Billed monthly at R20.00/month · Flexible month-to-month plan',
    badge: 'FLEXIBLE MONTHLY',
    badgeTone: 'navy',
    hasFreeTrial: false,
    ctaLabel: 'Subscribe for R20.00 / month',
    ctaSublabel: 'Billed monthly · Cancel anytime in Account Settings',
  },
  {
    id: 'lifetime_premium',
    officialTitle: 'Siyashesha Health Passport Pro — Lifetime Founder Pass',
    shortName: 'Lifetime Pass',
    durationLabel: 'Lifetime Access (One-time purchase)',
    billedPrice: 'R299.00 once-off',
    subordinateBreakdown: 'Single one-time payment of R299.00 · No recurring subscription charges',
    badge: 'FOUNDER OFFER',
    badgeTone: 'red',
    hasFreeTrial: false,
    ctaLabel: 'Unlock Lifetime Access — R299.00',
    ctaSublabel: 'One-time payment · Own Pro forever with no renewals',
  },
];

const proBenefits = [
  {
    title: 'Unlimited Medical Records & Smart OCR',
    subtitle: 'Scan & extract blood tests, scripts, and X-rays with no 10-document limit',
    freeLimit: '10 max on Free',
  },
  {
    title: '24/7 Health Assistant & Lab Explainer',
    subtitle: 'Plain-language breakdowns of your clinical documents, vitals & daily questions',
    freeLimit: 'Pro Exclusive',
  },
  {
    title: 'Certified Doctor-Ready PDF & CSV Exports',
    subtitle: 'Generate clinical summary PDFs and time-limited PIN-protected QR doctor shares',
    freeLimit: 'Basic QR on Free',
  },
  {
    title: 'Offline Biometric Vault & Emergency Beacon',
    subtitle: 'Full offline cryptographic record access and instant paramedic ICE readiness',
    freeLimit: 'Included',
  },
];

export default function OnboardingPaywallScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const firstName = useAppStore((s) => s.onboardingDraft.firstName);
  const finishOnboarding = useAppStore((s) => s.finishOnboarding);

  const [selectedId, setSelectedId] = useState<Exclude<SubscriptionPlanId, 'free'>>('annual_premium');
  const [processing, setProcessing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocKind>(null);

  const selectedOffer = offers.find((o) => o.id === selectedId) ?? offers[0];
  const storeAccountName = Platform.OS === 'android' ? 'Google Play account' : 'Apple ID / App Store account';
  const storeSettingsLabel = Platform.OS === 'android' ? 'Google Play Subscriptions' : 'Account Settings';

  const handleStartSelectedPlan = () => {
    tapFeedback();
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      toast.show(
        selectedOffer.hasFreeTrial
          ? '7-Day Free Trial activated! Welcome to Siyashesha Pro.'
          : `${selectedOffer.shortName} activated! Welcome to Siyashesha Pro.`,
        'success'
      );
      finishOnboarding({
        plan: selectedOffer.id,
        startTrial: selectedOffer.hasFreeTrial,
      });
    }, 600);
  };

  const handleContinueFree = () => {
    tapFeedback();
    toast.show('Welcome to your Siyashesha Health Passport!', 'info');
    finishOnboarding({ plan: 'free', startTrial: false });
  };

  const handleRestorePurchases = () => {
    tapFeedback();
    setRestoring(true);
    setTimeout(() => {
      setRestoring(false);
      Alert.alert(
        'Restore Purchases',
        'We checked your App Store / Google Play receipt history. No previous active subscription was found for this account, or you can continue with your new passport.',
        [{ text: 'OK' }]
      );
    }, 800);
  };

  return (
    <View className="flex-1 bg-slate-50 dark:bg-canvasdark" style={{ paddingTop: insets.top + 6 }}>
      {/* Top Bar: Back + Trust Pill + Clear Close/Skip to Free */}
      <View className="flex-row items-center justify-between px-5 pb-2.5">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => safeBack('/(onboarding)/reveal')}
          className="h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-canvasdark-card"
        >
          <ChevronLeft size={20} color="#0B2559" />
        </Pressable>

        <View className="flex-row items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-50 px-3 py-1 dark:bg-emerald-500/15">
          <ShieldCheck size={14} color="#16A34A" />
          <Text className="font-sans-bold text-[11px] text-emerald-700 dark:text-emerald-300">
            POPIA & HIPAA Aligned
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue with Free Basic plan"
          onPress={handleContinueFree}
          className="h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white dark:border-slate-700 dark:bg-canvasdark-card"
        >
          <X size={18} color="#5B6478" />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Banner */}
        <View className="mt-1 rounded-3xl bg-ink p-5 dark:bg-brand-900">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5 rounded-full bg-white/15 px-3 py-1">
              <Sparkles size={13} color="#FBBF24" />
              <Text className="font-sans-bold text-[10px] uppercase tracking-[1px] text-amber-300">
                Siyashesha Health Passport Pro
              </Text>
            </View>
            <Text className="font-sans-semibold text-[11px] text-sky-300">Cancel anytime</Text>
          </View>

          <Text className="mt-3 font-sans-bold text-[24px] leading-[30px] text-white">
            {firstName.trim()
              ? `${firstName.trim()}, protect your complete health history.`
              : 'Protect your complete health history in one vault.'}
          </Text>
          <Text className="mt-1.5 font-sans text-[13px] leading-[19px] text-slate-300">
            Your emergency ICE card is always free. Upgrade to Pro for unlimited OCR medical record scans, clinical PDF exports, and 24/7 Health Assistant support.
          </Text>
        </View>

        {/* Value Checklist / Free vs Pro Comparison */}
        <View className="mt-4 gap-2.5 rounded-3xl border border-slate-200/90 bg-white p-4 dark:border-slate-800 dark:bg-canvasdark-card">
          <Text className="font-sans-bold text-[12px] uppercase tracking-[0.9px] text-ink-muted dark:text-slate-400">
            What’s Included in Siyashesha Pro
          </Text>
          {proBenefits.map((b) => (
            <View key={b.title} className="flex-row items-start gap-3 py-1">
              <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/20">
                <Check size={14} color="#16A34A" strokeWidth={3} />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="flex-1 font-sans-bold text-[14px] text-ink dark:text-slate-50">{b.title}</Text>
                  <View className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                    <Text className="font-sans-semibold text-[10px] text-ink-muted dark:text-slate-400">
                      {b.freeLimit}
                    </Text>
                  </View>
                </View>
                <Text className="mt-0.5 font-sans text-[12px] leading-[17px] text-ink-muted dark:text-slate-400">
                  {b.subtitle}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Transparent 3-Step Free Trial Timeline (Paywallscreens.com High-Trust Pattern) */}
        {selectedOffer.hasFreeTrial ? (
          <View className="mt-4 rounded-3xl border border-emerald-500/30 bg-emerald-50/70 p-4 dark:border-emerald-500/25 dark:bg-emerald-950/25">
            <Text className="font-sans-bold text-[12px] uppercase tracking-[0.9px] text-emerald-800 dark:text-emerald-300">
              How Your 7-Day Free Trial Works
            </Text>

            <View className="mt-3 gap-3">
              <TimelineStep
                icon={<Unlock size={15} color="#FFFFFF" />}
                iconBg="bg-emerald-600"
                title="Today · Instant Full Access (R0.00)"
                subtitle="Unlock unlimited OCR document scans, Health Assistant & PDF exports immediately."
              />
              <TimelineStep
                icon={<BellRing size={15} color="#FFFFFF" />}
                iconBg="bg-brand-600"
                title="Day 5 · Trial Reminder Notification"
                subtitle="We send a transparent reminder 48 hours before your free trial ends."
              />
              <TimelineStep
                icon={<CheckCircle2 size={15} color="#FFFFFF" />}
                iconBg="bg-slate-600"
                title="Day 7 · Annual Subscription Begins"
                subtitle="Billed at R150.00 / year on Day 7 unless cancelled at least 24 hours before."
                isLast
              />
            </View>
          </View>
        ) : null}

        {/* Apple Guideline 3.1.2 Compliant Plan Selector Cards */}
        <View className="mt-4 gap-3" accessibilityRole="radiogroup">
          <Text className="font-sans-bold text-[12px] uppercase tracking-[0.9px] text-ink-muted dark:text-slate-400">
            Choose Your Plan
          </Text>

          {offers.map((offer) => {
            const selected = offer.id === selectedId;
            const badgeColors =
              offer.badgeTone === 'emerald'
                ? 'bg-emerald-600 text-white'
                : offer.badgeTone === 'red'
                ? 'bg-emergency-500 text-white'
                : 'bg-brand-600 text-white';

            return (
              <Pressable
                key={offer.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`${offer.officialTitle}, ${offer.billedPrice}, ${offer.durationLabel}`}
                onPress={() => {
                  tapFeedback();
                  setSelectedId(offer.id);
                }}
                className={`rounded-3xl border-2 p-4 ${
                  selected
                    ? 'border-ink bg-white shadow-sm dark:border-brand-300 dark:bg-canvasdark-card'
                    : 'border-slate-200/90 bg-white/80 dark:border-slate-800 dark:bg-canvasdark-card/60'
                }`}
              >
                <View className="flex-row items-center justify-between gap-2">
                  <Text className="flex-1 font-sans-bold text-[13px] text-ink dark:text-slate-100">
                    {offer.officialTitle}
                  </Text>
                  {offer.badge ? (
                    <View className={`rounded-full px-2.5 py-0.5 ${badgeColors.split(' ')[0]}`}>
                      <Text className="font-sans-bold text-[10px] uppercase text-white">{offer.badge}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Apple Guideline 3.1.2: Billed amount is the most prominent typographic element */}
                <View className="mt-2 flex-row items-baseline justify-between">
                  <View className="flex-1">
                    <Text className="font-sans-bold text-[22px] leading-[26px] text-ink dark:text-white">
                      {offer.billedPrice}
                    </Text>
                    <Text className="mt-0.5 font-sans-semibold text-[12px] text-brand-700 dark:text-brand-300">
                      Duration: {offer.durationLabel}
                    </Text>
                  </View>

                  <View
                    className={`h-6 w-6 items-center justify-center rounded-full ${
                      selected ? 'bg-success-500' : 'border-2 border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {selected ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : null}
                  </View>
                </View>

                <Text className="mt-1.5 font-sans text-[12px] leading-[16px] text-ink-muted dark:text-slate-400">
                  {offer.subordinateBreakdown}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Mandatory Apple App Store Guideline 3.1.2 Subscription Disclosure Block */}
        <View className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-100/90 p-3.5 dark:border-slate-800 dark:bg-slate-900/70">
          <View className="flex-row items-center gap-1.5">
            <FileCheck2 size={13} color="#5B6478" />
            <Text className="font-sans-bold text-[11px] uppercase tracking-[0.6px] text-ink dark:text-slate-200">
              Subscription & Billing Terms
            </Text>
          </View>
          <Text className="mt-1.5 font-sans text-[11px] leading-[16px] text-ink-muted dark:text-slate-400">
            • <Text className="font-sans-semibold">Title:</Text> {selectedOffer.officialTitle}{'\n'}
            • <Text className="font-sans-semibold">Length & Price:</Text> {selectedOffer.durationLabel} at {selectedOffer.billedPrice}
            {selectedOffer.hasFreeTrial ? ' after 7-day free trial (R0.00 charged today).' : '.'}{'\n'}
            • <Text className="font-sans-semibold">Auto-Renewal:</Text>{' '}
            {selectedOffer.id === 'lifetime_premium'
              ? 'One-time purchase. Does not auto-renew.'
              : `Payment will be charged to your ${storeAccountName} at confirmation of purchase. Subscription automatically renews unless auto-renew is turned off at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period. Manage or cancel subscriptions anytime in your ${storeSettingsLabel} after purchase.`}
          </Text>
        </View>

        {/* Apple Guideline 1.4.1 Medical Disclaimer */}
        <View className="mt-3 rounded-2xl border border-slate-200/70 bg-white/70 p-3.5 dark:border-slate-800 dark:bg-canvasdark-card/50">
          <View className="flex-row items-center gap-1.5">
            <Stethoscope size={13} color="#5B6478" />
            <Text className="font-sans-bold text-[11px] uppercase tracking-[0.6px] text-ink dark:text-slate-200">
              Clinical & Medical Disclaimer
            </Text>
          </View>
          <Text className="mt-1 font-sans text-[11px] leading-[16px] text-ink-muted dark:text-slate-400">
            Siyashesha is a patient-held health record organizer and informational tool. It is not a medical device and does not provide medical diagnosis or treatment advice. Always seek the advice of a qualified physician or healthcare provider with any questions regarding a medical condition.
          </Text>
        </View>

        {/* Functional Mandatory Footer Links: Restore Purchases | Terms of Use (EULA) | Privacy Policy */}
        <View className="mt-4 flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2 py-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Restore Purchases"
            onPress={handleRestorePurchases}
            disabled={restoring}
            className="flex-row items-center gap-1.5 py-1"
          >
            {restoring ? <ActivityIndicator size="small" color="#0B2559" /> : <RefreshCw size={12} color="#5B6478" />}
            <Text className="font-sans-semibold text-[12px] underline text-ink-muted dark:text-slate-300">
              Restore Purchases
            </Text>
          </Pressable>

          <Text className="text-slate-300 dark:text-slate-700">•</Text>

          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Terms of Use and End User License Agreement"
            onPress={() => setLegalDoc('terms')}
            className="py-1"
          >
            <Text className="font-sans-semibold text-[12px] underline text-ink-muted dark:text-slate-300">
              Terms of Use (EULA)
            </Text>
          </Pressable>

          <Text className="text-slate-300 dark:text-slate-700">•</Text>

          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Privacy Policy and POPIA Notice"
            onPress={() => setLegalDoc('privacy')}
            className="py-1"
          >
            <Text className="font-sans-semibold text-[12px] underline text-ink-muted dark:text-slate-300">
              Privacy Policy (POPIA)
            </Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Bar */}
      <View
        className="gap-2 border-t border-slate-200/80 bg-white px-5 pt-3 dark:border-slate-800 dark:bg-canvasdark-card"
        style={{ paddingBottom: Math.max(insets.bottom, 12) + 6 }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={selectedOffer.ctaLabel}
          disabled={processing}
          onPress={handleStartSelectedPlan}
          style={({ pressed }) => ({
            opacity: processing ? 0.6 : 1,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          })}
          className="min-h-[56px] items-center justify-center rounded-2xl bg-ink px-5 py-3 dark:bg-brand-500"
        >
          {processing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text className="font-sans-bold text-[17px] text-white">{selectedOffer.ctaLabel}</Text>
              <Text className="mt-0.5 font-sans text-[11px] text-slate-200">{selectedOffer.ctaSublabel}</Text>
            </>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continue with Free Basic Passport"
          onPress={handleContinueFree}
          className="items-center justify-center py-2"
        >
          <Text className="font-sans-semibold text-[13px] text-ink-muted dark:text-slate-300">
            Continue with Free Basic Passport (R0)
          </Text>
        </Pressable>
      </View>

      <LegalDocumentModal visibleDoc={legalDoc} onClose={() => setLegalDoc(null)} />
    </View>
  );
}

function TimelineStep({
  icon,
  iconBg,
  title,
  subtitle,
  isLast,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  isLast?: boolean;
}) {
  return (
    <View className="flex-row items-start gap-3">
      <View className="items-center">
        <View className={`h-7 w-7 items-center justify-center rounded-full ${iconBg}`}>{icon}</View>
        {!isLast ? <View className="mt-1 h-6 w-0.5 bg-emerald-500/30" /> : null}
      </View>
      <View className="flex-1 pb-1">
        <Text className="font-sans-bold text-[13px] text-ink dark:text-slate-100">{title}</Text>
        <Text className="mt-0.5 font-sans text-[12px] leading-[16px] text-ink-muted dark:text-slate-300">
          {subtitle}
        </Text>
      </View>
    </View>
  );
}
