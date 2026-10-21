import { router } from 'expo-router';
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

const COVER_WIDTH = 300;

/** Passport reveal: the cover swings open, confetti falls, and the earned stamps appear. */
export default function RevealScreen() {
  const reduced = useReducedMotion();
  const stamps = useAppStore((s) => s.stamps);
  const firstName = useAppStore((s) => s.patientProfile.firstName);
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
      showBack={false}
      footer={<ChunkyButton label="Continue" onPress={() => router.push('/(onboarding)/notifications' as any)} />}
    >
      <View className="items-center gap-5 py-2">
        <Mascot mood="cheer" size={96} />
        <SpeechBubble>{firstName ? `Your passport is ready, ${firstName}.` : 'Your passport is ready.'}</SpeechBubble>

        <View style={{ width: COVER_WIDTH, height: 380 }} className="overflow-hidden rounded-3xl">
          {/* Inside page, revealed as the cover opens */}
          <View className="absolute inset-0 justify-between rounded-3xl bg-white p-5 dark:bg-canvasdark-card">
            <View>
              <Text className="font-sans-semibold text-[11px] uppercase tracking-[1.5px] text-ink-muted dark:text-slate-400">
                Health Passport
              </Text>
              <Text className="mt-1 font-sans-bold text-[22px] text-ink dark:text-slate-50">
                {firstName || 'Your passport'}
              </Text>
              <Text className="mt-1 font-sans text-[13px] text-ink-muted dark:text-slate-400">
                {percent}% complete
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
            className="items-center justify-center rounded-3xl bg-ink dark:bg-brand-400"
            accessibilityLabel="Passport cover"
          >
            <Mascot mood="welcome" size={120} />
            <Text className="mt-3 font-display text-[30px] text-white">SIYASHESHA</Text>
            <Text className="font-sans-semibold text-[10px] uppercase text-white/70" style={{ letterSpacing: 3 }}>
              Health Passport
            </Text>
          </Animated.View>
        </View>

        {!opened ? <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">Opening…</Text> : null}
      </View>

      <Confetti active={opened} />
    </OnboardingShell>
  );
}
