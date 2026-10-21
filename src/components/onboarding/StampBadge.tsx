import { Check, Lock } from 'lucide-react-native';
import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

/**
 * Passport stamp. Unearned stamps are a quiet outline; earned stamps press in with a small spring.
 */
export function StampBadge({
  earned,
  label,
  size = 84,
}: {
  earned: boolean;
  label: string;
  size?: number;
}) {
  const reduced = useReducedMotion();
  const scale = useSharedValue(earned ? 1 : 1);

  useEffect(() => {
    if (!earned || reduced) return;
    scale.value = 1.35;
    scale.value = withSpring(1, { damping: 9, stiffness: 160 });
  }, [earned, reduced, scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { rotate: earned ? '-8deg' : '0deg' }] }));

  return (
    <Animated.View
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${label}: ${earned ? 'earned' : 'not yet earned'}`}
      style={[style, { width: size, height: size }]}
      className={`items-center justify-center rounded-full border-4 ${
        earned ? 'border-success-500 bg-success-50 dark:bg-success-500/15' : 'border-dashed border-slate-300 bg-white dark:border-slate-600 dark:bg-canvasdark-card'
      }`}
    >
      {earned ? <Check size={size * 0.36} color="#16A34A" strokeWidth={3} /> : <Lock size={size * 0.28} color="#8C98B8" />}
      <Text
        numberOfLines={2}
        className={`mt-1 px-2 text-center font-sans-semibold text-[9px] leading-[11px] ${earned ? 'text-success-600' : 'text-ink-muted dark:text-slate-400'}`}
      >
        {label}
      </Text>
    </Animated.View>
  );
}
