/* eslint-disable react/no-unescaped-entities */
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { Bullets, Callout, CtaButton, H2, MailLink, P, SitePage } from '@/components/web/site/SitePage';
import { INK, LINE, NAVY, PRIVACY_EMAIL, goSignIn, sans } from '@/components/web/site/SiteChrome';

const steps = [
  'Open Siyashesha and sign in (on the web, choose Log in).',
  'Go to More, then Delete account.',
  'Confirm. Your account and all data are erased immediately.',
];

export default function DeleteAccountPage() {
  return (
    <SitePage
      eyebrow="Account"
      title="Delete your account and data"
      intro="You can permanently delete your Siyashesha account and everything stored in it, at any time."
      description="How to delete your Siyashesha account and data in the app, or by emailing a deletion request. What is erased and how long it takes."
      narrow
    >
      <H2>Option 1: delete it yourself, in the app</H2>
      <View style={{ gap: 12 }}>
        {steps.map((s, i) => (
          <View key={s} style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 18, borderRadius: 16, borderWidth: 1, borderColor: LINE, backgroundColor: '#F8FAFC' }}>
            <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: sans(600), fontSize: 14, color: '#FFFFFF' }}>{i + 1}</Text>
            </View>
            <Text style={{ flex: 1, fontFamily: sans(500), fontSize: 16, color: INK }}>{s}</Text>
          </View>
        ))}
      </View>
      <View style={{ marginTop: 20 }}>
        <CtaButton label="Log in to delete" onPress={goSignIn} />
      </View>

      <H2>Option 2: request deletion by email</H2>
      <P>
        If you can't sign in, email <MailLink email={PRIVACY_EMAIL} subject="Account deletion request" /> from the email address on your
        account with the subject "Account deletion request". We will verify it is you, then delete your account within 30 days. We confirm by email when it's done.
      </P>

      <H2>What is deleted</H2>
      <Bullets
        items={[
          'Your profile, emergency card and contacts.',
          'All records and the original files you uploaded.',
          'Medications, reminders, appointments and diary notes.',
          'Clinician share links, which stop working immediately.',
          'Your sign-in account and push notification token.',
          'Backups are purged within 30 days.',
        ]}
      />
      <H2>What we may keep</H2>
      <P>Minimal records we are legally required to keep, such as proof of a purchase transaction. These do not contain your health information.</P>

      <Callout title="Subscriptions are separate">
        Deleting your account does not cancel an App Store or Google Play subscription. Cancel it in your Apple ID or Google Play settings first so you are not billed again.
      </Callout>
      <Text
        onPress={() => router.navigate('/privacy')}
        style={{ fontFamily: sans(600), fontSize: 15, color: NAVY, textDecorationLine: 'underline', marginTop: 12 }}
      >
        Read the privacy policy
      </Text>
    </SitePage>
  );
}
