import { router } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { ChunkyButton } from '@/components/onboarding/ChunkyButton';
import { Confetti } from '@/components/onboarding/Confetti';
import { Mascot } from '@/components/onboarding/Mascot';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SpeechBubble } from '@/components/onboarding/SpeechBubble';
import { StampBadge } from '@/components/onboarding/StampBadge';
import { milestoneFeedback } from '@/lib/feedback';
import { completionPercent, stampDefs } from '@/lib/passport';
import { useAppStore } from '@/store/useAppStore';

const COVER_WIDTH = 304;

/** Passport reveal: the cover swings open, confetti falls, and the earned stamps appear. */
export default function RevealScreen() {
  const reduced = useReducedMotion();
  const stamps = useAppStore((s) => s.stamps);
  const draft = useAppStore((s) => s.onboardingDraft);
  const profileFirstName = useAppStore((s) => s.patientProfile.firstName);
  const firstName = draft.firstName.trim() || profileFirstName;
  const fullName = [draft.firstName.trim(), draft.lastName.trim()].filter(Boolean).join(' ') || firstName || 'Your Passport';

  const [animatedOpen, setAnimatedOpen] = useState(false);
  // With reduced motion the passport is shown open straight away.
  const opened = animatedOpen || !!reduced;
  const percent = completionPercent(stamps);

  const angle = useSharedValue(reduced ? -160 : 0);

  useEffect(() => {
    milestoneFeedback();
    if (reduced) return;
    angle.value = withDelay(
      350,
      withTiming(-160, { duration: 1100, easing: Easing.out(Easing.cubic) }, (finished) => {
        if (finished) runOnJS(setAnimatedOpen)(true);
      })
    );
  }, [angle, reduced]);

  // Pivot the cover on its left edge so it swings open like a book.
  const coverStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: COVER_WIDTH / 2 },
      { perspective: 900 },
      { rotateY: `${angle.value}deg` },
      { translateX: -COVER_WIDTH / 2 },
    ],
  }));

  return (
    <OnboardingShell
      step={8}
      totalSteps={8}
      stepLabel="Passport Ready"
      footer={
        <ChunkyButton
          label="Continue to Final Step"
          onPress={() => router.push('/(onboarding)/paywall' as any)}
        />
      }
    >
      <View className="items-center gap-4 py-2">
        <Mascot mood="cheer" size={84} />
        <SpeechBubble subtitle="You can earn any remaining stamps anytime inside the app.">
          {firstName ? `Congratulations, ${firstName}! Your Health Passport is built.` : 'Your Health Passport is built!'}
        </SpeechBubble>

        <View
          style={{ width: COVER_WIDTH, height: 390 }}
          className="overflow-hidden rounded-3xl border border-slate-200/90 shadow-sm dark:border-slate-700"
        >
          {/* Inside page, revealed as the cover opens */}
          <View className="absolute inset-0 justify-between rounded-3xl bg-white p-5 dark:bg-canvasdark-card">
            <View>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5">
                  <ShieldCheck size={14} color="#16A34A" />
                  <Text className="font-sans-bold text-[10px] uppercase tracking-[1.4px] text-success-600 dark:text-emerald-400">
                    Verified Health Passport
                  </Text>
                </View>
                {draft.bloodGroup ? (
                  <View className="rounded-full bg-emergency-50 px-2.5 py-0.5 dark:bg-emergency-500/20">
                    <Text className="font-sans-bold text-[11px] text-emergency-600 dark:text-red-300">
                      Blood: {draft.bloodGroup}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text className="mt-1.5 font-sans-bold text-[21px] text-ink dark:text-slate-50">{fullName}</Text>
              <Text className="mt-0.5 font-sans text-[12px] text-ink-muted dark:text-slate-400">
                {stamps.length} of {stampDefs.length} readiness stamps earned ({percent}%)
              </Text>
            </View>
            <View className="flex-row flex-wrap justify-between gap-y-3">
              {stampDefs.map((def) => (
                <StampBadge key={def.id} earned={stamps.includes(def.id)} label={def.label} size={78} />
              ))}
            </View>
          </View>

          {/* Cover */}
          <Animated.View
            style={[coverStyle, { position: 'absolute', inset: 0, backfaceVisibility: 'hidden' }]}
            className="items-center justify-center rounded-3xl bg-ink dark:bg-brand-500"
            accessibilityLabel="Passport cover"
          >
            <Mascot mood="welcome" size={116} />
            <Text className="mt-3 font-display text-[32px] text-white">SIYASHESHA</Text>
            <Text className="font-sans-semibold text-[10px] uppercase text-white/75" style={{ letterSpacing: 3 }}>
              Republic of South Africa · Health Vault
            </Text>
          </Animated.View>
        </View>

        {!opened ? (
          <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">Opening your passport…</Text>
        ) : null}
      </View>

      <Confetti active={opened} />
    </OnboardingShell>
  );
}
