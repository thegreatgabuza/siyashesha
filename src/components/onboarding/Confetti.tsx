import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const colours = ['#0B2559', '#16A34A', '#8FA0C2', '#DCE7F5', '#DC1F26'];
const pieces = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  left: (i * 37) % 100,
  delay: (i * 53) % 400,
  drift: ((i * 29) % 80) - 40,
  colour: colours[i % colours.length],
}));

function Piece({ left, delay, drift, colour, active }: (typeof pieces)[number] & { active: boolean }) {
  const fall = useSharedValue(0);

  useEffect(() => {
    fall.value = active ? withDelay(delay, withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) })) : 0;
  }, [active, delay, fall]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - fall.value * 0.6,
    transform: [{ translateY: fall.value * 620 }, { translateX: fall.value * drift }, { rotate: `${fall.value * 540}deg` }],
  }));

  return (
    <Animated.View
      style={[
        style,
        { position: 'absolute', top: -20, left: `${left}%`, width: 8, height: 12, borderRadius: 2, backgroundColor: colour },
      ]}
    />
  );
}

/** Short confetti burst for milestone moments. Skipped entirely when reduced motion is on. */
export function Confetti({ active }: { active: boolean }) {
  const reduced = useReducedMotion();
  if (reduced) return null;
  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <Piece key={p.id} {...p} active={active} />
      ))}
    </View>
  );
}
