import dayjs from 'dayjs';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle2, Download, FileText, Languages, Pencil, Share2, Trash2 } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { HeroAction, heroShadow } from '@/components/ui/HeroAction';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useToast } from '@/components/ui/Toast';
import { RecordThumb } from '@/components/records/RecordThumb';
import { springs } from '@/design/tokens';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { TranslationSheet } from '@/components/TranslationSheet';
import { removeOriginal } from '@/lib/documents';
import { deleteRecordFromDatabase } from '@/lib/supabase';
import { formatEventDate, reviewLabel } from '@/lib/recordSearch';
import { exportSingleRecordPdf } from '@/lib/pdf';
import { useAppStore } from '@/store/useAppStore';
import { useAccent } from '@/hooks/useAccent';

export default function RecordDetailScreen() {
  const { accent, accentSoft } = useAccent();
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const records = useAppStore((s) => s.records);
  const patient = useAppStore((s) => s.patientProfile);
  const logAudit = useAppStore((s) => s.logAudit);
  const updateRecord = useAppStore((s) => s.updateRecord);
  const deleteRecord = useAppStore((s) => s.deleteRecord);
  const language = useAppStore((s) => s.language);
  const [translateOpen, setTranslateOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const record = records.find((r) => r.id === id);

  if (!record) {
    return (
      <Screen headerOwnsTopInset scroll={false}>
        <ScreenHeader title="Record" onBack={() => router.back()} />
        <Text className="px-5 font-sans text-ink-muted dark:text-slate-400">This record could not be found.</Text>
      </Screen>
    );
  }

  const review = reviewLabel(record);
  const provider = [record.doctor, record.facility].filter(Boolean).join(' · ');

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await exportSingleRecordPdf(record, patient, 'download');
      logAudit('export', `Downloaded record PDF: ${record.title}`);
      toast.show(`Downloaded "${record.title}" as PDF`, 'success');
    } catch {
      toast.show('Could not prepare the download. Please try again.', 'warning');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Delete record?', `${record.title} will be permanently removed from your vault.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeOriginal(record.originalFile);
          deleteRecord(record.id);
          deleteRecordFromDatabase(record.id).catch(() => {});
          toast.show('Record deleted', 'info');
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen headerOwnsTopInset scroll={false}>
      <ScreenHeader
        title={record.category}
        onBack={() => router.back()}
        right={
          <View className="flex-row gap-2">
            <IconButton accessibilityLabel="Download record PDF" onPress={handleDownload}>
              <Download size={18} color={accent} />
            </IconButton>
            <IconButton accessibilityLabel="Edit details" onPress={() => router.push(`/records/edit?id=${record.id}` as any)}>
              <Pencil size={18} color="#5B6478" />
            </IconButton>
            <IconButton accessibilityLabel="Translate document" onPress={() => setTranslateOpen(true)}>
              <Languages size={18} color="#5B6478" />
            </IconButton>
            <IconButton accessibilityLabel="Delete record" variant="danger" onPress={handleDelete}>
              <Trash2 size={18} color="#DC1F26" />
            </IconButton>
          </View>
        }
      />
      <ScreenScroll className="flex-1 px-5" contentContainerStyle={{ gap: 12 }}>
        {/* The document itself, lifted in on a spring, as if picked up from the vault. */}
        <Animated.View
          entering={ZoomIn.springify().damping(springs.bouncy.damping).stiffness(springs.bouncy.stiffness)}
          style={{ alignItems: 'center', paddingTop: 4, paddingBottom: 8 }}
        >
          <View style={{ transform: [{ rotate: '-2deg' }] }}>
            <RecordThumb category={record.category} title={record.title} width={128} showTitle />
          </View>
        </Animated.View>

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
            <HeroAction
              label={isDownloading ? 'Preparing PDF…' : 'Download PDF'}
              icon={<Download size={16} color="#FFFFFF" />}
              onPress={handleDownload}
            />
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
          {record.originalFile ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open original file ${record.originalFile.name}`}
              onPress={async () => {
                try {
                  await Sharing.shareAsync(record.originalFile!.uri, {
                    mimeType: record.originalFile!.mimeType,
                    dialogTitle: record.originalFile!.name,
                  });
                } catch {
                  toast.show('Could not open the original file.', 'warning');
                }
              }}
              className="flex-row items-center gap-3 px-4 py-3"
            >
              <View className="h-9 w-9 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-500/20">
                <FileText size={16} color={accent} />
              </View>
              <Text className="flex-1 font-sans-medium text-[13px] text-ink dark:text-slate-50" numberOfLines={1}>
                {record.originalFile.name}
              </Text>
              <Text className="font-sans-semibold text-[12px] text-brand-500 dark:text-brand-300">Open or save</Text>
            </Pressable>
          ) : (
            <Text className="px-4 py-3 font-sans text-[13px] leading-[19px] text-ink-soft dark:text-slate-300">
              No original file was kept for this record. It was entered by hand, or added before files were stored.
            </Text>
          )}
        </DetailCard>
      </ScreenScroll>

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
