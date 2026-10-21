import { router } from 'expo-router';
import { Bell, Pill } from 'lucide-react-native';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';

import { ChipSelector } from '@/components/onboarding/ChipSelector';
import { ChunkyButton } from '@/components/onboarding/ChunkyButton';
import { Mascot } from '@/components/onboarding/Mascot';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { RewardModal } from '@/components/onboarding/RewardModal';
import { SpeechBubble } from '@/components/onboarding/SpeechBubble';
import type { StampId, UserMedication } from '@/store/useAppStore';
import { useAppStore } from '@/store/useAppStore';

const times: UserMedication['time'][] = ['Morning', 'Afternoon', 'Evening', 'Night'];

export default function MedicationScreen() {
  const addUserMedication = useAppStore((s) => s.addUserMedication);
  const earnStamp = useAppStore((s) => s.earnStamp);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [time, setTime] = useState<UserMedication['time'] | null>(null);
  const [reward, setReward] = useState<StampId | null>(null);

  const ready = name.trim().length > 0 && !!time;
  const next = () => router.push('/(onboarding)/records' as any);

  const handleAdd = () => {
    if (!time) return;
    addUserMedication({ name: name.trim(), dose: dose.trim(), time });
    if (earnStamp('medication')) {
      setReward('medication');
    } else {
      next();
    }
  };

  const previewName = name.trim() || 'Your medicine';
  const previewDose = dose.trim();

  return (
    <OnboardingShell
      footer={
        <>
          <ChunkyButton label="Add medicine" disabled={!ready} onPress={handleAdd} />
          <ChunkyButton variant="ghost" label="Skip, add later" onPress={next} />
        </>
      }
    >
      <View className="gap-6 py-2">
        <View className="items-center gap-4">
          <Mascot mood="calm" size={88} />
          <SpeechBubble>Taking something every day? Add it in ten seconds.</SpeechBubble>
        </View>

        <View className="gap-2">
          <Text className="font-sans-bold text-[16px] text-ink dark:text-slate-50">Medicine name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Metformin"
            placeholderTextColor="#8C98B8"
            autoCapitalize="words"
            className="min-h-[56px] rounded-2xl border-2 border-slate-200 bg-white px-4 font-sans-semibold text-[18px] text-ink dark:border-canvasdark-card dark:bg-canvasdark-card dark:text-slate-50"
            accessibilityLabel="Medicine name"
          />
        </View>

        <View className="gap-2">
          <Text className="font-sans-bold text-[16px] text-ink dark:text-slate-50">Dose</Text>
          <TextInput
            value={dose}
            onChangeText={setDose}
            placeholder="e.g. 500 mg, one tablet"
            placeholderTextColor="#8C98B8"
            className="min-h-[56px] rounded-2xl border-2 border-slate-200 bg-white px-4 font-sans-semibold text-[18px] text-ink dark:border-canvasdark-card dark:bg-canvasdark-card dark:text-slate-50"
            accessibilityLabel="Dose"
          />
        </View>

        <View className="gap-2">
          <Text className="font-sans-bold text-[16px] text-ink dark:text-slate-50">Time of day</Text>
          <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">
            So we know when to remind you. You can change it later.
          </Text>
          <ChipSelector
            options={times}
            selected={time ? [time] : []}
            onChange={(v) => setTime((v[v.length - 1] as UserMedication['time']) ?? null)}
            singleSelect
          />
        </View>

        {/* Reminder preview */}
        <View className="gap-2">
          <Text className="font-sans-semibold text-[12px] uppercase tracking-wide text-ink-muted dark:text-slate-400">
            Reminder preview
          </Text>
          <View className="flex-row items-start gap-3 rounded-3xl bg-white p-4 dark:bg-canvasdark-card" accessibilityLabel={`Preview: reminder for ${previewName}${time ? ` in the ${time.toLowerCase()}` : ''}`}>
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-500/20">
              <Bell size={18} color="#0B2559" />
            </View>
            <View className="flex-1">
              <Text className="font-sans-semibold text-[14px] text-ink dark:text-slate-50">
                Time for {previewName}
                {previewDose ? ` · ${previewDose}` : ''}
              </Text>
              <Text className="mt-0.5 font-sans text-[12px] text-ink-muted dark:text-slate-400">
                {time ? `${time} reminder. Tap to mark it taken.` : 'Pick a time of day to see the reminder.'}
              </Text>
            </View>
            <Pill size={16} color="#16A34A" />
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
