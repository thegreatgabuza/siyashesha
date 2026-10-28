import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, withSpring } from 'react-native-reanimated';

import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { elevation, fonts, radii, springs } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { useI18n } from '@/i18n/useI18n';

/**
 * Calendar and Diary share one tab. This segmented switch sits at the top of both screens; the
 * thumb springs across before the route changes, so the switch feels physical.
 */
export function JournalSwitch({ active }: { active: 'calendar' | 'diary' }) {
  const t = useTokens();
  const { t: tr } = useI18n();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [pos, setPos] = useState(active === 'calendar' ? 0 : 1);

  const thumb = useAnimatedStyle(() => ({
    transform: [{ translateX: reduced ? (pos * width) / 2 : withSpring((pos * width) / 2, springs.snappy) }],
  }));

  const go = (target: 'calendar' | 'diary') => {
    if (target === active) return;
    setPos(target === 'calendar' ? 0 : 1);
    setTimeout(() => {
      router.replace(target === 'calendar' ? '/calendar' : '/diary');
      setPos(active === 'calendar' ? 0 : 1);
    }, reduced ? 0 : 140);
  };

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width - 8)}
      style={{ flexDirection: 'row', padding: 4, borderRadius: radii.pill, backgroundColor: t.surfaceMuted }}
    >
      {width > 0 ? (
        <Animated.View
          style={[
            { position: 'absolute', top: 4, left: 4, bottom: 4, width: width / 2, borderRadius: radii.pill, backgroundColor: t.surface },
            elevation[1],
            thumb,
          ]}
        />
      ) : null}
      {(['calendar', 'diary'] as const).map((key) => (
        <PressableScale
          key={key}
          accessibilityRole="tab"
          accessibilityState={{ selected: active === key }}
          accessibilityLabel={tr(`tabs.${key}`)}
          onPress={() => go(key)}
          haptic="selection"
          style={{ flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }}
        >
          <Txt variant="callout" color={active === key ? t.text : t.textMuted} style={{ fontFamily: active === key ? fonts.semibold : fonts.medium, textAlign: 'center' }}>
            {tr(`tabs.${key}`)}
          </Txt>
        </PressableScale>
      ))}
    </View>
  );
}
