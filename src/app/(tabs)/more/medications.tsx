import dayjs from 'dayjs';
import { router } from 'expo-router';
import { Flame } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { ScrollView, Switch, Text, View } from 'react-native';

import { AdherenceRing } from '@/components/AdherenceRing';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { activeMedications, pastMedications } from '@/data/medications';
import { computeAdherence } from '@/lib/adherence';
import { useAppStore } from '@/store/useAppStore';

export default function MedicationsScreen() {
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const takenLog = useAppStore((s) => s.takenLog);
  const reminderEnabled = useAppStore((s) => s.medicationReminderEnabled);
  const setReminderEnabled = useAppStore((s) => s.setMedicationReminderEnabled);

  const adherence = useMemo(() => computeAdherence(takenLog, 7), [takenLog]);

  return (
    <Screen bottomInset={120}>
      <ScreenHeader title="Medications" onBack={() => router.back()} />
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="mb-5 flex-row items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
          <AdherenceRing percent={adherence.percent} />
          <View className="flex-1">
            <Text className="font-sans-semibold text-[14px] text-ink dark:text-slate-50">
              7-day adherence
            </Text>
            <View className="mt-1 flex-row items-center gap-1.5">
              <Flame size={14} color="#DC2626" />
              <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">
                {adherence.streak}-day streak of taking every dose
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-4 flex-row gap-2">
          <Pill label={`Active (${activeMedications.length})`} selected={tab === 'active'} onPress={() => setTab('active')} />
          <Pill label={`Past (${pastMedications.length})`} selected={tab === 'past'} onPress={() => setTab('past')} />
        </View>

        {tab === 'active' ? (
          <View className="gap-3">
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
                    value={reminderEnabled[med.id] ?? true}
                    onValueChange={(v) => setReminderEnabled(med.id, v)}
                    trackColor={{ true: '#0D9488', false: '#E3E8F0' }}
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
      </ScrollView>
    </Screen>
  );
}
