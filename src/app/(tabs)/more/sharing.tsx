import dayjs from 'dayjs';
import { router, useLocalSearchParams } from 'expo-router';
import {
  BookHeart,
  Check,
  ChevronRight,
  FileText,
  ShieldCheck,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Card } from '@/components/ui/Card';
import { HeroAction, heroShadow } from '@/components/ui/HeroAction';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pill } from '@/components/ui/Pill';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useToast } from '@/components/ui/Toast';
import type { MedicalRecord } from '@/data/records';
import { shareDurations, type ShareDuration, type SharedLink } from '@/data/sharing';
import { useAppStore } from '@/store/useAppStore';
import { useAccent } from '@/hooks/useAccent';

const steps = ['Documents', 'Recipient', 'Access', 'Confirm'];

export default function SharingScreen() {
  const { accentSoft } = useAccent();
  const params = useLocalSearchParams<{ recordId?: string }>();
  const toast = useToast();
  const sharedLinks = useAppStore((s) => s.sharedLinks);
  const records = useAppStore((s) => s.records);
  const diaryNotes = useAppStore((s) => s.diaryNotes);
  const createShare = useAppStore((s) => s.createShare);
  const revokeShare = useAppStore((s) => s.revokeShare);

  const [view, setView] = useState<'new' | 'history'>('new');
  const [step, setStep] = useState(0);
  const [selectedRecordIds, setSelectedRecordIds] = useState<string[]>(
    params.recordId ? [params.recordId] : []
  );
  const [selectedDiaryIds, setSelectedDiaryIds] = useState<string[]>([]);
  const [recipientName, setRecipientName] = useState('');
  const [recipientFacility, setRecipientFacility] = useState('');
  const [duration, setDuration] = useState<ShareDuration>(shareDurations[2]);
  const [pin, setPin] = useState(() => String(Math.floor(1000 + Math.random() * 9000)));
  const [completedLink, setCompletedLink] = useState<ReturnType<typeof createShare> | null>(null);

  const resetWizard = () => {
    setStep(0);
    setSelectedRecordIds([]);
    setSelectedDiaryIds([]);
    setRecipientName('');
    setRecipientFacility('');
    setDuration(shareDurations[2]);
    setPin(String(Math.floor(1000 + Math.random() * 9000)));
    setCompletedLink(null);
  };

  const activeLinks = sharedLinks.filter((l) => l.status === 'active').length;

  const toggleRecord = (id: string) =>
    setSelectedRecordIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const toggleDiary = (id: string) =>
    setSelectedDiaryIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  const canAdvance =
    step === 0
      ? selectedRecordIds.length > 0 || selectedDiaryIds.length > 0
      : step === 1
        ? recipientName.trim().length > 0 && recipientFacility.trim().length > 0
        : step === 2
          ? pin.trim().length === 4
          : true;

  const handleConfirm = () => {
    const link = createShare({
      recipientName: recipientName.trim(),
      recipientFacility: recipientFacility.trim(),
      recordIds: selectedRecordIds,
      diaryNoteIds: selectedDiaryIds,
      duration,
      pin: pin.trim(),
    });
    setCompletedLink(link);
    toast.show('Secure share created', 'success');
  };

  if (view === 'history') {
    return (
      <Screen headerOwnsTopInset scroll={false}>
        <ScreenHeader title="Sharing" onBack={() => router.back()} />
        <ShareSummary
          activeCount={activeLinks}
          recordCount={records.length}
          view="history"
          onChange={setView}
        />
        <ScreenScroll className="mt-4 flex-1 px-5">
          {sharedLinks.length === 0 ? (
            <EmptyState icon={<ShieldCheck size={32} color={accentSoft} />} title="No sharing history yet" />
          ) : (
            <View className="gap-3">
              {sharedLinks.map((link) => (
                <Card key={link.id}>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                      <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">
                        {link.recipientName}
                      </Text>
                      <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">
                        {link.recipientFacility}
                      </Text>
                    </View>
                    <StatusBadge status={link.status} />
                  </View>
                  <Text className="mt-2 font-sans text-[12px] text-ink-soft dark:text-slate-300">
                    {link.recordIds.length} record(s)
                    {link.diaryNoteIds.length > 0 ? ` · ${link.diaryNoteIds.length} diary note(s)` : ''}
                  </Text>
                  <Text className="mt-1 font-sans text-[11px] text-ink-muted dark:text-slate-500">
                    Expires {dayjs(link.expiresAt).format('D MMM, h:mm A')}
                  </Text>
                  {link.status === 'active' ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Revoke share with ${link.recipientName}`}
                      onPress={() =>
                        Alert.alert('Revoke access?', `${link.recipientName} will lose access immediately.`, [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Revoke',
                            style: 'destructive',
                            onPress: () => {
                              revokeShare(link.id);
                              toast.show('Access revoked', 'info');
                            },
                          },
                        ])
                      }
                      className="mt-3 min-h-[40px] items-center justify-center self-start rounded-full bg-emergency-50 px-4 dark:bg-emergency-500/15"
                    >
                      <Text className="font-sans-semibold text-[12px] text-emergency-500">Revoke access</Text>
                    </Pressable>
                  ) : null}
                </Card>
              ))}
            </View>
          )}
        </ScreenScroll>
      </Screen>
    );
  }

  return (
    <Screen headerOwnsTopInset scroll={false}>
      <ScreenHeader title="Share Records" onBack={() => router.back()} />
      <ShareSummary activeCount={activeLinks} recordCount={records.length} view="new" onChange={setView} />
      <View className="mt-4 px-5">
        {!completedLink ? (
          <View className="mb-4 flex-row items-center gap-2">
            {steps.map((label, i) => (
              <View key={label} className="flex-1 flex-row items-center">
                <View
                  className={`h-7 w-7 items-center justify-center rounded-full ${
                    i <= step ? 'bg-ink dark:bg-brand-400' : 'bg-slate-200 dark:bg-canvasdark-card'
                  }`}
                >
                  {i < step ? (
                    <Check size={14} color="#FFFFFF" />
                  ) : (
                    <Text className={`font-sans-bold text-[12px] ${i <= step ? 'text-white' : 'text-ink-muted'}`}>
                      {i + 1}
                    </Text>
                  )}
                </View>
                {i < steps.length - 1 ? (
                  <View className={`mx-1 h-0.5 flex-1 ${i < step ? 'bg-ink dark:bg-brand-400' : 'bg-slate-200 dark:bg-canvasdark-card'}`} />
                ) : null}
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <ScreenScroll className="flex-1 px-5">
        {completedLink ? (
          <ConfirmationView link={completedLink} onDone={() => { resetWizard(); setView('history'); }} />
        ) : step === 0 ? (
          <DocumentStep
            selectedRecordIds={selectedRecordIds}
            toggleRecord={toggleRecord}
            selectedDiaryIds={selectedDiaryIds}
            toggleDiary={toggleDiary}
            diaryNotes={diaryNotes}
            records={records}
          />
        ) : step === 1 ? (
          <RecipientStep
            recipientName={recipientName}
            setRecipientName={setRecipientName}
            recipientFacility={recipientFacility}
            setRecipientFacility={setRecipientFacility}
          />
        ) : step === 2 ? (
          <AccessStep duration={duration} setDuration={setDuration} pin={pin} setPin={setPin} />
        ) : (
          <ReviewStep
            recordCount={selectedRecordIds.length}
            diaryCount={selectedDiaryIds.length}
            recipientName={recipientName}
            recipientFacility={recipientFacility}
            duration={duration}
            pin={pin}
          />
        )}

        {!completedLink ? (
          <View className="mt-6 flex-row gap-3">
            {step > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back"
                onPress={() => setStep((s) => s - 1)}
                className="min-h-[52px] flex-1 items-center justify-center rounded-full border border-slate-300 dark:border-canvasdark-card"
              >
                <Text className="font-sans-semibold text-[15px] text-ink dark:text-slate-50">Back</Text>
              </Pressable>
            ) : null}
            <View className="flex-1">
              <PrimaryButton
                label={step === steps.length - 1 ? 'Create secure share' : 'Continue'}
                onPress={() => (step === steps.length - 1 ? handleConfirm() : setStep((s) => s + 1))}
                disabled={!canAdvance}
                icon={step < steps.length - 1 ? <ChevronRight size={16} color="#FFFFFF" /> : undefined}
              />
            </View>
          </View>
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}

function DocumentStep({
  selectedRecordIds,
  toggleRecord,
  selectedDiaryIds,
  toggleDiary,
  diaryNotes,
  records,
}: {
  selectedRecordIds: string[];
  toggleRecord: (id: string) => void;
  selectedDiaryIds: string[];
  toggleDiary: (id: string) => void;
  diaryNotes: { id: string; title: string }[];
  records: MedicalRecord[];
}) {
  const { accent, accentSoft } = useAccent();
  return (
    <View className="gap-2.5">
      <Text className="mb-1 font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">
        Select the documents to share
      </Text>
      {records.map((r) => (
        <CheckRow
          key={r.id}
          selected={selectedRecordIds.includes(r.id)}
          onPress={() => toggleRecord(r.id)}
          icon={<FileText size={16} color={accent} />}
          title={r.title}
          subtitle={`${r.category} · ${dayjs(r.eventDate).format('D MMM YYYY')}`}
        />
      ))}

      <Text className="mb-1 mt-5 font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">
        Diary notes (optional — shown as “Patient-written”)
      </Text>
      {diaryNotes.length === 0 ? (
        <Text className="font-sans text-[13px] text-ink-muted dark:text-slate-500">No diary notes yet.</Text>
      ) : (
        diaryNotes.map((n) => (
          <CheckRow
            key={n.id}
            selected={selectedDiaryIds.includes(n.id)}
            onPress={() => toggleDiary(n.id)}
            icon={<BookHeart size={16} color={accentSoft} />}
            title={n.title}
            subtitle="Patient-written"
          />
        ))
      )}
    </View>
  );
}

function CheckRow({
  selected,
  onPress,
  icon,
  title,
  subtitle,
}: {
  selected: boolean;
  onPress: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={title}
      onPress={onPress}
      className={`flex-row items-center gap-3 rounded-2xl border p-3.5 ${
        selected ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-slate-200 bg-white dark:border-canvasdark-card dark:bg-canvasdark-card'
      }`}
    >
      <View
        className={`h-5 w-5 items-center justify-center rounded-md ${
          selected ? 'bg-brand-500 dark:bg-brand-400' : 'border border-slate-300 dark:border-slate-600'
        }`}
      >
        {selected ? <Check size={12} color="#FFFFFF" /> : null}
      </View>
      {icon}
      <View className="flex-1">
        <Text className="font-sans-medium text-[13px] text-ink dark:text-slate-50" numberOfLines={1}>
          {title}
        </Text>
        <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">{subtitle}</Text>
      </View>
    </Pressable>
  );
}

function RecipientStep({
  recipientName,
  setRecipientName,
  recipientFacility,
  setRecipientFacility,
}: {
  recipientName: string;
  setRecipientName: (v: string) => void;
  recipientFacility: string;
  setRecipientFacility: (v: string) => void;
}) {
  return (
    <View>
      <Text className="mb-1.5 font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">
        Recipient name
      </Text>
      <TextInput
        value={recipientName}
        onChangeText={setRecipientName}
        placeholder="e.g. Dr S. Naidoo"
        placeholderTextColor="#8C98B8"
        className="mb-4 min-h-[44px] rounded-2xl border border-slate-200 bg-white px-4 font-sans text-[14px] text-ink dark:border-canvasdark-card dark:bg-canvasdark-card dark:text-slate-50"
      />
      <Text className="mb-1.5 font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">
        Facility or practice
      </Text>
      <TextInput
        value={recipientFacility}
        onChangeText={setRecipientFacility}
        placeholder="e.g. Milpark Cardiology"
        placeholderTextColor="#8C98B8"
        className="min-h-[44px] rounded-2xl border border-slate-200 bg-white px-4 font-sans text-[14px] text-ink dark:border-canvasdark-card dark:bg-canvasdark-card dark:text-slate-50"
      />
    </View>
  );
}

function AccessStep({
  duration,
  setDuration,
  pin,
  setPin,
}: {
  duration: ShareDuration;
  setDuration: (d: ShareDuration) => void;
  pin: string;
  setPin: (p: string) => void;
}) {
  return (
    <View>
      <Text className="mb-2 font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">
        Access duration
      </Text>
      <View className="mb-5 flex-row flex-wrap gap-2">
        {shareDurations.map((d) => (
          <Pill key={d.id} label={d.label} selected={duration.id === d.id} onPress={() => setDuration(d)} />
        ))}
      </View>
      <Text className="mb-1.5 font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">
        Temporary access PIN
      </Text>
      <TextInput
        value={pin}
        onChangeText={(v) => setPin(v.replace(/[^0-9]/g, '').slice(0, 4))}
        keyboardType="number-pad"
        maxLength={4}
        placeholder="4-digit PIN"
        placeholderTextColor="#8C98B8"
        className="min-h-[44px] rounded-2xl border border-slate-200 bg-white px-4 font-sans text-[16px] tracking-[4px] text-ink dark:border-canvasdark-card dark:bg-canvasdark-card dark:text-slate-50"
      />
      <Text className="mt-2 font-sans text-[11px] text-ink-muted dark:text-slate-500">
        Share this PIN with the recipient separately so they can open the link.
      </Text>
    </View>
  );
}

function ReviewStep({
  recordCount,
  diaryCount,
  recipientName,
  recipientFacility,
  duration,
  pin,
}: {
  recordCount: number;
  diaryCount: number;
  recipientName: string;
  recipientFacility: string;
  duration: ShareDuration;
  pin: string;
}) {
  return (
    <Card>
      <Text className="mb-3 font-sans-bold text-[15px] text-ink dark:text-slate-50">Review before sending</Text>
      <ReviewRow label="Documents" value={`${recordCount} record(s)${diaryCount ? `, ${diaryCount} diary note(s)` : ''}`} />
      <ReviewRow label="Recipient" value={`${recipientName} · ${recipientFacility}`} />
      <ReviewRow label="Access" value={duration.label} />
      <ReviewRow label="PIN" value={pin} />
    </Card>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between border-t border-slate-100 py-2.5 dark:border-canvasdark-card">
      <Text className="font-sans text-[13px] text-ink-muted dark:text-slate-400">{label}</Text>
      <Text className="flex-1 pl-3 text-right font-sans-semibold text-[13px] text-ink dark:text-slate-50">
        {value}
      </Text>
    </View>
  );
}

function ConfirmationView({ link, onDone }: { link: SharedLink; onDone: () => void }) {
  const url = `siyashesha://share/${link.id}`;
  return (
    <View className="items-center">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-success-50 dark:bg-success-500/15">
        <ShieldCheck size={30} color="#16A34A" />
      </View>
      <Text className="mb-1 font-sans-bold text-[18px] text-ink dark:text-slate-50">Secure share created</Text>
      <Text className="mb-5 text-center font-sans text-[13px] text-ink-muted dark:text-slate-400">
        {link.recipientName} can access these records until {dayjs(link.expiresAt).format('D MMM, h:mm A')}.
      </Text>
      <View className="mb-5 items-center rounded-2xl bg-white p-3 dark:bg-canvasdark-card">
        <QRCode value={url} size={140} color="#0B2559" backgroundColor="#FFFFFF" />
      </View>
      <Text className="mb-6 font-sans text-[12px] text-ink-muted dark:text-slate-400">
        Access PIN: <Text className="font-sans-bold text-ink dark:text-slate-50">{link.pin}</Text>
      </Text>
      <PrimaryButton label="Done" onPress={onDone} />
    </View>
  );
}

function ShareSummary({
  activeCount,
  recordCount,
  view,
  onChange,
}: {
  activeCount: number;
  recordCount: number;
  view: 'new' | 'history';
  onChange: (v: 'new' | 'history') => void;
}) {
  return (
    <View className="mx-5 rounded-[32px] bg-ink p-5 dark:bg-canvasdark-card" style={heroShadow}>
      <View className="flex-row items-center justify-between">
        <Text className="font-sans-semibold text-[13px] text-white/70">Active shares</Text>
        <View className="rounded-full bg-white/15 px-3 py-1">
          <Text className="font-sans-semibold text-[11px] text-white">{view === 'new' ? 'New share' : 'History'}</Text>
        </View>
      </View>
      <View className="items-center py-5">
        <Text className="font-sans-bold text-[44px] leading-[48px] text-white">{activeCount}</Text>
        <Text className="mt-1 font-sans text-[13px] text-white/60">
          {recordCount} {recordCount === 1 ? 'record' : 'records'} in your vault available to share
        </Text>
      </View>
      <View className="flex-row items-center gap-2">
        <HeroAction label="New share" icon={<ShieldCheck size={16} color="#FFFFFF" />} onPress={() => onChange('new')} />
        <HeroAction label="History" icon={<FileText size={16} color="#FFFFFF" />} onPress={() => onChange('history')} />
      </View>
    </View>
  );
}

function StatusBadge({ status }: { status: 'active' | 'expired' | 'revoked' }) {
  const bg =
    status === 'active'
      ? 'bg-success-50 dark:bg-success-500/15'
      : status === 'revoked'
        ? 'bg-emergency-50 dark:bg-emergency-500/15'
        : 'bg-slate-100 dark:bg-canvasdark-card';
  const text =
    status === 'active' ? 'text-success-600' : status === 'revoked' ? 'text-emergency-500' : 'text-ink-muted';
  return (
    <View className={`rounded-full px-2.5 py-1 ${bg}`}>
      <Text className={`font-sans-semibold text-[10px] uppercase ${text}`}>{status}</Text>
    </View>
  );
}
