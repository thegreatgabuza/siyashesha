import { PlatformDatePicker } from '@/components/ui/PlatformDatePicker';
import dayjs from 'dayjs';
import {
  Bell,
  Calendar as CalendarIcon,
  Clock,
  Pill as PillIcon,
  Plus,
  Trash2,
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
import { type Medication } from '@/data/medications';
import { elevation, fonts, radii } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { tapFeedback } from '@/lib/feedback';

interface MedicationModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (med: Omit<Medication, 'id'>) => void;
  onDelete?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
  existingMedication?: Medication;
}

const COMMON_ROUTES = ['Oral', 'Inhalation', 'Topical', 'Injection', 'Eye drops'];

const COMMON_FREQUENCIES: { label: string; times: string[] }[] = [
  { label: 'Daily', times: ['08:00'] },
  { label: 'Twice daily', times: ['08:00', '20:00'] },
  { label: 'Three times daily', times: ['08:00', '14:00', '20:00'] },
  { label: 'Four times daily', times: ['08:00', '12:00', '16:00', '20:00'] },
  { label: 'As needed', times: [] },
];

const COMMON_DIRECTIONS = [
  'Take with meals',
  'Take in the morning',
  'Take at bedtime',
  'Take after breakfast',
  'Take before food',
  'Take with plenty of water',
];

const COMMON_UNITS = ['mg', 'ml', 'mcg', 'g', 'puffs', 'tablets', 'drops'];

export function MedicationModal({
  visible,
  onClose,
  onSave,
  onDelete,
  onToggleStatus,
  existingMedication,
}: MedicationModalProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <MedicationForm
        key={existingMedication?.id ?? 'new'}
        onClose={onClose}
        onSave={onSave}
        onDelete={onDelete}
        onToggleStatus={onToggleStatus}
        existingMedication={existingMedication}
      />
    </Modal>
  );
}

function MedicationForm({
  onClose,
  onSave,
  onDelete,
  onToggleStatus,
  existingMedication,
}: Omit<MedicationModalProps, 'visible'>) {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const isEditing = !!existingMedication;

  const [name, setName] = useState(existingMedication?.name ?? '');
  const [strength, setStrength] = useState(existingMedication?.strength ?? '');
  const [indication, setIndication] = useState(existingMedication?.indication ?? '');
  const [route, setRoute] = useState(existingMedication?.route ?? 'Oral');
  const [frequency, setFrequency] = useState(existingMedication?.frequency ?? 'Daily');
  const [directions, setDirections] = useState(existingMedication?.directions ?? 'Take with meals');
  const [times, setTimes] = useState<string[]>(existingMedication?.times ?? ['08:00']);
  const [prescriber, setPrescriber] = useState(existingMedication?.prescriber ?? '');
  const [facility, setFacility] = useState(existingMedication?.facility ?? 'Rosebank Family Practice');
  const [provenance] = useState(existingMedication?.provenance ?? 'Patient Added');
  const [startDate, setStartDate] = useState(existingMedication?.startDate ?? dayjs().format('YYYY-MM-DD'));
  const [status, setStatus] = useState<'active' | 'past'>(existingMedication?.status ?? 'active');
  const [note, setNote] = useState(existingMedication?.note ?? '');

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerIndex, setTimePickerIndex] = useState<number | null>(null);

  const handleSelectFrequency = (freqLabel: string) => {
    setFrequency(freqLabel);
    const matched = COMMON_FREQUENCIES.find((f) => f.label === freqLabel);
    if (matched && matched.times.length > 0) {
      setTimes(matched.times);
    }
  };

  const handleAddTime = () => {
    setTimes((prev) => [...prev, '12:00']);
  };

  const handleRemoveTime = (index: number) => {
    setTimes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter the medication name (e.g. Metformin, Amlodipine).');
      return;
    }
    if (!strength.trim()) {
      Alert.alert('Required Field', 'Please enter the dosage strength (e.g. 500 mg, 5 mg).');
      return;
    }

    onSave({
      name: name.trim(),
      strength: strength.trim(),
      indication: indication.trim() || 'General Health Maintenance',
      route: route.trim() || 'Oral',
      frequency: frequency.trim() || 'Daily',
      directions: directions.trim() || 'Take as prescribed',
      prescriber: prescriber.trim() || 'Prescribed Clinician',
      facility: facility.trim() || 'Primary Clinic',
      provenance: provenance.trim() || 'Patient Added',
      times: times.length > 0 ? times : ['08:00'],
      status,
      startDate,
      endDate: status === 'past' ? (existingMedication?.endDate ?? dayjs().format('YYYY-MM-DD')) : undefined,
      note: note.trim() || undefined,
    });

    onClose();
  };

  const handleDelete = () => {
    if (!existingMedication || !onDelete) return;
    Alert.alert(
      'Delete Prescription?',
      `Are you sure you want to remove ${existingMedication.name} from your medications list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(existingMedication.id);
            onClose();
          },
        },
      ]
    );
  };

  const handleToggleActivePast = () => {
    if (!existingMedication || !onToggleStatus) return;
    const nextStatus = status === 'active' ? 'past' : 'active';
    setStatus(nextStatus);
    onToggleStatus(existingMedication.id);
    onClose();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={{
          backgroundColor: t.surface,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          maxHeight: '92%',
          paddingBottom: insets.bottom + 14,
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
                backgroundColor: 'rgba(22, 163, 74, 0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PillIcon size={20} color="#16A34A" />
            </View>
            <View>
              <Txt variant="headline">{isEditing ? 'Edit Prescription' : 'Add Medication'}</Txt>
              <Txt variant="footnote" tone="muted">
                {isEditing ? 'Update dosage, directions or reminder schedule' : 'Record a new treatment, prescription or supplement'}
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

        {/* Form */}
        <ScrollView
          style={{ flex: 1, paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingVertical: 16, gap: 18 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Status switcher for existing medication */}
          {isEditing && (
            <View
              style={{
                flexDirection: 'row',
                borderRadius: radii.pill,
                backgroundColor: t.surfaceMuted,
                padding: 3,
              }}
            >
              <PressableScale
                onPress={() => setStatus('active')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: radii.pill,
                  alignItems: 'center',
                  backgroundColor: status === 'active' ? '#16A34A' : 'transparent',
                }}
              >
                <Txt
                  variant="footnote"
                  style={{
                    fontFamily: fonts.semibold,
                    color: status === 'active' ? '#FFFFFF' : t.textMuted,
                  }}
                >
                  Active Regimen
                </Txt>
              </PressableScale>
              <PressableScale
                onPress={() => setStatus('past')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: radii.pill,
                  alignItems: 'center',
                  backgroundColor: status === 'past' ? t.surface : 'transparent',
                }}
              >
                <Txt
                  variant="footnote"
                  style={{
                    fontFamily: fonts.semibold,
                    color: status === 'past' ? t.text : t.textMuted,
                  }}
                >
                  Past / Discontinued
                </Txt>
              </PressableScale>
            </View>
          )}

          {/* Name */}
          <View style={{ gap: 6 }}>
            <Txt variant="label" tone="muted">
              MEDICATION NAME *
            </Txt>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Metformin, Amlodipine, Panado"
              placeholderTextColor={t.textMuted}
              style={{
                fontSize: 15,
                color: t.text,
                backgroundColor: t.surfaceMuted,
                borderRadius: radii.md,
                paddingHorizontal: 14,
                paddingVertical: 11,
                borderWidth: 1,
                borderColor: t.border,
              }}
            />
          </View>

          {/* Strength / Dose */}
          <View style={{ gap: 6 }}>
            <Txt variant="label" tone="muted">
              STRENGTH & DOSAGE *
            </Txt>
            <TextInput
              value={strength}
              onChangeText={setStrength}
              placeholder="e.g. 500 mg, 10 ml, 2 puffs"
              placeholderTextColor={t.textMuted}
              style={{
                fontSize: 15,
                color: t.text,
                backgroundColor: t.surfaceMuted,
                borderRadius: radii.md,
                paddingHorizontal: 14,
                paddingVertical: 11,
                borderWidth: 1,
                borderColor: t.border,
              }}
            />
            {/* Quick unit chips */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {COMMON_UNITS.map((unit) => (
                <PressableScale
                  key={unit}
                  onPress={() => {
                    tapFeedback();
                    if (!strength.includes(unit)) {
                      setStrength((prev) => (prev ? `${prev.trim()} ${unit}` : `1 ${unit}`));
                    }
                  }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: radii.pill,
                    backgroundColor: t.surfaceMuted,
                    borderWidth: 1,
                    borderColor: t.border,
                  }}
                >
                  <Txt variant="footnote" tone="muted" style={{ fontSize: 11 }}>
                    +{unit}
                  </Txt>
                </PressableScale>
              ))}
            </View>
          </View>

          {/* Indication / Medical Reason */}
          <View style={{ gap: 6 }}>
            <Txt variant="label" tone="muted">
              INDICATION / HEALTH CONDITION
            </Txt>
            <TextInput
              value={indication}
              onChangeText={setIndication}
              placeholder="e.g. Type 2 Diabetes, Blood Pressure, Pain relief"
              placeholderTextColor={t.textMuted}
              style={{
                fontSize: 15,
                color: t.text,
                backgroundColor: t.surfaceMuted,
                borderRadius: radii.md,
                paddingHorizontal: 14,
                paddingVertical: 11,
                borderWidth: 1,
                borderColor: t.border,
              }}
            />
          </View>

          {/* Route & Frequency */}
          <View style={{ gap: 14 }}>
            {/* Route */}
            <View style={{ gap: 6 }}>
              <Txt variant="label" tone="muted">
                ADMINISTRATION ROUTE
              </Txt>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {COMMON_ROUTES.map((r) => {
                  const isSelected = route === r;
                  return (
                    <PressableScale
                      key={r}
                      onPress={() => {
                        tapFeedback();
                        setRoute(r);
                      }}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: radii.pill,
                        backgroundColor: isSelected ? 'rgba(22, 163, 74, 0.12)' : t.surfaceMuted,
                        borderWidth: 1,
                        borderColor: isSelected ? '#16A34A' : t.border,
                      }}
                    >
                      <Txt
                        variant="footnote"
                        style={{
                          fontFamily: isSelected ? fonts.semibold : fonts.regular,
                          color: isSelected ? '#16A34A' : t.text,
                        }}
                      >
                        {r}
                      </Txt>
                    </PressableScale>
                  );
                })}
              </ScrollView>
            </View>

            {/* Frequency */}
            <View style={{ gap: 6 }}>
              <Txt variant="label" tone="muted">
                PRESCRIBED FREQUENCY
              </Txt>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {COMMON_FREQUENCIES.map((f) => {
                  const isSelected = frequency === f.label;
                  return (
                    <PressableScale
                      key={f.label}
                      onPress={() => {
                        tapFeedback();
                        handleSelectFrequency(f.label);
                      }}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 7,
                        borderRadius: radii.pill,
                        backgroundColor: isSelected ? 'rgba(14, 116, 144, 0.12)' : t.surfaceMuted,
                        borderWidth: 1,
                        borderColor: isSelected ? t.accent : t.border,
                      }}
                    >
                      <Txt
                        variant="footnote"
                        style={{
                          fontFamily: isSelected ? fonts.semibold : fonts.regular,
                          color: isSelected ? t.accent : t.text,
                        }}
                      >
                        {f.label}
                      </Txt>
                    </PressableScale>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          {/* Dose Reminder Times */}
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Txt variant="label" tone="muted">
                SCHEDULED DOSE TIMES
              </Txt>
              <PressableScale
                onPress={handleAddTime}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
              >
                <Plus size={14} color={t.interactive} />
                <Txt variant="footnote" color={t.interactive} style={{ fontFamily: fonts.medium }}>
                  Add Time
                </Txt>
              </PressableScale>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {times.map((time, idx) => (
                <View
                  key={`${time}-${idx}`}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingLeft: 12,
                    paddingRight: 8,
                    paddingVertical: 7,
                    borderRadius: radii.md,
                    backgroundColor: t.surfaceMuted,
                    borderWidth: 1,
                    borderColor: t.border,
                  }}
                >
                  <Clock size={14} color={t.accent} />
                  <Pressable
                    onPress={() => {
                      setTimePickerIndex(idx);
                      setShowTimePicker(true);
                    }}
                  >
                    <Txt variant="callout" style={{ fontFamily: fonts.semibold }}>
                      {time}
                    </Txt>
                  </Pressable>
                  {times.length > 1 && (
                    <PressableScale
                      onPress={() => handleRemoveTime(idx)}
                      style={{ padding: 3, marginLeft: 2 }}
                      hitSlop={6}
                    >
                      <X size={13} color={t.textMuted} />
                    </PressableScale>
                  )}
                </View>
              ))}
            </View>

            <PlatformDatePicker
              visible={showTimePicker}
              value={
                timePickerIndex !== null && times[timePickerIndex]
                  ? dayjs(`2000-01-01T${times[timePickerIndex]}`).toDate()
                  : new Date()
              }
              mode="time"
              title="Select Dose Time"
              onClose={() => {
                setShowTimePicker(false);
                setTimePickerIndex(null);
              }}
              onChange={(selectedDate) => {
                setShowTimePicker(false);
                if (selectedDate && timePickerIndex !== null) {
                  const formatted = dayjs(selectedDate).format('HH:mm');
                  const nextTimes = [...times];
                  nextTimes[timePickerIndex] = formatted;
                  setTimes(nextTimes.sort());
                }
                setTimePickerIndex(null);
              }}
            />
          </View>

          {/* Directions & Instructions */}
          <View style={{ gap: 6 }}>
            <Txt variant="label" tone="muted">
              PATIENT DIRECTIONS & INSTRUCTIONS
            </Txt>
            <TextInput
              value={directions}
              onChangeText={setDirections}
              placeholder="e.g. Take with meals, swallow whole with water"
              placeholderTextColor={t.textMuted}
              style={{
                fontSize: 15,
                color: t.text,
                backgroundColor: t.surfaceMuted,
                borderRadius: radii.md,
                paddingHorizontal: 14,
                paddingVertical: 11,
                borderWidth: 1,
                borderColor: t.border,
              }}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 4 }}>
              {COMMON_DIRECTIONS.map((dir) => (
                <PressableScale
                  key={dir}
                  onPress={() => {
                    tapFeedback();
                    setDirections(dir);
                  }}
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: radii.pill,
                    backgroundColor: t.surfaceMuted,
                    borderWidth: 1,
                    borderColor: t.border,
                  }}
                >
                  <Txt variant="footnote" tone="muted" style={{ fontSize: 11 }}>
                    {dir}
                  </Txt>
                </PressableScale>
              ))}
            </ScrollView>
          </View>

          {/* Prescriber & Facility */}
          <View style={{ gap: 14 }}>
            <View style={{ gap: 6 }}>
              <Txt variant="label" tone="muted">
                ATTENDING CLINICIAN / PRESCRIBER
              </Txt>
              <TextInput
                value={prescriber}
                onChangeText={setPrescriber}
                placeholder="e.g. Dr N. Mokoena, Dr S. Naidoo"
                placeholderTextColor={t.textMuted}
                style={{
                  fontSize: 15,
                  color: t.text,
                  backgroundColor: t.surfaceMuted,
                  borderRadius: radii.md,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  borderWidth: 1,
                  borderColor: t.border,
                }}
              />
            </View>

            <View style={{ gap: 6 }}>
              <Txt variant="label" tone="muted">
                DISPENSING FACILITY / CLINIC / PHARMACY
              </Txt>
              <TextInput
                value={facility}
                onChangeText={setFacility}
                placeholder="e.g. Rosebank Family Practice, Dis-Chem, Clicks"
                placeholderTextColor={t.textMuted}
                style={{
                  fontSize: 15,
                  color: t.text,
                  backgroundColor: t.surfaceMuted,
                  borderRadius: radii.md,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  borderWidth: 1,
                  borderColor: t.border,
                }}
              />
            </View>
          </View>

          {/* Start Date */}
          <View style={{ gap: 6 }}>
            <Txt variant="label" tone="muted">
              START DATE
            </Txt>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                backgroundColor: t.surfaceMuted,
                borderRadius: radii.md,
                paddingHorizontal: 14,
                paddingVertical: 11,
                borderWidth: 1,
                borderColor: t.border,
              }}
            >
              <CalendarIcon size={16} color={t.accent} />
              <Txt variant="callout" style={{ fontFamily: fonts.medium }}>
                {dayjs(startDate).format('D MMMM YYYY')}
              </Txt>
            </Pressable>

            <PlatformDatePicker
              visible={showDatePicker}
              value={dayjs(startDate).toDate()}
              mode="date"
              title="Select Start Date"
              onClose={() => setShowDatePicker(false)}
              onChange={(selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setStartDate(dayjs(selectedDate).format('YYYY-MM-DD'));
                }
              }}
            />
          </View>

          {/* Discontinuation Note (if past) */}
          {status === 'past' && (
            <View style={{ gap: 6 }}>
              <Txt variant="label" tone="muted">
                DISCONTINUATION REASON / CLINICAL NOTE
              </Txt>
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder="e.g. Switched to Amlodipine due to cough, course completed"
                placeholderTextColor={t.textMuted}
                multiline
                numberOfLines={2}
                style={{
                  fontSize: 14,
                  color: t.text,
                  backgroundColor: t.surfaceMuted,
                  borderRadius: radii.md,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  borderWidth: 1,
                  borderColor: t.border,
                  minHeight: 64,
                  textAlignVertical: 'top',
                }}
              />
            </View>
          )}

          {/* Reminder Sync Notice */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 14,
              borderRadius: radii.lg,
              backgroundColor: 'rgba(22, 163, 74, 0.08)',
              borderWidth: 1,
              borderColor: 'rgba(22, 163, 74, 0.2)',
            }}
          >
            <Bell size={20} color="#16A34A" />
            <View style={{ flex: 1 }}>
              <Txt variant="footnote" style={{ fontFamily: fonts.semibold, color: '#16A34A' }}>
                Automatic Push Notification Sync
              </Txt>
              <Txt variant="footnote" tone="muted" style={{ fontSize: 12, marginTop: 2 }}>
                Daily device alerts will be scheduled for every dose time ({times.join(', ')}).
              </Txt>
            </View>
          </View>

          {/* Actions */}
          <View style={{ gap: 10, marginTop: 8 }}>
            <PressableScale
              onPress={handleSave}
              style={[
                {
                  height: 50,
                  borderRadius: radii.pill,
                  backgroundColor: '#16A34A',
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                elevation[2],
              ]}
            >
              <Txt variant="callout" style={{ fontFamily: fonts.semibold, color: '#FFFFFF' }}>
                {isEditing ? 'Save Changes' : 'Save Prescription'}
              </Txt>
            </PressableScale>

            {isEditing && (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <PressableScale
                  onPress={handleToggleActivePast}
                  style={{
                    flex: 1,
                    height: 44,
                    borderRadius: radii.pill,
                    backgroundColor: t.surfaceMuted,
                    borderWidth: 1,
                    borderColor: t.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Txt variant="footnote" style={{ fontFamily: fonts.medium }}>
                    {status === 'active' ? 'Move to Past' : 'Reactivate'}
                  </Txt>
                </PressableScale>

                {onDelete && (
                  <PressableScale
                    onPress={handleDelete}
                    style={{
                      height: 44,
                      paddingHorizontal: 16,
                      borderRadius: radii.pill,
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      borderWidth: 1,
                      borderColor: 'rgba(239, 68, 68, 0.25)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </PressableScale>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
