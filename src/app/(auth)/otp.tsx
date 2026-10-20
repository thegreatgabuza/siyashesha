import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GradientBackground } from '@/components/ui/GradientBackground';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useToast } from '@/components/ui/Toast';
import { useAppStore } from '@/store/useAppStore';

const LENGTH = 6;

export default function OtpScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const pendingPhone = useAppStore((s) => s.pendingPhone);
  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''));
  const inputs = useRef<(TextInput | null)[]>([]);

  const code = digits.join('');
  const isComplete = code.length === LENGTH;

  const handleChange = (value: string, index: number) => {
    const clean = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    if (!isComplete) {
      toast.show('Enter the 6-digit code', 'warning');
      return;
    }
    router.push('/two-factor');
  };

  return (
    <View className="flex-1">
      <GradientBackground variant="hero">
        <View className="flex-1 px-6" style={{ paddingTop: insets.top + 60 }}>
          <Text className="font-serif text-[26px] text-ink">Enter your code</Text>
          <Text className="mt-2 font-sans text-[14px] text-ink-muted">
            We sent a 6-digit code to {pendingPhone || '+27 71 442 0198'}.
          </Text>

          <View className="mt-8 flex-row justify-between gap-2">
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={(ref) => {
                  inputs.current[i] = ref;
                }}
                value={d}
                onChangeText={(v) => handleChange(v, i)}
                onKeyPress={(e) => handleKeyPress(e.nativeEvent.key, i)}
                keyboardType="number-pad"
                maxLength={1}
                accessibilityLabel={`Digit ${i + 1} of 6`}
                className="h-14 w-12 rounded-2xl border border-white/60 bg-white/80 text-center font-sans-bold text-[20px] text-ink"
              />
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Resend code"
            onPress={() => toast.show('A new code has been sent', 'info')}
            className="mt-4 min-h-[44px] self-start justify-center"
          >
            <Text className="font-sans-semibold text-[13px] text-brand-600">Resend code</Text>
          </Pressable>

          <View className="mt-8">
            <PrimaryButton label="Verify" onPress={handleVerify} disabled={!isComplete} />
          </View>
        </View>
      </GradientBackground>
    </View>
  );
}
