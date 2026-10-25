import { useSignIn, useSignUp } from '@clerk/clerk-expo';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ArrowRight, Mail, Phone, ShieldCheck, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
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

import { GradientBackground } from '@/components/ui/GradientBackground';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useToast } from '@/components/ui/Toast';
import { useAppStore } from '@/store/useAppStore';

type Method = 'email' | 'phone';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const signInWithEmail = useAppStore((s) => s.signInWithEmail);
  const signInWithPhone = useAppStore((s) => s.signIn);
  const completeSignIn = useAppStore((s) => s.completeSignIn);

  const { isLoaded: isSignInLoaded, signIn } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp } = useSignUp();

  const [method, setMethod] = useState<Method>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('71 442 0198');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cleanEmail = email.trim().toLowerCase();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
  const digits = phone.replace(/\D/g, '');
  const phoneValid = digits.length >= 9;
  const isValid = method === 'email' ? emailValid : phoneValid;

  const handleContinue = async () => {
    if (!isValid) {
      toast.show(
        method === 'email'
          ? 'Enter a valid email address'
          : 'Enter a valid South African mobile number',
        'warning'
      );
      return;
    }

    if (method === 'phone') {
      signInWithPhone(`+27 ${phone.trim()}`);
      router.push('/otp');
      return;
    }

    // Clerk Email OTP Auth Flow
    setIsSubmitting(true);
    try {
      if (!isSignInLoaded || !isSignUpLoaded || !signIn || !signUp) {
        toast.show('Authentication service is still initializing. Please try again.', 'warning');
        setIsSubmitting(false);
        return;
      }

      // Step 1: Try sign-in first for existing users
      try {
        const signInAttempt = await signIn.create({
          identifier: cleanEmail,
        });

        // Find email_code strategy in supported first factors
        const emailCodeFactor = signInAttempt.supportedFirstFactors?.find(
          (factor): factor is typeof factor & { emailAddressId: string } =>
            factor.strategy === 'email_code' && 'emailAddressId' in factor
        );

        if (emailCodeFactor) {
          await signIn.prepareFirstFactor({
            strategy: 'email_code',
            emailAddressId: emailCodeFactor.emailAddressId,
          });
        } else {
          throw new Error('Email verification is not supported on this account');
        }

        signInWithEmail(cleanEmail, 'sign_in');
        toast.show(`Verification code sent to ${cleanEmail}`, 'info');
        router.push('/otp');
      } catch (signInErr: any) {
        // Step 2: If identifier not found, gracefully fall back to sign-up
        const notFound =
          signInErr?.errors?.some(
            (e: any) =>
              e.code === 'form_identifier_not_found' ||
              e.code === 'identifier_not_found' ||
              e.code === 'user_not_found'
          ) || false;

        if (notFound) {
          await signUp.create({
            emailAddress: cleanEmail,
          });

          await signUp.prepareEmailAddressVerification({
            strategy: 'email_code',
          });

          signInWithEmail(cleanEmail, 'sign_up');
          toast.show(`Verification code sent to ${cleanEmail}`, 'info');
          router.push('/otp');
        } else {
          // Re-throw other sign-in errors
          throw signInErr;
        }
      }
    } catch (err: any) {
      console.error('[Clerk Email Auth] Sign-in error:', err);
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Unable to send verification code. Please try again.';
      toast.show(msg, 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSignIn = () => {
    completeSignIn({
      email: 'jessica.tebatso@example.co.za',
    });
    toast.show('Signed in as Jessica Tebatso (Demo)', 'success');
    router.replace('/(tabs)');
  };

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
          {/* Logo & Header */}
          <View className="items-center self-start rounded-3xl bg-white px-4 py-3 shadow-sm">
            <Image
              source={require('../../../assets/images/splash-icon.png')}
              style={{ width: 88, height: 88 }}
              contentFit="contain"
              accessibilityLabel="Siyashesha logo"
            />
          </View>
          <Text className="mt-5 font-display text-[48px] leading-[48px] text-emergency-500">SIYASHESHA</Text>
          <Text className="mt-1 font-sans-semibold text-[12px] uppercase text-ink" style={{ letterSpacing: 3.6 }}>
            Health Passport
          </Text>
          <Text className="mt-2 font-sans text-[14px] text-ink-muted">
            Your health. Your records. Wherever you go.
          </Text>

          {/* Auth Method Selector */}
          <View className="mb-3 mt-8 flex-row gap-2" accessibilityRole="radiogroup">
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: method === 'email' }}
              accessibilityLabel="Sign in with Email"
              onPress={() => setMethod('email')}
              className={`min-h-[42px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl ${
                method === 'email' ? 'bg-ink shadow-sm' : 'bg-white/70'
              }`}
            >
              <Mail size={16} color={method === 'email' ? '#FFFFFF' : '#64748B'} />
              <Text className={`font-sans-semibold text-[13px] ${method === 'email' ? 'text-white' : 'text-ink-muted'}`}>
                Email Address
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: method === 'phone' }}
              accessibilityLabel="Sign in with Mobile Number"
              onPress={() => setMethod('phone')}
              className={`min-h-[42px] flex-1 flex-row items-center justify-center gap-2 rounded-2xl ${
                method === 'phone' ? 'bg-ink shadow-sm' : 'bg-white/70'
              }`}
            >
              <Phone size={16} color={method === 'phone' ? '#FFFFFF' : '#64748B'} />
              <Text className={`font-sans-semibold text-[13px] ${method === 'phone' ? 'text-white' : 'text-ink-muted'}`}>
                Mobile Number
              </Text>
            </Pressable>
          </View>

          {/* Input Field */}
          {method === 'email' ? (
            <View className="rounded-2xl border border-white/60 bg-white/80 px-4 py-1.5 shadow-sm">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="tebatso@example.com"
                placeholderTextColor="#8C98B8"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                editable={!isSubmitting}
                className="min-h-[48px] font-sans text-[16px] text-ink"
                accessibilityLabel="Email address"
              />
            </View>
          ) : (
            <View className="flex-row items-center gap-2 rounded-2xl border border-white/60 bg-white/80 px-4 py-1.5 shadow-sm">
              <Text className="font-sans-semibold text-[15px] text-ink">+27</Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="71 442 0198"
                placeholderTextColor="#8C98B8"
                keyboardType="phone-pad"
                editable={!isSubmitting}
                className="min-h-[48px] flex-1 font-sans text-[16px] text-ink"
                accessibilityLabel="South African mobile number"
              />
            </View>
          )}

          {/* Security badge note */}
          <View className="mt-2.5 flex-row items-center gap-2">
            <ShieldCheck size={14} color="#059669" />
            <Text className="flex-1 font-sans text-[12px] text-ink-muted">
              {method === 'email'
                ? 'Secured by Clerk: We will email you a secure 6-digit one-time code.'
                : 'Demo mobile sign in: No SMS network required.'}
            </Text>
          </View>

          {/* Continue Button */}
          <View className="mt-6">
            <PrimaryButton
              label={isSubmitting ? 'Sending code...' : 'Continue with Code'}
              onPress={handleContinue}
              disabled={!isValid || isSubmitting}
            />
          </View>

          {/* Quick 1-Tap Demo Access */}
          <View className="mt-8 rounded-3xl border border-white/60 bg-white/60 p-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Sparkles size={16} color="#0D7C66" />
                <Text className="font-sans-semibold text-[13px] text-brand-700">Offline & Review Testing</Text>
              </View>
              <Text className="font-sans text-[11px] uppercase tracking-wide text-ink-muted">1-Tap</Text>
            </View>
            <Text className="mt-1 font-sans text-[12px] text-ink-muted">
              Skip code delivery and immediately launch the pre-seeded clinical passport for Jessica Tebatso.
            </Text>
            <Pressable
              onPress={handleDemoSignIn}
              accessibilityRole="button"
              accessibilityLabel="1-Tap Demo Sign In as Jessica Tebatso"
              className="mt-3 flex-row items-center justify-between rounded-xl bg-ink px-4 py-3"
            >
              <View>
                <Text className="font-sans-semibold text-[13px] text-white">1-Tap Demo Sign In</Text>
                <Text className="font-sans text-[11px] text-white/70">Jessica Tebatso (Seed Patient)</Text>
              </View>
              <ArrowRight size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        </ScrollView>
      </GradientBackground>
    </KeyboardAvoidingView>
  );
}