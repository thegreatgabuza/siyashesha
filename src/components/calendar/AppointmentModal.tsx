import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Pill as PillIcon,
  Stethoscope,
  Trash2,
  User,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { type Appointment, type AppointmentType } from '@/data/appointments';
import { elevation, fonts, radii } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { tapFeedback } from '@/lib/feedback';

interface AppointmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (appt: Omit<Appointment, 'id'>) => void;
  onDelete?: (id: string) => void;
  initialDate?: string;
  existingAppointment?: Appointment;
}

export function AppointmentModal({
  visible,
  onClose,
  onSave,
  onDelete,
  initialDate,
  existingAppointment,
}: AppointmentModalProps) {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const isEditing = !!existingAppointment;

  const [type, setType] = useState<AppointmentType>(existingAppointment?.type ?? 'Appointment');
  const [title, setTitle] = useState(existingAppointment?.title ?? '');
  const [facility, setFacility] = useState(existingAppointment?.facility ?? '');
  const [provider, setProvider] = useState(existingAppointment?.provider ?? '');
  const [date, setDate] = useState(existingAppointment?.date ?? initialDate ?? dayjs().format('YYYY-MM-DD'));
  const [time, setTime] = useState(existingAppointment?.time ?? '09:00');
  const [notes, setNotes] = useState(existingAppointment?.notes ?? '');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Required field', 'Please enter a title for the visit.');
      return;
    }
    if (!facility.trim()) {
      Alert.alert('Required field', 'Please enter a healthcare facility or clinic name.');
      return;
    }

    onSave({
      title: title.trim(),
      facility: facility.trim(),
      provider: provider.trim() ? provider.trim() : undefined,
      date,
      time,
      type,
      notes: notes.trim() ? notes.trim() : undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    if (!existingAppointment || !onDelete) return;
    Alert.alert(
      'Cancel Appointment',
      `Are you sure you want to cancel "${existingAppointment.title}"?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Cancel Visit',
          style: 'destructive',
          onPress: () => {
            onDelete(existingAppointment.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
      >
        <View
          style={{
            backgroundColor: t.surface,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
            maxHeight: '90%',
            paddingBottom: insets.bottom + 16,
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
            <View>
              <Txt variant="headline">{isEditing ? 'Manage Visit' : 'Schedule Health Visit'}</Txt>
              <Txt variant="footnote" tone="muted">
                {isEditing ? 'Update details or reschedule' : 'Add to your Health Calendar & reminders'}
              </Txt>
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

          <ScrollView style={{ paddingHorizontal: 20 }} contentContainerStyle={{ paddingVertical: 16, gap: 16 }}>
            {/* Visit Type Segmented Control */}
            <View>
              <Txt variant="label" tone="muted" style={{ marginBottom: 8 }}>
                VISIT TYPE
              </Txt>
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: t.surfaceMuted,
                  borderRadius: radii.lg,
                  padding: 4,
                  gap: 4,
                }}
              >
                <PressableScale
                  onPress={() => {
                    tapFeedback();
                    setType('Appointment');
                  }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 10,
                    borderRadius: radii.md,
                    backgroundColor: type === 'Appointment' ? t.surface : 'transparent',
                    ...(type === 'Appointment' ? elevation[1] : {}),
                  }}
                >
                  <Stethoscope size={16} color={type === 'Appointment' ? t.accent : t.textMuted} />
                  <Txt
                    variant="footnote"
                    style={{
                      fontFamily: type === 'Appointment' ? fonts.semibold : fonts.medium,
                      color: type === 'Appointment' ? t.text : t.textMuted,
                    }}
                  >
                    Clinical Visit
                  </Txt>
                </PressableScale>

                <PressableScale
                  onPress={() => {
                    tapFeedback();
                    setType('Medication Refill');
                  }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 10,
                    borderRadius: radii.md,
                    backgroundColor: type === 'Medication Refill' ? t.surface : 'transparent',
                    ...(type === 'Medication Refill' ? elevation[1] : {}),
                  }}
                >
                  <PillIcon size={16} color={type === 'Medication Refill' ? '#16A34A' : t.textMuted} />
                  <Txt
                    variant="footnote"
                    style={{
                      fontFamily: type === 'Medication Refill' ? fonts.semibold : fonts.medium,
                      color: type === 'Medication Refill' ? t.text : t.textMuted,
                    }}
                  >
                    Medicine Refill
                  </Txt>
                </PressableScale>
              </View>
            </View>

            {/* Visit Title */}
            <View>
              <Txt variant="label" tone="muted" style={{ marginBottom: 6 }}>
                VISIT TITLE *
              </Txt>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder={type === 'Appointment' ? 'e.g. Quarterly Diabetes Review' : 'e.g. Chronic Medication Collection'}
                placeholderTextColor={t.textMuted}
                style={{
                  minHeight: 48,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: t.border,
                  backgroundColor: t.surfaceMuted,
                  paddingHorizontal: 14,
                  fontSize: 15,
                  color: t.text,
                }}
              />
            </View>

            {/* Date & Time Row */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* Date */}
              <View style={{ flex: 1 }}>
                <Txt variant="label" tone="muted" style={{ marginBottom: 6 }}>
                  DATE *
                </Txt>
                <Pressable
                  onPress={() => {
                    tapFeedback();
                    setShowDatePicker(true);
                  }}
                  style={{
                    minHeight: 48,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: t.border,
                    backgroundColor: t.surfaceMuted,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <CalendarIcon size={16} color={t.accent} />
                  <Txt variant="body" numberOfLines={1}>
                    {dayjs(date).format('DD MMM YYYY')}
                  </Txt>
                </Pressable>
              </View>

              {/* Time */}
              <View style={{ width: 130 }}>
                <Txt variant="label" tone="muted" style={{ marginBottom: 6 }}>
                  TIME *
                </Txt>
                <Pressable
                  onPress={() => {
                    tapFeedback();
                    setShowTimePicker(true);
                  }}
                  style={{
                    minHeight: 48,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: t.border,
                    backgroundColor: t.surfaceMuted,
                    paddingHorizontal: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Clock size={16} color={t.accent} />
                  <Txt variant="body">
                    {time === '00:00' ? 'All day' : dayjs(`2000-01-01T${time}`).format('hh:mm A')}
                  </Txt>
                </Pressable>
              </View>
            </View>

            {/* Date picker dialog */}
            {showDatePicker && (
              <DateTimePicker
                value={dayjs(date).toDate()}
                mode="date"
                display="default"
                onChange={(_, selected) => {
                  setShowDatePicker(false);
                  if (selected) setDate(dayjs(selected).format('YYYY-MM-DD'));
                }}
              />
            )}

            {/* Time picker dialog */}
            {showTimePicker && (
              <DateTimePicker
                value={dayjs(`2000-01-01T${time === '00:00' ? '09:00' : time}`).toDate()}
                mode="time"
                display="default"
                onChange={(_, selected) => {
                  setShowTimePicker(false);
                  if (selected) setTime(dayjs(selected).format('HH:mm'));
                }}
              />
            )}

            {/* Healthcare Facility */}
            <View>
              <Txt variant="label" tone="muted" style={{ marginBottom: 6 }}>
                HEALTHCARE FACILITY / CLINIC *
              </Txt>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: t.border,
                  backgroundColor: t.surfaceMuted,
                  paddingHorizontal: 12,
                }}
              >
                <MapPin size={16} color={t.textMuted} />
                <TextInput
                  value={facility}
                  onChangeText={setFacility}
                  placeholder="e.g. Rosebank Family Practice"
                  placeholderTextColor={t.textMuted}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    fontSize: 15,
                    color: t.text,
                  }}
                />
              </View>
            </View>

            {/* Doctor / Specialist */}
            <View>
              <Txt variant="label" tone="muted" style={{ marginBottom: 6 }}>
                DOCTOR / SPECIALIST (OPTIONAL)
              </Txt>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: t.border,
                  backgroundColor: t.surfaceMuted,
                  paddingHorizontal: 12,
                }}
              >
                <User size={16} color={t.textMuted} />
                <TextInput
                  value={provider}
                  onChangeText={setProvider}
                  placeholder="e.g. Dr N. Mokoena"
                  placeholderTextColor={t.textMuted}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    fontSize: 15,
                    color: t.text,
                  }}
                />
              </View>
            </View>

            {/* Preparation / Instructions */}
            <View>
              <Txt variant="label" tone="muted" style={{ marginBottom: 6 }}>
                PREPARATION & NOTES (OPTIONAL)
              </Txt>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="e.g. Fasting required for 8 hours. Bring glucose diary."
                placeholderTextColor={t.textMuted}
                multiline
                numberOfLines={3}
                style={{
                  minHeight: 76,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: t.border,
                  backgroundColor: t.surfaceMuted,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  textAlignVertical: 'top',
                  color: t.text,
                }}
              />
            </View>

            {/* Action buttons */}
            <View style={{ gap: 10, marginTop: 8 }}>
              <PressableScale
                onPress={handleSave}
                style={{
                  backgroundColor: t.accent,
                  minHeight: 50,
                  borderRadius: radii.pill,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Txt variant="bodyStrong" tone="onNavy">
                  {isEditing ? 'Save Changes' : 'Schedule Visit'}
                </Txt>
              </PressableScale>

              {isEditing && onDelete ? (
                <PressableScale
                  onPress={handleDelete}
                  style={{
                    backgroundColor: 'rgba(220, 31, 38, 0.1)',
                    minHeight: 46,
                    borderRadius: radii.pill,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Trash2 size={16} color="#DC1F26" />
                  <Txt variant="footnote" color="#DC1F26" style={{ fontFamily: fonts.semibold }}>
                    Cancel & Delete Visit
                  </Txt>
                </PressableScale>
              ) : null}
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
