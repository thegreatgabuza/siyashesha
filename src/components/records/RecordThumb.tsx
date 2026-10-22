import { View } from 'react-native';

import { categoryTints, elevation, fonts, type CategoryTint } from '@/design/tokens';
import type { RecordCategory } from '@/data/records';
import { Txt } from '@/components/ui/Txt';
import { categoryStyle } from './categoryStyle';

/** Which brand tint each category's thumbnail uses. Five tints, so the vault stays calm. */
export const categoryTint: Record<RecordCategory, CategoryTint> = {
  Prescriptions: 'navy',
  'Blood Tests': 'steel',
  Radiology: 'slate',
  'Clinic Visits': 'navy',
  'Hospital Visits': 'red',
  'Discharge Summaries': 'slate',
  Operations: 'red',
  'Specialist Letters': 'steel',
  Vaccinations: 'green',
  'Chronic Care': 'navy',
  Other: 'slate',
};

/**
 * Studio-style document preview: a sheet of paper in a tinted frame with a soft shadow, a
 * letterhead band, the category glyph and a few ruled lines. Every record gets the same frame,
 * so the vault reads like a well-kept catalogue. Width drives everything; height is A4-ish.
 */
export function RecordThumb({
  category,
  title,
  width = 56,
  showTitle = false,
}: {
  category: RecordCategory;
  title?: string;
  width?: number;
  showTitle?: boolean;
}) {
  const tint = categoryTints[categoryTint[category]];
  const Icon = categoryStyle[category].icon;
  const height = Math.round(width * 1.28);
  const pad = Math.max(4, width * 0.1);
  const sheetW = width - pad * 2;
  // Scale from the base 56px design, capped so large catalog tiles keep fine detail.
  const s = Math.min(width / 56, 2.2);
  const lineH = Math.max(2, 2.5 * s);

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width, height, borderRadius: Math.max(8, width * 0.14), backgroundColor: tint.band, padding: pad, paddingBottom: 0, overflow: 'hidden' }}
    >
      <View
        style={[
          {
            flex: 1,
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: Math.max(4, 6 * s),
            borderTopRightRadius: Math.max(4, 6 * s),
            padding: Math.max(4, 6 * s),
            gap: Math.max(2, 4 * s),
          },
          elevation[1],
        ]}
      >
        {/* Letterhead */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 * s }}>
          <View style={{ width: 14 * s, height: 14 * s, borderRadius: 4 * s, backgroundColor: tint.paper, alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={Math.max(8, 9 * s)} color={tint.ink} strokeWidth={2.4} />
          </View>
          <View style={{ flex: 1, height: lineH, borderRadius: lineH, backgroundColor: tint.ink, opacity: 0.85 }} />
        </View>
        {showTitle && title ? (
          <Txt numberOfLines={3} maxFontSizeMultiplier={1} style={{ fontFamily: fonts.bold, fontSize: Math.min(9 * s, 15), lineHeight: Math.min(11 * s, 19), color: tint.ink }}>
            {title}
          </Txt>
        ) : null}
        {/* Ruled body lines */}
        {[0.92, 0.78, 0.86, 0.6].map((w, i) => (
          <View key={i} style={{ width: sheetW * w - 12 * s, height: lineH, borderRadius: lineH, backgroundColor: '#E2E8F0' }} />
        ))}
        {/* Signature mark */}
        <View style={{ flex: 1 }} />
        <View style={{ alignSelf: 'flex-end', width: sheetW * 0.32, height: lineH, borderRadius: lineH, backgroundColor: tint.ink, opacity: 0.35, marginBottom: 2 * s }} />
      </View>
    </View>
  );
}
