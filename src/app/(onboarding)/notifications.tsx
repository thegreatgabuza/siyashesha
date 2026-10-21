import { router } from 'expo-router';
import { CalendarCheck, Bell, Pill } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { ChunkyButton } from '@/components/onboarding/ChunkyButton';
import { Mascot } from '@/components/onboarding/Mascot';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SpeechBubble } from '@/components/onboarding/SpeechBubble';
import { useAppStore } from '@/store/useAppStore';
import { ensureNotificationPermission, syncMedicationReminders } from '@/lib/reminders';

const benefits = [
  { icon: Pill, title: 'Medication reminders', body: 'A gentle nudge at the times you chose. Never a guilt message.' },
  { icon: CalendarCheck, title: 'Check-up reminders', body: 'Heads-up before appointments and refills.' },
];

/** Friendly pre-prompt. The system permission dialog only appears after the user says yes here. */
export default function NotificationsScreen() {
  const setNotification = useAppStore((s) => s.setNotification);

  const allowReminders = async () => {
    const granted = await ensureNotificationPermission();
    setNotification('medicationReminders', granted);
    setNotification('wellnessCheckins', granted);
    await syncMedicationReminders();
    router.push('/(onboarding)/privacy' as any);
  };

  return (
    <OnboardingShell
      footer={
        <>
          <ChunkyButton label="Turn on reminders" onPress={allowReminders} />
          <ChunkyButton variant="ghost" label="Not now" onPress={() => router.push('/(onboarding)/privacy' as any)} />
        </>
      }
    >
      <View className="gap-6 py-2">
        <View className="items-center gap-4">
          <Mascot mood="calm" size={88} />
          <SpeechBubble>Want a little help remembering?</SpeechBubble>
        </View>

        <View className="gap-3">
          {benefits.map((b) => (
            <View key={b.title} className="flex-row items-start gap-4 rounded-3xl bg-white p-4 dark:bg-canvasdark-card">
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-500/20">
                <b.icon size={20} color="#0B2559" />
              </View>
              <View className="flex-1">
                <Text className="font-sans-bold text-[16px] text-ink dark:text-slate-50">{b.title}</Text>
                <Text className="mt-0.5 font-sans text-[13px] leading-[18px] text-ink-muted dark:text-slate-400">{b.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View className="flex-row items-center gap-2">
          <Bell size={14} color="#5B6478" />
          <Text className="flex-1 font-sans text-[12px] leading-[17px] text-ink-muted dark:text-slate-400">
            Your phone will ask for permission next. You can change this in Settings at any time.
          </Text>
        </View>
      </View>
    </OnboardingShell>
  );
}
