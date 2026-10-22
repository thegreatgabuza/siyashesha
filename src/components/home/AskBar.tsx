import { router } from 'expo-router';
import { ArrowUp, Sparkles } from 'lucide-react-native';
import { View } from 'react-native';

import { Glass } from '@/components/ui/Glass';
import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { elevation, radii } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';

const suggestions = ['When is my next dose?', 'My latest HbA1c', 'Share my records'];

/** First-class entry to the assistant: a glass prompt bar with a few one-tap questions. */
export function AskBar({ showSuggestions = false }: { showSuggestions?: boolean }) {
  const t = useTokens();
  const open = (q?: string) => router.push(q ? { pathname: '/assistant', params: { q } } : '/assistant');

  return (
    <View style={{ gap: 10 }}>
      <PressableScale accessibilityLabel="Ask Siyashesha a question" onPress={() => open()} haptic="selection" style={[{ borderRadius: radii.pill }, elevation[2]]}>
        <Glass
          interactive
          style={{
            minHeight: 56,
            borderRadius: radii.pill,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            paddingLeft: 18,
            paddingRight: 8,
            borderWidth: 1,
            borderColor: t.hairline,
          }}
        >
          <Sparkles size={18} color={t.interactive} />
          <Txt variant="body" tone="muted" style={{ flex: 1 }}>
            Ask Siyashesha…
          </Txt>
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: t.interactive, alignItems: 'center', justifyContent: 'center' }}>
            <ArrowUp size={18} color={t.scheme === 'dark' ? '#0B1024' : '#FFFFFF'} />
          </View>
        </Glass>
      </PressableScale>
      {showSuggestions ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {suggestions.map((q) => (
            <PressableScale
              key={q}
              accessibilityLabel={`Ask: ${q}`}
              onPress={() => open(q)}
              haptic="selection"
              style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: radii.pill, borderWidth: 1, borderColor: t.border, backgroundColor: t.surface }}
            >
              <Txt variant="footnote" tone="secondary">
                {q}
              </Txt>
            </PressableScale>
          ))}
        </View>
      ) : null}
    </View>
  );
}
