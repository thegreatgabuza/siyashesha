import { router } from 'expo-router';
import {
  Check,
  CheckCircle2,
  CreditCard,
  Download,
  Flame,
  Receipt,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useToast } from '@/components/ui/Toast';
import { Txt } from '@/components/ui/Txt';
import { elevation, fonts, radii } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';

export type PlanId = 'free' | 'monthly_premium' | 'annual_premium' | 'lifetime_premium';

interface Plan {
  id: PlanId;
  name: string;
  price: string;
  billing: string;
  badge?: string;
  badgeColor?: string;
  features: string[];
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 'R0',
    billing: 'Free forever',
    features: [
      'Digital ICE Emergency Card & QR code',
      'Up to 10 stored health documents in vault',
      'Daily medication reminders & adherence',
      'Basic clinical visit timeline',
    ],
  },
  {
    id: 'monthly_premium',
    name: 'Monthly Premium',
    price: 'R20',
    billing: 'Every month',
    features: [
      'Unlimited encrypted health documents',
      'Siyashesha AI Assistant with lab report analysis',
      'Emergency responder dispatch & ICE alert beacon',
      'Doctor & clinic QR access sharing with auto-expiry',
      'Offline biometric cryptographic passport access',
    ],
  },
  {
    id: 'annual_premium',
    name: 'Annual Premium',
    price: 'R150',
    billing: 'Every 12 months',
    badge: 'Save 38% · Best Value',
    badgeColor: '#16A34A',
    features: [
      'Everything in Monthly Premium',
      'Save R90 compared to monthly billing',
      'Priority customer & clinical support',
      'Full annual health record export (PDF)',
    ],
  },
  {
    id: 'lifetime_premium',
    name: 'Lifetime Premium',
    price: 'R299',
    billing: 'One-time payment (launch promotion)',
    badge: 'Launch Promotion',
    badgeColor: '#DC1F26',
    features: [
      'All Premium features with no recurring charges',
      'Guaranteed lifetime access to future updates',
      'One-time payment of R299 — never pay again',
      'Founder member badge on health passport',
    ],
  },
];

const invoices = [
  { id: 'inv-104', date: '15 Oct 2026', desc: 'Monthly Premium', amount: 'R 20.00', status: 'Paid' },
  { id: 'inv-103', date: '15 Sep 2026', desc: 'Monthly Premium', amount: 'R 20.00', status: 'Paid' },
  { id: 'inv-102', date: '15 Aug 2026', desc: 'Monthly Premium', amount: 'R 20.00', status: 'Paid' },
];

export default function BillingScreen() {
  const t = useTokens();
  const toast = useToast();
  const [currentPlan, setCurrentPlan] = useState<PlanId>('monthly_premium');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const activePlanData = plans.find((p) => p.id === currentPlan) ?? plans[1];

  const handleDownloadInvoice = (id: string, date: string) => {
    setDownloadingId(id);
    setTimeout(() => {
      setDownloadingId(null);
      toast.show(`Invoice #${id} (${date}) downloaded`, 'success');
    }, 700);
  };

  const handleChangePlan = (plan: Plan) => {
    if (plan.id === currentPlan) return;
    Alert.alert(
      'Confirm Plan Change',
      `Switch your subscription to ${plan.name} (${plan.price} · ${plan.billing})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setCurrentPlan(plan.id);
            toast.show(`Switched to ${plan.name}`, 'success');
          },
        },
      ]
    );
  };

  const handleUpdatePayment = () => {
    Alert.alert('Payment Method', 'Update your debit/credit card or switch to Instant EFT / Capitec Pay?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Update Details', onPress: () => toast.show('Payment details updated', 'success') },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.canvas }}>
      <ScreenHeader title="Subscription & Billing" onBack={() => router.back()} />
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
                ACTIVE
              </Txt>
            </View>
          </View>

          <Txt variant="title" tone="onNavy" style={{ marginTop: 8 }}>
            {activePlanData.name}
          </Txt>
          <Txt variant="callout" color="#CBD5E1">
            {activePlanData.price} · {activePlanData.billing}
            {currentPlan === 'monthly_premium' ? ' · Renews 15 Nov 2026' : ''}
            {currentPlan === 'annual_premium' ? ' · Renews 15 Oct 2027' : ''}
          </Txt>

          <View style={{ height: 1, backgroundColor: 'rgba(255, 255, 255, 0.12)', marginVertical: 16 }} />

          <View style={{ gap: 8 }}>
            {activePlanData.features.slice(0, 3).map((feat) => (
              <View key={feat} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Check size={16} color="#38BDF8" />
                <Txt variant="footnote" tone="onNavy">
                  {feat}
                </Txt>
              </View>
            ))}
          </View>
        </View>

        {/* Payment Method */}
        {currentPlan !== 'free' ? (
          <View style={{ marginTop: 24 }}>
            <SectionHeader title="Payment Method" />
            <View
              style={[
                {
                  borderRadius: radii.xl,
                  backgroundColor: t.surface,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                },
                elevation[1],
              ]}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radii.md,
                  backgroundColor: 'rgba(14, 116, 144, 0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CreditCard size={22} color="#0E7490" />
              </View>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">Visa ending in 4112</Txt>
                <Txt variant="footnote" tone="muted">
                  Expires 08/28 · Primary payment method
                </Txt>
              </View>
              <PressableScale
                onPress={handleUpdatePayment}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: radii.pill,
                  backgroundColor: t.surfaceMuted,
                }}
              >
                <Txt variant="footnote" style={{ fontFamily: fonts.medium }}>
                  Update
                </Txt>
              </PressableScale>
            </View>
          </View>
        ) : null}

        {/* Available Plans List */}
        <View style={{ marginTop: 28 }}>
          <SectionHeader title="Subscription Plans" />
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
                        <Txt variant="headline">{plan.name}</Txt>
                        {isLifetime ? <Flame size={16} color="#DC1F26" /> : null}
                        {isAnnual ? <Zap size={16} color="#16A34A" /> : null}
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

                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
                        <Txt variant="title" style={{ fontFamily: fonts.bold }}>
                          {plan.price}
                        </Txt>
                        <Txt variant="callout" tone="muted">
                          · {plan.billing}
                        </Txt>
                      </View>
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
                          paddingHorizontal: 16,
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

        {/* Billing History */}
        <View style={{ marginTop: 28 }}>
          <SectionHeader title="Billing History" />
          <View style={[{ borderRadius: radii.xl, backgroundColor: t.surface, overflow: 'hidden' }, elevation[1]]}>
            {invoices.map((inv, index) => (
              <View
                key={inv.id}
                style={[
                  {
                    padding: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  },
                  index > 0 ? { borderTopWidth: 1, borderTopColor: t.border } : {},
                ]}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: radii.md,
                    backgroundColor: t.surfaceMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Receipt size={18} color={t.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong">{inv.desc}</Txt>
                  <Txt variant="footnote" tone="muted">
                    {inv.date} · #{inv.id}
                  </Txt>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Txt variant="bodyStrong">{inv.amount}</Txt>
                  <PressableScale
                    onPress={() => handleDownloadInvoice(inv.id, inv.date)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Download size={12} color={t.accent} />
                    <Txt variant="footnote" color={t.accent} style={{ fontFamily: fonts.medium }}>
                      {downloadingId === inv.id ? 'Saving...' : 'Receipt'}
                    </Txt>
                  </PressableScale>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* PCI-DSS & Security Note */}
        <View style={{ marginTop: 24, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 4 }}>
          <ShieldCheck size={18} color="#16A34A" />
          <Txt variant="footnote" tone="muted" style={{ flex: 1 }}>
            Payments processed securely with PCI-DSS 256-bit encryption. Cancel or modify anytime.
          </Txt>
        </View>
      </ScreenScroll>
    </View>
  );
}
