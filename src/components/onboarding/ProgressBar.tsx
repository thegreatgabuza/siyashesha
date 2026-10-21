import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

/** Passport completion bar. Fills smoothly when a stamp is earned. */
export function ProgressBar({ percent }: { percent: number }) {
  const reduced = useReducedMotion();
  const width = useSharedValue(percent);

  useEffect(() => {
    width.value = reduced ? percent : withTiming(percent, { duration: 600 });
  }, [percent, reduced, width]);

  const fill = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percent }}
      accessibilityLabel={`Passport ${percent} percent complete`}
      className="flex-1"
    >
      <View className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-canvasdark-card">
        <Animated.View style={fill} className="h-3 rounded-full bg-success-500" />
      </View>
      <Text className="mt-1 font-sans-semibold text-[11px] text-ink-muted dark:text-slate-400">
        Passport {percent}% complete
      </Text>
    </View>
  );
}
