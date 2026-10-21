import dayjs from 'dayjs';
import { router } from 'expo-router';
import {
  Bell,
  BellRing,
  CheckCircle2,
  Circle,
  Clock,
  MessageCircle,
  Pill,
  ScanLine,
  Share2,
  ShieldAlert,
  Upload,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { BrandLockup } from '@/components/ui/BrandLockup';
import { ProgressBar } from '@/components/onboarding/ProgressBar';
import { StampBadge } from '@/components/onboarding/StampBadge';
import { heroShadow } from '@/components/ui/HeroAction';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useToast } from '@/components/ui/Toast';
import { todaysReminders } from '@/data/medications';
import { useI18n } from '@/i18n/useI18n';
import { computeAdherence } from '@/lib/adherence';
import { todayKey } from '@/lib/date';
import { completionPercent, nextBestStep, stampDefs } from '@/lib/passport';
import { useAppStore } from '@/store/useAppStore';
import { useAccent } from '@/hooks/useAccent';

/** The eight quick actions from the features spec. Each one opens an existing screen. */
const quickActions = [
  { label: 'Upload record', icon: Upload, route: '/records/upload' },
  { label: 'Scan document', icon: ScanLine, route: '/records/upload' },
  { label: 'Ask Siyashesha', icon: MessageCircle, route: '/more/assistant' },
  { label: 'View timeline', icon: Clock, route: '/more/timeline' },
  { label: 'Medications', icon: Pill, route: '/more/medications' },
  { label: 'Emergency profile', icon: ShieldAlert, route: '/more/emergency' },
  { label: 'Share records', icon: Share2, route: '/more/sharing' },
  { label: 'Set reminder', icon: BellRing, route: '/more/notifications' },
];

export default function HomeScreen() {
  const { accent, accentSoft } = useAccent();
  const { t } = useI18n();
  const toast = useToast();
  const records = useAppStore((s) => s.records);
  const takenLog = useAppStore((s) => s.takenLog);
  const toggleTaken = useAppStore((s) => s.toggleTaken);
  const auditEvents = useAppStore((s) => s.auditEvents);
  const patient = useAppStore((s) => s.patientProfile);
  // Split the translated greeting around the name so the name alone can be red.
  const hiParts = t('home.hi', { name: '\u0000' }).split('\u0000');

  const dateKey = todayKey();
  const reminders = useMemo(() => todaysReminders(), []);
  const adherence = useMemo(() => computeAdherence(takenLog, 7), [takenLog]);
  const latest = useMemo(
    () => [...records].sort((a, b) => (a.eventDate < b.eventDate ? 1 : -1))[0],
    [records]
  );
  const allergies = patient.allergies.map((a) => a.substance).join(', ') || 'None recorded';

  return (
    <Screen scroll contentClassName="px-5">
      <View className="flex-row items-center justify-between pb-1 pt-3">
        <BrandLockup />
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => router.push('/more/notifications' as any)}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-canvasdark-card"
          >
            <Bell size={18} color="#0B2559" />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/more/profile')}>
            <Avatar name={patient.preferredName} size={40} />
          </Pressable>
        </View>
      </View>

      <View className="pb-5 pt-3">
        <Text className="font-sans text-[14px] text-ink-muted dark:text-slate-400">
          {hiParts[0]}
          <Text className="font-sans-bold text-emergency-500">{patient.preferredName}</Text>
          {hiParts[1]}
        </Text>
        <Text className="font-sans-bold text-[32px] leading-[36px] text-ink dark:text-slate-50">{t('home.welcomeBack')}</Text>
        <Text className="mt-1 font-sans text-[13px] text-ink-muted dark:text-slate-400">{t('home.subtitle')}</Text>
      </View>

      {/* Summary card: identity and total documents */}
      <View className="rounded-[32px] bg-ink p-5 dark:bg-canvasdark-card" style={heroShadow}>
        <View className="flex-row items-center justify-between">
          <Text className="font-sans-semibold text-[15px] text-white">
            {patient.firstName} {patient.lastName}
          </Text>
          <View className="rounded-full bg-white/15 px-3 py-1">
            <Text className="font-sans-semibold text-[11px] text-white">{patient.bloodGroup}</Text>
          </View>
        </View>

        <View className="items-center py-6">
          <Text className="font-sans-bold text-[44px] leading-[48px] text-white">{records.length}</Text>
          <Text className="mt-1 font-sans text-[13px] text-white/60">{t('home.vaultCaption')}</Text>
        </View>

        <View className="flex-row items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
          <Text className="font-sans-medium text-[12px] tracking-wide text-white/80">ID ···{patient.idNumber.slice(-4)}</Text>
          <Text className="font-sans-bold text-[11px] uppercase tracking-[1.5px] text-white/70">Health Passport</Text>
        </View>
      </View>

      {/* Key metrics: adherence is calculated from the taken log, latest encounter from the records */}
      <View className="mt-4 flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`7-day adherence ${adherence.percent} percent`}
          onPress={() => router.push('/more/medications')}
          className="flex-1 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card"
        >
          <Text className="font-sans-medium text-[12px] text-ink-muted dark:text-slate-400">7-day adherence</Text>
          <Text className="mt-2 font-sans-bold text-[30px] text-ink dark:text-slate-50">{adherence.percent}%</Text>
          <Text className="mt-0.5 font-sans text-[11px] text-ink-muted dark:text-slate-500">{adherence.streak}-day streak</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Latest encounter"
          onPress={() => router.push('/records')}
          className="flex-1 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card"
        >
          <Text className="font-sans-medium text-[12px] text-ink-muted dark:text-slate-400">Latest encounter</Text>
          <Text className="mt-2 font-sans-semibold text-[14px] text-ink dark:text-slate-50" numberOfLines={2}>
            {latest ? latest.facility : 'No records yet'}
          </Text>
          <Text className="mt-0.5 font-sans text-[11px] text-ink-muted dark:text-slate-500">
            {latest ? dayjs(latest.eventDate).format('D MMM YYYY') : 'Add a record to start'}
          </Text>
        </Pressable>
      </View>

      {/* Emergency readiness */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Emergency readiness: blood group ${patient.bloodGroup}, allergies ${allergies}`}
        onPress={() => router.push('/more/emergency')}
        className="mt-3 flex-row items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card"
      >
        <View className="h-11 w-11 items-center justify-center rounded-2xl bg-emergency-50 dark:bg-emergency-500/15">
          <ShieldAlert size={20} color="#DC1F26" />
        </View>
        <View className="flex-1">
          <Text className="font-sans-semibold text-[14px] text-ink dark:text-slate-50">Emergency readiness</Text>
          <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400" numberOfLines={2}>
            Blood group {patient.bloodGroup} · Allergies: {allergies}
          </Text>
        </View>
        <Text className="font-sans-semibold text-[12px] text-brand-500 dark:text-brand-300">View</Text>
      </Pressable>

      <PassportCard />

      {/* Quick actions */}
      <View className="pt-7">
        <SectionHeader title="Quick actions" />
        <View className="flex-row flex-wrap gap-3">
          {quickActions.map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={() => router.push(action.route as any)}
              className="w-[30%] flex-grow items-center gap-2 rounded-3xl border border-slate-200 bg-white px-2 py-4 dark:border-canvasdark-card dark:bg-canvasdark-card"
            >
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-500/20">
                <action.icon size={20} color={accent} />
              </View>
              <Text className="text-center font-sans-medium text-[12px] leading-[15px] text-ink dark:text-slate-50">
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Today's reminders */}
      <View className="pt-7">
        <SectionHeader title={t('home.todaysReminders')} action={t('home.seeAll')} onActionPress={() => router.push('/more/medications')} />
        <View className="gap-2.5">
          {reminders.map((reminder) => {
            const logKey = `${reminder.id}__${dateKey}`;
            const taken = !!takenLog[logKey];
            return (
              <Pressable
                key={reminder.id}
                accessibilityRole="button"
                accessibilityLabel={`${reminder.label} at ${reminder.time}, ${taken ? 'taken' : 'not yet taken'}`}
                onPress={() => {
                  toggleTaken(reminder.id, dateKey);
                  if (!taken) toast.show(`${reminder.label} marked as taken`, 'success');
                }}
                className={`min-h-[44px] flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-canvasdark-card dark:bg-canvasdark-card ${
                  taken ? 'opacity-60' : ''
                }`}
              >
                {taken ? <CheckCircle2 size={22} color="#16A34A" /> : <Circle size={22} color={accentSoft} />}
                <View className="flex-1">
                  <Text className="font-sans-semibold text-[14px] text-ink dark:text-slate-50">{reminder.label}</Text>
                  <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">
                    {dayjs(`2000-01-01T${reminder.time}`).format('h:mm A')}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Recent activity */}
      <View className="pt-7">
        <SectionHeader title={t('home.recentActivity')} />
        <View className="gap-2">
          {auditEvents.slice(0, 5).map((event) => (
            <View
              key={event.id}
              className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-canvasdark-card dark:bg-canvasdark-card"
            >
              <View className="h-2 w-2 rounded-full bg-brand-500 dark:bg-brand-400" />
              <View className="flex-1">
                <Text className="font-sans text-[13px] text-ink dark:text-slate-50">{event.description}</Text>
                <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">
                  {dayjs(event.timestamp).format('D MMM, h:mm A')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}

/** Passport progress from the onboarding stamps, with the next best step. */
function PassportCard() {
  const stamps = useAppStore((s) => s.stamps);
  const percent = completionPercent(stamps);
  const next = nextBestStep(stamps);
  return (
    <View className="mt-4 gap-4 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
      <ProgressBar percent={percent} />
      <View className="flex-row justify-between">
        {stampDefs.map((def) => (
          <StampBadge key={def.id} earned={stamps.includes(def.id)} label={def.label} size={58} />
        ))}
      </View>
      {next ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Next step: ${next.nextStep}`}
          onPress={() => router.push(next.nextRoute as any)}
          className="flex-row items-center justify-between rounded-2xl bg-brand-50 px-4 py-3 dark:bg-brand-500/10"
        >
          <View className="flex-1">
            <Text className="font-sans-semibold text-[11px] uppercase tracking-wide text-ink-muted dark:text-slate-400">Next step</Text>
            <Text className="font-sans-semibold text-[14px] text-ink dark:text-slate-50">{next.nextStep}</Text>
          </View>
          <Text className="font-sans-semibold text-[12px] text-brand-500 dark:text-brand-300">Go</Text>
        </Pressable>
      ) : (
        <Text className="font-sans-semibold text-[14px] text-success-600">Every stamp earned. Your passport is complete.</Text>
      )}
    </View>
  );
}
