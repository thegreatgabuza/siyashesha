import { CheckCircle2, Lock, ShieldCheck, Smartphone, Sparkles, X } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tapFeedback } from '@/lib/feedback';

interface AiConsentModalProps {
  visible: boolean;
  featureTitle?: string;
  onAllowCloudAi: () => void;
  onUseOnDeviceOnly: () => void;
  onClose: () => void;
}

/**
 * Apple App Store Guideline 5.1.2(i) Compliance Modal:
 * Explicitly discloses what personal/health data is shared, identifies the third-party
 * AI service (Google Gemini API), and obtains explicit opt-in permission before sending
 * any data off-device, while offering a 100% on-device offline alternative.
 */
export function AiConsentModal({
  visible,
  featureTitle = 'AI Health Assistant & Smart OCR',
  onAllowCloudAi,
  onUseOnDeviceOnly,
  onClose,
}: AiConsentModalProps) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-slate-950/60">
        <View
          className="max-h-[90%] rounded-t-[32px] bg-white px-5 pt-5 dark:bg-canvasdark-card"
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-slate-200/80 pb-4 dark:border-slate-800">
            <View className="flex-row items-center gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/20">
                <Sparkles size={20} color="#0284C7" />
              </View>
              <View>
                <Text className="font-sans-bold text-[17px] text-ink dark:text-slate-50">
                  AI Data Privacy & Permission
                </Text>
                <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">
                  {featureTitle}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close AI consent dialog"
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <X size={18} color="#5B6478" />
            </Pressable>
          </View>

          <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
            {/* Core Disclosure Banner */}
            <View className="rounded-2xl border border-sky-500/25 bg-sky-50/70 p-4 dark:border-sky-500/20 dark:bg-sky-950/30">
              <View className="flex-row items-center gap-2">
                <ShieldCheck size={17} color="#0284C7" />
                <Text className="font-sans-bold text-[13px] text-sky-900 dark:text-sky-200">
                  Explicit Permission Required (POPIA & Apple Privacy)
                </Text>
              </View>
              <Text className="mt-1.5 font-sans text-[12px] leading-[18px] text-sky-950/80 dark:text-sky-100/80">
                Before Siyashesha uses cloud AI to answer clinical questions or extract text from complex lab documents, we ask for your explicit permission.
              </Text>
            </View>

            {/* Detailed Breakdown: What is shared & With Whom */}
            <View className="mt-4 gap-3 rounded-2xl border border-slate-200/90 bg-slate-50 p-4 dark:border-slate-800 dark:bg-canvasdark">
              <Text className="font-sans-bold text-[12px] uppercase tracking-[0.8px] text-ink-muted dark:text-slate-400">
                How Cloud AI Processing Works
              </Text>

              <DisclosureItem
                title="1. Third-Party AI Service Provider"
                body="Cloud AI features are powered by Google LLC (Google Gemini API) over an encrypted TLS 1.3 connection."
              />
              <DisclosureItem
                title="2. What Data Is Sent"
                body="When you ask a question or scan a document with Cloud AI enabled, only your prompt, clinical summary context (allergies, conditions, active medications, HbA1c trend), or the selected document image is transmitted to generate your response."
              />
              <DisclosureItem
                title="3. Strict Privacy & Zero Ad Profiling"
                body="Your National ID number, residential address, and emergency contact phone numbers are never used for advertising, and you can revoke this permission at any time in Settings → Security."
              />
            </View>

            {/* Educational / Medical Disclaimer */}
            <View className="mt-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 dark:border-slate-800 dark:bg-canvasdark">
              <View className="flex-row items-center gap-1.5">
                <Lock size={13} color="#5B6478" />
                <Text className="font-sans-bold text-[11px] uppercase tracking-[0.6px] text-ink dark:text-slate-200">
                  Medical Disclaimer
                </Text>
              </View>
              <Text className="mt-1 font-sans text-[11px] leading-[16px] text-ink-muted dark:text-slate-400">
                AI responses are for informational and educational purposes only and do not constitute medical diagnosis or treatment advice. Always consult a qualified physician or clinic sister before making medical decisions.
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="mt-5 gap-2.5 pb-2">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Allow Cloud AI with Google Gemini"
                onPress={() => {
                  tapFeedback();
                  onAllowCloudAi();
                }}
                className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 dark:bg-brand-500"
              >
                <CheckCircle2 size={18} color="#FFFFFF" />
                <Text className="font-sans-bold text-[15px] text-white">
                  Allow Cloud AI (Google Gemini)
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Use On-Device Offline Mode Only"
                onPress={() => {
                  tapFeedback();
                  onUseOnDeviceOnly();
                }}
                className="min-h-[48px] flex-row items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-slate-100 px-5 py-3 dark:border-slate-700 dark:bg-slate-800"
              >
                <Smartphone size={16} color="#0B2559" />
                <Text className="font-sans-semibold text-[14px] text-ink dark:text-slate-100">
                  Use On-Device Offline Mode Only
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DisclosureItem({ title, body }: { title: string; body: string }) {
  return (
    <View className="gap-0.5">
      <Text className="font-sans-bold text-[13px] text-ink dark:text-slate-100">{title}</Text>
      <Text className="font-sans text-[12px] leading-[17px] text-ink-muted dark:text-slate-400">{body}</Text>
    </View>
  );
}
