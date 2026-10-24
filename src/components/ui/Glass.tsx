import { BlurView } from 'expo-blur';
import { StyleSheet, View } from 'react-native';

import { useTokens } from '@/design/useTokens';
import type { GlassProps } from './Glass.types';

export * from './Glass.types';

/**
 * Default fallback frosted surface for environments where platform-specific
 * extensions are not resolved directly.
 */
export function Glass({ children, style, intensity = 60, tint }: GlassProps) {
  const t = useTokens();
  const fill = tint ?? t.glassTint;

  return (
    <View style={[style, { overflow: 'hidden' }]}>
      <BlurView intensity={intensity} tint={t.scheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: fill }]} pointerEvents="none" />
      {children}
    </View>
  );
}
