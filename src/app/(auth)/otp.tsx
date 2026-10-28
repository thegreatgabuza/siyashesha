import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLockup } from '@/components/ui/BrandLockup';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useToast } from '@/components/ui/Toast';
import { useAppStore } from '@/store/useAppStore';

const LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function OtpScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const pendingEmail = useAppStore((s) => s.pendingEmail);
  const clerkFlow = useAppStore((s) => s.clerkFlow);
  const completeSignIn = useAppStore((s) => s.completeSignIn);

  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();

  const [digits, setDigits] = useState<string[]>(Array(LENGTH).fill(''));
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [isResending, setIsResending] = useState(false);
  const inputs = useRef<(React.ComponentRef<typeof TextInput> | null)[]>([]);

  const code = digits.join('');
  const isComplete = code.length === LENGTH;

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleChange = (value: string, index: number) => {
    // Handle pasted 6-digit code
    const cleanNumbers = value.replace(/\D/g, '');
    if (cleanNumbers.length > 1) {
      const chars = cleanNumbers.slice(0, LENGTH).split('');
      const next = [...digits];
      chars.forEach((c, i) => {
        if (i < LENGTH) next[i] = c;
      });
      setDigits(next);
      const targetFocus = Math.min(chars.length, LENGTH - 1);
      inputs.current[targetFocus]?.focus();
      return;
    }

    const clean = cleanNumbers.slice(-1);
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

  const handleVerify = async () => {
    if (!isComplete) {
      toast.show('Enter the 6-digit code', 'warning');
      return;
    }

    setIsVerifying(true);

    try {
      if (clerkFlow === 'sign_in') {
        if (!isSignInLoaded || !signIn) {
          throw new Error('Authentication is still loading. Please wait a moment.');
        }

        const result = await signIn.attemptFirstFactor({
          strategy: 'email_code',
          code,
        });

        if (result.status === 'complete') {
          if (setSignInActive && result.createdSessionId) {
            await setSignInActive({ session: result.createdSessionId });
          }
          completeSignIn({
            clerkSessionId: result.createdSessionId || undefined,
            email: pendingEmail,
          });
          toast.show('Signed in successfully!', 'success');
          router.replace('/(tabs)');
          return;
        } else if (result.status === 'needs_second_factor') {
          router.push('/two-factor');
          return;
        } else {
          throw new Error(`Unexpected sign-in status: ${result.status}`);
        }
      } else if (clerkFlow === 'sign_up') {
        if (!isSignUpLoaded || !signUp) {
          throw new Error('Authentication is still loading. Please wait a moment.');
        }

        const result = await signUp.attemptEmailAddressVerification({
          code,
        });

        if (result.status === 'complete') {
          if (setSignUpActive && result.createdSessionId) {
            await setSignUpActive({ session: result.createdSessionId });
          }
          completeSignIn({
            clerkSessionId: result.createdSessionId || undefined,
            email: pendingEmail,
          });
          toast.show('Account verified & signed in!', 'success');
          router.replace('/(tabs)');
          return;
        } else {
          throw new Error(`Verification status: ${result.status}`);
        }
      } else {
        // Demo fallback
        completeSignIn({
          email: pendingEmail || 'jessica.tebatso@example.co.za',
        });
        toast.show('Signed in successfully', 'success');
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      console.error('[Clerk OTP Verification] Error:', err);
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Invalid or expired code. Please try again.';
      toast.show(msg, 'warning');
      // Reset code for re-entry
      setDigits(Array(LENGTH).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || isResending) return;
    setIsResending(true);

    try {
      if (clerkFlow === 'sign_in' && signIn) {
        const emailCodeFactor = signIn.supportedFirstFactors?.find(
          (factor): factor is typeof factor & { emailAddressId: string } =>
            factor.strategy === 'email_code' && 'emailAddressId' in factor
        );
        if (emailCodeFactor) {
          await signIn.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: emailCodeFactor.emailAddressId,
          });
        }
      } else if (clerkFlow === 'sign_up' && signUp) {
        await signUp.prepareEmailAddressVerification({
          strategy: 'email_code',
        });
      }
      toast.show(`New code sent to ${pendingEmail || 'your email'}`, 'info');
      setResendTimer(RESEND_COOLDOWN);
    } catch (err: any) {
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Could not resend code. Please try again later.';
      toast.show(msg, 'warning');
    } finally {
      setIsResending(false);
    }
  };

  const destinationLabel = pendingEmail || 'your email';

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <GradientBackground variant="hero">
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 32,
            paddingBottom: insets.bottom + 32,
            paddingHorizontal: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Back to sign in"
            className="mb-4 h-10 w-10 items-center justify-center rounded-full bg-white/70"
          >
            <ArrowLeft size={18} color="#0F172A" />
          </Pressable>

          <BrandLockup />

          <Text className="mt-8 font-sans-bold text-[28px] text-ink">Check your inbox</Text>
          <Text className="mt-2 font-sans text-[14px] leading-[20px] text-ink-muted">
            We sent a 6-digit one-time verification code to{' '}
            <Text className="font-sans-semibold text-ink">{destinationLabel}</Text>.
          </Text>

          {/* OTP Digit Inputs */}
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
                editable={!isVerifying}
                accessibilityLabel={`Digit ${i + 1} of 6`}
                className="h-14 w-12 rounded-2xl border border-white/70 bg-white/90 text-center font-sans-bold text-[22px] text-ink shadow-sm"
              />
            ))}
          </View>

          {/* Security badge */}
          <View className="mt-4 flex-row items-center gap-2 rounded-2xl bg-white/50 px-3.5 py-2">
            <ShieldCheck size={16} color="#059669" />
            <Text className="flex-1 font-sans text-[12px] text-ink-muted">
              Verification codes expire in 10 minutes. Never share this code with anyone.
            </Text>
          </View>

          {/* Verify Button */}
          <View className="mt-8">
            <PrimaryButton
              label={isVerifying ? 'Verifying...' : 'Verify & Continue'}
              onPress={handleVerify}
              disabled={!isComplete || isVerifying}
            />
          </View>

          {/* Resend Section */}
          <View className="mt-6 items-center">
            <Pressable
              onPress={handleResend}
              disabled={resendTimer > 0 || isResending}
              accessibilityRole="button"
              accessibilityLabel="Resend verification code"
              className="flex-row items-center gap-2 py-2"
            >
              <RefreshCw
                size={14}
                color={resendTimer > 0 ? '#94A3B8' : '#0F172A'}
                className={isResending ? 'animate-spin' : undefined}
              />
              <Text
                className={`font-sans-semibold text-[13px] ${
                  resendTimer > 0 ? 'text-ink-muted' : 'text-ink underline'
                }`}
              >
                {resendTimer > 0 ? `Resend code in ${resendTimer}s` : 'Resend code'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Change email address"
              className="mt-2 py-2"
            >
              <Text className="font-sans text-[13px] text-ink-muted">
                Wrong email address? <Text className="font-sans-semibold text-brand-700">Change it</Text>
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </GradientBackground>
    </KeyboardAvoidingView>
  );
}
