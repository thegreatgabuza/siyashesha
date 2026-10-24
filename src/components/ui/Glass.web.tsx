import { View } from 'react-native';

import { useTokens } from '@/design/useTokens';
import type { GlassProps } from './Glass.types';

/**
 * Web frosted surface. Uses standard CSS hardware-accelerated backdrop-filter.
 */
export function Glass({ children, style, intensity = 60, tint }: GlassProps) {
  const t = useTokens();
  const fill = tint ?? t.glassTint;
  const blurPx = Math.round(intensity * 0.25);

  return (
    <View
      style={[
        style,
        {
          backgroundColor: fill,
          backdropFilter: `blur(${blurPx}px)`,
          WebkitBackdropFilter: `blur(${blurPx}px)`,
        } as any,
      ]}
    >
      {children}
    </View>
  );
}

export type { GlassProps };
