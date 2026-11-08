import { router } from 'expo-router';
import { Check, Eye, Lock, ShieldCheck, Smartphone } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, Switch, Text, View } from 'react-native';

import { ChunkyButton } from '@/components/onboarding/ChunkyButton';
import { Mascot } from '@/components/onboarding/Mascot';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { RewardModal } from '@/components/onboarding/RewardModal';
import { SpeechBubble } from '@/components/onboarding/SpeechBubble';
import { tapFeedback } from '@/lib/feedback';
import {
  authenticateWithBiometrics,
  getBiometricCapabilities,
  getOrCreateEnclaveKey,
} from '@/lib/security/enclaveSecurity';
import type { StampId } from '@/store/useAppStore';
import { useAppStore } from '@/store/useAppStore';

const points = [
  {
    icon: Smartphone,
    title: 'Encrypted on your device',
    body: 'Your medical vault is protected with AES-256 hardware-backed encryption on your phone.',
  },
  {
    icon: Eye,
    title: 'You control every doctor share',
    body: 'Share records via a PIN-protected QR link with automatic expiry. Revoke access in one tap.',
  },
  {
    icon: ShieldCheck,
    title: 'POPIA & HIPAA aligned privacy',
    body: 'Your health data is never sold to insurers, marketers, or third-party brokers. Erase all data anytime.',
  },
];

/** Plain-language privacy, consent, and the optional biometric lock. */
export default function PrivacyScreen() {
  const setBiometricLock = useAppStore((s) => s.setBiometricLock);
  const biometricLock = useAppStore((s) => s.biometricLock);
  const earnStamp = useAppStore((s) => s.earnStamp);
  const [consented, setConsented] = useState(true);
  const [note, setNote] = useState<string | null>(null);
  const [reward, setReward] = useState<StampId | null>(null);

  const toggleBiometric = async (value: boolean) => {
    if (!value) {
      setBiometricLock(false);
      return;
    }
    const caps = await getBiometricCapabilities();
    if (!caps.hasHardware || !caps.isEnrolled) {
      if (Platform.OS !== 'web') {
        setNote('Set up Face ID or fingerprint in your phone settings first, or enable this later in Settings.');
        return;
      }
    }
    const result = await authenticateWithBiometrics('Confirm to turn on biometric lock');
    if (result.success) {
      await getOrCreateEnclaveKey();
      setBiometricLock(true);
      setNote(null);
      tapFeedback();
      if (earnStamp('biometric')) setReward('biometric');
    } else {
      setNote('No problem. You can turn this on later in Settings.');
    }
  };

  const next = () => router.push('/(onboarding)/reveal' as any);

  return (
    <OnboardingShell
      step={7}
      totalSteps={8}
      stepLabel="Privacy & Security"
      footer={
        <ChunkyButton
          label="Reveal my passport"
          disabled={!consented}
          onPress={next}
          accessibilityHint="Requires agreeing to how your data is protected"
        />
      }
    >
      <View className="gap-5 py-2">
        <View className="items-center gap-3">
          <Mascot mood="calm" size={80} />
          <SpeechBubble subtitle="Built from the ground up for South African POPIA health data protection.">
            Your health data belongs strictly to you.
          </SpeechBubble>
        </View>

        <View className="gap-2.5">
          {points.map((p) => (
            <View
              key={p.title}
              className="flex-row items-start gap-3.5 rounded-3xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-canvasdark-card"
            >
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-brand-100/80 dark:bg-brand-500/20">
                <p.icon size={18} color="#0B2559" />
              </View>
              <View className="flex-1">
                <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">{p.title}</Text>
                <Text className="mt-0.5 font-sans text-[13px] leading-[18px] text-ink-muted dark:text-slate-400">
                  {p.body}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Biometric lock (optional) */}
        <View className="gap-2 rounded-3xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-canvasdark-card">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-500/15">
                <Lock size={18} color="#16A34A" />
              </View>
              <View className="flex-1">
                <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">
                  Biometric Vault Lock
                </Text>
                <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">
                  Optional · Require Face ID / fingerprint to open vault
                </Text>
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
          {note ? (
            <Text className="font-sans text-[12px] leading-[17px] text-ink-soft dark:text-slate-300">{note}</Text>
          ) : null}
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
          className={`flex-row items-center gap-3 rounded-3xl border-2 p-4 ${
            consented
              ? 'border-ink bg-brand-50/60 dark:border-brand-300 dark:bg-brand-500/15'
              : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-canvasdark-card'
          }`}
          style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.985 : 1 }] })}
        >
          <View
            className={`h-6 w-6 items-center justify-center rounded-lg ${
              consented ? 'bg-success-500' : 'border-2 border-slate-300 dark:border-slate-600'
            }`}
          >
            {consented ? <Check size={15} color="#FFFFFF" strokeWidth={3} /> : null}
          </View>
          <Text className="flex-1 font-sans-semibold text-[13px] leading-[19px] text-ink dark:text-slate-50">
            I understand how my health data is stored on my device and shared only with my consent.
          </Text>
        </Pressable>
      </View>

      <RewardModal stampId={reward} onDone={() => setReward(null)} />
    </OnboardingShell>
  );
}
