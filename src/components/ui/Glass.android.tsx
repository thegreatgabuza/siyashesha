import { View } from 'react-native';

import { useTokens } from '@/design/useTokens';
import type { GlassProps } from './Glass.types';

/**
 * Android frosted surface. Uses a solid translucent fill to guarantee contrast
 * and eliminate shader lag across varied Android GPUs.
 */
export function Glass({ children, style, tint }: GlassProps) {
  const t = useTokens();
  const fill = tint ?? t.glassTint;

  return <View style={[style, { backgroundColor: fill }]}>{children}</View>;
}

export type { GlassProps };
