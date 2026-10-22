import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Txt } from '@/components/ui/Txt';
import { useTokens } from '@/design/useTokens';

const WORD_MS = 34;

/**
 * Reveals a reply word by word, with a soft light band sweeping across while it streams. Reduce
 * motion shows the full text at once. `onDone` fires when the last word is in.
 */
export function StreamingText({ text, animate, onDone }: { text: string; animate: boolean; onDone?: () => void }) {
  const t = useTokens();
  const reduced = useReducedMotion();
  const words = text.split(/(\s+)/);
  const instant = !animate || reduced;
  const [count, setCount] = useState(instant ? words.length : 0);
  const done = count >= words.length;
  const sweep = useSharedValue(0);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (instant) {
      onDone?.();
      return;
    }
    sweep.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }), -1);
    const id = setInterval(() => {
      setCount((c) => {
        const next = c + 2; // a word and the space after it
        if (next >= words.length) {
          clearInterval(id);
          setTimeout(() => onDone?.(), 0);
        }
        return next;
      });
    }, WORD_MS);
    return () => clearInterval(id);
    // Runs once per message; the text never changes after it is created.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const band = useAnimatedStyle(() => ({ transform: [{ translateX: -120 + sweep.value * (width + 240) }] }));

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} accessibilityLiveRegion="polite" accessibilityLabel={done ? text : undefined}>
      <Txt variant="body" style={{ lineHeight: 24 }}>
        {words.slice(0, count).join('')}
      </Txt>
      {!done && !instant ? (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { width: 120 }, band]}>
          <LinearGradient
            colors={[`${t.canvas}00`, `${t.canvas}D9`, `${t.canvas}00`]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}
