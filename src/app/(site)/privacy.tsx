/* eslint-disable react/no-unescaped-entities */
import { router } from 'expo-router';
import { Text } from 'react-native';

import { Bullets, Callout, H2, MailLink, P, SitePage } from '@/components/web/site/SitePage';
import { MUTED, PRIVACY_EMAIL, SUPPORT_EMAIL, sans } from '@/components/web/site/SiteChrome';

export default function PrivacyPage() {
  return (
    <SitePage
      eyebrow="Legal"
      title="Privacy policy"
      intro="How Siyashesha collects, uses, shares and protects your personal information, including health information, under POPIA."
      description="Siyashesha privacy policy: what we collect, how we use it, who we share it with, retention, your rights under POPIA and how to delete your account."
      narrow
    >
      <Text style={{ fontFamily: sans(500), fontSize: 14, color: MUTED, marginBottom: 8 }}>Last updated 8 November 2026</Text>

      <H2>1. Who we are</H2>
      <P>
        Siyashesha ("we", "us") provides the Siyashesha Health Passport app for iOS, Android and the web. We are the responsible party
        for personal information processed through the service under the Protection of Personal Information Act 4 of 2013 (POPIA).
        Contact our information officer at <MailLink email={PRIVACY_EMAIL} />.
      </P>

      <H2>2. Information we collect</H2>
      <Bullets
        items={[
          <Text key="a"><Text style={{ fontFamily: sans(600) }}>Account:</Text> your email address and sign-in details, handled by Clerk.</Text>,
          <Text key="b"><Text style={{ fontFamily: sans(600) }}>Profile and health information you enter:</Text> name, date of birth, blood group, allergies, chronic conditions, medications, emergency contacts, appointments and diary notes.</Text>,
          <Text key="c"><Text style={{ fontFamily: sans(600) }}>Documents:</Text> lab results, prescriptions and images you scan or upload, plus the text extracted from them.</Text>,
          <Text key="d"><Text style={{ fontFamily: sans(600) }}>Subscription status:</Text> your plan, product ID and transaction ID from the App Store or Google Play. We never see your payment card details.</Text>,
          <Text key="e"><Text style={{ fontFamily: sans(600) }}>Device information:</Text> a push notification token if you enable reminders, and your chosen language and settings.</Text>,
          <Text key="f"><Text style={{ fontFamily: sans(600) }}>Audit log:</Text> a record of sign-ins, shares and settings changes in your account.</Text>,
        ]}
      />
      <P>We do not collect your precise location, we do not use advertising identifiers, and we do not track you across other apps or websites.</P>

      <H2>3. Device permissions</H2>
      <Bullets
        items={[
          'Camera and photo library: only when you scan or attach a document.',
          'Contacts: only when you pick an emergency contact. Your full address book is never uploaded.',
          'Microphone: only when you dictate a diary note.',
          'Notifications: only for the reminders you turn on.',
          'Face ID, Touch ID or Android biometrics: handled by your device. We never receive biometric data.',
        ]}
      />

      <H2>4. How we use information</H2>
      <Bullets
        items={[
          'To provide the passport, emergency card, record vault, reminders and sharing features.',
          'To sync your data securely between your devices.',
          'To verify your subscription and prevent fraud.',
          'To respond to support requests and keep the service secure.',
        ]}
      />
      <P>We do not sell your personal information and we do not use health information for advertising.</P>

      <H2>5. Who we share it with</H2>
      <Bullets
        items={[
          <Text key="s1"><Text style={{ fontFamily: sans(600) }}>Service providers (operators)</Text> that process data on our behalf under written agreements: Supabase (database and file storage), Clerk (authentication), Expo (push notifications and app delivery), and Apple and Google (purchases).</Text>,
          <Text key="s2"><Text style={{ fontFamily: sans(600) }}>Google Gemini (AI):</Text> only if you give consent, the content of a document or question you submit is sent to Google Gemini to produce text extraction or an explanation. You can withdraw consent in Settings at any time. Without consent, nothing is sent.</Text>,
          <Text key="s3"><Text style={{ fontFamily: sans(600) }}>People you choose:</Text> clinician share links you create are PIN-protected, expire, and can be revoked. Your emergency card shows only the fields you choose to make visible.</Text>,
          <Text key="s4"><Text style={{ fontFamily: sans(600) }}>Legal:</Text> where required by law or to protect someone's life or safety.</Text>,
        ]}
      />

      <H2>6. Security</H2>
      <P>Data is encrypted in transit and at rest. Every table and storage bucket uses row-level security so records are only accessible by the account that owns them. Share links are time-limited and PIN-protected. No system is perfectly secure, and we will notify you and the Information Regulator of a breach as required by POPIA.</P>

      <H2>7. Retention and deletion</H2>
      <P>We keep your information while your account is active. When you delete your account, your profile, records, documents, shares and subscription link are permanently erased from our systems, and backups are purged within 30 days. We may keep minimal records we are legally required to keep (for example, proof of a transaction).</P>
      <Callout title="Delete your account">
        You can delete your account and all data from the app (More, then Delete account) or from our{' '}
        <Text onPress={() => router.navigate('/delete-account')} style={{ fontFamily: sans(600), textDecorationLine: 'underline' }}>account deletion page</Text>.
      </Callout>

      <H2>8. Your rights</H2>
      <P>Under POPIA you may ask to access, correct, delete or restrict the processing of your information, object to processing, and withdraw consent. You can export your data in the app. To exercise a right, email <MailLink email={PRIVACY_EMAIL} />. You may also complain to the Information Regulator (South Africa) at inforeg.org.za.</P>

      <H2>9. Children</H2>
      <P>Siyashesha is intended for people aged 18 and over. A parent or guardian may keep a passport on behalf of a child. We do not knowingly collect information from children without parental involvement. Contact us if you believe a child has created an account.</P>

      <H2>10. International transfers</H2>
      <P>Our service providers may process data outside South Africa. Where they do, we require protections that meet POPIA's conditions for transfer.</P>

      <H2>11. Cookies and local storage</H2>
      <P>The website uses browser local storage only to keep you signed in and remember your settings. We do not use advertising or tracking cookies.</P>

      <H2>12. Changes</H2>
      <P>We will post changes here and update the date above. For material changes we will notify you in the app or by email.</P>

      <H2>13. Contact</H2>
      <P>
        Privacy: <MailLink email={PRIVACY_EMAIL} />. General support: <MailLink email={SUPPORT_EMAIL} />.
      </P>
    </SitePage>
  );
}
