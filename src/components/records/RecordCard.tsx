import { ChevronRight, Download, Share2, Trash2 } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { PressableScale } from '@/components/ui/PressableScale';
import { RecordsTokens } from '@/constants/recordsTokens';
import type { MedicalRecord } from '@/data/records';
import { formatEventDate, reviewLabel } from '@/lib/recordSearch';
import { RecordThumb } from './RecordThumb';

/**
 * One medical record. Hierarchy: title first, then category and date, then provider and facility,
 * with the diagnosis as a small tag. Swipe left for download, share, and delete.
 */
export function RecordCard({
  record,
  onOpen,
  onShare,
  onDownload,
  onDelete,
}: {
  record: MedicalRecord;
  onOpen: () => void;
  onShare: () => void;
  onDownload?: () => void;
  onDelete: () => void;
}) {
  const review = reviewLabel(record);
  const provider = [record.doctor, record.facility].filter(Boolean).join(' · ');

  return (
    <ReanimatedSwipeable
      overshootRight={false}
      renderRightActions={() => (
        <View className="ml-2 flex-row gap-2">
          {onDownload ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Download ${record.title}`}
              onPress={onDownload}
              className="w-16 items-center justify-center rounded-3xl"
              style={{ backgroundColor: RecordsTokens.accentSoft }}
            >
              <Download size={20} color={RecordsTokens.accent} />
            </Pressable>
          ) : null}
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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          padding: 14,
          backgroundColor: RecordsTokens.surface,
          borderRadius: RecordsTokens.radius.card,
          ...RecordsTokens.shadow,
        }}
      >
        <PressableScale
          accessibilityLabel={`Open ${record.title}, ${record.category}, ${formatEventDate(record)}, ${review}`}
          onPress={onOpen}
          scaleTo={0.98}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <RecordThumb category={record.category} width={52} />

          <View className="flex-1 gap-1">
            <View className="flex-row items-start justify-between gap-2">
              <Text
                numberOfLines={1}
                className="flex-1 font-sans-bold"
                style={{ color: RecordsTokens.text, fontSize: RecordsTokens.type.cardTitle }}
              >
                {record.title}
              </Text>
              <View
                className="rounded-full px-2 py-0.5"
                style={{ backgroundColor: review === 'Reviewed' ? RecordsTokens.successSoft : RecordsTokens.track }}
              >
                <Text
                  style={{
                    color: review === 'Reviewed' ? RecordsTokens.successText : RecordsTokens.textMuted,
                    fontSize: RecordsTokens.type.tiny,
                    fontFamily: RecordsTokens.fonts.semibold,
                  }}
                >
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
              <View
                className="mt-1 self-start rounded-full px-2.5 py-1"
                style={{ backgroundColor: RecordsTokens.accentSoft, maxWidth: '100%' }}
              >
                <Text numberOfLines={1} style={{ color: RecordsTokens.accent, fontSize: RecordsTokens.type.tiny, fontFamily: RecordsTokens.fonts.semibold }}>
                  {record.diagnosis}
                </Text>
              </View>
            ) : null}
          </View>
        </PressableScale>

        {onDownload ? (
          <PressableScale
            accessibilityLabel={`Download ${record.title} as PDF`}
            onPress={onDownload}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: RecordsTokens.accentSoft,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Download size={16} color={RecordsTokens.accent} />
          </PressableScale>
        ) : null}

        <Pressable accessibilityRole="button" accessibilityLabel={`View ${record.title}`} onPress={onOpen}>
          <ChevronRight size={18} color={RecordsTokens.textMuted} />
        </Pressable>
      </View>
    </ReanimatedSwipeable>
  );
}
