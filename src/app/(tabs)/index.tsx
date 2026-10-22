import dayjs from 'dayjs';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { AskBar } from '@/components/home/AskBar';
import { EmergencyReadinessCard } from '@/components/home/EmergencyReadinessCard';
import { HomeHeader } from '@/components/home/HomeHeader';
import { PassportCard } from '@/components/home/PassportCard';
import { PassportProgress } from '@/components/home/PassportProgress';
import { RecentActivity } from '@/components/home/RecentActivity';
import { TodayCard } from '@/components/home/TodayCard';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import { Txt } from '@/components/ui/Txt';
import { fonts, motion, springs } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { activeMedications } from '@/data/medications';
import { useI18n } from '@/i18n/useI18n';
import { derivePassportProgress } from '@/lib/passport';
import { syncReminders } from '@/lib/reminders';
import { useAppStore } from '@/store/useAppStore';

/** Spring entrance for each section, staggered. Reduce motion is respected by Reanimated. */
const enter = (i: number) =>
  FadeInDown.delay(i * motion.stagger)
    .springify()
    .damping(springs.gentle.damping)
    .stiffness(springs.gentle.stiffness);

/**
 * Home, in one fixed order: greeting → passport → emergency readiness → today → next best step
 * → recent activity. The passport card and its emergency actions are never delayed.
 */
export default function HomeScreen() {
  const t = useTokens();
  const toast = useToast();
  const { t: tr } = useI18n();
  const records = useAppStore((s) => s.records);
  const patient = useAppStore((s) => s.patientProfile);
  const userMedications = useAppStore((s) => s.userMedications);
  const biometricLock = useAppStore((s) => s.biometricLock);

  const progress = useMemo(
    () =>
      derivePassportProgress({
        patient,
        medicationCount: activeMedications.length + userMedications.length,
        recordCount: records.length,
        biometricLock,
      }),
    [patient, userMedications.length, records.length, biometricLock]
  );

  // Split the translated greeting around the name so the name alone can be red.
  const name = patient.preferredName || patient.firstName;
  const hiParts = tr('home.hi', { name: '\u0000' }).split('\u0000');

  return (
    <Screen
      contentClassName="px-5"
      onRefresh={async () => {
        await Promise.all([syncReminders().catch(() => {}), new Promise((r) => setTimeout(r, 700))]);
        toast.show('Your passport is up to date', 'info');
      }}
    >
      <HomeHeader />

      <View style={{ paddingTop: 18, paddingBottom: 20 }}>
        <Txt variant="label" tone="muted">
          {dayjs().format('dddd D MMMM')}
        </Txt>
        <Txt variant="display" style={{ marginTop: 6 }}>
          {hiParts[0]}
          <Txt variant="display" color={t.accent}>
            {name}
          </Txt>
          {hiParts[1]}
        </Txt>
        <Txt variant="body" tone="muted" style={{ marginTop: 4 }}>
          {tr('home.subtitle')}
        </Txt>
      </View>

      {/* Never delayed: the emergency side of the card must be one tap away immediately. */}
      <PassportCard recordCount={records.length} />

      <Animated.View entering={enter(1)} style={{ marginTop: 28 }}>
        <SectionTitle title="Emergency" />
        <EmergencyReadinessCard />
      </Animated.View>

      <Animated.View entering={enter(2)} style={{ marginTop: 28 }}>
        <AskBar />
      </Animated.View>

      <Animated.View entering={enter(3)} style={{ marginTop: 28 }}>
        <SectionTitle title={tr('home.todaysReminders')} action="Medications" onAction={() => router.push('/more/medications')} />
        <TodayCard />
      </Animated.View>

      {progress.next ? (
        <Animated.View entering={enter(4)} style={{ marginTop: 28 }}>
          <SectionTitle title="Your passport" />
          <PassportProgress progress={progress} />
        </Animated.View>
      ) : null}

      <Animated.View entering={enter(5)} style={{ marginTop: 28 }}>
        <SectionTitle title={tr('home.recentActivity')} />
        <RecentActivity />
      </Animated.View>

      {!progress.next ? (
        <Animated.View entering={enter(6)} style={{ marginTop: 28 }}>
          <PassportProgress progress={progress} />
        </Animated.View>
      ) : null}
    </Screen>
  );
}

function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const t = useTokens();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, paddingHorizontal: 2, minHeight: 32 }}>
      <Txt variant="label" tone="muted" style={{ flexShrink: 1 }}>
        {title}
      </Txt>
      {action ? (
        <PressableScale
          accessibilityLabel={action}
          onPress={onAction}
          hitSlop={10}
          style={{ minHeight: 32, justifyContent: 'center', paddingLeft: 12 }}
        >
          <Txt variant="footnote" color={t.interactive} style={{ fontFamily: fonts.semibold }}>
            {action}
          </Txt>
        </PressableScale>
      ) : null}
    </View>
  );
}
