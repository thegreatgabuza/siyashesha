import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useTokens } from '@/design/useTokens';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** A ring that fills to `progress` (0 to 1) with an eased sweep. Green once complete. */
export function ProgressRing({
  progress,
  size = 56,
  stroke = 6,
  color,
  track,
  delay = 150,
  children,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  delay?: number;
  children?: React.ReactNode;
}) {
  const t = useTokens();
  const reduced = useReducedMotion();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = useSharedValue(reduced ? progress : 0);

  useEffect(() => {
    p.value = reduced ? progress : withDelay(delay, withTiming(progress, { duration: 1100, easing: Easing.out(Easing.cubic) }));
  }, [progress, reduced, delay, p]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - p.value) }));
  const fill = color ?? (progress >= 1 ? t.success : t.interactive);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track ?? t.border} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={fill}
          strokeWidth={stroke}
          strokeDasharray={`${c} ${c}`}
          strokeLinecap="round"
          fill="none"
          animatedProps={animatedProps}
        />
      </Svg>
      {children}
    </View>
  );
}
