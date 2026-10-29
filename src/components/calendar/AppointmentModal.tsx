import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import {
  Bell,
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  FileText,
  MapPin,
  Pill as PillIcon,
  Plus,
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
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import {
  type Appointment,
  type AppointmentReminderOption,
  type AppointmentStatus,
  type AppointmentType,
} from '@/data/appointments';
import { elevation, fonts, radii } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { tapFeedback } from '@/lib/feedback';
import { formatTime12 } from '@/lib/date';
import { useAppStore } from '@/store/useAppStore';

interface AppointmentModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (appt: Omit<Appointment, 'id'>, editingId?: string) => void;
  onDelete?: (id: string) => void;
  initialDate?: string;
  existingAppointment?: Appointment;
  dayAppointments?: Appointment[];
}

const reminderOptions: { id: AppointmentReminderOption; label: string }[] = [
  { id: '1_day', label: '1 day before' },
  { id: 'morning_of', label: 'Morning of' },
  { id: '2_hours', label: '2 hours before' },
  { id: 'none', label: 'No reminder' },
];

const quickEventTemplates: { title: string; type: AppointmentType; facility: string }[] = [
  { title: 'Doctor Consultation', type: 'Appointment', facility: 'Family Practice / Clinic' },
  { title: 'Blood Test / Lab Work', type: 'Appointment', facility: 'Pathology Lab' },
  { title: 'Chronic Medicine Refill', type: 'Medication Refill', facility: 'Dispensary / Pharmacy' },
  { title: 'Specialist Follow-Up', type: 'Appointment', facility: 'Outpatient Specialist Clinic' },
];

export function AppointmentModal(props: AppointmentModalProps) {
  if (!props.visible) return null;

  const sheetKey = `${props.existingAppointment?.id ?? 'new'}-${props.initialDate ?? ''}-${props.dayAppointments?.length ?? 0}`;

  return (
    <Modal
      visible={props.visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={props.onClose}
    >
      <AppointmentSheet key={sheetKey} {...props} />
    </Modal>
  );
}

function AppointmentSheet({
  onClose,
  onSave,
  onDelete,
  initialDate,
  existingAppointment,
  dayAppointments = [],
}: AppointmentModalProps) {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const records = useAppStore((s) => s.records);

  // If the user clicked a date that already has events (and no specific existingAppointment was forced),
  // default to selecting the first event on that date so they can immediately view/edit/delete it,
  // or switch to "+ New Event" with one tap.
  const initialTarget = existingAppointment ?? (dayAppointments.length > 0 ? dayAppointments[0] : undefined);

  const [activeAppt, setActiveAppt] = useState<Appointment | undefined>(initialTarget);
  const isEditing = !!activeAppt;

  const [type, setType] = useState<AppointmentType>(initialTarget?.type ?? 'Appointment');
  const [title, setTitle] = useState(initialTarget?.title ?? '');
  const [facility, setFacility] = useState(initialTarget?.facility ?? '');
  const [provider, setProvider] = useState(initialTarget?.provider ?? '');
  const [date, setDate] = useState(initialTarget?.date ?? initialDate ?? dayjs().format('YYYY-MM-DD'));
  const [time, setTime] = useState(initialTarget?.time ?? '09:00');
  const [notes, setNotes] = useState(initialTarget?.notes ?? '');
  const [status, setStatus] = useState<AppointmentStatus>(initialTarget?.status ?? 'confirmed');
  const [reminderOption, setReminderOption] = useState<AppointmentReminderOption>(
    initialTarget?.reminderOption ?? '1_day'
  );
  const [linkedRecordId, setLinkedRecordId] = useState<string | undefined>(
    initialTarget?.linkedRecordId
  );

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showRecordPicker, setShowRecordPicker] = useState(false);

  const loadAppointmentIntoForm = (appt: Appointment | undefined) => {
    tapFeedback();
    setActiveAppt(appt);
    if (appt) {
      setType(appt.type);
      setTitle(appt.title);
      setFacility(appt.facility);
      setProvider(appt.provider ?? '');
      setDate(appt.date);
      setTime(appt.time);
      setNotes(appt.notes ?? '');
      setStatus(appt.status ?? 'confirmed');
      setReminderOption(appt.reminderOption ?? '1_day');
      setLinkedRecordId(appt.linkedRecordId);
    } else {
      setType('Appointment');
      setTitle('');
      setFacility('');
      setProvider('');
      setDate(initialDate ?? dayjs().format('YYYY-MM-DD'));
      setTime('09:00');
      setNotes('');
      setStatus('confirmed');
      setReminderOption('1_day');
      setLinkedRecordId(undefined);
    }
  };

  const applyQuickTemplate = (tmpl: { title: string; type: AppointmentType; facility: string }) => {
    tapFeedback();
    setTitle(tmpl.title);
    setType(tmpl.type);
    if (!facility.trim()) {
      setFacility(tmpl.facility);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Required field', 'Please enter a title for this event or choose a quick preset.');
      return;
    }

    onSave(
      {
        title: title.trim(),
        facility: facility.trim() ? facility.trim() : type === 'Medication Refill' ? 'Pharmacy / Dispensary' : 'Clinic / Practice',
        provider: provider.trim() ? provider.trim() : undefined,
        date,
        time,
        type,
        notes: notes.trim() ? notes.trim() : undefined,
        status,
        reminderOption,
        linkedRecordId,
      },
      activeAppt?.id
    );
    onClose();
  };

  const handleDelete = () => {
    if (!activeAppt || !onDelete) return;
    if (Platform.OS === 'web') {
      onDelete(activeAppt.id);
      onClose();
      return;
    }
    Alert.alert(
      'Delete Event',
      `Remove "${activeAppt.title}" from your calendar?`,
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(activeAppt.id);
            onClose();
          },
        },
      ]
    );
  };

  const linkedRecord = records.find((r) => r.id === linkedRecordId);
  const formattedSelectedDate = dayjs(date).isValid()
    ? dayjs(date).format('ddd, D MMM YYYY')
    : date;

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.55)' }}
    >
      <Pressable
        accessibilityLabel="Dismiss event modal"
        onPress={onClose}
        style={{ flex: 1 }}
      />

      <View
        style={{
          backgroundColor: t.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          maxHeight: '92%',
          paddingBottom: Math.max(insets.bottom, 16),
          borderTopWidth: 1,
          borderColor: t.border,
        }}
      >
        {/* Drag Handle */}
        <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: t.border }} />
        </View>

        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 6,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: t.border,
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Txt variant="headline">
              {isEditing ? 'Edit Calendar Event' : 'New Calendar Event'}
            </Txt>
            <Txt variant="footnote" tone="muted">
              {formattedSelectedDate} · {isEditing ? 'Update details or delete below' : 'Schedule an appointment or refill'}
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

        {/* Day Events Switcher: shown when the clicked date has existing events */}
        {dayAppointments.length > 0 && (
          <View
            style={{
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: t.surfaceMuted,
              borderBottomWidth: 1,
              borderBottomColor: t.border,
              gap: 6,
            }}
          >
            <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: t.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Events on {dayjs(initialDate ?? date).format('D MMM')} ({dayAppointments.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {dayAppointments.map((item) => {
                const selected = activeAppt?.id === item.id;
                return (
                  <PressableScale
                    key={item.id}
                    onPress={() => loadAppointmentIntoForm(item)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: radii.pill,
                      backgroundColor: selected ? t.accent : t.surface,
                      borderWidth: 1,
                      borderColor: selected ? t.accent : t.border,
                    }}
                  >
                    {item.type === 'Medication Refill' ? (
                      <PillIcon size={13} color={selected ? '#FFFFFF' : '#16A34A'} />
                    ) : (
                      <Stethoscope size={13} color={selected ? '#FFFFFF' : t.accent} />
                    )}
                    <Text
                      numberOfLines={1}
                      style={{
                        fontFamily: fonts.semibold,
                        fontSize: 12,
                        color: selected ? '#FFFFFF' : t.text,
                        maxWidth: 160,
                      }}
                    >
                      {item.title} ({item.time !== '00:00' ? formatTime12(item.time) : 'All day'})
                    </Text>
                  </PressableScale>
                );
              })}

              <PressableScale
                onPress={() => loadAppointmentIntoForm(undefined)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: radii.pill,
                  backgroundColor: !isEditing ? '#16A34A' : t.surface,
                  borderWidth: 1,
                  borderColor: !isEditing ? '#16A34A' : t.border,
                }}
              >
                <Plus size={14} color={!isEditing ? '#FFFFFF' : '#16A34A'} />
                <Text
                  style={{
                    fontFamily: fonts.semibold,
                    fontSize: 12,
                    color: !isEditing ? '#FFFFFF' : '#16A34A',
                  }}
                >
                  New Event
                </Text>
              </PressableScale>
            </ScrollView>
          </View>
        )}

        <ScrollView
          style={{ flexShrink: 1, paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingVertical: 16, gap: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Visit Status (when editing) */}
          {isEditing ? (
            <View>
              <Txt variant="label" tone="muted" style={{ marginBottom: 8 }}>
                EVENT STATUS
              </Txt>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <PressableScale
                  onPress={() => {
                    tapFeedback();
                    setStatus('confirmed');
                  }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 9,
                    borderRadius: radii.pill,
                    backgroundColor: status === 'confirmed' ? 'rgba(14, 116, 144, 0.12)' : t.surfaceMuted,
                    borderWidth: status === 'confirmed' ? 1.5 : 1,
                    borderColor: status === 'confirmed' ? t.accent : t.border,
                  }}
                >
                  <Clock size={15} color={status === 'confirmed' ? t.accent : t.textMuted} />
                  <Txt
                    variant="footnote"
                    style={{
                      fontFamily: status === 'confirmed' ? fonts.semibold : fonts.medium,
                      color: status === 'confirmed' ? t.accent : t.textMuted,
                    }}
                  >
                    Upcoming
                  </Txt>
                </PressableScale>

                <PressableScale
                  onPress={() => {
                    tapFeedback();
                    setStatus('completed');
                  }}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 9,
                    borderRadius: radii.pill,
                    backgroundColor: status === 'completed' ? 'rgba(22, 163, 74, 0.12)' : t.surfaceMuted,
                    borderWidth: status === 'completed' ? 1.5 : 1,
                    borderColor: status === 'completed' ? '#16A34A' : t.border,
                  }}
                >
                  <CheckCircle2 size={15} color={status === 'completed' ? '#16A34A' : t.textMuted} />
                  <Txt
                    variant="footnote"
                    style={{
                      fontFamily: status === 'completed' ? fonts.semibold : fonts.medium,
                      color: status === 'completed' ? '#16A34A' : t.textMuted,
                    }}
                  >
                    Completed
                  </Txt>
                </PressableScale>
              </View>
            </View>
          ) : (
            /* Quick Presets when creating a new event */
            <View>
              <Txt variant="label" tone="muted" style={{ marginBottom: 8 }}>
                QUICK EVENT PRESETS
              </Txt>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {quickEventTemplates.map((tmpl) => (
                  <PressableScale
                    key={tmpl.title}
                    onPress={() => applyQuickTemplate(tmpl)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 7,
                      borderRadius: radii.pill,
                      backgroundColor: title === tmpl.title ? 'rgba(14, 116, 144, 0.14)' : t.surfaceMuted,
                      borderWidth: 1,
                      borderColor: title === tmpl.title ? t.accent : t.border,
                    }}
                  >
                    <Txt
                      variant="footnote"
                      style={{
                        fontFamily: fonts.medium,
                        fontSize: 12,
                        color: title === tmpl.title ? t.accent : t.text,
                      }}
                    >
                      + {tmpl.title}
                    </Txt>
                  </PressableScale>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Visit Type Segmented Control */}
          <View>
            <Txt variant="label" tone="muted" style={{ marginBottom: 8 }}>
              EVENT TYPE
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
              EVENT TITLE *
            </Txt>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={
                type === 'Appointment'
                  ? 'e.g. Quarterly Diabetes Review'
                  : 'e.g. Chronic Medication Collection'
              }
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
              HEALTHCARE FACILITY / LOCATION
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
                placeholder="e.g. Rosebank Family Practice (optional)"
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

          {/* Reminder Options */}
          <View>
            <Txt variant="label" tone="muted" style={{ marginBottom: 6 }}>
              REMINDER TIMING
            </Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {reminderOptions.map((opt) => {
                const selected = reminderOption === opt.id;
                return (
                  <PressableScale
                    key={opt.id}
                    onPress={() => {
                      tapFeedback();
                      setReminderOption(opt.id);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: radii.pill,
                      backgroundColor: selected ? t.accent : t.surfaceMuted,
                    }}
                  >
                    <Bell size={13} color={selected ? '#FFFFFF' : t.textMuted} />
                    <Txt
                      variant="footnote"
                      color={selected ? '#FFFFFF' : t.text}
                      style={{ fontFamily: selected ? fonts.semibold : fonts.regular }}
                    >
                      {opt.label}
                    </Txt>
                  </PressableScale>
                );
              })}
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
                minHeight: 72,
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

          {/* Linked Record from Vault */}
          <View>
            <Txt variant="label" tone="muted" style={{ marginBottom: 6 }}>
              LINK RELEVANT RECORD FROM VAULT (OPTIONAL)
            </Txt>
            <Pressable
              onPress={() => setShowRecordPicker(!showRecordPicker)}
              style={{
                minHeight: 48,
                borderRadius: radii.md,
                borderWidth: 1,
                borderColor: t.border,
                backgroundColor: t.surfaceMuted,
                paddingHorizontal: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: 8 }}>
                <FileText size={16} color={t.accent} />
                <Txt variant="footnote" numberOfLines={1}>
                  {linkedRecord ? linkedRecord.title : 'Choose a record to link...'}
                </Txt>
              </View>
              {linkedRecordId ? (
                <PressableScale onPress={() => setLinkedRecordId(undefined)} style={{ padding: 4 }}>
                  <X size={14} color={t.textMuted} />
                </PressableScale>
              ) : null}
            </Pressable>

            {showRecordPicker && (
              <View
                style={{
                  marginTop: 6,
                  maxHeight: 160,
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: t.border,
                  backgroundColor: t.surface,
                  overflow: 'hidden',
                }}
              >
                <ScrollView nestedScrollEnabled>
                  {records.map((r) => (
                    <Pressable
                      key={r.id}
                      onPress={() => {
                        setLinkedRecordId(r.id);
                        setShowRecordPicker(false);
                      }}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        borderBottomWidth: 1,
                        borderBottomColor: t.border,
                        backgroundColor: r.id === linkedRecordId ? 'rgba(14, 116, 144, 0.08)' : 'transparent',
                      }}
                    >
                      <Txt variant="footnote" style={{ fontFamily: fonts.medium }} numberOfLines={1}>
                        {r.title}
                      </Txt>
                      <Txt variant="footnote" tone="muted" style={{ fontSize: 11 }}>
                        {r.category} · {r.facility}
                      </Txt>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Pinned Bottom Action Bar */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: t.border,
            flexDirection: 'row',
            gap: 10,
          }}
        >
          {isEditing && onDelete ? (
            <PressableScale
              accessibilityLabel="Delete event"
              onPress={handleDelete}
              style={{
                height: 48,
                paddingHorizontal: 16,
                borderRadius: radii.pill,
                backgroundColor: 'rgba(220, 31, 38, 0.1)',
                borderWidth: 1,
                borderColor: 'rgba(220, 31, 38, 0.25)',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Trash2 size={16} color="#DC1F26" />
              <Txt variant="footnote" color="#DC1F26" style={{ fontFamily: fonts.semibold }}>
                Delete
              </Txt>
            </PressableScale>
          ) : null}

          <PressableScale
            accessibilityLabel={isEditing ? 'Save event changes' : 'Create event'}
            onPress={handleSave}
            style={{
              flex: 1,
              backgroundColor: t.accent,
              height: 48,
              borderRadius: radii.pill,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Txt variant="bodyStrong" tone="onNavy">
              {isEditing ? 'Save Changes' : 'Create Event'}
            </Txt>
          </PressableScale>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
