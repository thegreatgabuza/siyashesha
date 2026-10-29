import { router } from 'expo-router';
import { FileCheck2, HeartPulse, Lock, QrCode } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { ChunkyButton } from '@/components/onboarding/ChunkyButton';
import { Mascot } from '@/components/onboarding/Mascot';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SpeechBubble } from '@/components/onboarding/SpeechBubble';

const highlights = [
  { icon: QrCode, label: 'Instant ICE Emergency QR' },
  { icon: FileCheck2, label: 'OCR Medical Record Vault' },
  { icon: HeartPulse, label: 'Smart Meds & Vitals Tracking' },
  { icon: Lock, label: 'POPIA & Biometric Protected' },
];

export default function WelcomeScreen() {
  return (
    <OnboardingShell
      showBack={false}
      hideProgress
      footer={
        <>
          <ChunkyButton
            label="Build my health passport"
            onPress={() => router.push('/(onboarding)/why' as any)}
            accessibilityHint="Starts setting up your health passport"
          />
          <ChunkyButton
            variant="ghost"
            label="I already have an account"
            onPress={() => router.push('/(auth)/sign-in')}
          />
        </>
      }
    >
      <View className="flex-1 items-center justify-center gap-5 py-4">
        <View className="rounded-full bg-brand-100/80 px-3.5 py-1.5 dark:bg-brand-500/20">
          <Text className="font-sans-bold text-[11px] uppercase tracking-[1.2px] text-brand-700 dark:text-brand-300">
            Patient-Held Digital Health Vault
          </Text>
        </View>

        <Mascot mood="welcome" size={132} />

        <View className="items-center">
          <Text className="font-display text-[44px] leading-[44px] text-emergency-500">SIYASHESHA</Text>
          <Text
            className="mt-1 font-sans-bold text-[11px] uppercase text-ink dark:text-slate-200"
            style={{ letterSpacing: 3.3 }}
          >
            Health Passport
          </Text>
          <Text className="mt-2.5 px-4 text-center font-sans text-[14px] leading-[20px] text-ink-muted dark:text-slate-400">
            Your emergency profile, clinical records, and daily care in one secure pocket passport.
          </Text>
        </View>

        <SpeechBubble subtitle="Takes about 2 minutes · Everything stays under your control">
          Hi, I’m Shield! Let’s set up your personal health passport.
        </SpeechBubble>

        <View className="w-full flex-row flex-wrap justify-between gap-y-2.5 pt-1">
          {highlights.map((item) => (
            <View
              key={item.label}
              style={{ width: '48.5%' }}
              className="flex-row items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white p-3 dark:border-slate-800 dark:bg-canvasdark-card"
            >
              <View className="h-8 w-8 items-center justify-center rounded-xl bg-brand-100/80 dark:bg-brand-500/20">
                <item.icon size={16} color="#0B2559" />
              </View>
              <Text className="flex-1 font-sans-semibold text-[12px] leading-[15px] text-ink dark:text-slate-100">
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </OnboardingShell>
  );
}
