import { router } from 'expo-router';
import { Check, Pill, Plus } from 'lucide-react-native';
import { useMemo } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, withSpring } from 'react-native-reanimated';

import { PressableScale } from '@/components/ui/PressableScale';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Txt } from '@/components/ui/Txt';
import { useToast } from '@/components/ui/Toast';
import { elevation, fonts, radii, springs } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { todaysReminders } from '@/data/medications';
import { computeAdherence } from '@/lib/adherence';
import { formatTime12, todayKey } from '@/lib/date';
import { milestoneFeedback, tapFeedback } from '@/lib/feedback';
import { useAppStore } from '@/store/useAppStore';

/**
 * Today's doses. With nothing scheduled it shows a calm invitation, not a 0%. Adherence appears
 * only once there are logged doses to measure.
 */
export function TodayCard() {
  const t = useTokens();
  const toast = useToast();
  const takenLog = useAppStore((s) => s.takenLog);
  const toggleTaken = useAppStore((s) => s.toggleTaken);
  const medications = useAppStore((s) => s.medications);
  const reminders = useMemo(() => todaysReminders(medications), [medications]);
  const adherence = useMemo(() => computeAdherence(takenLog, 7, medications), [takenLog, medications]);
  const dateKey = todayKey();

  const takenCount = reminders.filter((r) => takenLog[`${r.id}__${dateKey}`]).length;

  if (reminders.length === 0) {
    return (
      <View style={[{ backgroundColor: t.surface, borderRadius: radii.lg, padding: 18, gap: 12 }, elevation[1]]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: t.interactiveSoft, alignItems: 'center', justifyContent: 'center' }}>
            <Pill size={20} color={t.interactive} />
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">No medications scheduled</Txt>
            <Txt variant="footnote" tone="muted">
              Add one and we will remind you when it is time.
            </Txt>
          </View>
        </View>
        <PressableScale
          accessibilityLabel="Add a medication"
          onPress={() => router.push('/more/medications')}
          haptic="selection"
          style={{ minHeight: 48, borderRadius: radii.pill, backgroundColor: t.interactiveSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
        >
          <Plus size={16} color={t.interactive} />
          <Txt variant="callout" color={t.interactive} style={{ fontFamily: fonts.semibold }}>
            Add a medication
          </Txt>
        </PressableScale>
      </View>
    );
  }

  return (
    <View style={[{ backgroundColor: t.surface, borderRadius: radii.lg, paddingVertical: 8 }, elevation[1]]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 6 }}>
        <ProgressRing progress={takenCount / reminders.length} size={44} stroke={5}>
          <Txt variant="footnote" style={{ fontFamily: fonts.bold, fontSize: 12 }}>
            {takenCount}/{reminders.length}
          </Txt>
        </ProgressRing>
        <View style={{ flex: 1 }}>
          <Txt variant="bodyStrong">
            {takenCount === reminders.length ? 'All doses taken today' : `${reminders.length - takenCount} ${reminders.length - takenCount === 1 ? 'dose' : 'doses'} to go`}
          </Txt>
          <Txt variant="footnote" tone="muted">
            {adherence.hasData ? `${adherence.percent}% over the last 7 days` : 'Tap a dose when you take it'}
          </Txt>
        </View>
      </View>

      {reminders.map((r) => {
        const taken = !!takenLog[`${r.id}__${dateKey}`];
        return (
          <DoseRow
            key={r.id}
            label={r.label}
            time={formatTime12(r.time)}
            taken={taken}
            onPress={() => {
              toggleTaken(r.id, dateKey);
              if (!taken) {
                milestoneFeedback();
                toast.show(`${r.label} marked as taken`, 'success');
              } else {
                tapFeedback();
              }
            }}
          />
        );
      })}
    </View>
  );
}

function DoseRow({ label, time, taken, onPress }: { label: string; time: string; taken: boolean; onPress: () => void }) {
  const t = useTokens();
  const reduced = useReducedMotion();
  const check = useAnimatedStyle(() => ({
    transform: [{ scale: reduced ? 1 : withSpring(taken ? 1 : 0.6, springs.bouncy) }],
    opacity: withSpring(taken ? 1 : 0, springs.snappy),
  }));

  return (
    <PressableScale
      accessibilityRole="checkbox"
      accessibilityState={{ checked: taken }}
      accessibilityLabel={`${label} at ${time}`}
      accessibilityHint={taken ? 'Marks this dose as not taken' : 'Marks this dose as taken'}
      onPress={onPress}
      scaleTo={0.985}
      style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 8 }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          borderWidth: 2,
          borderColor: taken ? t.success : t.border,
          backgroundColor: taken ? t.success : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Animated.View style={check}>
          <Check size={16} color="#FFFFFF" strokeWidth={3} />
        </Animated.View>
      </View>
      <View style={{ flex: 1 }}>
        {/* Doses and units are never translated or abbreviated. */}
        <Txt variant="callout" style={{ fontFamily: fonts.semibold, opacity: taken ? 0.55 : 1 }}>
          {label}
        </Txt>
      </View>
      <Txt variant="footnote" tone="muted" style={{ fontVariant: ['tabular-nums'] }}>
        {time}
      </Txt>
    </PressableScale>
  );
}
