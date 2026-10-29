import { Lock } from 'lucide-react-native';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type LegalDocKind = 'terms' | 'privacy' | null;

interface LegalDocumentModalProps {
  visibleDoc: LegalDocKind;
  onClose: () => void;
}

/**
 * Reusable platform-aware in-app viewer for Siyashesha's Terms of Use (EULA + Subscription Terms)
 * and Privacy Policy (POPIA, HIPAA, Third-Party AI Consent & Right to Erasure).
 */
export function LegalDocumentModal({ visibleDoc, onClose }: LegalDocumentModalProps) {
  const insets = useSafeAreaInsets();
  const isAndroid = Platform.OS === 'android';
  const storeAccountName = isAndroid ? 'Google Play account' : 'Apple ID / App Store account';
  const storeSettingsName = isAndroid ? 'Google Play Subscriptions settings' : 'Apple ID Account Settings';
  const biometricHardwareName = isAndroid
    ? 'Android Biometrics & Hardware Keystore'
    : 'Face ID / Touch ID & Secure Enclave';

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
                • Siyashesha offers optional Pro tiers: Annual Pro (R150.00 / year with a 7-day free trial), Monthly Pro (R20.00 / month), and a Lifetime Founder Pass (R299.00 one-time purchase).{'\n'}
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
