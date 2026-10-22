import * as LocalAuthentication from 'expo-local-authentication';
import { router } from 'expo-router';
import { Check, Eye, Lock, ShieldCheck, Smartphone } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';

import { ChunkyButton } from '@/components/onboarding/ChunkyButton';
import { Mascot } from '@/components/onboarding/Mascot';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { RewardModal } from '@/components/onboarding/RewardModal';
import { SpeechBubble } from '@/components/onboarding/SpeechBubble';
import { tapFeedback } from '@/lib/feedback';
import type { StampId } from '@/store/useAppStore';
import { useAppStore } from '@/store/useAppStore';

const points = [
  {
    icon: Smartphone,
    title: 'Stored on this phone',
    body: 'Your records stay on this phone for now. Nothing is uploaded to a cloud service in this version.',
  },
  {
    icon: Eye,
    title: 'Only you decide who sees it',
    body: 'You choose what to share, with a PIN and an end time. You can stop a share at any time.',
  },
  {
    icon: ShieldCheck,
    title: 'Encryption comes before any sync',
    body: 'Encryption and account sign-in are being set up before records ever leave your phone.',
  },
];

/** Plain-language privacy, consent, and the optional biometric lock. */
export default function PrivacyScreen() {
  const setBiometricLock = useAppStore((s) => s.setBiometricLock);
  const biometricLock = useAppStore((s) => s.biometricLock);
  const earnStamp = useAppStore((s) => s.earnStamp);
  const [consented, setConsented] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [reward, setReward] = useState<StampId | null>(null);

  const toggleBiometric = async (value: boolean) => {
    if (!value) {
      setBiometricLock(false);
      return;
    }
    const hardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hardware || !enrolled) {
      setNote('Set up Face ID or a fingerprint in your phone settings first, then come back here.');
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Confirm to turn on biometric lock',
      cancelLabel: 'Cancel',
    });
    if (result.success) {
      setBiometricLock(true);
      setNote(null);
      tapFeedback();
      if (earnStamp('biometric')) setReward('biometric');
    } else {
      setNote('No problem. You can turn this on later in Settings.');
    }
  };

  const next = () => router.push('/(onboarding)/account' as any);

  return (
    <OnboardingShell
      footer={<ChunkyButton label="Continue" disabled={!consented} onPress={next} accessibilityHint="Requires agreeing to how your data is used" />}
    >
      <View className="gap-6 py-2">
        <View className="items-center gap-4">
          <Mascot mood="calm" size={88} />
          <SpeechBubble>Your data, your choice.</SpeechBubble>
        </View>

        <View className="gap-3">
          {points.map((p) => (
            <View key={p.title} className="flex-row items-start gap-4 rounded-3xl bg-white p-4 dark:bg-canvasdark-card">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-500/20">
                <p.icon size={18} color="#0B2559" />
              </View>
              <View className="flex-1">
                <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">{p.title}</Text>
                <Text className="mt-0.5 font-sans text-[13px] leading-[18px] text-ink-muted dark:text-slate-400">{p.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Biometric lock (optional) */}
        <View className="gap-2 rounded-3xl bg-white p-4 dark:bg-canvasdark-card">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 flex-row items-center gap-3">
              <Lock size={18} color="#0B2559" />
              <View className="flex-1">
                <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">Lock with Face ID or fingerprint</Text>
                <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">Optional. Asks for you before the app opens.</Text>
              </View>
            </View>
            <Switch
                thumbColor="#FFFFFF"
              value={biometricLock}
              onValueChange={toggleBiometric}
              trackColor={{ true: '#16A34A', false: '#E3E8F0' }}
              accessibilityLabel="Lock with Face ID or fingerprint"
            />
          </View>
          {note ? <Text className="font-sans text-[12px] leading-[17px] text-ink-soft dark:text-slate-300">{note}</Text> : null}
        </View>

        {/* Consent (required to continue) */}
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consented }}
          accessibilityLabel="I understand how my health data is kept and shared"
          onPress={() => {
            tapFeedback();
            setConsented((c) => !c);
          }}
          className="flex-row items-center gap-3 rounded-3xl border-2 border-ink bg-white p-4 dark:border-brand-300 dark:bg-canvasdark-card"
          style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}
        >
          <View className={`h-7 w-7 items-center justify-center rounded-lg ${consented ? 'bg-success-500' : 'border-2 border-slate-300 dark:border-slate-600'}`}>
            {consented ? <Check size={16} color="#FFFFFF" /> : null}
          </View>
          <Text className="flex-1 font-sans-semibold text-[14px] leading-[20px] text-ink dark:text-slate-50">
            I understand how my health data is kept and shared.
          </Text>
        </Pressable>
      </View>

      <RewardModal stampId={reward} onDone={() => setReward(null)} />
    </OnboardingShell>
  );
}
