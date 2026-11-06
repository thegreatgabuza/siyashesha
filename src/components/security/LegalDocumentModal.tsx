import { ExternalLink, Lock } from 'lucide-react-native';
import { Linking, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type LegalDocKind = 'terms' | 'privacy' | null;

export const STATIC_PRIVACY_URL = 'https://siyashesha.co.za/privacy';
export const STATIC_TERMS_URL = 'https://siyashesha.co.za/terms';
export const APPLE_STANDARD_EULA_URL = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/';

interface LegalDocumentModalProps {
  visibleDoc: LegalDocKind;
  onClose: () => void;
}

/**
 * Reusable platform-aware in-app viewer for Siyashesha's Terms of Use (EULA + Subscription Terms)
 * and Privacy Policy (POPIA, HIPAA, Third-Party AI Consent & Right to Erasure), with direct
 * links to the static HTML web documents and Apple's Standard Licensed Application EULA.
 */
export function LegalDocumentModal({ visibleDoc, onClose }: LegalDocumentModalProps) {
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === 'android';
  const storeAccountName = isAndroid ? 'Google Play account' : 'Apple ID / App Store account';
  const storeSettingsName = isAndroid ? 'Google Play Subscriptions settings' : 'Apple ID Account Settings';
  const biometricHardwareName = isAndroid
    ? 'Android Biometrics & Hardware Keystore'
    : 'Face ID / Touch ID & Secure Enclave';

  const openExternalUrl = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <Modal
      visible={visibleDoc !== null}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-slate-50 dark:bg-canvasdark" style={{ paddingTop: insets.top + 12 }}>
        <View className="flex-row items-center justify-between border-b border-slate-200 px-5 pb-3 dark:border-slate-800">
          <View className="flex-row items-center gap-2">
            <Lock size={16} color="#0B2559" />
            <Text className="font-sans-bold text-[17px] text-ink dark:text-slate-50">
              {visibleDoc === 'terms' ? 'Terms of Use (EULA)' : 'Privacy Policy & POPIA Notice'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close legal document"
            onPress={onClose}
            className="rounded-full bg-slate-200/80 px-3.5 py-1.5 dark:bg-slate-800"
          >
            <Text className="font-sans-bold text-[13px] text-ink dark:text-slate-100">Done</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 py-4" contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Direct Static Web HTML Link Banner (App Store Review Requirement) */}
          <View className="mb-4 flex-row flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-canvasdark-card">
            <View className="flex-1">
              <Text className="font-sans-bold text-[12px] text-ink dark:text-slate-100">
                {visibleDoc === 'terms' ? 'Official Web Terms & Apple EULA' : 'Official Static Web Privacy Policy'}
              </Text>
              <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">
                {visibleDoc === 'terms' ? STATIC_TERMS_URL : STATIC_PRIVACY_URL}
              </Text>
            </View>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Open static web document in browser"
              onPress={() => openExternalUrl(visibleDoc === 'terms' ? STATIC_TERMS_URL : STATIC_PRIVACY_URL)}
              className="flex-row items-center gap-1.5 rounded-xl bg-ink px-3 py-2 dark:bg-brand-500"
            >
              <ExternalLink size={13} color="#FFFFFF" />
              <Text className="font-sans-semibold text-[11px] text-white">Open Web HTML</Text>
            </Pressable>
          </View>
          {visibleDoc === 'terms' && !isAndroid ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Open Apple Standard End User License Agreement"
              onPress={() => openExternalUrl(APPLE_STANDARD_EULA_URL)}
              className="mb-4 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 dark:border-slate-800 dark:bg-canvasdark-card"
            >
              <Text className="font-sans-semibold text-[12px] text-brand-700 dark:text-brand-300">
                View Apple Standard Licensed Application EULA
              </Text>
              <ExternalLink size={13} color="#0284C7" />
            </Pressable>
          ) : null}
          {visibleDoc === 'terms' ? (
            <View className="gap-4">
              <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">
                1. End-User License Agreement (EULA)
              </Text>
              <Text className="font-sans text-[13px] leading-[20px] text-ink-muted dark:text-slate-300">
                This End-User License Agreement (&ldquo;EULA&rdquo;) governs your use of the Siyashesha Health Passport mobile application. By creating a passport or subscribing to Siyashesha Health Passport Pro, you agree to these terms and the applicable platform store terms ({isAndroid ? 'Google Play Terms of Service' : 'Apple’s Standard Licensed Application End User License Agreement'}).
              </Text>

              <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">
                2. Auto-Renewable Subscriptions & Billing
              </Text>
              <Text className="font-sans text-[13px] leading-[20px] text-ink-muted dark:text-slate-300">
                • Siyashesha offers optional Pro tiers: Annual Pro (R149.99 / year after a 7-day free trial; Product ID za.co.siyashesha.healthpassport.annual_premium), Monthly Pro (R19.99 / month; Product ID za.co.siyashesha.healthpassport.monthly_premium), and a Lifetime Founder Pass (R299.99 once-off; Product ID za.co.siyashesha.healthpassport.lifetime_premium).{'\n'}
                • Payment is charged to your {storeAccountName} at confirmation of purchase, or at the conclusion of the 7-day free trial period.{'\n'}
                • Subscriptions automatically renew unless auto-renew is turned off at least 24 hours before the end of the current billing period.{'\n'}
                • Your account will be charged for renewal within 24 hours prior to the end of the current period.{'\n'}
                • Any unused portion of a free trial period will be forfeited when you purchase a subscription. You can manage or cancel your subscription at any time in your {storeSettingsName}.
              </Text>

              <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">
                3. Medical & Clinical Disclaimer (Guideline 1.4.1)
              </Text>
              <Text className="font-sans text-[13px] leading-[20px] text-ink-muted dark:text-slate-300">
                Siyashesha is designed solely to help patients organize their personal medical records, medication schedules, and emergency contact details. Siyashesha is not a medical device, does not practice medicine, and does not provide medical diagnosis or treatment advice. Always seek the advice of a qualified physician or healthcare professional in addition to using this app and before making any medical decisions. In a medical emergency, call 10177 / 112 immediately.
              </Text>
            </View>
          ) : (
            <View className="gap-4">
              <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">
                1. Protection of Personal Information Act (POPIA) & Row-Level Isolation
              </Text>
              <Text className="font-sans text-[13px] leading-[20px] text-ink-muted dark:text-slate-300">
                Under South Africa’s Protection of Personal Information Act (POPIA) and international health privacy standards, your medical records, allergies, chronic conditions, and prescriptions constitute Special Personal Information. Every database record and storage file is strictly isolated to your authenticated user ID using Row-Level Security (RLS).
              </Text>

              <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">
                2. Device Permissions & Data Minimization (Guideline 5.1.1)
              </Text>
              <Text className="font-sans text-[13px] leading-[20px] text-ink-muted dark:text-slate-300">
                • Camera & Photo Library: Used only when you choose to scan or attach a medical document.{'\n'}
                • Contacts: Used only when you choose to select an emergency contact (ICE) from your address book; your full contact list is never uploaded.{'\n'}
                • Microphone: Used only when you record voice dictation notes in your Health Diary.{'\n'}
                • {biometricHardwareName}: Handled strictly by the operating system’s hardware security module; Siyashesha never accesses raw biometric templates.
              </Text>

              <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">
                3. Third-Party Cloud AI Disclosure (Guideline 5.1.2(i))
              </Text>
              <Text className="font-sans text-[13px] leading-[20px] text-ink-muted dark:text-slate-300">
                Cloud AI features (Siyashesha Assistant and multimodal OCR) are powered by Google LLC (Google Gemini API) and operate strictly on an explicit opt-in basis. No clinical context or document image is sent to Google Gemini unless you explicitly grant AI consent, and you may use On-Device Offline Mode or revoke consent at any time in Settings → Security.
              </Text>

              <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">
                4. Account Deletion & Right to Erasure (Guideline 5.1.1(v) & POPIA §24)
              </Text>
              <Text className="font-sans text-[13px] leading-[20px] text-ink-muted dark:text-slate-300">
                You may export a complete archive of your records (PDF, CSV, JSON) or permanently delete your account and erase all local and cloud data at any time from Profile or Settings → Delete Account & Erase Data.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
