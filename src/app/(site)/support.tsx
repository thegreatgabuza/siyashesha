import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Bullets, Callout, CtaButton, H2, MailLink, P, SitePage } from '@/components/web/site/SitePage';
import { INK, LINE, MUTED, NAVY, SUPPORT_EMAIL, sans } from '@/components/web/site/SiteChrome';

const faqs = [
  ['How do I show my emergency card to a paramedic?', 'Open the app and tap the emergency card on Home. It opens a full-screen view with your QR code. Anyone can scan the QR code to see the fields you made visible, without logging in.'],
  ['How do I share records with my doctor?', 'In the app go to More, then Sharing. Choose the records, set how long the link lasts (24 hours to 30 days), and share the link and PIN. You can revoke it at any time.'],
  ['I forgot how I signed in.', 'Siyashesha uses an email one-time code. Enter your email on the sign-in screen and we will send a fresh code. There is no password.'],
  ['How do I restore my purchase on a new phone?', 'Sign in, then open More, Billing, and tap Restore purchases. Make sure you are using the same Apple ID or Google account that bought it.'],
  ['How do I cancel my subscription?', 'Cancel in your Apple ID account settings (iOS) or Google Play, Payments and subscriptions (Android). Deleting the app does not cancel it.'],
  ['How do I export or delete my data?', 'Both are in the app under More, Settings. You can also request deletion on the delete account page.'],
];

export default function SupportPage() {
  return (
    <SitePage
      eyebrow="Support"
      title="How can we help?"
      intro="Answers to common questions, and how to reach a real person."
      description="Siyashesha support: contact details, frequently asked questions, safety reporting and emergency numbers."
      narrow
    >
      <Callout tone="danger" title="In an emergency">
        Call 112 or, in South Africa, 10177 for an ambulance. Siyashesha does not contact emergency services for you.
      </Callout>

      <H2>Contact us</H2>
      <Bullets
        items={[
          <Text key="1">General help and billing: <MailLink email={SUPPORT_EMAIL} subject="Siyashesha support" /></Text>,
          <Text key="2">Privacy requests: <MailLink email="privacy@siyashesha.co.za" subject="Privacy request" /></Text>,
          <Text key="3">Report a safety or content issue: <MailLink email="safety@siyashesha.co.za" subject="Siyashesha safety report" /></Text>,
        ]}
      />
      <P>We reply within 24 hours on business days. Please do not email medical records or your sign-in codes.</P>

      <H2>Frequently asked questions</H2>
      <View style={{ gap: 12 }}>
        {faqs.map(([q, a]) => (
          <View key={q} style={{ padding: 20, borderRadius: 16, borderWidth: 1, borderColor: LINE, backgroundColor: '#F8FAFC' }}>
            <Text style={{ fontFamily: sans(600), fontSize: 16, color: NAVY }}>{q}</Text>
            <Text style={{ fontFamily: sans(400), fontSize: 15, lineHeight: 24, color: INK, marginTop: 6 }}>{a}</Text>
          </View>
        ))}
      </View>

      <H2>More</H2>
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        <CtaButton label="Delete your account" secondary onPress={() => router.navigate('/delete-account')} />
        <CtaButton label="Privacy policy" secondary onPress={() => router.navigate('/privacy')} />
        <CtaButton label="Terms of use" secondary onPress={() => router.navigate('/terms')} />
      </View>
      <Text style={{ fontFamily: sans(400), fontSize: 13, color: MUTED, marginTop: 24 }}>
        Siyashesha is an information and record-keeping tool, not a medical service.
      </Text>
    </SitePage>
  );
}
