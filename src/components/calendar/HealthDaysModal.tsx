import { Image } from 'expo-image';
import { router } from 'expo-router';
import { BookHeart, ChevronRight, Search, X } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { healthDays, type HealthDayCard } from '@/data/healthDays';
import { elevation, fonts, radii } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { healthDayIcons } from '@/lib/healthDayIcons';

interface HealthDaysModalProps {
  visible: boolean;
  onClose: () => void;
}

export function HealthDaysModal({ visible, onClose }: HealthDaysModalProps) {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const filteredDays = healthDays.filter((d) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.dateLabel.toLowerCase().includes(q) ||
      d.sections.some((s) => s.body.toLowerCase().includes(q) || s.heading.toLowerCase().includes(q))
    );
  });

  const handleSelectDay = (card: HealthDayCard) => {
    onClose();
    router.push(`/calendar/${card.id}`);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View
          style={{
            backgroundColor: t.surface,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
            height: '88%',
            paddingBottom: insets.bottom + 12,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: t.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radii.md,
                  backgroundColor: 'rgba(14, 116, 144, 0.12)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BookHeart size={18} color={t.accent} />
              </View>
              <View>
                <Txt variant="headline">20 WHO Health Days</Txt>
                <Txt variant="footnote" tone="muted">
                  Official internationally recognised observances
                </Txt>
              </View>
            </View>
            <PressableScale
              accessibilityLabel="Close"
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: radii.pill,
                backgroundColor: t.surfaceMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} color={t.text} />
            </PressableScale>
          </View>

          {/* Search bar */}
          <View style={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 10 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: t.surfaceMuted,
                borderRadius: radii.md,
                paddingHorizontal: 12,
                minHeight: 44,
                borderWidth: 1,
                borderColor: t.border,
              }}
            >
              <Search size={16} color={t.textMuted} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search condition (e.g. Diabetes, TB, Hearing)..."
                placeholderTextColor={t.textMuted}
                style={{ flex: 1, fontSize: 14, color: t.text }}
              />
              {query ? (
                <PressableScale onPress={() => setQuery('')} style={{ padding: 4 }}>
                  <X size={14} color={t.textMuted} />
                </PressableScale>
              ) : null}
            </View>
          </View>

          {/* List of Health Days */}
          <ScrollView
            style={{ flex: 1, paddingHorizontal: 20 }}
            contentContainerStyle={{ paddingVertical: 8, gap: 10 }}
          >
            {filteredDays.map((card) => (
              <PressableScale
                key={card.id}
                onPress={() => handleSelectDay(card)}
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 14,
                    borderRadius: radii.lg,
                    backgroundColor: t.surface,
                    borderWidth: 1,
                    borderColor: t.border,
                  },
                  elevation[1],
                ]}
              >
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: radii.md,
                    backgroundColor: t.surfaceMuted,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Image source={healthDayIcons[card.icon]} style={{ width: 28, height: 28 }} contentFit="contain" />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="footnote" color={t.accent} style={{ fontFamily: fonts.semibold, fontSize: 11 }}>
                    {card.dateLabel}
                  </Txt>
                  <Txt variant="bodyStrong" numberOfLines={1} style={{ marginTop: 2 }}>
                    {card.title}
                  </Txt>
                  <Txt variant="footnote" tone="muted" numberOfLines={1} style={{ marginTop: 2 }}>
                    {card.sections[0]?.body ?? ''}
                  </Txt>
                </View>
                <ChevronRight size={16} color={t.textMuted} />
              </PressableScale>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
