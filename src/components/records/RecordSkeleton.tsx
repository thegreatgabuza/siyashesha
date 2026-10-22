import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { RecordsTokens } from '@/constants/recordsTokens';

/** Placeholder cards shown while stored records are loading. Pulses unless reduced motion is on. */
export function RecordSkeleton() {
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0.5);

  useEffect(() => {
    if (reduced) return;
    pulse.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [pulse, reduced]);

  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View className="gap-3" accessibilityLabel="Loading records" accessibilityRole="progressbar">
      {[0, 1, 2].map((i) => (
        <View key={i} className="flex-row items-center gap-3 p-4" style={{ backgroundColor: RecordsTokens.surface, borderRadius: RecordsTokens.radius.card, ...RecordsTokens.shadow }}>
          <Animated.View style={style} className="h-12 w-12" >
            <View className="h-12 w-12" style={{ backgroundColor: RecordsTokens.track, borderRadius: RecordsTokens.radius.tile }} />
          </Animated.View>
          <View className="flex-1 gap-2">
            <Animated.View style={style} className="h-4 w-3/4" >
              <View className="h-4 w-full" style={{ backgroundColor: RecordsTokens.track, borderRadius: RecordsTokens.radius.pill }} />
            </Animated.View>
            <Animated.View style={style} className="h-3 w-1/2" >
              <View className="h-3 w-full" style={{ backgroundColor: RecordsTokens.track, borderRadius: RecordsTokens.radius.pill }} />
            </Animated.View>
          </View>
        </View>
      ))}
    </View>
  );
}
