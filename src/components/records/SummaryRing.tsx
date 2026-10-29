import dayjs from 'dayjs';
import { Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { RecordsTokens } from '@/constants/recordsTokens';
import { categoryStyle } from './categoryStyle';
import type { RecordCategory } from '@/data/records';

/**
 * Compact ring showing how the records split across categories.
 * The total sits in the centre and the most common categories are listed beside it.
 */
export function SummaryRing({
  counts,
  total,
  lastUpdated,
}: {
  counts: Map<RecordCategory, number>;
  total: number;
  lastUpdated: string | null;
}) {
  const size = 124;
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const ranked = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  let offset = 0;

  return (
    <View className="flex-row items-center gap-5" accessibilityRole="summary" accessibilityLabel={`${total} records`}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={size / 2} cy={size / 2} r={radius} stroke={RecordsTokens.track} strokeWidth={stroke} fill="none" />
          {total > 0
            ? ranked.map(([category, count]) => {
                const length = (count / total) * circumference;
                const segment = (
                  <Circle
                    key={category}
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={categoryStyle[category].colour}
                    strokeWidth={stroke}
                    fill="none"
                    strokeLinecap="butt"
                    strokeDasharray={`${Math.max(length - 3, 0)} ${circumference}`}
                    strokeDashoffset={-offset}
                  />
                );
                offset += length;
                return segment;
              })
            : null}
        </Svg>
        <View className="absolute inset-0 items-center justify-center">
          <Text style={{ color: RecordsTokens.text, fontSize: 28, fontFamily: RecordsTokens.fonts.bold }}>{total}</Text>
          <Text style={{ color: RecordsTokens.textMuted, fontSize: RecordsTokens.type.tiny }}>records</Text>
        </View>
      </View>

      <View className="flex-1 gap-2">
        {ranked.slice(0, 3).map(([category, count]) => (
          <View key={category} className="flex-row items-center gap-2">
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: categoryStyle[category].colour }} />
            <Text className="flex-1 font-sans-medium" numberOfLines={1} style={{ color: RecordsTokens.text, fontSize: RecordsTokens.type.meta }}>
              {categoryStyle[category].short}
            </Text>
            <Text className="font-sans-semibold" style={{ color: RecordsTokens.text, fontSize: RecordsTokens.type.meta }}>{count}</Text>
          </View>
        ))}
        {lastUpdated ? (
          <Text className="mt-1 font-sans" style={{ color: RecordsTokens.textMuted, fontSize: RecordsTokens.type.tiny }}>
            Last updated {dayjs(lastUpdated).format('D MMM YYYY')}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
