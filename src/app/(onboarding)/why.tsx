import { HeartHandshake, FolderOpen, Stethoscope, ShieldAlert } from 'lucide-react-native';
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
  { id: 'own', title: 'Manage my own health', subtitle: 'Keep track of my care day to day', icon: Stethoscope, reply: 'Great. Let’s get your basics in place.' },
  { id: 'family', title: 'Care for a family member', subtitle: 'Keep their details close at hand', icon: HeartHandshake, reply: 'Thoughtful. We’ll start with the basics for this passport.' },
  { id: 'records', title: 'Keep my records in one place', subtitle: 'Stop hunting for old documents', icon: FolderOpen, reply: 'A tidy vault. Let’s make it useful.' },
  { id: 'emergency', title: 'Prepare for emergencies', subtitle: 'Have key details ready to show', icon: ShieldAlert, reply: 'Smart thinking. Emergency details come first.' },
];

export default function WhyScreen() {
  const goal = useAppStore((s) => s.onboardingDraft.goal);
  const updateDraft = useAppStore((s) => s.updateOnboardingDraft);
  const [mood, setMood] = useState<MascotMood>('curious');

  const chosen = goals.find((g) => g.id === goal);

  return (
    <OnboardingShell
      footer={<ChunkyButton label="Continue" disabled={!goal} onPress={() => router.push('/(onboarding)/profile' as any)} />}
    >
      <View className="gap-5 py-2">
        <View className="items-center gap-4">
          <Mascot mood={mood} size={96} />
          <SpeechBubble>{chosen ? chosen.reply : 'Why are you here today?'}</SpeechBubble>
        </View>

        <View className="gap-3" accessibilityRole="radiogroup">
          {goals.map((g) => (
            <OptionCard
              key={g.id}
              title={g.title}
              subtitle={g.subtitle}
              icon={<g.icon size={24} color={goal === g.id ? '#FFFFFF' : '#0B2559'} />}
              selected={goal === g.id}
              onPress={() => {
                updateDraft({ goal: g.id });
                setMood(g.id === 'emergency' ? 'cheer' : 'calm');
              }}
            />
          ))}
        </View>
        <Text className="text-center font-sans text-[12px] text-ink-muted dark:text-slate-400">
          This only shapes the next few questions. You can change anything later.
        </Text>
      </View>
    </OnboardingShell>
  );
}
