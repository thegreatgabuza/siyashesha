import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { ChunkyButton } from '@/components/onboarding/ChunkyButton';
import { Mascot } from '@/components/onboarding/Mascot';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SpeechBubble } from '@/components/onboarding/SpeechBubble';

export default function WelcomeScreen() {
  return (
    <OnboardingShell
      showBack={false}
      footer={
        <>
          <ChunkyButton label="Build my passport" onPress={() => router.push('/(onboarding)/why' as any)} accessibilityHint="Starts setting up your health passport" />
          <ChunkyButton
            variant="ghost"
            label="I already have an account"
            onPress={() => router.push('/(auth)/sign-in')}
          />
        </>
      }
    >
      <View className="flex-1 items-center justify-center gap-6 py-6">
        <Mascot mood="welcome" size={150} />
        <SpeechBubble>Hi, I’m Shield. Let’s build your passport in about three minutes.</SpeechBubble>
        <View className="items-center">
          <Text className="font-display text-[44px] leading-[44px] text-emergency-500">SIYASHESHA</Text>
          <Text className="mt-1 font-sans-semibold text-[11px] uppercase text-ink" style={{ letterSpacing: 3.3 }}>
            Health Passport
          </Text>
          <Text className="mt-4 text-center font-sans text-[15px] text-ink-muted dark:text-slate-400">
            Your health. Your records. Wherever you go.
          </Text>
        </View>
      </View>
    </OnboardingShell>
  );
}
