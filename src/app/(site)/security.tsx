import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { Bullets, CtaButton, H2, P, SitePage } from '@/components/web/site/SitePage';
import { INK, LINE, MUTED, NAVY, TEAL, goSignUp, sans } from '@/components/web/site/SiteChrome';

const points = [
  ['Email one-time code sign-in', 'No passwords to leak. Sign-in is handled by Clerk.'],
  ['Isolated by account', 'Row-level security on every database table and storage bucket, so your data is only readable by you.'],
  ['PIN-protected, expiring doctor links', 'Shares last 24 hours to 30 days, require a PIN, and can be revoked instantly.'],
  ['Consent before AI', 'Documents are only sent to Google Gemini after you opt in, and you can turn it off at any time.'],
  ['Biometric lock', 'Optionally lock the app with Face ID, Touch ID or Android biometrics. Siyashesha never sees your biometric data.'],
  ['Export or erase everything', 'Download a copy of your data, or permanently delete your account, from Settings or the web.'],
];

export default function SecurityPage() {
  return (
    <SitePage
      eyebrow="Security and privacy"
      title="You own your data"
      intro="Health information is special personal information under POPIA. We treat it that way."
      description="How Siyashesha protects your health data: account isolation, expiring PIN-protected shares, consented AI, biometric lock and full export or erasure."
      narrow
    >
      <View style={{ gap: 14 }}>
        {points.map(([t, b]) => (
          <View key={t} style={{ flexDirection: 'row', gap: 14, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: LINE, backgroundColor: '#F8FAFC' }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#E6F4F1', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
              <Check size={14} color={TEAL} strokeWidth={3} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: sans(600), fontSize: 17, color: NAVY }}>{t}</Text>
              <Text style={{ fontFamily: sans(400), fontSize: 15, lineHeight: 23, color: MUTED, marginTop: 4 }}>{b}</Text>
            </View>
          </View>
        ))}
      </View>

      <H2>Where your data lives</H2>
      <P>Account data and documents are stored in a managed Postgres database and encrypted object storage (Supabase). Sign-in is provided by Clerk. Data is encrypted in transit with TLS and encrypted at rest.</P>

      <H2>Your rights</H2>
      <Bullets
        items={[
          'Access and export your data at any time.',
          'Correct or delete your information.',
          'Withdraw AI consent at any time.',
          'Delete your account and all associated data permanently.',
        ]}
      />
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
        <CtaButton label="Read the privacy policy" secondary onPress={() => router.navigate('/privacy')} />
        <CtaButton label="Delete your account" secondary onPress={() => router.navigate('/delete-account')} />
        <CtaButton label="Create passport" onPress={() => goSignUp()} />
      </View>
      <Text style={{ fontFamily: sans(400), fontSize: 13, color: INK, marginTop: 24 }}>
        Found a vulnerability? Email security reports to safety@siyashesha.co.za.
      </Text>
    </SitePage>
  );
}
