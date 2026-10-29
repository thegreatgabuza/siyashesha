import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { Calendar as CalendarIcon, Clock } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Platform, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTokens } from '@/design/useTokens';

export interface PlatformDatePickerProps {
  visible: boolean;
  value: Date;
  mode?: 'date' | 'time';
  title?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  minuteInterval?: 1 | 2 | 3 | 4 | 5 | 6 | 10 | 12 | 15 | 20 | 30;
  onChange: (date: Date) => void;
  onClose: () => void;
}

/**
 * Cross-platform date & time picker component:
 * - On Android: Triggers native Android DatePickerDialog / TimePickerDialog
 * - On iOS: Presents a clean bottom sheet with spinner DateTimePicker and Done/Cancel controls
 * - On Web: Falls back to clean modal or native picker
 */
export function PlatformDatePicker({
  visible,
  value,
  mode = 'date',
  title,
  minimumDate,
  maximumDate,
  minuteInterval,
  onChange,
  onClose,
}: PlatformDatePickerProps) {
  const insets = useSafeAreaInsets();
  const t = useTokens();
  const [tempDate, setTempDate] = useState<Date>(value);

  if (!visible) return null;

  // --- Android Implementation ---
  if (Platform.OS === 'android') {
    return (
      <DateTimePicker
        value={value}
        mode={mode}
        display="default"
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        minuteInterval={minuteInterval}
        onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
          onClose();
          if (event.type === 'set' && selectedDate) {
            onChange(selectedDate);
          }
        }}
      />
    );
  }

  // --- Web Implementation ---
  if (Platform.OS === 'web') {
    const formatted = mode === 'date' ? dayjs(value).format('YYYY-MM-DD') : dayjs(value).format('HH:mm');
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ backgroundColor: t.surface, borderRadius: 20, padding: 20, width: 300, gap: 14 }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: t.text }}>
              {title ?? (mode === 'date' ? 'Select Date' : 'Select Time')}
            </Text>
            <input
              type={mode}
              defaultValue={formatted}
              style={{ padding: 10, fontSize: 16, borderRadius: 8, border: '1px solid #CBD5E1' }}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                const next = mode === 'date' ? dayjs(val).toDate() : dayjs(`2000-01-01T${val}`).toDate();
                onChange(next);
              }}
            />
            <Pressable
              onPress={onClose}
              style={{ backgroundColor: '#0B2559', padding: 10, borderRadius: 10, alignItems: 'center' }}
            >
              <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' }}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    );
  }

  // --- iOS Implementation (Bottom Sheet with Spinner and Done button) ---
  const defaultTitle = mode === 'date' ? 'Select Date' : 'Select Time';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.45)' }}>
        <Pressable accessibilityLabel="Close picker" onPress={onClose} style={{ flex: 1 }} />
        <View
          style={{
            backgroundColor: t.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom, 16) + 8,
            borderTopWidth: 1,
            borderTopColor: t.border,
          }}
        >
          {/* Header Bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderBottomColor: t.border,
            }}
          >
            <Pressable accessibilityRole="button" accessibilityLabel="Cancel" onPress={onClose} style={{ padding: 4 }}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: t.textMuted }}>Cancel</Text>
            </Pressable>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {mode === 'date' ? (
                <CalendarIcon size={16} color="#0B2559" />
              ) : (
                <Clock size={16} color="#0B2559" />
              )}
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16, color: t.text }}>
                {title ?? defaultTitle}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirm selection"
              onPress={() => {
                onChange(tempDate);
                onClose();
              }}
              style={{
                backgroundColor: '#0B2559',
                paddingHorizontal: 14,
                paddingVertical: 6,
                borderRadius: 999,
              }}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: '#FFFFFF' }}>Done</Text>
            </Pressable>
          </View>

          {/* iOS Spinner Picker */}
          <View style={{ alignItems: 'center', paddingVertical: 10 }}>
            <DateTimePicker
              value={tempDate}
              mode={mode}
              display="spinner"
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              minuteInterval={minuteInterval}
              onChange={(_, selectedDate?: Date) => {
                if (selectedDate) {
                  setTempDate(selectedDate);
                }
              }}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
