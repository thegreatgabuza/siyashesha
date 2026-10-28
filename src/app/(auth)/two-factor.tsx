import { Fingerprint, Lock, ShieldCheck } from 'lucide-react-native';
import { Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/ui/GradientBackground';
import { heroShadow } from '@/components/ui/HeroAction';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAppStore } from '@/store/useAppStore';
import { useAccent } from '@/hooks/useAccent';

export default function TwoFactorScreen() {
  const { accent } = useAccent();
  const insets = useSafeAreaInsets();
  const mfaEnabled = useAppStore((s) => s.mfaEnabled);
  const setMfaEnabled = useAppStore((s) => s.setMfaEnabled);
  const completeSignIn = useAppStore((s) => s.completeSignIn);

  return (
    <View className="flex-1">
      <GradientBackground variant="hero">
        <View className="flex-1 px-6" style={{ paddingTop: insets.top + 60 }}>
          <View className="rounded-[32px] bg-ink p-5 dark:bg-canvasdark-card" style={heroShadow}>
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
              <ShieldCheck size={26} color="#FFFFFF" />
            </View>
            <Text className="mt-5 font-sans-bold text-[24px] leading-[30px] text-white">Secure your account</Text>
            <Text className="mt-2 font-sans text-[13px] leading-[20px] text-white/70">
              Two-factor authentication adds a second check every time you sign in, so your medical records and
              emergency profile stay protected even if your email or device credentials are compromised.
            </Text>
          </View>

          <View className="mt-4 flex-row items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
            <View className="flex-1 flex-row items-center gap-3 pr-3">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-500/20">
                <Lock size={18} color={accent} />
              </View>
              <View className="flex-1">
                <Text className="font-sans-semibold text-[14px] text-ink dark:text-slate-50">Require 2FA on every login</Text>
                <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">Recommended for medical data</Text>
              </View>
            </View>
            <Switch
                thumbColor="#FFFFFF" value={mfaEnabled} onValueChange={setMfaEnabled} trackColor={{ true: accent, false: '#E3E8F0' }} />
          </View>

          <View className="mt-3 flex-row items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-success-50 dark:bg-success-500/15">
              <Fingerprint size={18} color="#16A34A" />
            </View>
            <Text className="flex-1 font-sans text-[12px] leading-[17px] text-ink-muted dark:text-slate-400">
              Account identity secured via Clerk. Multi-factor verification ensures HIPAA and POPIA compliance.
            </Text>
          </View>

          <View className="mt-8">
            <PrimaryButton label="Finish setting up" onPress={completeSignIn} />
          </View>
        </View>
      </GradientBackground>
    </View>
  );
}
