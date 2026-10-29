import dayjs from 'dayjs';
import { safeBack } from '@/lib/navigation';
import { useLocalSearchParams } from 'expo-router';
import { Calendar as CalendarIcon } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';

import { Pill } from '@/components/ui/Pill';
import { PlatformDatePicker } from '@/components/ui/PlatformDatePicker';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useToast } from '@/components/ui/Toast';
import { recordCategories, type RecordCategory } from '@/data/records';
import { useAppStore } from '@/store/useAppStore';

/** Edit a record's details. The clinical notes and the stored record body are not changed here. */
export default function EditRecordScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const record = useAppStore((s) => s.records.find((r) => r.id === id));
  const updateRecord = useAppStore((s) => s.updateRecord);
  const logAudit = useAppStore((s) => s.logAudit);

  const [title, setTitle] = useState(record?.title ?? '');
  const [category, setCategory] = useState<RecordCategory>(record?.category ?? 'Other');
  const [eventDate, setEventDate] = useState(record?.eventDate ?? dayjs().format('YYYY-MM-DD'));
  const [facility, setFacility] = useState(record?.facility ?? '');
  const [doctor, setDoctor] = useState(record?.doctor ?? '');
  const [diagnosis, setDiagnosis] = useState(record?.diagnosis ?? '');
  const [showDatePicker, setShowDatePicker] = useState(false);

  if (!record) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-canvasdark">
        <ScreenHeader title="Edit record" onBack={() => safeBack('/(tabs)/records')} />
        <Text className="px-5 font-sans text-ink-muted dark:text-slate-400">This record could not be found.</Text>
      </View>
    );
  }

  const handleSave = () => {
    if (!title.trim()) {
      toast.show('Add a title for this record', 'warning');
      return;
    }
    const changed: string[] = [];
    if (title.trim() !== record.title) changed.push('title');
    if (category !== record.category) changed.push('category');
    if (eventDate !== record.eventDate) changed.push('date');
    if (facility.trim() !== record.facility) changed.push('facility');
    if ((doctor.trim() || undefined) !== record.doctor) changed.push('doctor');
    if ((diagnosis.trim() || undefined) !== record.diagnosis) changed.push('diagnosis');

    updateRecord(record.id, {
      title: title.trim(),
      category,
      eventDate,
      facility: facility.trim() || 'Not recorded',
      doctor: doctor.trim() || undefined,
      diagnosis: diagnosis.trim() || undefined,
    });
    if (changed.length > 0) {
      logAudit('edit', `Edited ${changed.join(', ')} of ${title.trim()}`);
    }
    toast.show('Record details saved', 'success');
    safeBack('/(tabs)/records');
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-slate-50 dark:bg-canvasdark" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Edit record" onBack={() => safeBack('/(tabs)/records')} />
      <ScreenScroll className="flex-1 px-5">
        <Label text="Title" />
        <Input value={title} onChangeText={setTitle} placeholder="e.g. HbA1c laboratory report" />

        <Label text="Category" />
        <View className="mb-4 flex-row flex-wrap gap-2">
          {recordCategories.map((c) => (
            <Pill key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>

        <Label text="Event date" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Event date ${eventDate}. Change`}
          onPress={() => setShowDatePicker(true)}
          className="mb-4 min-h-[48px] flex-row items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 dark:border-canvasdark-card dark:bg-canvasdark-card"
        >
          <CalendarIcon size={16} color="#5B6478" />
          <Text className="font-sans text-[14px] text-ink dark:text-slate-50">{dayjs(eventDate).format('D MMMM YYYY')}</Text>
        </Pressable>
        <PlatformDatePicker
          visible={showDatePicker}
          value={dayjs(eventDate).toDate()}
          mode="date"
          maximumDate={new Date()}
          title="Record Event Date"
          onChange={(date) => setEventDate(dayjs(date).format('YYYY-MM-DD'))}
          onClose={() => setShowDatePicker(false)}
        />

        <Label text="Facility" />
        <Input value={facility} onChangeText={setFacility} placeholder="e.g. Rosebank Family Practice" />

        <Label text="Doctor (optional)" />
        <Input value={doctor} onChangeText={setDoctor} placeholder="e.g. Dr N. Mokoena" />

        <Label text="Diagnosis or reason for visit (optional)" />
        <Input value={diagnosis} onChangeText={setDiagnosis} placeholder="e.g. Type 2 diabetes review" />

        <View className="mt-4">
          <PrimaryButton label="Save details" onPress={handleSave} />
        </View>
      </ScreenScroll>
    </KeyboardAvoidingView>
  );
}

function Label({ text }: { text: string }) {
  return <Text className="mb-1.5 font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">{text}</Text>;
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="#8C98B8"
      className="mb-4 min-h-[48px] rounded-3xl border border-slate-200 bg-white px-4 font-sans text-[14px] text-ink dark:border-canvasdark-card dark:bg-canvasdark-card dark:text-slate-50"
    />
  );
}
