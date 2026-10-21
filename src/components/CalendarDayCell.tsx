import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';

import { healthDayIcons } from '@/lib/healthDayIcons';
import { getHealthDaysForDateString } from '@/lib/calendarMarks';

export function CalendarDayCell(props: any) {
  const { date, state, marking, onPress } = props;
  if (!date) return <View style={{ width: 40, height: 56 }} />;

  const isSelected = !!marking?.selected;
  const isToday = state === 'today';
  const isOtherMonth = state === 'disabled' || state === 'inactive';
  const healthCards = getHealthDaysForDateString(date.dateString);
  const dots: { color: string }[] = marking?.dots ?? [];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${date.day}${isToday ? ', today' : ''}`}
      onPress={() => onPress?.(date)}
      className="items-center justify-center"
      style={{ width: 40, height: 56 }}
    >
      <View
        className={`h-9 w-9 items-center justify-center rounded-full ${
          isSelected ? 'bg-ink dark:bg-brand-400' : isToday ? 'bg-brand-200 dark:bg-brand-500/30' : ''
        }`}
      >
        <Text
          className={`font-sans-medium text-[14px] ${
            isSelected
              ? 'text-white'
              : isOtherMonth
                ? 'text-slate-300 dark:text-slate-700'
                : 'text-ink dark:text-slate-100'
          }`}
        >
          {date.day}
        </Text>
      </View>
      <View className="mt-1 h-4 flex-row items-center justify-center gap-0.5">
        {healthCards.length > 0 ? (
          <Image
            source={healthDayIcons[healthCards[0].icon]}
            style={{ width: 14, height: 14 }}
            contentFit="contain"
          />
        ) : (
          dots.map((d, i) => (
            <View key={i} style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: d.color }} />
          ))
        )}
      </View>
    </Pressable>
  );
}
