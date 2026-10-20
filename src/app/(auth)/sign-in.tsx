import { router } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/ui/GradientBackground';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useToast } from '@/components/ui/Toast';
import { useAppStore } from '@/store/useAppStore';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const signIn = useAppStore((s) => s.signIn);
  const [phone, setPhone] = useState('71 442 0198');

  const digits = phone.replace(/\D/g, '');
  const isValid = digits.length >= 9;

  const handleContinue = () => {
    if (!isValid) {
      toast.show('Enter a valid South African mobile number', 'warning');
      return;
    }
    signIn(`+27 ${phone.trim()}`);
    router.push('/otp');
  };

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <GradientBackground variant="hero">
        <View className="flex-1 px-6" style={{ paddingTop: insets.top + 40 }}>
          <View className="h-16 w-16 items-center justify-center rounded-3xl bg-white/70">
            <ShieldCheck size={28} color="#6D5BD0" />
          </View>
          <Text className="mt-6 font-serif text-[32px] leading-[36px] text-ink">
            Siyashesha{'\n'}Health Passport
          </Text>
          <Text className="mt-2 font-sans text-[14px] text-ink-muted">
            Your health. Your records. Wherever you go.
          </Text>

          <Text className="mb-2 mt-10 font-sans-semibold text-[13px] text-ink-muted">
            Mobile number
          </Text>
          <View className="flex-row items-center gap-2 rounded-2xl border border-white/60 bg-white/70 px-4 py-1">
            <Text className="font-sans-semibold text-[15px] text-ink">+27</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="71 442 0198"
              placeholderTextColor="#8C98B8"
              keyboardType="phone-pad"
              className="min-h-[48px] flex-1 font-sans text-[16px] text-ink"
              accessibilityLabel="South African mobile number"
            />
          </View>
          <Text className="mt-2 font-sans text-[11px] text-ink-muted">
            We will send a 6-digit code to verify it’s you. Protected by POPIA-compliant
            encryption.
          </Text>

          <View className="mt-8">
            <PrimaryButton label="Send verification code" onPress={handleContinue} disabled={!isValid} />
          </View>
        </View>
      </GradientBackground>
    </KeyboardAvoidingView>
  );
}
