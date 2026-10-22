import { ChevronRight, Share2, Trash2 } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';

import { RecordsTokens } from '@/constants/recordsTokens';
import type { MedicalRecord } from '@/data/records';
import { formatEventDate, reviewLabel } from '@/lib/recordSearch';
import { categoryStyle } from './categoryStyle';

/**
 * One medical record. Hierarchy: title first, then category and date, then provider and facility,
 * with the diagnosis as a small tag. Swipe left for share and delete.
 */
export function RecordCard({
  record,
  onOpen,
  onShare,
  onDelete,
}: {
  record: MedicalRecord;
  onOpen: () => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  const style = categoryStyle[record.category];
  const Icon = style.icon;
  const review = reviewLabel(record);
  const provider = [record.doctor, record.facility].filter(Boolean).join(' · ');

  return (
    <Swipeable
      overshootRight={false}
      renderRightActions={() => (
        <View className="ml-2 flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Share ${record.title}`}
            onPress={onShare}
            className="w-16 items-center justify-center rounded-3xl bg-brand-100"
          >
            <Share2 size={20} color={RecordsTokens.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Delete ${record.title}`}
            onPress={onDelete}
            className="w-16 items-center justify-center rounded-3xl"
            style={{ backgroundColor: RecordsTokens.emergency }}
          >
            <Trash2 size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      )}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${record.title}, ${record.category}, ${formatEventDate(record)}, ${review}`}
        onPress={onOpen}
        className="flex-row items-center gap-3 p-4"
        style={({ pressed }) => ({
          backgroundColor: RecordsTokens.surface,
          borderRadius: RecordsTokens.radius.card,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.985 : 1 }],
          ...RecordsTokens.shadow,
        })}
      >
        <View className="h-12 w-12 items-center justify-center" style={{ backgroundColor: style.tint, borderRadius: RecordsTokens.radius.tile }}>
          <Icon size={22} color={style.colour} />
        </View>

        <View className="flex-1 gap-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text numberOfLines={1} className="flex-1 font-sans-bold" style={{ color: RecordsTokens.text, fontSize: RecordsTokens.type.cardTitle }}>
              {record.title}
            </Text>
            <View
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: review === 'Reviewed' ? RecordsTokens.successSoft : RecordsTokens.track }}
            >
              <Text style={{ color: review === 'Reviewed' ? RecordsTokens.successText : RecordsTokens.textMuted, fontSize: RecordsTokens.type.tiny, fontWeight: '600' }}>
                {review}
              </Text>
            </View>
          </View>
          <Text numberOfLines={1} style={{ color: RecordsTokens.textMuted, fontSize: RecordsTokens.type.meta }}>
            {record.category} · {formatEventDate(record)}
          </Text>
          {provider ? (
            <Text numberOfLines={1} style={{ color: RecordsTokens.textMuted, fontSize: RecordsTokens.type.tiny }}>
              {provider}
            </Text>
          ) : null}
          {record.diagnosis ? (
            <View className="mt-1 self-start rounded-full px-2.5 py-1" style={{ backgroundColor: RecordsTokens.accentSoft }}>
              <Text numberOfLines={1} style={{ color: RecordsTokens.accent, fontSize: RecordsTokens.type.tiny, fontWeight: '600' }}>
                {record.diagnosis}
              </Text>
            </View>
          ) : null}
        </View>

        <ChevronRight size={18} color={RecordsTokens.textMuted} />
      </Pressable>
    </Swipeable>
  );
}
