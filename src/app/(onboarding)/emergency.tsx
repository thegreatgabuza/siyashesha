import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';

import { ChipSelector } from '@/components/onboarding/ChipSelector';
import { ChunkyButton } from '@/components/onboarding/ChunkyButton';
import { Mascot } from '@/components/onboarding/Mascot';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { RewardModal } from '@/components/onboarding/RewardModal';
import { SpeechBubble } from '@/components/onboarding/SpeechBubble';
import type { StampId } from '@/store/useAppStore';
import { useAppStore } from '@/store/useAppStore';

const allergyOptions = ['Penicillin', 'Aspirin', 'Latex', 'Peanuts', 'Shellfish', 'Bee stings', 'Sulfa drugs'];
const conditionOptions = ['Type 2 diabetes', 'High blood pressure', 'Asthma', 'Epilepsy', 'Heart condition'];
const relationships = ['Spouse', 'Parent', 'Child', 'Sibling', 'Friend'];

export default function EmergencyScreen() {
  const draft = useAppStore((s) => s.onboardingDraft);
  const updateDraft = useAppStore((s) => s.updateOnboardingDraft);
  const earnStamp = useAppStore((s) => s.earnStamp);
  const [generating, setGenerating] = useState(false);
  const [reward, setReward] = useState<StampId | null>(null);

  const hasSomething = draft.allergies.length > 0 || draft.conditions.length > 0 || !!draft.contactName.trim();

  // Short "building your card" moment before the stamp lands.
  useEffect(() => {
    if (!generating) return;
    const timer = setTimeout(() => {
      setGenerating(false);
      if (earnStamp('emergency')) {
        setReward('emergency');
      } else {
        router.push('/(onboarding)/medication' as any);
      }
    }, 1400);
    return () => clearTimeout(timer);
  }, [generating, earnStamp]);

  const handleContinue = () => {
    if (hasSomething) {
      setGenerating(true);
    } else {
      router.push('/(onboarding)/medication' as any);
    }
  };

  return (
    <OnboardingShell
      footer={
        <>
          <ChunkyButton label={hasSomething ? 'Generate my emergency card' : 'Continue without these'} onPress={handleContinue} disabled={generating} />
          {!hasSomething ? <Text className="text-center font-sans text-[12px] text-ink-muted dark:text-slate-400">You can add these any time from your profile.</Text> : null}
        </>
      }
    >
      <View className="gap-6 py-2">
        <View className="items-center gap-4">
          <Mascot mood={hasSomething ? 'cheer' : 'calm'} size={88} />
          <SpeechBubble>Paramedics see this first in an emergency.</SpeechBubble>
        </View>

        <Section title="Allergies" why="Medicines and foods that could make you unwell.">
          <ChipSelector
            options={allergyOptions}
            selected={draft.allergies}
            onChange={(v) => updateDraft({ allergies: v })}
            placeholder="Type an allergy"
          />
        </Section>

        <Section title="Long-term conditions" why="Conditions that staff should know about.">
          <ChipSelector
            options={conditionOptions}
            selected={draft.conditions}
            onChange={(v) => updateDraft({ conditions: v })}
            placeholder="Type a condition"
          />
        </Section>

        <Section title="One emergency contact" why="Someone to call. Optional.">
          <Text className="font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">Who are they to you?</Text>
          <ChipSelector
            options={relationships}
            selected={draft.contactRelationship ? [draft.contactRelationship] : []}
            onChange={(v) => updateDraft({ contactRelationship: v[v.length - 1] ?? '' })}
            singleSelect
            addLabel="Other"
            placeholder="Relationship"
          />
          <TextInput
            value={draft.contactName}
            onChangeText={(v) => updateDraft({ contactName: v })}
            placeholder="Their name"
            placeholderTextColor="#8C98B8"
            autoCapitalize="words"
            className="min-h-[52px] rounded-2xl border-2 border-slate-200 bg-white px-4 font-sans-semibold text-[16px] text-ink dark:border-canvasdark-card dark:bg-canvasdark-card dark:text-slate-50"
            accessibilityLabel="Emergency contact name"
          />
          <TextInput
            value={draft.contactPhone}
            onChangeText={(v) => updateDraft({ contactPhone: v })}
            placeholder="Their phone number"
            placeholderTextColor="#8C98B8"
            keyboardType="phone-pad"
            className="min-h-[52px] rounded-2xl border-2 border-slate-200 bg-white px-4 font-sans-semibold text-[16px] text-ink dark:border-canvasdark-card dark:bg-canvasdark-card dark:text-slate-50"
            accessibilityLabel="Emergency contact phone number"
          />
        </Section>

        {generating ? (
          <View className="items-center gap-2 rounded-3xl bg-white p-5 dark:bg-canvasdark-card" accessibilityLiveRegion="polite">
            <ActivityIndicator color="#0B2559" />
            <Text className="font-sans-semibold text-[15px] text-ink dark:text-slate-50">Building your emergency card…</Text>
          </View>
        ) : null}
      </View>

      <RewardModal
        stampId={reward}
        onDone={() => {
          setReward(null);
          router.push('/(onboarding)/medication' as any);
        }}
      />
    </OnboardingShell>
  );
}

function Section({ title, why, children }: { title: string; why: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <View>
        <Text className="font-sans-bold text-[16px] text-ink dark:text-slate-50">{title}</Text>
        <Text className="font-sans text-[12px] leading-[17px] text-ink-muted dark:text-slate-400">{why}</Text>
      </View>
      {children}
    </View>
  );
}
