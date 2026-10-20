import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  Bell,
  CheckCircle2,
  Circle,
  Plus,
  Share2,
  Siren,
  Upload,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useToast } from '@/components/ui/Toast';
import { healthDayIcons } from '@/lib/healthDayIcons';
import { nextAppointment } from '@/data/appointments';
import { activeMedications, todaysReminders } from '@/data/medications';
import { getNextHealthDay, isHealthDayToday } from '@/data/healthDays';
import { useI18n } from '@/i18n/useI18n';
import { formatDayMonth, todayKey } from '@/lib/date';
import { useAppStore } from '@/store/useAppStore';

const avatarTints = ['#6D5BD0', '#0D9488', '#DC2626', '#A58FE6'];

export default function HomeScreen() {
  const { t } = useI18n();
  const toast = useToast();
  const records = useAppStore((s) => s.records);
  const takenLog = useAppStore((s) => s.takenLog);
  const toggleTaken = useAppStore((s) => s.toggleTaken);
  const auditEvents = useAppStore((s) => s.auditEvents);
  const patient = useAppStore((s) => s.patientProfile);

  const dateKey = todayKey();
  const reminders = useMemo(() => todaysReminders(), []);
  const appt = useMemo(() => nextAppointment(), []);
  const healthDay = useMemo(() => {
    const todays = getNextHealthDay();
    return { card: todays, isToday: isHealthDayToday(todays) };
  }, []);
  const careTeam = useMemo(() => {
    const names = records.map((r) => r.doctor).filter((d): d is string => !!d);
    return Array.from(new Set(names)).slice(0, 3);
  }, [records]);

  return (
    <Screen scroll contentClassName="px-5">
      <View className="flex-row items-center justify-between pb-1 pt-3">
        <Text className="font-sans-bold text-[13px] uppercase tracking-[2px] text-ink-muted dark:text-slate-400">
          Siyashesha
        </Text>
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => router.push('/more/settings')}
            className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-canvasdark-card"
          >
            <Bell size={18} color="#0B1E40" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            onPress={() => router.push('/more/profile')}
          >
            <Avatar name={patient.preferredName} size={40} />
          </Pressable>
        </View>
      </View>

      <View className="pb-5 pt-3">
        <Text className="font-sans text-[14px] text-ink-muted dark:text-slate-400">
          {t('home.hi', { name: patient.preferredName })}
        </Text>
        <Text className="font-serif text-[32px] leading-[36px] text-ink dark:text-slate-50">
          {t('home.welcomeBack')}
        </Text>
        <Text className="mt-1 font-sans text-[13px] text-ink-muted dark:text-slate-400">
          {t('home.subtitle')}
        </Text>
      </View>

      {/* Hero card */}
      <View className="rounded-[32px] bg-ink p-5 dark:bg-canvasdark-card" style={heroShadow}>
        <View className="flex-row items-center justify-between">
          <Text className="font-sans-semibold text-[15px] text-white">
            {patient.firstName} {patient.lastName}
          </Text>
          <View className="rounded-full bg-white/15 px-3 py-1">
            <Text className="font-sans-semibold text-[11px] text-white">{patient.bloodGroup}</Text>
          </View>
        </View>

        {/* Decorative ID strip */}
        <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
          <View className="flex-row items-center gap-1.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} className="h-1.5 w-1.5 rounded-full bg-white/50" />
            ))}
            <Text className="ml-1 font-sans-medium text-[12px] tracking-wide text-white/80">
              {patient.idNumber.slice(-4)}
            </Text>
          </View>
          <Text className="font-sans-bold text-[11px] uppercase tracking-[1.5px] text-white/70">
            Health Passport
          </Text>
        </View>

        <View className="items-center py-7">
          <Text className="font-sans-bold text-[44px] leading-[48px] text-white">
            {records.length}
          </Text>
          <Text className="mt-1 font-sans text-[13px] text-white/60">{t('home.vaultCaption')}</Text>
        </View>

        <View className="flex-row items-center gap-2">
          <HeroAction
            label={t('home.upload')}
            icon={<Upload size={16} color="#FFFFFF" />}
            onPress={() => router.push('/records/upload')}
          />
          <HeroAction
            label={t('home.share')}
            icon={<Share2 size={16} color="#FFFFFF" />}
            onPress={() => router.push('/more/sharing')}
          />
          <HeroAction
            label={t('home.emergency')}
            icon={<Siren size={16} color="#FFFFFF" />}
            onPress={() => router.push('/more/emergency')}
            filled
          />
        </View>
      </View>

      {/* Stat row */}
      <View className="mt-4 flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('home.activeMedications')}: ${activeMedications.length}`}
          onPress={() => router.push('/more/medications')}
          className="flex-1 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card"
        >
          <View className="flex-row items-center justify-between">
            <Text className="font-sans-medium text-[12px] text-ink-muted dark:text-slate-400">
              {t('home.activeMedications')}
            </Text>
            <View className="rounded-full bg-success-50 px-2 py-0.5 dark:bg-success-500/15">
              <Text className="font-sans-semibold text-[10px] text-success-600">On track</Text>
            </View>
          </View>
          <Text className="mt-2 font-sans-bold text-[30px] text-ink dark:text-slate-50">
            {activeMedications.length}
          </Text>
          <Text className="mt-0.5 font-sans text-[11px] text-ink-muted dark:text-slate-500">
            {t('home.onSchedule')}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('home.careTeam')}
          onPress={() => router.push('/records')}
          className="flex-1 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card"
        >
          <Text className="font-sans-medium text-[12px] text-ink-muted dark:text-slate-400">
            {t('home.careTeam')}
          </Text>
          <View className="mt-3 flex-row items-center">
            {careTeam.map((name, i) => (
              <View key={name} style={{ marginLeft: i === 0 ? 0 : -10 }}>
                <View
                  className="h-9 w-9 items-center justify-center rounded-full border-2 border-white dark:border-canvasdark-card"
                  style={{ backgroundColor: avatarTints[i % avatarTints.length] }}
                >
                  <Text className="font-sans-bold text-[11px] text-white">
                    {name
                      .replace('Dr ', '')
                      .replace('Sr ', '')
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)}
                  </Text>
                </View>
              </View>
            ))}
            <View
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-canvasdark"
              style={{ marginLeft: careTeam.length ? -10 : 0 }}
            >
              <Plus size={14} color="#5B6B8A" />
            </View>
          </View>
          <Text className="mt-2 font-sans text-[11px] text-ink-muted dark:text-slate-500" numberOfLines={1}>
            {appt ? `${t('home.nextAppointment')} · ${formatDayMonth(appt.date)}` : 'No upcoming visits'}
          </Text>
        </Pressable>
      </View>

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
                {taken ? (
                  <CheckCircle2 size={22} color="#0D9488" />
                ) : (
                  <Circle size={22} color="#C3B6F0" />
                )}
                <View className="flex-1">
                  <Text className="font-sans-semibold text-[14px] text-ink dark:text-slate-50">
                    {reminder.label}
                  </Text>
                  <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">
                    {dayjs(`2000-01-01T${reminder.time}`).format('h:mm A')}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="pt-7">
        <SectionHeader title={healthDay.isToday ? t('home.healthDayToday') : t('home.healthDayUpcoming')} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={healthDay.card.title}
          onPress={() => router.push(`/calendar/${healthDay.card.id}`)}
          className="flex-row items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card"
        >
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-lavender-100 dark:bg-brand-500/20">
            <View style={{ width: 40, height: 40 }}>
              <HealthDayThumb icon={healthDay.card.icon} />
            </View>
          </View>
          <View className="flex-1">
            <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">
              {healthDay.card.dateLabel}
            </Text>
            <Text className="font-sans-semibold text-[15px] text-ink dark:text-slate-50" numberOfLines={2}>
              {healthDay.card.title}
            </Text>
          </View>
        </Pressable>
      </View>

      <View className="pt-7">
        <SectionHeader title={t('home.recentActivity')} />
        <View className="gap-2">
          {auditEvents.slice(0, 5).map((event) => (
            <View
              key={event.id}
              className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-canvasdark-card dark:bg-canvasdark-card"
            >
              <View className="h-2 w-2 rounded-full bg-brand-500" />
              <View className="flex-1">
                <Text className="font-sans text-[13px] text-ink dark:text-slate-50">
                  {event.description}
                </Text>
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

function HeroAction({
  label,
  icon,
  onPress,
  filled,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  filled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`min-h-[44px] flex-1 flex-row items-center justify-center gap-1.5 rounded-full px-3 py-3 ${
        filled ? 'bg-emergency-500' : 'border border-white/30 bg-white/5'
      }`}
    >
      {icon}
      <Text className="font-sans-semibold text-[13px] text-white">{label}</Text>
    </Pressable>
  );
}

function HealthDayThumb({ icon }: { icon: string }) {
  return <Image source={healthDayIcons[icon]} style={{ width: 40, height: 40 }} contentFit="contain" />;
}

const heroShadow = {
  shadowColor: '#0B1E40',
  shadowOpacity: 0.25,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 12 },
  elevation: 8,
};
