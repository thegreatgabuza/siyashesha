import dayjs from 'dayjs';
import { router } from 'expo-router';
import { Flame } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Switch, Text, View } from 'react-native';

import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { heroShadow } from '@/components/ui/HeroAction';
import { activeMedications, pastMedications } from '@/data/medications';
import { syncReminders } from '@/lib/reminders';
import { computeAdherence } from '@/lib/adherence';
import { useAppStore } from '@/store/useAppStore';

export default function MedicationsScreen() {
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const takenLog = useAppStore((s) => s.takenLog);
  const reminderEnabled = useAppStore((s) => s.medicationReminderEnabled);
  const setReminderEnabled = useAppStore((s) => s.setMedicationReminderEnabled);

  const adherence = useMemo(() => computeAdherence(takenLog, 7), [takenLog]);
  const userMedications = useAppStore((s) => s.userMedications);
  const remindersOn = activeMedications.filter((m) => reminderEnabled[m.id] ?? true).length;

  return (
    <Screen headerOwnsTopInset scroll={false}>
      <ScreenHeader title="Medications" onBack={() => router.back()} />
      <ScreenScroll className="flex-1 px-5">
        <View className="mb-5 rounded-[32px] bg-ink p-5 dark:bg-canvasdark-card" style={heroShadow}>
          <View className="flex-row items-center justify-between">
            <Text className="font-sans-semibold text-[13px] text-white/70">Adherence · last 7 days</Text>
            <View className="flex-row items-center gap-1.5 rounded-full bg-white/15 px-3 py-1">
              <Flame size={12} color="#FFFFFF" />
              <Text className="font-sans-semibold text-[11px] text-white">{adherence.streak}-day streak</Text>
            </View>
          </View>
          <View className="items-center py-5">
            <Text className="font-sans-bold text-[44px] leading-[48px] text-white">{adherence.percent}%</Text>
            <Text className="mt-1 font-sans text-[13px] text-white/60">of scheduled doses taken</Text>
          </View>
          <View className="flex-row rounded-2xl bg-white/10 px-4 py-3">
            <View className="flex-1">
              <Text className="font-sans text-[11px] text-white/60">Active</Text>
              <Text className="font-sans-bold text-[16px] text-white">{activeMedications.length}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-sans text-[11px] text-white/60">Past</Text>
              <Text className="font-sans-bold text-[16px] text-white">{pastMedications.length}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-sans text-[11px] text-white/60">Reminders on</Text>
              <Text className="font-sans-bold text-[16px] text-white">{remindersOn}</Text>
            </View>
          </View>
        </View>

        <View className="mb-4 flex-row gap-2">
          <Pill label={`Active (${activeMedications.length})`} selected={tab === 'active'} onPress={() => setTab('active')} />
          <Pill label={`Past (${pastMedications.length})`} selected={tab === 'past'} onPress={() => setTab('past')} />
        </View>

        {tab === 'active' ? (
          <View className="gap-3">
            {userMedications.map((med) => (
              <View key={med.id} className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
                <Text className="font-sans-bold text-[16px] text-ink dark:text-slate-50">
                  {med.name} {med.dose}
                </Text>
                <Text className="mt-0.5 font-sans text-[12px] text-ink-muted dark:text-slate-400">{med.time} · added by you</Text>
              </View>
            ))}
            {activeMedications.map((med) => (
              <View
                key={med.id}
                className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card"
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="font-sans-bold text-[16px] text-ink dark:text-slate-50">
                      {med.name} {med.strength}
                    </Text>
                    <Text className="mt-0.5 font-sans text-[12px] text-ink-muted dark:text-slate-400">
                      {med.indication} · {med.route}, {med.frequency}
                    </Text>
                  </View>
                  <Switch
                thumbColor="#FFFFFF"
                    value={reminderEnabled[med.id] ?? true}
                    onValueChange={(v) => {
                      setReminderEnabled(med.id, v);
                      syncReminders();
                    }}
                    trackColor={{ true: '#16A34A', false: '#E3E8F0' }}
                    accessibilityLabel={`Reminders for ${med.name}`}
                  />
                </View>
                <View className="mt-3 rounded-2xl bg-slate-50 px-3 py-2.5 dark:bg-canvasdark">
                  <Text className="font-sans-medium text-[13px] text-ink-soft dark:text-slate-200">
                    {med.directions}
                  </Text>
                  <Text className="mt-0.5 font-sans text-[11px] text-ink-muted dark:text-slate-500">
                    {med.times.map((t) => dayjs(`2000-01-01T${t}`).format('h:mm A')).join(' · ')}
                  </Text>
                </View>
                <Text className="mt-2 font-sans text-[11px] text-ink-muted dark:text-slate-500">
                  {med.prescriber} · {med.facility} ({med.provenance})
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <View className="gap-3">
            {pastMedications.map((med) => (
              <View
                key={med.id}
                className="rounded-3xl border border-slate-200 bg-slate-50 p-4 opacity-80 dark:border-canvasdark-card dark:bg-canvasdark-card"
              >
                <Text className="font-sans-bold text-[16px] text-ink dark:text-slate-50">
                  {med.name} {med.strength}
                </Text>
                <Text className="mt-0.5 font-sans text-[12px] text-ink-muted dark:text-slate-400">
                  {med.indication} · {dayjs(med.startDate).format('MMM YYYY')} –{' '}
                  {med.endDate ? dayjs(med.endDate).format('MMM YYYY') : 'Discontinued'}
                </Text>
                {med.note ? (
                  <Text className="mt-2 font-sans text-[12px] text-ink-soft dark:text-slate-300">
                    {med.note}
                  </Text>
                ) : null}
                <Text className="mt-2 font-sans text-[11px] text-ink-muted dark:text-slate-500">
                  {med.prescriber} · {med.facility} ({med.provenance})
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScreenScroll>
    </Screen>
  );
}
