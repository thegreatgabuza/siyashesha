import dayjs from 'dayjs';
import { router, useLocalSearchParams } from 'expo-router';
import {
  CheckCircle2,
  Download,
  Languages,
  Share2,
  Trash2,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useToast } from '@/components/ui/Toast';
import { TranslationSheet } from '@/components/TranslationSheet';
import { baseDocumentStyles, printAndShareHtml } from '@/lib/pdf';
import { useAppStore } from '@/store/useAppStore';

export default function RecordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const records = useAppStore((s) => s.records);
  const updateRecord = useAppStore((s) => s.updateRecord);
  const deleteRecord = useAppStore((s) => s.deleteRecord);
  const language = useAppStore((s) => s.language);
  const [translateOpen, setTranslateOpen] = useState(false);

  const record = records.find((r) => r.id === id);

  if (!record) {
    return (
      <Screen>
        <ScreenHeader title="Record" onBack={() => router.back()} />
        <Text className="px-5 font-sans text-ink-muted dark:text-slate-400">
          This record could not be found.
        </Text>
      </Screen>
    );
  }

  const handleDownload = async () => {
    try {
      const html = `
        <html><head>${baseDocumentStyles()}</head><body>
          <h1>${record.title}</h1>
          <div class="muted">${record.facility}${record.doctor ? ` · ${record.doctor}` : ''} · ${dayjs(record.eventDate).format('D MMMM YYYY')}</div>
          <div class="section-title">Diagnosis</div>
          <div>${record.diagnosis ?? 'Not recorded'}</div>
          <div class="section-title">Clinical Notes</div>
          <div>${record.clinicalNotes}</div>
          ${record.followUp ? `<div class="section-title">Follow-up</div><div>${record.followUp}</div>` : ''}
          <div class="notice">Siyashesha Health Passport — downloaded by the patient. The original record held by the issuing facility remains authoritative.</div>
        </body></html>
      `;
      await printAndShareHtml(html, record.title);
    } catch {
      toast.show('Could not prepare the download. Please try again.', 'warning');
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete record?', `${record.title} will be permanently removed from your vault.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteRecord(record.id);
          toast.show('Record deleted', 'info');
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen bottomInset={60}>
      <ScreenHeader
        title={record.category}
        onBack={() => router.back()}
        right={
          <View className="flex-row gap-2">
            <IconButton accessibilityLabel="Translate document" onPress={() => setTranslateOpen(true)}>
              <Languages size={18} color="#5B6B8A" />
            </IconButton>
            <IconButton accessibilityLabel="Delete record" variant="danger" onPress={handleDelete}>
              <Trash2 size={18} color="#DC2626" />
            </IconButton>
          </View>
        }
      />
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 48 }}>
        <Text className="mb-1 font-serif text-[22px] leading-[28px] text-ink dark:text-slate-50">
          {record.title}
        </Text>
        <Text className="mb-4 font-sans text-[13px] text-ink-muted dark:text-slate-400">
          {record.facility}
          {record.doctor ? ` · ${record.doctor}` : ''} · {dayjs(record.eventDate).format('D MMMM YYYY')}
        </Text>

        <View className="mb-5 flex-row gap-2">
          <ActionChip label="Share securely" icon={<Share2 size={14} color="#6D5BD0" />} onPress={() => router.push({ pathname: '/more/sharing', params: { recordId: record.id } })} />
          <ActionChip label="Download" icon={<Download size={14} color="#6D5BD0" />} onPress={handleDownload} />
        </View>

        <View className="mb-5 flex-row items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-canvasdark-card dark:bg-canvasdark-card">
          <CheckCircle2
            size={16}
            color={record.status === 'Patient confirmed' ? '#0D9488' : '#A58FE6'}
          />
          <Text className="flex-1 font-sans text-[12px] text-ink-soft dark:text-slate-300">
            {record.status === 'Patient confirmed'
              ? 'Patient confirmed — you have reviewed this extracted information.'
              : 'Extracted from document — please review before confirming.'}
          </Text>
          {record.status !== 'Patient confirmed' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirm extracted information"
              onPress={() => {
                updateRecord(record.id, { status: 'Patient confirmed' });
                toast.show('Marked as patient confirmed', 'success');
              }}
            >
              <Text className="font-sans-semibold text-[12px] text-brand-500">Confirm</Text>
            </Pressable>
          ) : null}
        </View>

        <Section title="Document Type" value={record.documentType} />
        {record.diagnosis ? <Section title="Diagnosis" value={record.diagnosis} /> : null}
        {record.followUp ? <Section title="Follow-up instructions" value={record.followUp} /> : null}

        {record.fields && record.fields.length > 0 ? (
          <View className="mb-5">
            <Text className="mb-2 font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">
              Results
            </Text>
            <View className="rounded-2xl border border-slate-200 bg-white dark:border-canvasdark-card dark:bg-canvasdark-card">
              {record.fields.map((f, i) => (
                <View
                  key={f.label}
                  className={`flex-row items-center justify-between px-4 py-3 ${
                    i > 0 ? 'border-t border-slate-100 dark:border-canvasdark' : ''
                  }`}
                >
                  <Text className="font-sans text-[13px] text-ink-muted dark:text-slate-400">{f.label}</Text>
                  <Text className="font-sans-semibold text-[13px] text-ink dark:text-slate-50">{f.value}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View className="mb-2">
          <Text className="mb-2 font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">
            Clinical notes (verbatim)
          </Text>
          <View className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
            <Text className="font-sans text-[14px] leading-[22px] text-ink dark:text-slate-100">
              {record.clinicalNotes}
            </Text>
          </View>
        </View>
      </ScrollView>

      <TranslationSheet
        visible={translateOpen}
        onClose={() => setTranslateOpen(false)}
        record={record}
        defaultLanguage={language}
      />
    </Screen>
  );
}

function Section({ title, value }: { title: string; value: string }) {
  return (
    <View className="mb-5">
      <Text className="mb-1.5 font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">
        {title}
      </Text>
      <Text className="font-sans text-[14px] leading-[21px] text-ink dark:text-slate-100">{value}</Text>
    </View>
  );
}

function ActionChip({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="min-h-[40px] flex-row items-center gap-1.5 rounded-full bg-lavender-100 px-3.5 py-2 dark:bg-brand-500/20"
    >
      {icon}
      <Text className="font-sans-semibold text-[12px] text-brand-600 dark:text-brand-400">{label}</Text>
    </Pressable>
  );
}
