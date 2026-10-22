import { useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { springs } from '@/design/tokens';
import type { MedicalRecord } from '@/data/records';
import { formatEventDate } from '@/lib/recordSearch';
import { RecordThumb } from './RecordThumb';

const GAP = 14;

/**
 * The zoomed-out vault: a month-by-month timeline of large document tiles, like flipping
 * through a printed catalogue. Tiles spring in with a short stagger per month.
 */
export function RecordCatalog({
  groups,
  onOpen,
}: {
  groups: { label: string; records: MedicalRecord[] }[];
  onOpen: (record: MedicalRecord) => void;
}) {
  const { width } = useWindowDimensions();
  const tileW = Math.floor((Math.min(width, 640) - 40 - GAP) / 2);

  return (
    <View style={{ gap: 28 }}>
      {groups.map((group, gi) => (
        <Animated.View key={group.label || 'all'} layout={LinearTransition.springify().damping(springs.gentle.damping)} style={{ gap: 12 }}>
          {group.label ? (
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              <Txt variant="headline">{group.label}</Txt>
              <Txt variant="footnote" tone="muted">
                {group.records.length} {group.records.length === 1 ? 'record' : 'records'}
              </Txt>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
            {group.records.map((record, i) => (
              <Animated.View
                key={record.id}
                entering={FadeInDown.delay(Math.min(gi * 60 + i * 40, 400))
                  .springify()
                  .damping(springs.bouncy.damping)
                  .stiffness(springs.bouncy.stiffness)}
                style={{ width: tileW }}
              >
                <PressableScale
                  accessibilityLabel={`Open ${record.title}, ${record.category}, ${formatEventDate(record)}`}
                  onPress={() => onOpen(record)}
                  haptic="selection"
                  scaleTo={0.95}
                  style={{ gap: 8 }}
                >
                  <RecordThumb category={record.category} title={record.title} width={tileW} showTitle />
                  <View style={{ paddingHorizontal: 2 }}>
                    <Txt variant="callout" numberOfLines={2} style={{ fontFamily: 'Inter_600SemiBold' }}>
                      {record.title}
                    </Txt>
                    <Txt variant="footnote" tone="muted" numberOfLines={1}>
                      {formatEventDate(record)}
                    </Txt>
                  </View>
                </PressableScale>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      ))}
    </View>
  );
}
