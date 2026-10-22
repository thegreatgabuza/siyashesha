import { Text, type TextProps } from 'react-native';

import { type } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';

type Variant = keyof typeof type;
type Tone = 'default' | 'secondary' | 'muted' | 'onNavy' | 'onNavyMuted' | 'accent' | 'success';

/** Text on the type scale. Font scaling stays on so text follows the system size. */
export function Txt({
  variant = 'body',
  tone = 'default',
  color,
  style,
  ...rest
}: TextProps & { variant?: Variant; tone?: Tone; color?: string }) {
  const t = useTokens();
  const toneColor: Record<Tone, string> = {
    default: t.text,
    secondary: t.textSecondary,
    muted: t.textMuted,
    onNavy: t.textOnNavy,
    onNavyMuted: t.textOnNavyMuted,
    accent: t.accentText,
    success: t.successText,
  };
  return <Text maxFontSizeMultiplier={1.8} {...rest} style={[type[variant], { color: color ?? toneColor[tone] }, style]} />;
}
