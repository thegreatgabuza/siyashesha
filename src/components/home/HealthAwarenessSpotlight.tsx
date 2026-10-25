import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useMemo } from 'react';
import { View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { elevation, fonts, radii } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { useI18n } from '@/i18n/useI18n';
import { upcomingHealthDays } from '@/lib/calendarMarks';
import { healthDayIcons } from '@/lib/healthDayIcons';

export function HealthAwarenessSpotlight() {
  const t = useTokens();
  const { t: tr } = useI18n();

  const nextHealthDay = useMemo(() => {
    const list = upcomingHealthDays(new Date(), 1);
    return list[0];
  }, []);

  if (!nextHealthDay) return null;

  const now = new Date();
  const isToday = nextHealthDay.month === now.getMonth() + 1 && nextHealthDay.day === now.getDate();
  const title = isToday ? tr('home.healthDayToday') : tr('home.healthDayUpcoming');

  return (
    <PressableScale
      accessibilityLabel={`${title}: ${nextHealthDay.title}`}
      onPress={() => router.push(`/calendar/${nextHealthDay.id}`)}
      style={[
        {
          backgroundColor: t.surface,
          borderRadius: radii.lg,
          padding: 16,
          borderWidth: 1,
          borderColor: isToday ? 'rgba(239, 68, 68, 0.25)' : t.border,
          gap: 12,
        },
        elevation[1],
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: radii.pill,
              backgroundColor: isToday ? 'rgba(239, 68, 68, 0.12)' : 'rgba(14, 116, 144, 0.12)',
            }}
          >
            <Txt
              variant="footnote"
              color={isToday ? '#EF4444' : t.accent}
              style={{ fontFamily: fonts.semibold, fontSize: 11 }}
            >
              {isToday ? 'TODAY' : nextHealthDay.dateLabel}
            </Txt>
          </View>
          <Txt variant="footnote" tone="muted" style={{ fontSize: 12 }}>
            WHO Global Observance
          </Txt>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Txt variant="footnote" color={t.interactive} style={{ fontFamily: fonts.medium }}>
            View Guide
          </Txt>
          <ChevronRight size={14} color={t.interactive} />
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: radii.md,
            backgroundColor: t.surfaceMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={healthDayIcons[nextHealthDay.icon]}
            style={{ width: 30, height: 30 }}
            contentFit="contain"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="bodyStrong" numberOfLines={1}>
            {nextHealthDay.title}
          </Txt>
          <Txt variant="footnote" tone="muted" numberOfLines={2} style={{ marginTop: 2 }}>
            {nextHealthDay.sections[0]?.body ?? ''}
          </Txt>
        </View>
      </View>
    </PressableScale>
  );
}
