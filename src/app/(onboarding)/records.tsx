import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import dayjs from 'dayjs';
import { router } from 'expo-router';
import { Camera, CheckCircle2, FileText, FileUp, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { ChunkyButton } from '@/components/onboarding/ChunkyButton';
import { Mascot } from '@/components/onboarding/Mascot';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { RewardModal } from '@/components/onboarding/RewardModal';
import { SpeechBubble } from '@/components/onboarding/SpeechBubble';
import type { MedicalRecord } from '@/data/records';
import type { StampId } from '@/store/useAppStore';
import { saveOriginal } from '@/lib/documents';
import { extractClinicalRecord } from '@/lib/ocr/documentExtractor';
import { syncRecordToDatabase } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';

const SUPPORTED_MIME_TYPES = [
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
  return reportedMime || 'application/octet-stream';
}

export default function RecordsOnboardingScreen() {
  const addRecord = useAppStore((s) => s.addRecord);
  const earnStamp = useAppStore((s) => s.earnStamp);
  const [added, setAdded] = useState<string | null>(null);
  const [savedRecordSummary, setSavedRecordSummary] = useState<MedicalRecord | null>(null);
  const [reward, setReward] = useState<StampId | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const next = () => router.push('/(onboarding)/notifications' as any);

  const saveRecord = async (
    title: string,
    sourceType: MedicalRecord['sourceType'],
    file: { uri: string; name: string; mimeType: string }
  ) => {
    const today = dayjs().format('YYYY-MM-DD');
    const id = `rec-${Date.now()}`;
    let originalFile: MedicalRecord['originalFile'];
    try {
      originalFile = await saveOriginal(file.uri, id, file.name, file.mimeType);
    } catch {
      setMessage('Could not keep a copy of that file. Please try again.');
      return;
    }

    setAnalyzing(true);
    let extractedCategory: MedicalRecord['category'] = 'Other';
    let extractedTitle = title;
    let extractedNotes = 'Record added during onboarding. You can review and edit in your vault.';
    let extractedFacility = 'Not recorded';
    let extractedDoctor: string | undefined;
    let extractedDiagnosis: string | undefined;
    let extractedEventDate = today;
    let extractedFields: MedicalRecord['fields'];

    try {
      const ocrResult = await extractClinicalRecord(file.uri, file.mimeType, file.name);
      if (ocrResult?.data) {
        if (ocrResult.data.title) extractedTitle = ocrResult.data.title;
        if (ocrResult.data.category) extractedCategory = ocrResult.data.category;
        if (ocrResult.data.facility && ocrResult.data.facility !== 'Not recorded') {
          extractedFacility = ocrResult.data.facility;
        }
        if (ocrResult.data.doctor) extractedDoctor = ocrResult.data.doctor;
        if (ocrResult.data.diagnosis) extractedDiagnosis = ocrResult.data.diagnosis;
        if (ocrResult.data.eventDate) extractedEventDate = ocrResult.data.eventDate;
        if (ocrResult.data.clinicalNotes) extractedNotes = ocrResult.data.clinicalNotes;
        if (ocrResult.data.fields?.length) extractedFields = ocrResult.data.fields;
      }
    } catch {
      // Continue with safe defaults
    } finally {
      setAnalyzing(false);
    }

    const newRecord: MedicalRecord = {
      id,
      originalFile,
      category: extractedCategory,
      title: extractedTitle,
      facility: extractedFacility,
      doctor: extractedDoctor,
      diagnosis: extractedDiagnosis,
      eventDate: extractedEventDate,
      uploadedAt: today,
      sourceType,
      documentType: extractedCategory,
      status: 'Extracted from document',
      clinicalNotes: extractedNotes,
      fields: extractedFields,
    };

    addRecord(newRecord);
    syncRecordToDatabase(newRecord).catch(() => {});
    setAdded(extractedTitle);
    setSavedRecordSummary(newRecord);
    setMessage(null);
    if (earnStamp('record')) setReward('record');
  };

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: SUPPORTED_MIME_TYPES,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        const resolvedMime = resolveDocumentMime(asset.name, asset.mimeType);
        const cleanName = asset.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

        saveRecord(cleanName || 'Uploaded document', 'Upload', {
          uri: asset.uri,
          name: asset.name,
          mimeType: resolvedMime,
        });
      }
    } catch (err) {
      console.warn('[OnboardingRecords] Pick file error:', err);
      setMessage('Could not select file. Please try again.');
    }
  };

  const scan = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setMessage('Camera access is needed to scan. You can allow it in your phone settings, or upload a file instead.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled || !result.assets || !result.assets[0]) return;
    const asset = result.assets[0];
    saveRecord(`Scanned document ${dayjs().format('D MMM YYYY')}`, 'Scan', {
      uri: asset.uri,
      name: `Scanned document ${dayjs().format('YYYY-MM-DD')}.jpg`,
      mimeType: 'image/jpeg',
    });
  };

  return (
    <OnboardingShell
      step={5}
      totalSteps={8}
      stepLabel="Health Records"
      footer={
        added ? (
          <ChunkyButton label="Continue" onPress={() => (reward ? null : next())} />
        ) : (
          <ChunkyButton variant="ghost" label="Skip — I’ll upload records later" onPress={next} />
        )
      }
    >
      <View className="gap-5 py-2">
        <View className="items-center gap-3">
          <Mascot mood={added ? 'cheer' : 'curious'} size={80} />
          <SpeechBubble subtitle="Supports PDF, Word (.docx), blood tests, prescriptions & clinic letters.">
            {analyzing
              ? 'Extracting clinical details and prefilling from your document…'
              : added
              ? `Saved "${added}" to your encrypted vault!`
              : message ?? 'Have a medical document handy? Upload your PDF, DOCX or scan.'}
          </SpeechBubble>
          {analyzing ? (
            <View className="flex-row items-center gap-2 rounded-full bg-brand-100/80 px-4 py-1.5 dark:bg-brand-500/20">
              <ActivityIndicator size="small" color="#0B2559" />
              <Text className="font-sans-semibold text-[12px] text-brand-700 dark:text-brand-300">
                AI parsing clinical entities…
              </Text>
            </View>
          ) : null}
        </View>

        {!added && !analyzing ? (
          <View className="gap-3">
            <OptionCard
              title="Upload a PDF, Word DOCX, or photo"
              subtitle="Choose a lab report, script, or hospital letter from your phone"
              badge="Fastest"
              icon={<FileUp size={22} color="#0B2559" />}
              selected={false}
              onPress={pickFile}
            />
            <OptionCard
              title="Scan with my camera"
              subtitle="Snap a photo of a paper prescription or clinic book"
              icon={<Camera size={22} color="#0B2559" />}
              selected={false}
              onPress={scan}
            />
          </View>
        ) : null}

        {added && savedRecordSummary ? (
          <View className="rounded-3xl border border-success-500/30 bg-success-50 p-4 dark:bg-success-500/15">
            <View className="flex-row items-center gap-2 mb-2">
              <CheckCircle2 size={20} color="#16A34A" />
              <Text className="font-sans-bold text-[14px] text-success-700 dark:text-emerald-400">
                Details Auto-Prefilled & Saved to Vault
              </Text>
            </View>

            <Text className="font-sans-bold text-[16px] text-ink dark:text-slate-50">
              {savedRecordSummary.title}
            </Text>
            <Text className="mt-0.5 font-sans text-[12px] text-ink-muted dark:text-slate-400">
              {savedRecordSummary.category} · {savedRecordSummary.facility} · {dayjs(savedRecordSummary.eventDate).format('D MMM YYYY')}
            </Text>

            {savedRecordSummary.doctor ? (
              <Text className="mt-1 font-sans text-[12px] text-ink-muted dark:text-slate-400">
                Clinician: {savedRecordSummary.doctor}
              </Text>
            ) : null}

            {savedRecordSummary.diagnosis ? (
              <Text className="mt-1 font-sans-medium text-[12px] text-brand-700 dark:text-brand-300">
                Diagnosis: {savedRecordSummary.diagnosis}
              </Text>
            ) : null}

            {savedRecordSummary.fields && savedRecordSummary.fields.length > 0 ? (
              <View className="mt-3 flex-row flex-wrap gap-1.5 pt-2 border-t border-success-200 dark:border-success-800">
                {savedRecordSummary.fields.map((f, i) => (
                  <View key={i} className="rounded-xl bg-white px-2.5 py-1 dark:bg-canvasdark">
                    <Text className="font-sans text-[11px] text-ink dark:text-slate-200">
                      <Text className="font-sans-semibold">{f.label}: </Text>
                      {f.value}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Informative explanation */}
        {!added && (
          <View className="gap-2">
            <View className="flex-row items-center gap-1.5">
              <Sparkles size={13} color="#0B2559" />
              <Text className="font-sans-bold text-[11px] uppercase tracking-[0.8px] text-ink-muted dark:text-slate-400">
                Automatic Clinical Extraction
              </Text>
            </View>
            <View className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-4 dark:border-slate-700 dark:bg-canvasdark-card/70">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <FileText size={15} color="#0B2559" />
                  <Text className="font-sans-semibold text-[12px] text-ink-muted dark:text-slate-400">
                    PDF & Word DOCX Supported
                  </Text>
                </View>
                <View className="rounded-full bg-brand-100 px-2.5 py-0.5 dark:bg-brand-500/20">
                  <Text className="font-sans-bold text-[10px] text-brand-700 dark:text-brand-300">
                    Auto-Prefill
                  </Text>
                </View>
              </View>
              <Text className="mt-2 font-sans-bold text-[15px] text-ink dark:text-slate-50">
                Full Blood Count & Lipid Panel
              </Text>
              <Text className="mt-0.5 font-sans text-[12px] text-ink-muted dark:text-slate-400">
                Lancet Laboratories · Pre-fills lab values, clinician & clinical summary
              </Text>
            </View>
          </View>
        )}
      </View>

      <RewardModal
        stampId={reward}
        onDone={() => {
          setReward(null);
          next();
        }}
      />
    </OnboardingShell>
  );
}
