import { useEffect } from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export function Skeleton({ className, style, ...rest }: ViewProps & { className?: string }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      className={`rounded-2xl bg-slate-200 dark:bg-canvasdark-card ${className ?? ''}`}
      style={[animatedStyle, style]}
      {...rest}
    />
  );
}

export function SkeletonRow() {
  return (
    <View className="mb-3 flex-row items-center gap-3">
      <Skeleton style={{ width: 44, height: 44, borderRadius: 14 }} />
      <View className="flex-1 gap-2">
        <Skeleton style={{ height: 14, borderRadius: 7, width: '70%' }} />
        <Skeleton style={{ height: 12, borderRadius: 6, width: '45%' }} />
      </View>
    </View>
  );
}
