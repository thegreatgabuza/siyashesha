import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/ui/GradientBackground';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useToast } from '@/components/ui/Toast';
import { useAppStore } from '@/store/useAppStore';

type Method = 'phone' | 'email';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const signIn = useAppStore((s) => s.signIn);
  const [method, setMethod] = useState<Method>('phone');
  const [phone, setPhone] = useState('71 442 0198');
  const [email, setEmail] = useState('');

  const digits = phone.replace(/\D/g, '');
  const phoneValid = digits.length >= 9;
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isValid = method === 'phone' ? phoneValid : emailValid;

  const handleContinue = () => {
    if (!isValid) {
      toast.show(
        method === 'phone' ? 'Enter a valid South African mobile number' : 'Enter a valid email address',
        'warning'
      );
      return;
    }
    signIn(method === 'phone' ? `+27 ${phone.trim()}` : email.trim());
    router.push('/otp');
  };

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <GradientBackground variant="hero">
        <View className="flex-1 px-6" style={{ paddingTop: insets.top + 40 }}>
          <View className="items-center self-start rounded-3xl bg-white px-4 py-3">
            <Image
              source={require('../../../assets/images/splash-icon.png')}
              style={{ width: 96, height: 96 }}
              contentFit="contain"
              accessibilityLabel="Siyashesha logo"
            />
          </View>
          <Text className="mt-6 font-display text-[52px] leading-[52px] text-emergency-500">SIYASHESHA</Text>
          <Text className="mt-1 font-sans-semibold text-[12px] uppercase text-ink" style={{ letterSpacing: 3.6 }}>
            Health Passport
          </Text>
          <Text className="mt-2 font-sans text-[14px] text-ink-muted">
            Your health. Your records. Wherever you go.
          </Text>

          {/* Sign in with a South African mobile number or an email address */}
          <View className="mb-2 mt-10 flex-row gap-2" accessibilityRole="radiogroup">
            {(['phone', 'email'] as Method[]).map((m) => (
              <Pressable
                key={m}
                accessibilityRole="radio"
                accessibilityState={{ selected: method === m }}
                accessibilityLabel={m === 'phone' ? 'Use mobile number' : 'Use email address'}
                onPress={() => setMethod(m)}
                className={`min-h-[40px] flex-1 items-center justify-center rounded-full ${
                  method === m ? 'bg-ink' : 'bg-white/70'
                }`}
              >
                <Text className={`font-sans-semibold text-[13px] ${method === m ? 'text-white' : 'text-ink-muted'}`}>
                  {m === 'phone' ? 'Mobile number' : 'Email address'}
                </Text>
              </Pressable>
            ))}
          </View>

          {method === 'phone' ? (
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
          ) : (
            <View className="rounded-2xl border border-white/60 bg-white/70 px-4 py-1">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#8C98B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="min-h-[48px] font-sans text-[16px] text-ink"
                accessibilityLabel="Email address"
              />
            </View>
          )}
          <Text className="mt-2 font-sans text-[11px] text-ink-muted">
            Demo build: no code is sent. Any 6-digit code is accepted at the next step.
          </Text>

          <View className="mt-8">
            <PrimaryButton label="Continue" onPress={handleContinue} disabled={!isValid} />
          </View>
        </View>
      </GradientBackground>
    </KeyboardAvoidingView>
  );
}
