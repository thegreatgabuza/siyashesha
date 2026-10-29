import { router } from 'expo-router';
import { Bell, CalendarCheck, HeartPulse, Pill } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { ChunkyButton } from '@/components/onboarding/ChunkyButton';
import { Mascot } from '@/components/onboarding/Mascot';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SpeechBubble } from '@/components/onboarding/SpeechBubble';
import { ensureNotificationPermission, syncReminders } from '@/lib/reminders';
import { useAppStore } from '@/store/useAppStore';

const benefits = [
  {
    icon: Pill,
    title: 'Timely medication nudges',
    body: 'Actionable reminders at the times you choose — mark taken or snooze 15 mins right from your lock screen.',
  },
  {
    icon: CalendarCheck,
    title: 'Clinic & script refill alerts',
    body: 'Get a helpful heads-up before doctor consultations and monthly chronic prescription repeats.',
  },
  {
    icon: HeartPulse,
    title: 'Calm, spam-free care',
    body: 'Zero marketing spam or guilt notifications. Only the clinical reminders you turn on.',
  },
];

/** Friendly pre-prompt. The system permission dialog only appears after the user says yes here. */
export default function NotificationsScreen() {
  const setNotification = useAppStore((s) => s.setNotification);

  const allowReminders = async () => {
    const granted = await ensureNotificationPermission();
    setNotification('medicationReminders', granted);
    setNotification('wellnessCheckins', granted);
    await syncReminders();
    router.push('/(onboarding)/privacy' as any);
  };

  return (
    <OnboardingShell
      step={6}
      totalSteps={8}
      stepLabel="Smart Reminders"
      footer={
        <>
          <ChunkyButton label="Enable smart reminders" onPress={allowReminders} />
          <ChunkyButton variant="ghost" label="Maybe later" onPress={() => router.push('/(onboarding)/privacy' as any)} />
        </>
      }
    >
      <View className="gap-5 py-2">
        <View className="items-center gap-3">
          <Mascot mood="calm" size={80} />
          <SpeechBubble subtitle="Patients with reminders enabled stay 3x more consistent with their care.">
            Want a gentle nudge for doses and check-ups?
          </SpeechBubble>
        </View>

        <View className="gap-3">
          {benefits.map((b) => (
            <View
              key={b.title}
              className="flex-row items-start gap-3.5 rounded-3xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-canvasdark-card"
            >
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-100/80 dark:bg-brand-500/20">
                <b.icon size={20} color="#0B2559" />
              </View>
              <View className="flex-1">
                <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">{b.title}</Text>
                <Text className="mt-0.5 font-sans text-[13px] leading-[18px] text-ink-muted dark:text-slate-400">
                  {b.body}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View className="flex-row items-center gap-2.5 rounded-2xl bg-slate-100 px-3.5 py-2.5 dark:bg-slate-800/70">
          <Bell size={15} color="#5B6478" />
          <Text className="flex-1 font-sans text-[12px] leading-[17px] text-ink-muted dark:text-slate-400">
            Your phone will ask for permission next. You can customize or mute individual alerts anytime in Settings.
          </Text>
        </View>
      </View>
    </OnboardingShell>
  );
}
