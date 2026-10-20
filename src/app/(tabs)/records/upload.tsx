import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { Camera, Calendar as CalendarIcon, FileUp, PenLine } from 'lucide-react-native';
import { cloneElement, isValidElement, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Pill } from '@/components/ui/Pill';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useToast } from '@/components/ui/Toast';
import { recordCategories, type MedicalRecord, type RecordCategory } from '@/data/records';
import { useAppStore } from '@/store/useAppStore';

type Method = 'upload' | 'scan' | 'manual';

export default function UploadRecordScreen() {
  const toast = useToast();
  const addRecord = useAppStore((s) => s.addRecord);

  const [method, setMethod] = useState<Method>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<RecordCategory>('Other');
  const [eventDate, setEventDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [facility, setFacility] = useState('');
  const [doctor, setDoctor] = useState('');
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'] });
    if (!result.canceled && result.assets[0]) {
      setFileName(result.assets[0].name);
      if (!title) setTitle(result.assets[0].name.replace(/\.[^/.]+$/, ''));
    }
  };

  const captureScan = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      toast.show('Camera access is needed to scan a document', 'warning');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setFileName('Scanned document.jpg');
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.show('Add a title for this record', 'warning');
      return;
    }
    const record: MedicalRecord = {
      id: `rec-${Date.now()}`,
      category,
      title: title.trim(),
      facility: facility.trim() || 'Not recorded',
      doctor: doctor.trim() || undefined,
      eventDate,
      uploadedAt: dayjs().format('YYYY-MM-DD'),
      sourceType: method === 'upload' ? 'Upload' : method === 'scan' ? 'Scan' : 'Manual',
      documentType: category,
      status: method === 'manual' ? 'Patient confirmed' : 'Extracted from document',
      clinicalNotes: notes.trim() || 'No additional notes recorded.',
    };
    addRecord(record);
    toast.show('Record added to your vault', 'success');
    router.back();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50 dark:bg-canvasdark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Add a medical record" onBack={() => router.back()} />
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 48 }}>
        <View className="mb-5 flex-row gap-2">
          <MethodChip label="Upload File" icon={<FileUp size={16} />} active={method === 'upload'} onPress={() => setMethod('upload')} />
          <MethodChip label="Camera Scan" icon={<Camera size={16} />} active={method === 'scan'} onPress={() => setMethod('scan')} />
          <MethodChip label="Add Manually" icon={<PenLine size={16} />} active={method === 'manual'} onPress={() => setMethod('manual')} />
        </View>

        {method !== 'manual' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={method === 'upload' ? 'Choose a file' : 'Open camera'}
            onPress={method === 'upload' ? pickFile : captureScan}
            className="mb-5 min-h-[96px] items-center justify-center gap-2 rounded-3xl border border-dashed border-lavender-300 bg-lavender-50 p-6 dark:border-brand-500/40 dark:bg-brand-500/10"
          >
            {method === 'upload' ? (
              <FileUp size={24} color="#6D5BD0" />
            ) : (
              <Camera size={24} color="#6D5BD0" />
            )}
            <Text className="font-sans-medium text-[13px] text-brand-600 dark:text-brand-400">
              {fileName ?? (method === 'upload' ? 'Choose a PDF or image' : 'Open camera to scan')}
            </Text>
          </Pressable>
        ) : null}

        <Label text="Title" />
        <Input value={title} onChangeText={setTitle} placeholder="e.g. HbA1c Laboratory Report" />

        <Label text="Category" />
        <View className="mb-4 flex-row flex-wrap gap-2">
          {recordCategories.map((c) => (
            <Pill key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>

        <Label text="Event date" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Event date ${eventDate}`}
          onPress={() => setShowDatePicker(true)}
          className="mb-4 min-h-[44px] flex-row items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-canvasdark-card dark:bg-canvasdark-card"
        >
          <CalendarIcon size={16} color="#5B6B8A" />
          <Text className="font-sans text-[14px] text-ink dark:text-slate-50">
            {dayjs(eventDate).format('D MMMM YYYY')}
          </Text>
        </Pressable>
        {showDatePicker ? (
          <DateTimePicker
            value={dayjs(eventDate).toDate()}
            mode="date"
            maximumDate={new Date()}
            onChange={(_, date) => {
              setShowDatePicker(false);
              if (date) setEventDate(dayjs(date).format('YYYY-MM-DD'));
            }}
          />
        ) : null}

        <Label text="Facility" />
        <Input value={facility} onChangeText={setFacility} placeholder="e.g. Rosebank Family Practice" />

        <Label text="Doctor (optional)" />
        <Input value={doctor} onChangeText={setDoctor} placeholder="e.g. Dr N. Mokoena" />

        <Label text="Clinical notes" />
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any clinical detail you want saved with this record"
          placeholderTextColor="#8C98B8"
          multiline
          textAlignVertical="top"
          style={{ minHeight: 100 }}
          className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 font-sans text-[14px] text-ink dark:border-canvasdark-card dark:bg-canvasdark-card dark:text-slate-50"
        />

        <PrimaryButton label="Save record" onPress={handleSave} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Label({ text }: { text: string }) {
  return (
    <Text className="mb-1.5 font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">{text}</Text>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      placeholderTextColor="#8C98B8"
      className="mb-4 min-h-[44px] rounded-2xl border border-slate-200 bg-white px-4 font-sans text-[14px] text-ink dark:border-canvasdark-card dark:bg-canvasdark-card dark:text-slate-50"
    />
  );
}

function MethodChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`min-h-[44px] flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl px-2 py-3 ${
        active ? 'bg-ink dark:bg-brand-500' : 'bg-white dark:bg-canvasdark-card'
      }`}
    >
      {isValidElement(icon) ? cloneElement(icon as React.ReactElement<any>, { color: active ? '#FFFFFF' : '#5B6B8A' }) : icon}
      <Text className={`font-sans-medium text-[11px] ${active ? 'text-white' : 'text-ink-muted dark:text-slate-400'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
