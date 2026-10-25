import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import dayjs from 'dayjs';
import { router } from 'expo-router';
import { Camera, FileUp, SkipForward } from 'lucide-react-native';
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

export default function RecordsOnboardingScreen() {
  const addRecord = useAppStore((s) => s.addRecord);
  const earnStamp = useAppStore((s) => s.earnStamp);
  const [added, setAdded] = useState<string | null>(null);
  const [reward, setReward] = useState<StampId | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const next = () => router.push('/(onboarding)/reveal' as any);

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
    setMessage(null);
    if (earnStamp('record')) setReward('record');
  };

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'] });
    if (!result.canceled && result.assets[0]) {
      const name = result.assets[0].name.replace(/\.[^/.]+$/, '');
      const asset = result.assets[0];
      saveRecord(name || 'Uploaded document', 'Upload', {
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/octet-stream',
      });
    }
  };

  const scan = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setMessage('Camera access is needed to scan. You can allow it in your phone settings, or upload a file instead.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    saveRecord(`Scanned document ${dayjs().format('D MMM YYYY')}`, 'Scan', {
      uri: result.assets[0].uri,
      name: `Scanned document ${dayjs().format('YYYY-MM-DD')}.jpg`,
      mimeType: 'image/jpeg',
    });
  };

  return (
    <OnboardingShell
      footer={
        added ? (
          <ChunkyButton label="Continue" onPress={() => (reward ? null : next())} />
        ) : (
          <ChunkyButton variant="ghost" label="Skip for now" onPress={next} />
        )
      }
    >
      <View className="gap-5 py-2">
        <View className="items-center gap-4">
          <Mascot mood={added ? 'cheer' : 'curious'} size={88} />
          <SpeechBubble>
            {analyzing
              ? 'Scanning your document with OCR and AI…'
              : added
              ? `Saved "${added}" to your vault!`
              : message ??
                'Bring in a blood test, prescription, clinic book photo or discharge letter. Siyashesha will scan and organize it.'}
          </SpeechBubble>
          {analyzing ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color="#0B2559" />
              <Text className="font-sans text-[12px] text-ink-muted">Analyzing clinical details…</Text>
            </View>
          ) : null}
        </View>

        {!added && !analyzing ? (
          <View className="gap-3">
            <OptionCard
              title="Upload a PDF or photo"
              subtitle="Pick a file from your phone"
              icon={<FileUp size={24} color="#0B2559" />}
              selected={false}
              onPress={pickFile}
            />
            <OptionCard
              title="Scan with my camera"
              subtitle="Photograph a paper document"
              icon={<Camera size={24} color="#0B2559" />}
              selected={false}
              onPress={scan}
            />
            {message ? <Text className="font-sans text-[13px] leading-[18px] text-ink-soft dark:text-slate-300">{message}</Text> : null}
          </View>
        ) : null}

        {added ? (
          <View className="flex-row items-center gap-2 rounded-2xl bg-success-50 p-3 dark:bg-success-500/15">
            <SkipForward size={16} color="#16A34A" />
            <Text className="flex-1 font-sans-semibold text-[13px] text-success-600">Added: {added}</Text>
          </View>
        ) : null}

        {/* Example of where records will live. Clearly labelled, not real data. */}
        <View className="gap-2">
          <Text className="font-sans-semibold text-[12px] uppercase tracking-wide text-ink-muted dark:text-slate-400">
            Example · where it will live
          </Text>
          <View className="rounded-3xl border-2 border-dashed border-slate-300 bg-white/60 p-4 dark:border-slate-600 dark:bg-canvasdark-card/60">
            <View className="flex-row items-center justify-between">
              <Text className="font-sans-medium text-[12px] text-ink-muted dark:text-slate-400">Example date</Text>
              <View className="rounded-full bg-brand-100 px-2.5 py-0.5 dark:bg-brand-500/20">
                <Text className="font-sans-medium text-[10px] text-brand-600 dark:text-brand-300">Example</Text>
              </View>
            </View>
            <Text className="mt-2 font-sans-bold text-[15px] text-ink dark:text-slate-50">Example: clinic visit letter</Text>
            <Text className="mt-0.5 font-sans text-[12px] text-ink-muted dark:text-slate-400">Your clinic · in date order</Text>
          </View>
        </View>
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
