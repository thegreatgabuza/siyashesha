import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';

import { motion, springs } from '@/design/tokens';
import { impactFeedback, tapFeedback } from '@/lib/feedback';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * A pressable surface that sinks slightly under the finger and springs back. Haptics are opt-in:
 * `selection` for choices, `impact` for primary actions.
 */
export function PressableScale({
  children,
  style,
  scaleTo = motion.pressScale,
  haptic,
  onPress,
  onPressIn,
  onPressOut,
  ...rest
}: Omit<PressableProps, 'style' | 'children'> & {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: 'selection' | 'impact';
}) {
  const reduced = useReducedMotion();
  const pressed = useSharedValue(0);
  // With reduce motion the press shows as a dim instead of a scale. Opacity is only animated then,
  // so a caller's own opacity (e.g. a disabled state) is otherwise left alone.
  const animated = useAnimatedStyle(() =>
    reduced ? { opacity: 1 - pressed.value * 0.15 } : { transform: [{ scale: 1 - (1 - scaleTo) * pressed.value }] }
  );

  return (
    <AnimatedPressable
      accessibilityRole="button"
      {...rest}
      onPressIn={(e) => {
        pressed.value = withSpring(1, springs.snappy);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        pressed.value = withSpring(0, springs.bouncy);
        onPressOut?.(e);
      }}
      onPress={(e) => {
        if (haptic === 'selection') tapFeedback();
        if (haptic === 'impact') impactFeedback();
        onPress?.(e);
      }}
      style={[style, animated]}
    >
      {children}
    </AnimatedPressable>
  );
}
