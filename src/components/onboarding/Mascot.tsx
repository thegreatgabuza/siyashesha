import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type MascotMood = 'welcome' | 'curious' | 'cheer' | 'calm';

const moodLabel: Record<MascotMood, string> = {
  welcome: 'Siyashesha mascot, a friendly passport shield',
  curious: 'Mascot looking curious',
  cheer: 'Mascot cheering',
  calm: 'Mascot calmly waiting',
};

/**
 * Shield-and-stamp mascot. Eyes and mouth change with the mood so it can react to choices.
 * It bobs gently unless the user has reduced motion turned on.
 */
export function Mascot({ mood = 'welcome', size = 120 }: { mood?: MascotMood; size?: number }) {
  const reduced = useReducedMotion();
  const bob = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      bob.value = 0;
      return;
    }
    bob.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [bob, reduced]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: bob.value }] }));

  const mouth =
    mood === 'cheer'
      ? 'M40 66 Q50 78 60 66'
      : mood === 'curious'
        ? 'M42 68 Q50 65 58 68'
        : mood === 'calm'
          ? 'M43 68 Q50 72 57 68'
          : 'M41 66 Q50 74 59 66';

  return (
    <Animated.View style={style} accessible accessibilityRole="image" accessibilityLabel={moodLabel[mood]}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Path d="M50 6 L86 19 V48 C86 72 70 88 50 95 C30 88 14 72 14 48 V19 Z" fill="#0B2559" />
        <Path d="M50 16 L76 26 V48 C76 66 64 79 50 85 C36 79 24 66 24 48 V26 Z" fill="#FFFFFF" />
        <Rect x="44" y="34" width="12" height="28" rx="3" fill="#DC1F26" />
        <Rect x="36" y="42" width="28" height="12" rx="3" fill="#DC1F26" />
        {mood === 'cheer' ? (
          <>
            <Path d="M33 56 Q36 50 39 56" stroke="#0B2559" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <Path d="M61 56 Q64 50 67 56" stroke="#0B2559" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <Circle cx="37" cy="55" r="2.8" fill="#0B2559" />
            <Circle cx="63" cy="55" r="2.8" fill="#0B2559" />
          </>
        )}
        <Path d={mouth} stroke="#0B2559" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}
