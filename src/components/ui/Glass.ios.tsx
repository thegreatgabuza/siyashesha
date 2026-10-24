import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { StyleSheet, View } from 'react-native';

import { useTokens } from '@/design/useTokens';
import type { GlassProps } from './Glass.types';

const liquid = isLiquidGlassAvailable();

/**
 * iOS frosted surface. Uses native liquid glass (iOS 26+ / GlassView) where available,
 * falling back to a system BlurView on older iOS versions.
 */
export function Glass({ children, style, intensity = 60, tint, interactive }: GlassProps) {
  const t = useTokens();
  const fill = tint ?? t.glassTint;

  if (liquid) {
    return (
      <GlassView glassEffectStyle="regular" isInteractive={interactive} tintColor={tint} colorScheme={t.scheme} style={style}>
        {children}
      </GlassView>
    );
  }

  return (
    <View style={[style, { overflow: 'hidden' }]}>
      <BlurView intensity={intensity} tint={t.scheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} pointerEvents="none" />
      {children}
    </View>
  );
}

export type { GlassProps };
