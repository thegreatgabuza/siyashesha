import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { router } from 'expo-router';
import { Calendar as CalendarIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { ChipSelector } from '@/components/onboarding/ChipSelector';
import { ChunkyButton } from '@/components/onboarding/ChunkyButton';
import { Mascot } from '@/components/onboarding/Mascot';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { RewardModal } from '@/components/onboarding/RewardModal';
import { SpeechBubble } from '@/components/onboarding/SpeechBubble';
import type { StampId } from '@/store/useAppStore';
import { useAppStore } from '@/store/useAppStore';

const bloodTypes = ['A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−', 'Not sure'];

export default function ProfileScreen() {
  const draft = useAppStore((s) => s.onboardingDraft);
  const updateDraft = useAppStore((s) => s.updateOnboardingDraft);
  const earnStamp = useAppStore((s) => s.earnStamp);
  const [showDate, setShowDate] = useState(false);
  const [reward, setReward] = useState<StampId | null>(null);

  const next = () => router.push('/(onboarding)/emergency' as any);

  const handleContinue = () => {
    if (earnStamp('profile')) {
      setReward('profile');
    } else {
      next();
    }
  };

  return (
    <OnboardingShell footer={<ChunkyButton label="Continue" disabled={!draft.firstName.trim()} onPress={handleContinue} />}>
      <View className="gap-6 py-2">
        <View className="items-center gap-4">
          <Mascot mood="calm" size={88} />
          <SpeechBubble>What should we call you?</SpeechBubble>
        </View>

        <Field label="First name" why="This is the name on your passport.">
          <TextInput
            value={draft.firstName}
            onChangeText={(v) => updateDraft({ firstName: v })}
            placeholder="e.g. Thandi"
            placeholderTextColor="#8C98B8"
            autoCapitalize="words"
            returnKeyType="next"
            className="min-h-[56px] rounded-2xl border-2 border-slate-200 bg-white px-4 font-sans-semibold text-[18px] text-ink dark:border-canvasdark-card dark:bg-canvasdark-card dark:text-slate-50"
            accessibilityLabel="First name"
          />
        </Field>

        <Field label="Last name" why="Optional. Helps staff match you to your records.">
          <TextInput
            value={draft.lastName}
            onChangeText={(v) => updateDraft({ lastName: v })}
            placeholder="Optional"
            placeholderTextColor="#8C98B8"
            autoCapitalize="words"
            className="min-h-[56px] rounded-2xl border-2 border-slate-200 bg-white px-4 font-sans-semibold text-[18px] text-ink dark:border-canvasdark-card dark:bg-canvasdark-card dark:text-slate-50"
            accessibilityLabel="Last name"
          />
        </Field>

        <Field label="Date of birth" why="Optional. Staff confirm your age before they act on your details.">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={draft.dateOfBirth ? `Date of birth ${dayjs(draft.dateOfBirth).format('D MMMM YYYY')}. Change` : 'Add date of birth'}
            onPress={() => setShowDate(true)}
            className="min-h-[56px] flex-row items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white px-4 dark:border-canvasdark-card dark:bg-canvasdark-card"
          >
            <CalendarIcon size={20} color="#0B2559" />
            <Text className="font-sans-semibold text-[18px] text-ink dark:text-slate-50">
              {draft.dateOfBirth ? dayjs(draft.dateOfBirth).format('D MMMM YYYY') : 'Add date of birth'}
            </Text>
          </Pressable>
          {showDate ? (
            <DateTimePicker
              value={draft.dateOfBirth ? dayjs(draft.dateOfBirth).toDate() : dayjs('1980-01-01').toDate()}
              mode="date"
              maximumDate={new Date()}
              onChange={(_, date) => {
                setShowDate(false);
                if (date) updateDraft({ dateOfBirth: dayjs(date).format('YYYY-MM-DD') });
              }}
            />
          ) : null}
        </Field>

        <Field label="Blood type" why="Paramedics check this first in an emergency. Optional.">
          <ChipSelector
            options={bloodTypes}
            selected={draft.bloodGroup ? [draft.bloodGroup] : []}
            onChange={(v) => updateDraft({ bloodGroup: v[v.length - 1] ?? '' })}
            singleSelect
          />
        </Field>
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

function Field({ label, why, children }: { label: string; why: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="font-sans-bold text-[16px] text-ink dark:text-slate-50">{label}</Text>
      {children}
      <Text className="font-sans text-[12px] leading-[17px] text-ink-muted dark:text-slate-400">{why}</Text>
    </View>
  );
}
