import dayjs from 'dayjs';
import { router } from 'expo-router';
import { Clock, FileUp, Globe, KeyRound, Pill, Share2, ShieldOff, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { elevation, radii } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import type { AuditEventType } from '@/data/audit';
import { useAppStore } from '@/store/useAppStore';

const icons: Partial<Record<AuditEventType, LucideIcon>> = {
  upload: FileUp,
  share: Share2,
  revoke: ShieldOff,
  login: KeyRound,
  reminder: Pill,
  language: Globe,
};

export function RecentActivity() {
  const t = useTokens();
  const events = useAppStore((s) => s.auditEvents).slice(0, 3);

  if (events.length === 0) {
    return (
      <Txt variant="footnote" tone="muted" style={{ paddingHorizontal: 4 }}>
        Uploads, shares and reminders you act on will show up here.
      </Txt>
    );
  }

  return (
    <View style={[{ backgroundColor: t.surface, borderRadius: radii.lg, paddingVertical: 6 }, elevation[1]]}>
      {events.map((e, i) => {
        const Icon = icons[e.type] ?? Clock;
        return (
          <View key={e.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: t.border }}>
            <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: t.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={16} color={t.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="callout">{e.description}</Txt>
              <Txt variant="footnote" tone="muted">
                {dayjs(e.timestamp).format('D MMM · h:mm A')}
              </Txt>
            </View>
          </View>
        );
      })}
      <PressableScale
        accessibilityLabel="View your full health timeline"
        onPress={() => router.push('/more/timeline')}
        style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: t.border }}
      >
        <Txt variant="callout" color={t.interactive} style={{ fontFamily: 'Inter_600SemiBold' }}>
          View timeline
        </Txt>
      </PressableScale>
    </View>
  );
}
