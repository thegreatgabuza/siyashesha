import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { Platform, RefreshControl, ScrollView, View, type ScrollViewProps } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { navy, red } from '@/design/tokens';
import { useTabBarInset } from '@/hooks/useTabBarInset';

/**
 * Page shell. The scroll content always clears the floating tab bar. `bottomInset`, when given,
 * is extra space on top of that (for a floating button). Pull to refresh shows the passport mark
 * gently pulsing instead of a stock spinner on iOS and web.
 */
export function Screen({
  children,
  scroll = true,
  onRefresh,
  contentClassName,
  bottomInset = 0,
  ...rest
}: {
  children: React.ReactNode;
  scroll?: boolean;
  onRefresh?: () => Promise<void> | void;
  contentClassName?: string;
  bottomInset?: number;
} & ScrollViewProps) {
  const insets = useSafeAreaInsets();
  const tabInset = useTabBarInset(bottomInset);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = onRefresh
    ? async () => {
        setRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setRefreshing(false);
        }
      }
    : undefined;

  if (!scroll) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-canvasdark" style={{ paddingTop: insets.top }}>
        {children}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-canvasdark" style={{ paddingTop: insets.top }}>
      {refreshing ? <RefreshMark /> : null}
      <ScrollView
        className={contentClassName}
        contentContainerStyle={{ paddingBottom: tabInset }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          handleRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              // The branded mark replaces the spinner on iOS; Android keeps its native disc in brand colours.
              tintColor={Platform.OS === 'ios' ? 'transparent' : navy[500]}
              colors={[navy[500], red[500]]}
              progressBackgroundColor="#FFFFFF"
            />
          ) : undefined
        }
        {...rest}
      >
        {children}
      </ScrollView>
    </View>
  );
}

function RefreshMark() {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 520, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 520, easing: Easing.in(Easing.quad) })),
      -1
    );
  }, [pulse, reduced]);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: 0.9 + pulse.value * 0.15 }, { rotate: `${-6 + pulse.value * 12}deg` }],
  }));
  if (Platform.OS === 'android') return null;
  return (
    <Animated.View
      entering={FadeIn.duration(150)}
      exiting={FadeOut.duration(150)}
      pointerEvents="none"
      accessibilityLabel="Refreshing"
      style={{ position: 'absolute', top: insets.top, left: 0, right: 0, alignItems: 'center', paddingTop: 6 }}
    >
      <Animated.View style={style}>
        <Image source={require('../../../assets/images/splash-icon.png')} style={{ width: 34, height: 34 }} contentFit="contain" />
      </Animated.View>
    </Animated.View>
  );
}
