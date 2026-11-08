import { FolderOpen, HeartHandshake, ShieldAlert, Stethoscope } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { ChunkyButton } from '@/components/onboarding/ChunkyButton';
import { Mascot, type MascotMood } from '@/components/onboarding/Mascot';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { OptionCard } from '@/components/onboarding/OptionCard';
import { SpeechBubble } from '@/components/onboarding/SpeechBubble';
import { useAppStore } from '@/store/useAppStore';

const goals = [
  {
    id: 'own',
    title: 'Manage my own health',
    subtitle: 'Track medications, appointments & daily care',
    badge: 'Most Popular',
    icon: Stethoscope,
    reply: 'Great choice. Let’s get your personal health basics in place.',
  },
  {
    id: 'emergency',
    title: 'Prepare for emergencies',
    subtitle: 'Instant ICE card & QR code for paramedics',
    icon: ShieldAlert,
    reply: 'Smart thinking. Paramedics check blood type and allergies first.',
  },
  {
    id: 'records',
    title: 'Keep my records in one place',
    subtitle: 'Scan lab results, scripts & clinic letters',
    icon: FolderOpen,
    reply: 'A tidy clinical vault. No more hunting for paper folders.',
  },
  {
    id: 'family',
    title: 'Care for a family member',
    subtitle: 'Keep their medical details close at hand',
    icon: HeartHandshake,
    reply: 'Thoughtful. We’ll start with the essentials for this passport.',
  },
];

export default function WhyScreen() {
  const draftGoals = useAppStore((s) => s.onboardingDraft.goals);
  const draftGoal = useAppStore((s) => s.onboardingDraft.goal);
  const updateDraft = useAppStore((s) => s.updateOnboardingDraft);
  const [mood, setMood] = useState<MascotMood>('curious');

  const selectedGoals: string[] =
    draftGoals && draftGoals.length > 0
      ? draftGoals
      : draftGoal
        ? [draftGoal]
        : [];

  const toggleGoal = (id: string) => {
    let next: string[];
    if (selectedGoals.includes(id)) {
      next = selectedGoals.filter((g) => g !== id);
    } else {
      next = [...selectedGoals, id];
    }
    updateDraft({
      goals: next,
      goal: next[0] ?? null,
    });

    if (next.includes('emergency')) {
      setMood('cheer');
    } else if (next.length > 1) {
      setMood('cheer');
    } else if (next.length === 1) {
      setMood('calm');
    } else {
      setMood('curious');
    }
  };

  const singleChosen = selectedGoals.length === 1 ? goals.find((g) => g.id === selectedGoals[0]) : null;

  const getSpeechTitle = () => {
    if (selectedGoals.length === 0) return 'What brings you to Siyashesha today?';
    if (selectedGoals.length === 1 && singleChosen) return singleChosen.reply;
    if (selectedGoals.length === goals.length) {
      return 'Complete peace of mind! We’ll configure your full passport, records & emergency card.';
    }
    return 'Great choices! We’ll tailor your health passport to cover all these goals.';
  };

  const getSpeechSubtitle = () => {
    if (selectedGoals.length === 0) return 'Select all that apply — all features remain unlocked.';
    if (selectedGoals.length === 1) return 'Select any other options that apply, or continue below.';
    return `${selectedGoals.length} of ${goals.length} goals selected.`;
  };

  return (
    <OnboardingShell
      step={1}
      totalSteps={8}
      stepLabel="Your Focus"
      footer={
        <ChunkyButton
          label={selectedGoals.length > 1 ? `Continue (${selectedGoals.length} selected)` : 'Continue'}
          disabled={selectedGoals.length === 0}
          onPress={() => router.push('/(onboarding)/profile' as any)}
        />
      }
    >
      <View className="gap-5 py-2">
        <View className="items-center gap-3">
          <Mascot mood={mood} size={84} />
          <SpeechBubble subtitle={getSpeechSubtitle()}>
            {getSpeechTitle()}
          </SpeechBubble>
        </View>

        <View className="gap-3">
          {goals.map((g) => {
            const isSelected = selectedGoals.includes(g.id);
            return (
              <OptionCard
                key={g.id}
                title={g.title}
                subtitle={g.subtitle}
                badge={g.badge}
                icon={<g.icon size={22} color={isSelected ? '#FFFFFF' : '#0B2559'} />}
                selected={isSelected}
                onPress={() => toggleGoal(g.id)}
              />
            );
          })}
        </View>
        <Text className="text-center font-sans text-[12px] text-ink-muted dark:text-slate-400">
          Select all that apply. You can customize your health passport anytime.
        </Text>
      </View>
    </OnboardingShell>
  );
}
