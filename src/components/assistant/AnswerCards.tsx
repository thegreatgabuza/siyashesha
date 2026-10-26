import dayjs from 'dayjs';
import { router } from 'expo-router';
import { Check, ChevronRight, QrCode, Share2, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useMemo } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Circle, Polyline } from 'react-native-svg';

import { RecordThumb } from '@/components/records/RecordThumb';
import { Chip } from '@/components/ui/Chip';
import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { elevation, fonts, radii, springs } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import type { AssistantCard } from '@/data/assistant';
import { todaysReminders } from '@/data/medications';
import { deriveHba1cSeries } from '@/data/timeline';
import { useEmergencyCard } from '@/hooks/useEmergencyCard';
import { formatTime12, todayKey } from '@/lib/date';
import { milestoneFeedback } from '@/lib/feedback';
import { countByCategory } from '@/lib/recordSearch';
import { useAppStore } from '@/store/useAppStore';

/** Renders the rich card for an assistant answer. */
export function AnswerCard({ card }: { card: AssistantCard }) {
  const body = {
    medications: <MedicationsCard />,
    hba1c: <Hba1cCard />,
    emergency: <EmergencyCard />,
    records: <RecordsCard />,
    share: <ShareCard />,
  }[card];
  return (
    <Animated.View entering={FadeInDown.springify().damping(springs.bouncy.damping).stiffness(springs.bouncy.stiffness)} style={{ marginTop: 12 }}>
      {body}
    </Animated.View>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const t = useTokens();
  return <View style={[{ backgroundColor: t.surface, borderRadius: radii.lg, padding: 16, gap: 12, borderWidth: 1, borderColor: t.hairline }, elevation[1]]}>{children}</View>;
}

function CardAction({ label, onPress, icon }: { label: string; onPress: () => void; icon?: React.ReactNode }) {
  const t = useTokens();
  return (
    <PressableScale
      accessibilityLabel={label}
      onPress={onPress}
      haptic="selection"
      style={{ minHeight: 48, borderRadius: radii.pill, backgroundColor: t.interactiveSoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 }}
    >
      {icon}
      <Txt variant="callout" color={t.interactive} style={{ fontFamily: fonts.semibold }}>
        {label}
      </Txt>
      <ChevronRight size={16} color={t.interactive} />
    </PressableScale>
  );
}

function MedicationsCard() {
  const t = useTokens();
  const takenLog = useAppStore((s) => s.takenLog);
  const toggleTaken = useAppStore((s) => s.toggleTaken);
  const reminders = useMemo(() => todaysReminders(), []);
  const day = todayKey();
  const now = dayjs().format('HH:mm');
  const nextId = reminders.find((r) => !takenLog[`${r.id}__${day}`] && r.time >= now)?.id;

  if (reminders.length === 0) {
    return (
      <Shell>
        <Txt variant="bodyStrong">No medications scheduled</Txt>
        <CardAction label="Add a medication" onPress={() => router.push('/more/medications')} />
      </Shell>
    );
  }

  return (
    <Shell>
      <Txt variant="label" tone="muted">
        Today
      </Txt>
      {reminders.map((r) => {
        const taken = !!takenLog[`${r.id}__${day}`];
        const isNext = r.id === nextId;
        return (
          <PressableScale
            key={r.id}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: taken }}
            accessibilityLabel={`${r.label} at ${formatTime12(r.time)}${isNext ? ', next dose' : ''}`}
            onPress={() => {
              toggleTaken(r.id, day);
              if (!taken) milestoneFeedback();
            }}
            scaleTo={0.98}
            style={{
              minHeight: 48,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingHorizontal: 12,
              borderRadius: radii.sm,
              backgroundColor: isNext ? t.interactiveSoft : 'transparent',
            }}
          >
            <View style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: taken ? t.success : 'transparent', borderWidth: taken ? 0 : 2, borderColor: isNext ? t.interactive : t.border }}>
              {taken ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : null}
            </View>
            {/* Names, doses and units exactly as prescribed. */}
            <Txt variant="callout" style={{ flex: 1, fontFamily: fonts.semibold, opacity: taken ? 0.55 : 1 }}>
              {r.label}
            </Txt>
            <View style={{ alignItems: 'flex-end' }}>
              <Txt variant="footnote" tone="muted" style={{ fontVariant: ['tabular-nums'] }}>
                {formatTime12(r.time)}
              </Txt>
              {isNext ? (
                <Txt variant="footnote" color={t.interactive} style={{ fontFamily: fonts.semibold, fontSize: 12 }}>
                  Next
                </Txt>
              ) : null}
            </View>
          </PressableScale>
        );
      })}
    </Shell>
  );
}

function Hba1cCard() {
  const t = useTokens();
  const records = useAppStore((s) => s.records);
  const pts = useMemo(() => deriveHba1cSeries(records), [records]);
  const latest = pts[pts.length - 1];
  const prev = pts.length > 1 ? pts[pts.length - 2] : undefined;
  if (!latest) return null;
  const delta = prev ? +(latest.value - prev.value).toFixed(1) : 0;
  const W = 120;
  const H = 44;
  const min = Math.min(...pts.map((p) => p.value)) - 0.3;
  const max = Math.max(...pts.map((p) => p.value)) + 0.3;
  const divisor = pts.length > 1 ? pts.length - 1 : 1;
  const xy = pts.map((p, i) => [(i / divisor) * (W - 8) + 4, H - 4 - ((p.value - min) / (max - min)) * (H - 8)] as const);
  const Trend = delta <= 0 ? TrendingDown : TrendingUp;

  return (
    <Shell>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Txt variant="label" tone="muted">
            HbA1c
          </Txt>
          <Txt variant="number">
            {latest.value}
            <Txt variant="headline" tone="muted">
              {' '}%
            </Txt>
          </Txt>
          <Txt variant="footnote" tone="muted">
            {dayjs(latest.date).format('D MMMM YYYY')}
          </Txt>
        </View>
        <Svg width={W} height={H} accessibilityLabel={`Trend over ${pts.length} results`}>
          <Polyline points={xy.map(([x, y]) => `${x},${y}`).join(' ')} fill="none" stroke={t.interactive} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
          {xy.map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r={i === xy.length - 1 ? 4 : 2.5} fill={i === xy.length - 1 ? t.interactive : t.surface} stroke={t.interactive} strokeWidth={1.5} />
          ))}
        </Svg>
      </View>
      {prev ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Trend size={16} color={t.textSecondary} />
          {/* Direction only; whether it is good is for the clinician to say. */}
          <Txt variant="footnote" tone="secondary">
            {delta === 0 ? 'Unchanged' : `${delta > 0 ? 'Up' : 'Down'} ${Math.abs(delta)} points`} since {dayjs(prev.date).format('MMM YYYY')} ({prev.value}%)
          </Txt>
        </View>
      ) : null}
      <CardAction label="View timeline" onPress={() => router.push('/more/timeline')} />
    </Shell>
  );
}

function EmergencyCard() {
  const t = useTokens();
  const ice = useEmergencyCard();
  return (
    <Shell>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip label="Blood group" value={ice.bloodGroup} tone={ice.bloodGroupKnown ? 'neutral' : 'missing'} />
        {ice.allergyList.length ? ice.allergyList.map((a) => <Chip key={a} label="Allergy" value={a} tone="accent" />) : <Chip value="No allergies recorded" tone="missing" />}
        <Chip label="Contact" value={ice.hasContact ? ice.contact.name : 'Unknown'} tone={ice.hasContact ? 'neutral' : 'missing'} />
      </View>
      <CardAction label="Open ICE card & QR" icon={<QrCode size={16} color={t.interactive} />} onPress={() => router.push('/more/emergency')} />
    </Shell>
  );
}

function RecordsCard() {
  const records = useAppStore((s) => s.records);
  const top = useMemo(() => [...countByCategory(records).entries()].sort((a, b) => b[1] - a[1]).slice(0, 3), [records]);
  return (
    <Shell>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        {top.map(([cat, n]) => (
          <View key={cat} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
            <RecordThumb category={cat} width={52} />
            <Txt variant="footnote" style={{ textAlign: 'center', fontFamily: fonts.semibold }}>
              {cat}
            </Txt>
            <Txt variant="footnote" tone="muted">
              {n}
            </Txt>
          </View>
        ))}
      </View>
      <CardAction label="Open records" onPress={() => router.push('/records')} />
    </Shell>
  );
}

function ShareCard() {
  const t = useTokens();
  const active = useAppStore((s) => s.sharedLinks.filter((l) => l.status === 'active' && dayjs(l.expiresAt).isAfter(dayjs())).length);
  return (
    <Shell>
      <Txt variant="callout" tone="secondary">
        {active ? `${active} ${active === 1 ? 'share is' : 'shares are'} active right now.` : 'Nothing is shared right now.'}
      </Txt>
      <CardAction label="Share records" icon={<Share2 size={16} color={t.interactive} />} onPress={() => router.push('/more/sharing')} />
    </Shell>
  );
}
