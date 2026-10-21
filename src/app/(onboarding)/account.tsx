import { Mail } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { ChunkyButton } from '@/components/onboarding/ChunkyButton';
import { Mascot } from '@/components/onboarding/Mascot';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SpeechBubble } from '@/components/onboarding/SpeechBubble';
import { useAppStore } from '@/store/useAppStore';

/**
 * Last step. The passport is already built by now, so account creation is an offer, not a gate.
 * Apple, Google and email sign-in are shown disabled until sign-in is connected.
 */
export default function AccountScreen() {
  const finishOnboarding = useAppStore((s) => s.finishOnboarding);
  const firstName = useAppStore((s) => s.onboardingDraft.firstName);

  return (
    <OnboardingShell
      footer={
        <>
          <ChunkyButton label="Open my passport" onPress={finishOnboarding} />
          <ChunkyButton variant="ghost" label="Skip for now" onPress={finishOnboarding} />
        </>
      }
    >
      <View className="gap-6 py-2">
        <View className="items-center gap-4">
          <Mascot mood="cheer" size={88} />
          <SpeechBubble>
            {firstName ? `${firstName}, your passport is built. Save it to an account?` : 'Your passport is built. Save it to an account?'}
          </SpeechBubble>
        </View>

        <View className="gap-3">
          <ChunkyButton variant="ghost" label="Continue with Apple" disabled onPress={() => {}} accessibilityHint="Not available yet" />
          <ChunkyButton variant="ghost" label="Continue with Google" disabled onPress={() => {}} accessibilityHint="Not available yet" />
          <ChunkyButton variant="ghost" label="Continue with email" disabled onPress={() => {}} accessibilityHint="Not available yet" />
        </View>

        <View className="flex-row items-start gap-3 rounded-3xl bg-white p-4 dark:bg-canvasdark-card">
          <Mail size={16} color="#5B6478" />
          <Text className="flex-1 font-sans text-[12px] leading-[17px] text-ink-muted dark:text-slate-400">
            Account sign-in is being set up. Until then, your passport stays on this phone. You can add an account later from Settings.
          </Text>
        </View>
      </View>
    </OnboardingShell>
  );
}
