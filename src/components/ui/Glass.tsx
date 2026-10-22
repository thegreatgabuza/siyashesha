import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTokens } from '@/design/useTokens';

const liquid = Platform.OS === 'ios' && isLiquidGlassAvailable();

/**
 * A frosted surface. Native liquid glass where the OS has it (iOS 26+), a system blur elsewhere
 * on iOS and web, and a solid translucent fill on Android so text always keeps its contrast.
 */
export function Glass({
  children,
  style,
  intensity = 60,
  tint,
  interactive,
}: {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  /** Override the fill, e.g. a navy glass. */
  tint?: string;
  interactive?: boolean;
}) {
  const t = useTokens();
  const fill = tint ?? t.glassTint;

  if (liquid) {
    return (
      <GlassView glassEffectStyle="regular" isInteractive={interactive} tintColor={tint} colorScheme={t.scheme} style={style}>
        {children}
      </GlassView>
    );
  }

  if (Platform.OS === 'android') {
    return <View style={[style, { backgroundColor: fill }]}>{children}</View>;
  }

  return (
    // The blur and fill layers sit at zIndex -1 inside their own stacking context: on web, absolute
    // layers would otherwise paint over (and blur) the in-flow content.
    <View style={[style, { overflow: 'hidden', zIndex: 0 }]}>
      <BlurView intensity={intensity} tint={t.scheme === 'dark' ? 'dark' : 'light'} style={[StyleSheet.absoluteFill, { zIndex: -1 }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: fill, zIndex: -1 }]} pointerEvents="none" />
      {children}
    </View>
  );
}
