import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Text, useWindowDimensions, View } from 'react-native';

import { Bullets, CtaButton, H2, P, SitePage } from '@/components/web/site/SitePage';
import { INK, LINE, MUTED, NAVY, TEAL, goSignUp, sans } from '@/components/web/site/SiteChrome';

const plans = [
  { name: 'Free', price: 'R0', note: 'Always free', items: ['Emergency ICE card and QR', 'Up to 10 records', 'Medication reminders', 'Calendar and diary'] },
  { name: 'Monthly Pro', price: 'R19.99', note: 'per month, auto-renewing', items: ['Unlimited records and scanning', 'Health assistant', 'PDF and CSV exports', 'PIN-protected clinician shares'] },
  { name: 'Annual Pro', price: 'R149.99', note: 'per year after a 7-day free trial', items: ['Everything in Monthly', 'Equivalent to R12.50 per month', 'Save 38% against monthly'], featured: true },
  { name: 'Lifetime', price: 'R299.99', note: 'once-off, no renewals', items: ['Everything in Pro, forever', 'Founder pass', 'No recurring charges'] },
];

export default function PricingPage() {
  const { width } = useWindowDimensions();
  const wide = width >= 1000;
  return (
    <SitePage
      eyebrow="Pricing"
      title="Simple, transparent pricing"
      intro="The emergency card is free for everyone. Upgrade only if you want unlimited records and the assistant."
      description="Siyashesha pricing: Free, Monthly Pro R19.99, Annual Pro R149.99 with a 7-day free trial, and a once-off Lifetime pass R299.99."
    >
      <View style={{ flexDirection: wide ? 'row' : 'column', gap: 16, flexWrap: 'wrap' }}>
        {plans.map((p) => (
          <View
            key={p.name}
            style={{
              flex: wide ? 1 : undefined,
              minWidth: wide ? 220 : undefined,
              padding: 28,
              borderRadius: 20,
              backgroundColor: p.featured ? NAVY : '#FFFFFF',
              borderWidth: 1,
              borderColor: p.featured ? NAVY : LINE,
            }}
          >
            <Text style={{ fontFamily: sans(600), fontSize: 14, color: p.featured ? '#C7D2EA' : MUTED }}>{p.name}</Text>
            <Text style={{ fontFamily: sans(500), fontSize: 38, letterSpacing: -1, color: p.featured ? '#FFFFFF' : NAVY, marginTop: 10 }}>{p.price}</Text>
            <Text style={{ fontFamily: sans(400), fontSize: 13, color: p.featured ? '#C7D2EA' : MUTED, marginTop: 4 }}>{p.note}</Text>
            <View style={{ gap: 10, marginTop: 24 }}>
              {p.items.map((i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <Check size={16} color={p.featured ? '#6EE7B7' : TEAL} strokeWidth={3} style={{ marginTop: 3 }} />
                  <Text style={{ flex: 1, fontFamily: sans(400), fontSize: 14, lineHeight: 21, color: p.featured ? '#E4EAF7' : INK }}>{i}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
      <View style={{ marginTop: 32 }}>
        <CtaButton label="Get started free" onPress={() => goSignUp()} />
      </View>

      <H2>Subscription terms</H2>
      <Bullets
        items={[
          'Purchases are made in the iOS or Android app and charged to your Apple ID or Google Play account.',
          'Annual Pro starts with a 7-day free trial (R0.00 today), then R149.99 per year. Monthly Pro is R19.99 per month.',
          'Subscriptions renew automatically unless auto-renew is turned off at least 24 hours before the end of the current period. Your account is charged for renewal within 24 hours before the period ends.',
          'Manage or cancel any time in your Apple ID account settings or Google Play subscriptions. Deleting the app does not cancel a subscription.',
          'Lifetime is a single payment and does not renew.',
          'Any unused part of a free trial is forfeited when you buy a subscription.',
          'Use Restore purchases in the app (onboarding paywall or Settings, Billing) on a new device to recover an active plan.',
          'Prices are in South African rand and may differ by country in the store.',
        ]}
      />
      <P>
        By subscribing you agree to the{' '}
        <Text onPress={() => router.navigate('/terms')} style={{ fontFamily: sans(600), color: NAVY, textDecorationLine: 'underline' }}>Terms of use</Text> and the{' '}
        <Text onPress={() => router.navigate('/privacy')} style={{ fontFamily: sans(600), color: NAVY, textDecorationLine: 'underline' }}>Privacy policy</Text>.
      </P>
    </SitePage>
  );
}
