import { PlatformDatePicker } from '@/components/ui/PlatformDatePicker';
import dayjs from 'dayjs';
import { router } from 'expo-router';
import { Calendar as CalendarIcon, Droplet, User } from 'lucide-react-native';
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
    <OnboardingShell
      step={2}
      totalSteps={8}
      stepLabel="Personal Details"
      footer={<ChunkyButton label="Save & Continue" disabled={!draft.firstName.trim()} onPress={handleContinue} />}
    >
      <View className="gap-5 py-2">
        <View className="items-center gap-3">
          <Mascot mood="calm" size={80} />
          <SpeechBubble subtitle="These details appear on your digital health passport header.">
            {draft.firstName.trim() ? `Nice to meet you, ${draft.firstName.trim()}!` : 'Who does this health passport belong to?'}
          </SpeechBubble>
        </View>

        <View className="gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-canvasdark-card">
          <View className="flex-row items-center gap-2">
            <User size={16} color="#0B2559" />
            <Text className="font-sans-bold text-[13px] uppercase tracking-[0.8px] text-brand-700 dark:text-brand-300">
              Identity
            </Text>
          </View>

          <Field label="First name *" why="Required. Shown on your passport and emergency card.">
            <TextInput
              value={draft.firstName}
              onChangeText={(v) => updateDraft({ firstName: v })}
              placeholder="e.g. Thandi"
              placeholderTextColor="#8C98B8"
              autoCapitalize="words"
              returnKeyType="next"
              className="min-h-[52px] rounded-2xl border-2 border-slate-200 bg-slate-50/70 px-4 font-sans-semibold text-[16px] text-ink dark:border-slate-700 dark:bg-canvasdark dark:text-slate-50"
              accessibilityLabel="First name"
            />
          </Field>

          <Field label="Last name" why="Optional. Helps clinicians match you to your hospital records.">
            <TextInput
              value={draft.lastName}
              onChangeText={(v) => updateDraft({ lastName: v })}
              placeholder="e.g. Nkosi (Optional)"
              placeholderTextColor="#8C98B8"
              autoCapitalize="words"
              returnKeyType="done"
              className="min-h-[52px] rounded-2xl border-2 border-slate-200 bg-slate-50/70 px-4 font-sans-semibold text-[16px] text-ink dark:border-slate-700 dark:bg-canvasdark dark:text-slate-50"
              accessibilityLabel="Last name"
            />
          </Field>

          <Field label="Date of birth" why="Optional. Paramedics and nurses verify age before administering care.">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                draft.dateOfBirth
                  ? `Date of birth ${dayjs(draft.dateOfBirth).format('D MMMM YYYY')}. Change`
                  : 'Select date of birth'
              }
              onPress={() => setShowDate((v) => !v)}
              className="min-h-[52px] flex-row items-center justify-between rounded-2xl border-2 border-slate-200 bg-slate-50/70 px-4 dark:border-slate-700 dark:bg-canvasdark"
            >
              <View className="flex-row items-center gap-3">
                <CalendarIcon size={18} color="#0B2559" />
                <Text
                  className={`font-sans-semibold text-[16px] ${
                    draft.dateOfBirth ? 'text-ink dark:text-slate-50' : 'text-ink-muted dark:text-slate-400'
                  }`}
                >
                  {draft.dateOfBirth ? dayjs(draft.dateOfBirth).format('D MMMM YYYY') : 'Select date of birth'}
                </Text>
              </View>
              <Text className="font-sans-semibold text-[13px] text-brand-600 dark:text-brand-300">
                {draft.dateOfBirth ? 'Edit' : 'Choose'}
              </Text>
            </Pressable>
            <PlatformDatePicker
              visible={showDate}
              value={draft.dateOfBirth ? dayjs(draft.dateOfBirth).toDate() : dayjs('1990-01-01').toDate()}
              mode="date"
              maximumDate={new Date()}
              title="Select Date of Birth"
              onClose={() => setShowDate(false)}
              onChange={(date) => {
                setShowDate(false);
                if (date) updateDraft({ dateOfBirth: dayjs(date).format('YYYY-MM-DD') });
              }}
            />
          </Field>
        </View>

        <View className="gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-canvasdark-card">
          <View className="flex-row items-center gap-2">
            <Droplet size={16} color="#DC1F26" />
            <Text className="font-sans-bold text-[13px] uppercase tracking-[0.8px] text-emergency-500">
              Blood Group
            </Text>
          </View>
          <Text className="font-sans text-[12px] leading-[17px] text-ink-muted dark:text-slate-400">
            First responders check this first in an emergency. Choose &ldquo;Not sure&rdquo; if you need to check later.
          </Text>
          <ChipSelector
            options={bloodTypes}
            selected={draft.bloodGroup ? [draft.bloodGroup] : []}
            onChange={(v) => updateDraft({ bloodGroup: v[v.length - 1] ?? '' })}
            singleSelect
          />
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

function Field({ label, why, children }: { label: string; why: string; children: React.ReactNode }) {
  return (
    <View className="gap-1.5">
      <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">{label}</Text>
      {children}
      <Text className="font-sans text-[12px] leading-[16px] text-ink-muted dark:text-slate-400">{why}</Text>
    </View>
  );
}
