import { router } from 'expo-router';
import { Check, ChevronRight } from 'lucide-react-native';
import { View } from 'react-native';

import { PressableScale } from '@/components/ui/PressableScale';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Txt } from '@/components/ui/Txt';
import { elevation, fonts, radii } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import type { PassportProgress as Progress } from '@/lib/passport';

/**
 * Next best action, with the five setup steps as a compact checklist underneath.
 */
export function PassportProgress({ progress }: { progress: Progress }) {
  const t = useTokens();
  const { steps, done, total, next } = progress;

  return (
    <View style={[{ backgroundColor: t.surface, borderRadius: radii.lg, padding: 18, gap: 18 }, elevation[1]]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <ProgressRing progress={progress.progress} size={52} stroke={6}>
          <Txt variant="footnote" style={{ fontFamily: fonts.bold }}>
            {done}/{total}
          </Txt>
        </ProgressRing>
        <View style={{ flex: 1 }}>
          <Txt variant="label" tone="muted">
            {next ? 'Next best step' : 'Passport complete'}
          </Txt>
          <Txt variant="bodyStrong" color={next ? t.text : t.successText}>
            {next ? next.nextStep : 'Every step done. Nicely looked after.'}
          </Txt>
        </View>
      </View>

      {/* Compact checklist. Pills wrap to new lines, so no label is ever cut or squeezed. */}
      <View
        accessible
        accessibilityLabel={`Passport setup: ${steps.map((s) => `${s.short} ${s.done ? 'done' : 'to do'}`).join(', ')}`}
        style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
      >
        {steps.map((s) => {
          const isNext = next?.id === s.id;
          return (
            <View
              key={s.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingLeft: 6,
                paddingRight: 12,
                paddingVertical: 5,
                borderRadius: radii.pill,
                backgroundColor: s.done ? t.successSoft : isNext ? t.surface : t.surfaceMuted,
                borderWidth: isNext ? 1.5 : 0,
                borderColor: t.interactive,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: s.done ? t.success : 'transparent',
                  borderWidth: s.done ? 0 : 1.5,
                  borderColor: isNext ? t.interactive : t.textMuted,
                  borderStyle: s.done || isNext ? 'solid' : 'dashed',
                }}
              >
                {s.done ? <Check size={12} color="#FFFFFF" strokeWidth={3} /> : null}
              </View>
              <Txt variant="footnote" color={s.done ? t.successText : isNext ? t.text : t.textMuted} style={{ fontFamily: isNext || s.done ? fonts.semibold : fonts.regular }}>
                {s.short}
              </Txt>
            </View>
          );
        })}
      </View>

      {next ? (
        <PressableScale
          accessibilityLabel={`Next step: ${next.nextStep}`}
          onPress={() => router.push(next.nextRoute as any)}
          haptic="impact"
          style={{
            minHeight: 48,
            borderRadius: radii.pill,
            backgroundColor: t.interactive,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingHorizontal: 18,
          }}
        >
          <Txt variant="callout" color={t.scheme === 'dark' ? '#0B1024' : '#FFFFFF'} style={{ fontFamily: fonts.semibold }}>
            {next.short === 'Record' ? 'Upload a record' : 'Continue'}
          </Txt>
          <ChevronRight size={16} color={t.scheme === 'dark' ? '#0B1024' : '#FFFFFF'} />
        </PressableScale>
      ) : null}
    </View>
  );
}
