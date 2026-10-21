import dayjs from 'dayjs';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, Download, Languages, Share2, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { HeroAction, heroShadow } from '@/components/ui/HeroAction';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useToast } from '@/components/ui/Toast';
import { TranslationSheet } from '@/components/TranslationSheet';
import { formatEventDate, reviewLabel } from '@/lib/recordSearch';
import { baseDocumentStyles, printAndShareHtml } from '@/lib/pdf';
import { useAppStore } from '@/store/useAppStore';
import { useAccent } from '@/hooks/useAccent';

export default function RecordDetailScreen() {
  const { accentSoft } = useAccent();
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
        <Text className="px-5 font-sans text-ink-muted dark:text-slate-400">This record could not be found.</Text>
      </Screen>
    );
  }

  const review = reviewLabel(record);
  const provider = [record.doctor, record.facility].filter(Boolean).join(' · ');

  const handleDownload = async () => {
    try {
      const html = `
        <html><head>${baseDocumentStyles()}</head><body>
          <h1>${record.title}</h1>
          <div class="muted">${record.facility}${record.doctor ? ` · ${record.doctor}` : ''} · ${formatEventDate(record)}</div>
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
    <Screen bottomInset={120}>
      <ScreenHeader
        title={record.category}
        onBack={() => router.back()}
        right={
          <View className="flex-row gap-2">
            <IconButton accessibilityLabel="Translate document" onPress={() => setTranslateOpen(true)}>
              <Languages size={18} color="#5B6478" />
            </IconButton>
            <IconButton accessibilityLabel="Delete record" variant="danger" onPress={handleDelete}>
              <Trash2 size={18} color="#DC1F26" />
            </IconButton>
          </View>
        }
      />
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 48, gap: 12 }}>
        {/* Summary */}
        <View className="rounded-[32px] bg-ink p-5 dark:bg-canvasdark-card" style={heroShadow}>
          <View className="flex-row items-center justify-between">
            <View className="rounded-full bg-white/15 px-3 py-1">
              <Text className="font-sans-semibold text-[11px] text-white">{record.documentType}</Text>
            </View>
            <Text className="font-sans-semibold text-[11px] text-white/70">{review}</Text>
          </View>
          <Text className="mt-4 font-sans-bold text-[22px] leading-[28px] text-white">{record.title}</Text>
          <Text className="mt-2 font-sans text-[13px] leading-[19px] text-white/60">
            {provider || 'Provider not recorded'}
          </Text>
          <Text className="mt-1 font-sans text-[13px] text-white/60">{formatEventDate(record)}</Text>

          <View className="mt-5 flex-row items-center gap-2">
            <HeroAction
              label="Share securely"
              icon={<Share2 size={16} color="#FFFFFF" />}
              onPress={() => router.push({ pathname: '/more/sharing', params: { recordId: record.id } })}
            />
            <HeroAction label="Download summary" icon={<Download size={16} color="#FFFFFF" />} onPress={handleDownload} />
          </View>
        </View>

        {/* Review status */}
        <View className="flex-row items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 dark:border-canvasdark-card dark:bg-canvasdark-card">
          <CheckCircle2 size={18} color={record.status === 'Patient confirmed' ? '#16A34A' : accentSoft} />
          <Text className="flex-1 font-sans text-[12px] leading-[17px] text-ink-soft dark:text-slate-300">
            {record.status === 'Patient confirmed'
              ? 'Confirmed — you have checked these details.'
              : 'Added from a file — please check the details, then confirm.'}
          </Text>
          {record.status !== 'Patient confirmed' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirm these details"
              onPress={() => {
                updateRecord(record.id, { status: 'Patient confirmed' });
                toast.show('Marked as patient confirmed', 'success');
              }}
              className="min-h-[44px] justify-center"
            >
              <Text className="font-sans-semibold text-[13px] text-brand-500 dark:text-brand-300">Confirm</Text>
            </Pressable>
          ) : null}
        </View>

        {/* Details */}
        <DetailCard title="Record details">
          <DetailRow label="Record type" value={record.documentType} />
          <DetailRow label="Date of visit or issue" value={formatEventDate(record)} />
          {record.doctor ? <DetailRow label="Healthcare provider" value={record.doctor} /> : null}
          <DetailRow label="Facility" value={record.facility} />
          <DetailRow
            label="Added to vault"
            value={`${dayjs(record.uploadedAt).isValid() ? dayjs(record.uploadedAt).format('D MMM YYYY') : 'Date not recorded'} · ${
              record.sourceType === 'Upload' ? 'uploaded file' : record.sourceType === 'Scan' ? 'camera scan' : 'entered by hand'
            }`}
          />
        </DetailCard>

        {record.diagnosis || record.followUp ? (
          <DetailCard title="Clinical context">
            {record.diagnosis ? <DetailRow label="Diagnosis or reason for visit" value={record.diagnosis} /> : null}
            {record.followUp ? <DetailRow label="Follow-up instructions" value={record.followUp} /> : null}
          </DetailCard>
        ) : null}

        {record.fields && record.fields.length > 0 ? (
          <DetailCard title="Results">
            {record.fields.map((f) => (
              <DetailRow key={f.label} label={f.label} value={f.value} />
            ))}
          </DetailCard>
        ) : null}

        <DetailCard title="Clinical notes (verbatim)">
          <Text className="px-4 py-3 font-sans text-[14px] leading-[22px] text-ink dark:text-slate-100">
            {record.clinicalNotes}
          </Text>
        </DetailCard>

        <DetailCard title="Original document">
          <Text className="px-4 py-3 font-sans text-[13px] leading-[19px] text-ink-soft dark:text-slate-300">
            No original file is stored for this record. The details above are what was entered into your
            vault.
          </Text>
        </DetailCard>
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

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Text className="mb-2 px-1 font-sans-bold text-[15px] text-ink dark:text-slate-50">{title}</Text>
      <View className="rounded-3xl border border-slate-200 bg-white dark:border-canvasdark-card dark:bg-canvasdark-card">
        {children}
      </View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="gap-0.5 border-t border-slate-100 px-4 py-3 first:border-t-0 dark:border-canvasdark">
      <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">{label}</Text>
      <Text className="font-sans-medium text-[14px] leading-[20px] text-ink dark:text-slate-50">{value}</Text>
    </View>
  );
}
