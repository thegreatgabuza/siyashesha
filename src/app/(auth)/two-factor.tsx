import { Fingerprint, Lock, ShieldCheck } from 'lucide-react-native';
import { Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/ui/GradientBackground';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useAppStore } from '@/store/useAppStore';

export default function TwoFactorScreen() {
  const insets = useSafeAreaInsets();
  const mfaEnabled = useAppStore((s) => s.mfaEnabled);
  const setMfaEnabled = useAppStore((s) => s.setMfaEnabled);
  const completeSignIn = useAppStore((s) => s.completeSignIn);

  return (
    <View className="flex-1">
      <GradientBackground variant="hero">
        <View className="flex-1 px-6" style={{ paddingTop: insets.top + 60 }}>
          <View className="h-16 w-16 items-center justify-center rounded-3xl bg-white/70">
            <ShieldCheck size={28} color="#6D5BD0" />
          </View>
          <Text className="mt-6 font-serif text-[26px] text-ink">Secure your account</Text>
          <Text className="mt-2 font-sans text-[14px] leading-[21px] text-ink-muted">
            Two-factor authentication adds a second check every time you sign in, so your medical
            records and emergency profile stay protected even if your phone number is compromised.
          </Text>

          <View className="mt-8 flex-row items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-4 py-4">
            <View className="flex-1 flex-row items-center gap-3 pr-3">
              <Lock size={18} color="#6D5BD0" />
              <View className="flex-1">
                <Text className="font-sans-semibold text-[14px] text-ink">
                  Require 2FA on every login
                </Text>
                <Text className="font-sans text-[12px] text-ink-muted">
                  Recommended for medical data
                </Text>
              </View>
            </View>
            <Switch value={mfaEnabled} onValueChange={setMfaEnabled} trackColor={{ true: '#6D5BD0', false: '#E3E8F0' }} />
          </View>

          <View className="mt-3 flex-row items-center gap-3 rounded-2xl border border-white/60 bg-white/70 px-4 py-4">
            <Fingerprint size={18} color="#0D9488" />
            <Text className="flex-1 font-sans text-[12px] text-ink-muted">
              POPIA and HIPAA-aligned safeguards protect your data with end-to-end encryption and
              full audit logging.
            </Text>
          </View>

          <View className="mt-10">
            <PrimaryButton label="Finish setting up" onPress={completeSignIn} />
          </View>
        </View>
      </GradientBackground>
    </View>
  );
}
