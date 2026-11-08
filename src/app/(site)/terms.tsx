/* eslint-disable react/no-unescaped-entities */
import { router } from 'expo-router';
import { Text } from 'react-native';

import { Bullets, Callout, H2, MailLink, P, SitePage } from '@/components/web/site/SitePage';
import { MUTED, NAVY, SUPPORT_EMAIL, sans } from '@/components/web/site/SiteChrome';

export default function TermsPage() {
  return (
    <SitePage
      eyebrow="Legal"
      title="Terms of use"
      intro="The agreement between you and Siyashesha for the Siyashesha Health Passport app and website, including subscription terms."
      description="Siyashesha terms of use and end user licence agreement: licence, subscriptions and billing, medical disclaimer, acceptable use and liability."
      narrow
    >
      <Text style={{ fontFamily: sans(500), fontSize: 14, color: MUTED, marginBottom: 8 }}>Last updated 8 November 2026</Text>

      <Callout tone="danger" title="Medical disclaimer">
        Siyashesha is a patient-held record organiser and information tool. It is not a medical device, does not practise medicine, and
        does not diagnose, treat or prevent any condition. Information in the app, including AI explanations, is not medical advice.
        Always consult a qualified healthcare professional before making medical decisions. In an emergency call 112 or 10177
        immediately. Do not rely on the app alone in an emergency.
      </Callout>

      <H2>1. Agreement and licence</H2>
      <P>
        By creating an account or using Siyashesha you agree to these terms. We grant you a personal, non-exclusive, non-transferable,
        revocable licence to use the app for your own personal health records. On iOS, Apple's Standard Licensed Application End User
        Licence Agreement also applies, and on Android, the Google Play Terms of Service. If they conflict with these terms on a
        point about the store, the store terms prevail.
      </P>

      <H2>2. Your account</H2>
      <P>You must be 18 or older, or have a parent or guardian's permission. Keep your sign-in secure and give accurate information. You are responsible for activity on your account.</P>

      <H2>3. Your content</H2>
      <P>You own your health information and documents. You give us permission to store, process and display them only to provide the service to you, including sharing with the people you choose and, if you consent, sending content to Google Gemini for extraction or explanation.</P>

      <H2>4. Subscriptions and billing</H2>
      <Bullets
        items={[
          'Free: emergency card and up to 10 records, at no charge.',
          'Annual Pro: 7-day free trial, then R149.99 per year. Monthly Pro: R19.99 per month. Both renew automatically.',
          'Lifetime Founder Pass: R299.99 once-off, no renewals.',
          'Payment is charged to your Apple ID or Google Play account at confirmation of purchase, or at the end of the free trial.',
          'Subscriptions renew unless auto-renew is turned off at least 24 hours before the end of the current period. Renewal is charged within 24 hours before the period ends.',
          'Manage or cancel in your Apple ID account settings or Google Play subscriptions. Refunds are handled by Apple or Google under their policies.',
          'Unused free trial time is forfeited when you purchase a subscription.',
          'If a subscription lapses you keep your data and the free features. Pro features pause until you resubscribe, and records above the free limit remain stored but read-only.',
        ]}
      />

      <H2>5. Acceptable use</H2>
      <Bullets
        items={[
          'Do not upload another person\'s records without their permission.',
          'Do not attempt to break, probe or overload the service, or access other users\' data.',
          'Do not use the service unlawfully or to harm others.',
          'Do not rely on the app as your only source of emergency information.',
        ]}
      />

      <H2>6. Emergency card</H2>
      <P>The emergency card shows the information you choose to make visible to anyone who scans it. You are responsible for keeping that information accurate and for deciding what is shown. We do not guarantee that emergency responders will see or act on it.</P>

      <H2>7. Availability and changes</H2>
      <P>We work to keep Siyashesha available but do not guarantee uninterrupted service. We may update features and these terms. If a change is material we will tell you in the app or by email, and continued use means you accept it.</P>

      <H2>8. Termination</H2>
      <P>You may stop using Siyashesha and delete your account at any time. We may suspend accounts that break these terms. On deletion your data is erased as described in the <Text onPress={() => router.navigate('/privacy')} style={{ fontFamily: sans(600), color: NAVY, textDecorationLine: 'underline' }}>privacy policy</Text>.</P>

      <H2>9. Liability</H2>
      <P>To the fullest extent allowed by South African law, the service is provided "as is", and we are not liable for indirect or consequential loss, or for any decision made using information in the app. Nothing limits liability that cannot be limited by law, including under the Consumer Protection Act.</P>

      <H2>10. Governing law</H2>
      <P>These terms are governed by the laws of the Republic of South Africa, and the South African courts have jurisdiction, without limiting any mandatory consumer rights you have where you live.</P>

      <H2>11. Contact</H2>
      <P>Questions about these terms: <MailLink email={SUPPORT_EMAIL} />.</P>
    </SitePage>
  );
}
