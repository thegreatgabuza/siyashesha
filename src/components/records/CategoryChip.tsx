import { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { RecordsTokens } from '@/constants/recordsTokens';
import { tapFeedback } from '@/lib/feedback';

/** Icon in a circle with a label and count underneath. The active chip fills with the accent colour. */
export function CategoryChip({
  label,
  count,
  icon: Icon,
  active,
  onPress,
}: {
  label: string;
  count: number;
  icon: any;
  active: boolean;
  onPress: () => void;
}) {
  const reduced = useReducedMotion();
  const fill = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    fill.value = reduced ? (active ? 1 : 0) : withTiming(active ? 1 : 0, { duration: 180 });
  }, [active, fill, reduced]);

  const circleStyle = useAnimatedStyle(() => ({
    backgroundColor: fill.value > 0.5 ? RecordsTokens.accent : RecordsTokens.surface,
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label}, ${count} records`}
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      className="min-w-[72px] items-center gap-1.5 py-1"
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
    >
      <Animated.View
        style={[circleStyle, RecordsTokens.shadow]}
        className="h-14 w-14 items-center justify-center rounded-full"
      >
        <Icon size={22} color={active ? '#FFFFFF' : RecordsTokens.text} />
      </Animated.View>
      <Text
        numberOfLines={1}
        style={{ color: active ? RecordsTokens.accent : RecordsTokens.text, fontSize: RecordsTokens.type.tiny, fontFamily: active ? RecordsTokens.fonts.bold : RecordsTokens.fonts.medium }}
      >
        {label}
      </Text>
      <View className="rounded-full px-1.5">
        <Text style={{ color: RecordsTokens.textMuted, fontSize: RecordsTokens.type.tiny }}>{count}</Text>
      </View>
    </Pressable>
  );
}
