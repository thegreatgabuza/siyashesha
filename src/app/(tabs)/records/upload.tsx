import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  Calendar as CalendarIcon,
  Camera,
  CheckCircle2,
  FileUp,
  PenLine,
  RefreshCw,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react-native';
import { cloneElement, isValidElement, useState } from 'react';

import { Pill } from '@/components/ui/Pill';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { useToast } from '@/components/ui/Toast';
import { recordCategories, type MedicalRecord, type RecordCategory, type RecordField } from '@/data/records';
import { useAccent } from '@/hooks/useAccent';
import { saveOriginal } from '@/lib/documents';
import { extractClinicalRecord, type ExtractionSource } from '@/lib/ocr/documentExtractor';
import { syncRecordToDatabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';

type Method = 'upload' | 'scan' | 'manual';

export default function UploadRecordScreen() {
  const { accent } = useAccent();
  const toast = useToast();
  const addRecord = useAppStore((s) => s.addRecord);

  const [method, setMethod] = useState<Method>('upload');
  const [fileName, setFileName] = useState<string | null>(null);
  const [picked, setPicked] = useState<{ uri: string; name: string; mimeType: string } | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<RecordCategory>('Other');
  const [eventDate, setEventDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [facility, setFacility] = useState('');
  const [doctor, setDoctor] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [notes, setNotes] = useState('');
  const [extractedFields, setExtractedFields] = useState<RecordField[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // OCR & Clinical NER state
  const [extracting, setExtracting] = useState(false);
  const [extractionSource, setExtractionSource] = useState<ExtractionSource | null>(null);

  const runOcrExtraction = async (uri: string, name: string, mimeType: string) => {
    setExtracting(true);
    setExtractionSource(null);
    try {
      const result = await extractClinicalRecord(uri, mimeType, name);
      const data = result.data;

      if (data.title) setTitle(data.title);
      if (data.category) setCategory(data.category);
      if (data.eventDate) setEventDate(data.eventDate);
      if (data.facility && data.facility !== 'Not recorded') setFacility(data.facility);
      if (data.doctor) setDoctor(data.doctor);
      if (data.diagnosis) setDiagnosis(data.diagnosis);
      if (data.followUp) setFollowUp(data.followUp);
      if (data.clinicalNotes) setNotes(data.clinicalNotes);
      if (data.fields && data.fields.length > 0) setExtractedFields(data.fields);

      setExtractionSource(result.source);

      if (result.source === 'on-device') {
        toast.show('Document scanned with on-device OCR', 'success');
      } else if (result.source === 'gemini-vision') {
        toast.show('Document analyzed with Gemini AI Vision', 'success');
      } else {
        toast.show('Document details auto-detected', 'info');
      }
    } catch (err) {
      console.warn('[UploadRecordScreen] Extraction error:', err);
      toast.show('Could not auto-extract all fields. You can enter them manually.', 'info');
    } finally {
      setExtracting(false);
    }
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'] });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setFileName(asset.name);
      const pickedDoc = {
        uri: asset.uri,
        name: asset.name,
        mimeType:
          asset.mimeType ??
          (asset.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'),
      };
      setPicked(pickedDoc);
      runOcrExtraction(pickedDoc.uri, pickedDoc.name, pickedDoc.mimeType);
    }
  };

  const captureScan = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      toast.show('Camera access is needed to scan a document', 'warning');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const scannedName = `Scanned document ${dayjs().format('YYYY-MM-DD HHmm')}.jpg`;
      setFileName(scannedName);
      const pickedDoc = { uri: result.assets[0].uri, name: scannedName, mimeType: 'image/jpeg' };
      setPicked(pickedDoc);
      runOcrExtraction(pickedDoc.uri, pickedDoc.name, pickedDoc.mimeType);
    }
  };

  const removeField = (index: number) => {
    setExtractedFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.show('Add a title for this record', 'warning');
      return;
    }
    const id = `rec-${Date.now()}`;
    let originalFile: MedicalRecord['originalFile'];
    if (picked) {
      try {
        originalFile = await saveOriginal(picked.uri, id, picked.name, picked.mimeType);
      } catch {
        toast.show('Could not keep a copy of the file. Please try again.', 'warning');
        return;
      }
    }
    const record: MedicalRecord = {
      id,
      originalFile,
      category,
      title: title.trim(),
      facility: facility.trim() || 'Not recorded',
      doctor: doctor.trim() || undefined,
      diagnosis: diagnosis.trim() || undefined,
      followUp: followUp.trim() || undefined,
      eventDate,
      uploadedAt: dayjs().format('YYYY-MM-DD'),
      sourceType: method === 'upload' ? 'Upload' : method === 'scan' ? 'Scan' : 'Manual',
      documentType: category,
      status: method === 'manual' ? 'Patient confirmed' : 'Extracted from document',
      clinicalNotes: notes.trim() || 'No additional notes recorded.',
      fields: extractedFields.length > 0 ? extractedFields : undefined,
    };
    try {
      addRecord(record);
      syncRecordToDatabase(record).catch(() => {});
    } catch {
      toast.show('Could not save the record. Please try again.', 'warning');
      return;
    }
    toast.show('Record added to your vault', 'success');
    router.back();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50 dark:bg-canvasdark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Add a medical record" onBack={() => router.back()} />
      <ScreenScroll className="flex-1 px-5">
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
            className="mb-4 min-h-[96px] items-center justify-center gap-2 rounded-3xl border border-dashed border-brand-300 bg-brand-50 p-6 dark:border-brand-500/40 dark:bg-brand-500/10"
          >
            {method === 'upload' ? (
              <FileUp size={24} color={accent} />
            ) : (
              <Camera size={24} color={accent} />
            )}
            <Text className="font-sans-medium text-[13px] text-brand-600 dark:text-brand-300">
              {fileName ?? (method === 'upload' ? 'Choose a PDF or image' : 'Open camera to scan')}
            </Text>
          </Pressable>
        ) : null}

        {/* OCR Extracting Banner */}
        {extracting ? (
          <View className="mb-5 flex-row items-center gap-3 rounded-2xl bg-brand-50 p-4 dark:bg-brand-500/10">
            <ActivityIndicator size="small" color={accent} />
            <View className="flex-1">
              <Text className="font-sans-bold text-[13px] text-brand-700 dark:text-brand-300">
                Analyzing Document with OCR & AI…
              </Text>
              <Text className="font-sans text-[11px] text-brand-600/80 dark:text-brand-300/80">
                Extracting diagnosis, facility, clinical notes and key findings
              </Text>
            </View>
          </View>
        ) : null}

        {/* OCR Extraction Complete Badge */}
        {!extracting && extractionSource ? (
          <View className="mb-5 flex-row items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <View className="flex-row items-center gap-2">
              {extractionSource === 'on-device' ? (
                <Smartphone size={16} color="#059669" />
              ) : (
                <Sparkles size={16} color="#059669" />
              )}
              <View>
                <Text className="font-sans-bold text-[12px] text-emerald-800 dark:text-emerald-300">
                  {extractionSource === 'on-device'
                    ? 'On-Device OCR Active'
                    : extractionSource === 'gemini-vision'
                    ? 'Gemini AI Vision Active'
                    : 'Auto-Extracted from Document'}
                </Text>
                <Text className="font-sans text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                  Clinical fields auto-populated. Please review details.
                </Text>
              </View>
            </View>
            {picked ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Re-analyze document"
                onPress={() => runOcrExtraction(picked.uri, picked.name, picked.mimeType)}
                className="h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-canvasdark-card"
              >
                <RefreshCw size={14} color="#059669" />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {/* Extracted Structured Findings (e.g. HbA1c, Blood Pressure) */}
        {extractedFields.length > 0 ? (
          <View className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
            <View className="mb-2 flex-row items-center gap-1.5">
              <CheckCircle2 size={15} color="#16A34A" />
              <Text className="font-sans-bold text-[12px] text-ink dark:text-slate-100">
                Key Findings Detected ({extractedFields.length})
              </Text>
            </View>
            <View className="flex-row flex-wrap gap-2 pt-1">
              {extractedFields.map((field, idx) => (
                <View
                  key={`${field.label}-${idx}`}
                  className="flex-row items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 dark:bg-canvasdark"
                >
                  <Text className="font-sans-semibold text-[11px] text-ink dark:text-slate-200">
                    {field.label}:
                  </Text>
                  <Text className="font-sans-bold text-[11px] text-brand-600 dark:text-brand-300">
                    {field.value}
                  </Text>
                  <Pressable
                    accessibilityLabel={`Remove ${field.label}`}
                    onPress={() => removeField(idx)}
                    className="ml-1"
                  >
                    <X size={12} color="#8C98B8" />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
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
          className="mb-4 min-h-[44px] flex-row items-center gap-2 rounded-3xl border border-slate-200 bg-white px-4 py-3 dark:border-canvasdark-card dark:bg-canvasdark-card"
        >
          <CalendarIcon size={16} color="#5B6478" />
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

        <Label text="Diagnosis or reason for visit (optional)" />
        <Input value={diagnosis} onChangeText={setDiagnosis} placeholder="e.g. Type 2 diabetes review" />

        <Label text="Follow-up instructions (optional)" />
        <Input value={followUp} onChangeText={setFollowUp} placeholder="e.g. Next review in 3 months" />

        <Label text="Clinical notes" />
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Add any clinical detail you want saved with this record"
          placeholderTextColor="#8C98B8"
          multiline
          textAlignVertical="top"
          style={{ minHeight: 100 }}
          className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 font-sans text-[14px] text-ink dark:border-canvasdark-card dark:bg-canvasdark-card dark:text-slate-50"
        />

        <PrimaryButton label="Save record" onPress={handleSave} />
      </ScreenScroll>
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
      className="mb-4 min-h-[44px] rounded-3xl border border-slate-200 bg-white px-4 font-sans text-[14px] text-ink dark:border-canvasdark-card dark:bg-canvasdark-card dark:text-slate-50"
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
        active ? 'bg-ink dark:bg-brand-400' : 'bg-white dark:bg-canvasdark-card'
      }`}
    >
      {isValidElement(icon) ? cloneElement(icon as React.ReactElement<any>, { color: active ? '#FFFFFF' : '#5B6478' }) : icon}
      <Text className={`font-sans-medium text-[11px] ${active ? 'text-white' : 'text-ink-muted dark:text-slate-400'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
