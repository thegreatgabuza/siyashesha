import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

export interface GlassProps {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  /** Override the fill, e.g. a navy glass. */
  tint?: string;
  interactive?: boolean;
}
