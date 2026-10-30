import dayjs from 'dayjs';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { safeBack } from '@/lib/navigation';
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
  FileText,
  FileType,
  FileUp,
  PenLine,
  Plus,
  RefreshCw,
  Smartphone,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react-native';
import { cloneElement, isValidElement, useState } from 'react';

import { Pill } from '@/components/ui/Pill';
import { PlatformDatePicker } from '@/components/ui/PlatformDatePicker';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { useToast } from '@/components/ui/Toast';
import { AiConsentModal } from '@/components/security/AiConsentModal';
import { recordCategories, type MedicalRecord, type RecordCategory, type RecordField } from '@/data/records';
import { useAccent } from '@/hooks/useAccent';
import { saveOriginal } from '@/lib/documents';
import {
  extractClinicalRecord,
  isPdfDocument,
  isWordDocument,
  type ExtractionSource,
} from '@/lib/ocr/documentExtractor';
import { syncRecordToDatabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';

type Method = 'upload' | 'scan' | 'manual';

interface PickedDocument {
  uri: string;
  name: string;
  mimeType: string;
  size?: number;
}

const SUPPORTED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/webp',
  'image/*',
  '*/*',
];

function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function resolveDocumentMime(name: string, reportedMime?: string | null): string {
  const lower = name.toLowerCase();
  if (lower.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  if (lower.endsWith('.doc')) {
    return 'application/msword';
  }
  if (lower.endsWith('.pdf')) {
    return 'application/pdf';
  }
  if (lower.endsWith('.png')) {
    return 'image/png';
  }
  if (/\.(jpe?g)$/i.test(lower)) {
    return 'image/jpeg';
  }
  if (lower.endsWith('.webp')) {
    return 'image/webp';
  }
  if (lower.endsWith('.heic')) {
    return 'image/heic';
  }
  return reportedMime || 'application/octet-stream';
}

export default function UploadRecordScreen() {
  const { accent } = useAccent();
  const toast = useToast();
  const addRecord = useAppStore((s) => s.addRecord);
  const aiConsentGranted = useAppStore((s) => s.aiConsentGranted);
  const setAiConsentGranted = useAppStore((s) => s.setAiConsentGranted);

  const [method, setMethod] = useState<Method>('upload');
  const [aiConsentVisible, setAiConsentVisible] = useState(false);
  const [pendingDocForOcr, setPendingDocForOcr] = useState<PickedDocument | null>(null);

  // Form State
  const [picked, setPicked] = useState<PickedDocument | null>(null);
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

  // New custom field modal/inputs
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');

  // OCR & Clinical NER State
  const [extracting, setExtracting] = useState(false);
  const [extractionSource, setExtractionSource] = useState<ExtractionSource | null>(null);
  const [prefilledCount, setPrefilledCount] = useState<number>(0);

  const runOcrExtraction = async (uri: string, name: string, mimeType: string) => {
    setExtracting(true);
    setExtractionSource(null);
    setPrefilledCount(0);

    try {
      const result = await extractClinicalRecord(uri, mimeType, name);
      const data = result.data;

      let count = 0;

      if (data.title) {
        setTitle(data.title);
        count++;
      }
      if (data.category) {
        setCategory(data.category);
        count++;
      }
      if (data.eventDate) {
        setEventDate(data.eventDate);
        count++;
      }
      if (data.facility && data.facility !== 'Not recorded') {
        setFacility(data.facility);
        count++;
      }
      if (data.doctor) {
        setDoctor(data.doctor);
        count++;
      }
      if (data.diagnosis) {
        setDiagnosis(data.diagnosis);
        count++;
      }
      if (data.followUp) {
        setFollowUp(data.followUp);
        count++;
      }
      if (data.clinicalNotes) {
        setNotes(data.clinicalNotes);
        count++;
      }
      if (data.fields && data.fields.length > 0) {
        setExtractedFields(data.fields);
        count += data.fields.length;
      }

      setPrefilledCount(count);
      setExtractionSource(result.source);

      const isDocx = isWordDocument(name, mimeType);
      const isPdf = isPdfDocument(name, mimeType);

      if (isDocx) {
        toast.show('Word document analyzed — details auto-filled', 'success');
      } else if (isPdf) {
        toast.show('PDF clinical report analyzed — details auto-filled', 'success');
      } else {
        toast.show('Document scan analyzed — details auto-filled', 'success');
      }
    } catch (err) {
      console.warn('[UploadRecordScreen] Extraction error:', err);
      toast.show('Could not auto-extract all fields. You can review or complete them manually.', 'info');
    } finally {
      setExtracting(false);
    }
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: SUPPORTED_DOCUMENT_MIME_TYPES,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const resolvedMime = resolveDocumentMime(asset.name, asset.mimeType);

        const pickedDoc: PickedDocument = {
          uri: asset.uri,
          name: asset.name,
          mimeType: resolvedMime,
          size: asset.size,
        };

        setPicked(pickedDoc);

        if (!aiConsentGranted) {
          setPendingDocForOcr(pickedDoc);
          setAiConsentVisible(true);
        } else {
          runOcrExtraction(pickedDoc.uri, pickedDoc.name, pickedDoc.mimeType);
        }
      }
    } catch (err) {
      console.warn('[UploadRecordScreen] DocumentPicker error:', err);
      toast.show('Could not open document picker. Please try again.', 'warning');
    }
  };

  const captureScan = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      toast.show('Camera access is needed to scan a document', 'warning');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      const scannedName = `Scanned document ${dayjs().format('YYYY-MM-DD HHmm')}.jpg`;
      const pickedDoc: PickedDocument = {
        uri: asset.uri,
        name: scannedName,
        mimeType: 'image/jpeg',
        size: asset.fileSize,
      };
      setPicked(pickedDoc);
      if (!aiConsentGranted) {
        setPendingDocForOcr(pickedDoc);
        setAiConsentVisible(true);
      } else {
        runOcrExtraction(pickedDoc.uri, pickedDoc.name, pickedDoc.mimeType);
      }
    }
  };

  const removeField = (index: number) => {
    setExtractedFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddCustomField = () => {
    if (!newFieldLabel.trim() || !newFieldValue.trim()) {
      toast.show('Enter both a label and a value for this finding', 'warning');
      return;
    }
    setExtractedFields((prev) => [
      ...prev,
      { label: newFieldLabel.trim(), value: newFieldValue.trim() },
    ]);
    setNewFieldLabel('');
    setNewFieldValue('');
    setShowAddField(false);
    toast.show('Finding added', 'success');
  };

  const handleClearDocument = () => {
    setPicked(null);
    setExtractionSource(null);
    setPrefilledCount(0);
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

    toast.show('Record added to your encrypted vault', 'success');
    safeBack('/(tabs)/records');
  };

  const isDocx = picked ? isWordDocument(picked.name, picked.mimeType) : false;
  const isPdf = picked ? isPdfDocument(picked.name, picked.mimeType) : false;

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50 dark:bg-canvasdark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Add a medical record" onBack={() => safeBack('/(tabs)/records')} />
      <ScreenScroll className="flex-1 px-5">
        {/* Method Chips */}
        <View className="mb-5 flex-row gap-2">
          <MethodChip
            label="Upload File"
            icon={<FileUp size={16} />}
            active={method === 'upload'}
            onPress={() => setMethod('upload')}
          />
          <MethodChip
            label="Camera Scan"
            icon={<Camera size={16} />}
            active={method === 'scan'}
            onPress={() => setMethod('scan')}
          />
          <MethodChip
            label="Add Manually"
            icon={<PenLine size={16} />}
            active={method === 'manual'}
            onPress={() => setMethod('manual')}
          />
        </View>

        {/* Upload or Camera Capture Box */}
        {method !== 'manual' && !picked ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={method === 'upload' ? 'Choose a PDF, Word docx, or image' : 'Open camera to scan document'}
            onPress={method === 'upload' ? pickFile : captureScan}
            className="mb-4 min-h-[110px] items-center justify-center gap-2 rounded-3xl border border-dashed border-brand-300 bg-brand-50 p-6 dark:border-brand-500/40 dark:bg-brand-500/10"
          >
            {method === 'upload' ? (
              <FileUp size={28} color={accent} />
            ) : (
              <Camera size={28} color={accent} />
            )}
            <Text className="font-sans-bold text-[14px] text-brand-700 dark:text-brand-300">
              {method === 'upload' ? 'Choose a PDF, Word DOCX, or Image' : 'Snap photo of prescription or letter'}
            </Text>
            <Text className="font-sans text-[12px] text-brand-600/80 dark:text-brand-300/80 text-center">
              {method === 'upload'
                ? 'Details will be automatically read and prefilled into the form'
                : 'OCR will automatically transcribe dates, clinic, and diagnoses'}
            </Text>
          </Pressable>
        ) : null}

        {/* Picked Document Preview Card */}
        {picked ? (
          <View className="mb-4 rounded-3xl border border-brand-200 bg-white p-4 shadow-sm dark:border-brand-500/30 dark:bg-canvasdark-card">
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-row items-center gap-3 flex-1">
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-100/80 dark:bg-brand-500/20">
                  {isDocx ? (
                    <FileType size={22} color="#0B2559" />
                  ) : isPdf ? (
                    <FileText size={22} color="#DC1F26" />
                  ) : (
                    <Camera size={22} color="#0B2559" />
                  )}
                </View>
                <View className="flex-1">
                  <Text numberOfLines={1} className="font-sans-bold text-[14px] text-ink dark:text-slate-50">
                    {picked.name}
                  </Text>
                  <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">
                    {isDocx ? 'Word Document (.docx)' : isPdf ? 'PDF Document' : 'Image Scan'}
                    {picked.size ? ` · ${formatBytes(picked.size)}` : ''}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center gap-1.5">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Re-analyze document"
                  onPress={() => runOcrExtraction(picked.uri, picked.name, picked.mimeType)}
                  disabled={extracting}
                  className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-canvasdark"
                >
                  <RefreshCw size={15} color="#5B6478" />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove attached file"
                  onPress={handleClearDocument}
                  disabled={extracting}
                  className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-canvasdark"
                >
                  <Trash2 size={15} color="#DC1F26" />
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}

        {/* OCR Extracting Loading Banner */}
        {extracting ? (
          <View className="mb-5 flex-row items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
            <ActivityIndicator size="small" color={accent} />
            <View className="flex-1">
              <Text className="font-sans-bold text-[13px] text-brand-700 dark:text-brand-300">
                {isDocx
                  ? 'Parsing Word Document & Extracting Medical Data…'
                  : isPdf
                  ? 'Analyzing PDF Report & Clinical NER…'
                  : 'Scanning Document & Extracting Medical Data…'}
              </Text>
              <Text className="font-sans text-[11px] text-brand-600/80 dark:text-brand-300/80">
                Fetching clinic, doctor, encounter date, diagnoses & lab metrics…
              </Text>
            </View>
          </View>
        ) : null}

        {/* OCR Extraction Complete Success Banner */}
        {!extracting && extractionSource ? (
          <View className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                {extractionSource === 'on-device' ? (
                  <Smartphone size={16} color="#059669" />
                ) : (
                  <Sparkles size={16} color="#059669" />
                )}
                <View>
                  <Text className="font-sans-bold text-[12px] text-emerald-800 dark:text-emerald-300">
                    {extractionSource === 'on-device'
                      ? 'Extracted via On-Device Engine'
                      : extractionSource === 'gemini-ner'
                      ? 'Clinical NER Auto-Extracted Details'
                      : extractionSource === 'gemini-vision'
                      ? 'Gemini Multimodal Vision Extracted Details'
                      : 'Auto-Extracted from Document'}
                  </Text>
                  <Text className="font-sans text-[11px] text-emerald-700/80 dark:text-emerald-400/80">
                    {prefilledCount > 0
                      ? `✨ ${prefilledCount} fields auto-prefilled. Review details below before saving.`
                      : 'Clinical fields prefilled. Review details below before saving.'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : null}

        {/* Extracted Structured Findings (e.g. HbA1c, Blood Pressure, eGFR) */}
        <View className="mb-5 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
          <View className="mb-2 flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <CheckCircle2 size={16} color="#16A34A" />
              <Text className="font-sans-bold text-[13px] text-ink dark:text-slate-100">
                Clinical Metrics & Key Findings ({extractedFields.length})
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add custom clinical metric"
              onPress={() => setShowAddField(!showAddField)}
              className="flex-row items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-canvasdark"
            >
              <Plus size={13} color="#0B2559" />
              <Text className="font-sans-semibold text-[11px] text-ink dark:text-slate-200">
                Add finding
              </Text>
            </Pressable>
          </View>

          {showAddField ? (
            <View className="mb-3 rounded-2xl bg-slate-50 p-3 dark:bg-canvasdark">
              <Text className="mb-2 font-sans-bold text-[12px] text-ink dark:text-slate-200">
                Add Custom Clinical Finding
              </Text>
              <View className="flex-row gap-2 mb-2">
                <TextInput
                  value={newFieldLabel}
                  onChangeText={setNewFieldLabel}
                  placeholder="Metric (e.g. eGFR, BP)"
                  placeholderTextColor="#8C98B8"
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-sans text-[12px] text-ink dark:border-slate-700 dark:bg-canvasdark-card dark:text-slate-50"
                />
                <TextInput
                  value={newFieldValue}
                  onChangeText={setNewFieldValue}
                  placeholder="Value (e.g. 84 mL/min)"
                  placeholderTextColor="#8C98B8"
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 font-sans text-[12px] text-ink dark:border-slate-700 dark:bg-canvasdark-card dark:text-slate-50"
                />
              </View>
              <View className="flex-row justify-end gap-2">
                <Pressable
                  onPress={() => setShowAddField(false)}
                  className="rounded-xl px-3 py-1 bg-slate-200 dark:bg-slate-700"
                >
                  <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-300">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleAddCustomField}
                  className="rounded-xl px-3 py-1 bg-ink dark:bg-brand-400"
                >
                  <Text className="font-sans-bold text-[11px] text-white">Add</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {extractedFields.length > 0 ? (
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
          ) : (
            <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400 pt-1">
              No specific numeric metrics identified yet. They will appear here when uploading lab results or prescriptions.
            </Text>
          )}
        </View>

        {/* Record Form Fields */}
        <Label text="Title" prefilled={Boolean(title && extractionSource)} />
        <Input value={title} onChangeText={setTitle} placeholder="e.g. HbA1c & Lipogram Panel" />

        <Label text="Category" prefilled={Boolean(category !== 'Other' && extractionSource)} />
        <View className="mb-4 flex-row flex-wrap gap-2">
          {recordCategories.map((c) => (
            <Pill key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>

        <Label text="Event date" prefilled={Boolean(extractionSource)} />
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
        <PlatformDatePicker
          visible={showDatePicker}
          value={dayjs(eventDate).toDate()}
          mode="date"
          maximumDate={new Date()}
          title="Record Event Date"
          onChange={(date) => setEventDate(dayjs(date).format('YYYY-MM-DD'))}
          onClose={() => setShowDatePicker(false)}
        />

        <Label text="Facility / Clinic / Lab" prefilled={Boolean(facility && extractionSource)} />
        <Input value={facility} onChangeText={setFacility} placeholder="e.g. Lancet Laboratories, Bedfordview" />

        <Label text="Doctor / Clinician (optional)" prefilled={Boolean(doctor && extractionSource)} />
        <Input value={doctor} onChangeText={setDoctor} placeholder="e.g. Dr N. Mokoena" />

        <Label text="Diagnosis or Indication (optional)" prefilled={Boolean(diagnosis && extractionSource)} />
        <Input value={diagnosis} onChangeText={setDiagnosis} placeholder="e.g. Type 2 Diabetes Mellitus" />

        <Label text="Follow-up instructions (optional)" prefilled={Boolean(followUp && extractionSource)} />
        <Input value={followUp} onChangeText={setFollowUp} placeholder="e.g. Repeat HbA1c in 3 months" />

        <Label text="Clinical notes & transcribed text" prefilled={Boolean(notes && extractionSource)} />
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Clinical summary or directions extracted from your document"
          placeholderTextColor="#8C98B8"
          multiline
          textAlignVertical="top"
          style={{ minHeight: 110 }}
          className="mb-6 rounded-3xl border border-slate-200 bg-white p-4 font-sans text-[14px] text-ink dark:border-canvasdark-card dark:bg-canvasdark-card dark:text-slate-50"
        />

        <PrimaryButton label="Save record to vault" onPress={handleSave} />
      </ScreenScroll>

      <AiConsentModal
        visible={aiConsentVisible}
        featureTitle="Medical Document OCR & Clinical Extraction"
        onAllowCloudAi={() => {
          setAiConsentGranted(true);
          setAiConsentVisible(false);
          if (pendingDocForOcr) {
            const doc = pendingDocForOcr;
            setPendingDocForOcr(null);
            void runOcrExtraction(doc.uri, doc.name, doc.mimeType);
          }
        }}
        onUseOnDeviceOnly={() => {
          setAiConsentGranted(false);
          setAiConsentVisible(false);
          if (pendingDocForOcr) {
            const doc = pendingDocForOcr;
            setPendingDocForOcr(null);
            void runOcrExtraction(doc.uri, doc.name, doc.mimeType);
          }
        }}
        onClose={() => {
          setAiConsentVisible(false);
          setPendingDocForOcr(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}

function Label({ text, prefilled }: { text: string; prefilled?: boolean }) {
  return (
    <View className="mb-1.5 flex-row items-center gap-1.5">
      <Text className="font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">{text}</Text>
      {prefilled ? (
        <View className="rounded-full bg-emerald-100 px-2 py-0.5 dark:bg-emerald-950">
          <Text className="font-sans-bold text-[10px] text-emerald-800 dark:text-emerald-300">
            Prefilled
          </Text>
        </View>
      ) : null}
    </View>
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
