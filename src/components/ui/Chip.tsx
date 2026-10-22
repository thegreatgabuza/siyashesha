import { View } from 'react-native';

import { fonts, radii } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { Txt } from './Txt';

type ChipTone = 'neutral' | 'accent' | 'success' | 'onNavy' | 'missing';

/** A compact label chip. Text wraps rather than truncating, so long translations survive. */
export function Chip({
  label,
  value,
  tone = 'neutral',
  icon,
}: {
  label?: string;
  value: string;
  tone?: ChipTone;
  icon?: React.ReactNode;
}) {
  const t = useTokens();
  const tones: Record<ChipTone, { bg: string; fg: string; sub: string; border?: string }> = {
    neutral: { bg: t.surfaceMuted, fg: t.text, sub: t.textMuted },
    accent: { bg: t.accentSoft, fg: t.accentText, sub: t.accentText },
    success: { bg: t.successSoft, fg: t.successText, sub: t.successText },
    onNavy: { bg: 'rgba(255,255,255,0.12)', fg: '#FFFFFF', sub: 'rgba(255,255,255,0.72)', border: 'rgba(255,255,255,0.18)' },
    // A value that is not recorded yet: dashed outline, never filled, so it can't be mistaken for data.
    missing: { bg: 'transparent', fg: t.text, sub: t.textMuted, border: t.textMuted },
  };
  const c = tones[tone];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: radii.pill,
        backgroundColor: c.bg,
        borderWidth: c.border ? 1 : 0,
        borderColor: c.border,
        borderStyle: tone === 'missing' ? 'dashed' : 'solid',
        maxWidth: '100%',
        flexShrink: 1,
      }}
    >
      {icon}
      <Txt variant="footnote" color={c.sub} style={{ flexShrink: 1 }}>
        {label ? `${label} · ` : null}
        <Txt variant="footnote" color={c.fg} style={{ fontFamily: fonts.semibold }}>
          {value}
        </Txt>
      </Txt>
    </View>
  );
}
