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
  const goal = useAppStore((s) => s.onboardingDraft.goal);
  const updateDraft = useAppStore((s) => s.updateOnboardingDraft);
  const [mood, setMood] = useState<MascotMood>('curious');

  const chosen = goals.find((g) => g.id === goal);

  return (
    <OnboardingShell
      step={1}
      totalSteps={8}
      stepLabel="Your Focus"
      footer={
        <ChunkyButton
          label="Continue"
          disabled={!goal}
          onPress={() => router.push('/(onboarding)/profile' as any)}
        />
      }
    >
      <View className="gap-5 py-2">
        <View className="items-center gap-3">
          <Mascot mood={mood} size={84} />
          <SpeechBubble subtitle="Pick your primary focus — all features remain unlocked.">
            {chosen ? chosen.reply : 'What brings you to Siyashesha today?'}
          </SpeechBubble>
        </View>

        <View className="gap-3" accessibilityRole="radiogroup">
          {goals.map((g) => (
            <OptionCard
              key={g.id}
              title={g.title}
              subtitle={g.subtitle}
              badge={g.badge}
              icon={<g.icon size={22} color={goal === g.id ? '#FFFFFF' : '#0B2559'} />}
              selected={goal === g.id}
              onPress={() => {
                updateDraft({ goal: g.id });
                setMood(g.id === 'emergency' ? 'cheer' : 'calm');
              }}
            />
          ))}
        </View>
        <Text className="text-center font-sans text-[12px] text-ink-muted dark:text-slate-400">
          This helps tailor your setup steps. You can customize everything later.
        </Text>
      </View>
    </OnboardingShell>
  );
}
