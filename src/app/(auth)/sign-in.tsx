import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Mail, ShieldCheck } from 'lucide-react-native';
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
import { LegalDocumentModal, type LegalDocKind } from '@/components/security/LegalDocumentModal';
import { deriveNamesFromEmail, hasClerkKey, useSafeSignIn, useSafeSignUp } from '@/lib/clerkAvatar';
import { useAppStore } from '@/store/useAppStore';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const signInWithEmail = useAppStore((s) => s.signInWithEmail);
  const completeSignIn = useAppStore((s) => s.completeSignIn);
  const updatePatientProfile = useAppStore((s) => s.updatePatientProfile);

  const { isLoaded: isSignInLoaded, signIn } = useSafeSignIn();
  const { isLoaded: isSignUpLoaded, signUp } = useSafeSignUp();

  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocKind>(null);

  const cleanEmail = email.trim().toLowerCase();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);

  const handleContinue = async () => {
    if (!emailValid) {
      toast.show('Enter a valid email address', 'warning');
      return;
    }

    // Offline / local build fallback when Clerk is not configured
    if (!hasClerkKey) {
      signInWithEmail(cleanEmail, 'sign_in');
      updatePatientProfile({ email: cleanEmail });
      completeSignIn();
      toast.show('Signed in to your Health Passport', 'success');
      router.replace('/');
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

        if (signInAttempt.userData?.imageUrl) {
          updatePatientProfile({
            avatarUrl: signInAttempt.userData.imageUrl,
            ...(signInAttempt.userData.firstName ? { firstName: signInAttempt.userData.firstName, preferredName: signInAttempt.userData.firstName } : {}),
            ...(signInAttempt.userData.lastName ? { lastName: signInAttempt.userData.lastName } : {}),
          });
        }

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
          const { firstName, lastName } = deriveNamesFromEmail(cleanEmail);
          try {
            await signUp.create({
              emailAddress: cleanEmail,
              firstName,
              lastName,
            });
          } catch {
            await signUp.create({
              emailAddress: cleanEmail,
            });
          }

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

  return (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <GradientBackground variant="hero">
        <ScrollView
          contentContainerStyle={{
            paddingTop: insets.top + 32,
            paddingBottom: insets.bottom + 32,
            paddingHorizontal: 24,
            width: '100%',
            maxWidth: 480,
            alignSelf: 'center',
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

          {/* Email Input Field */}
          <View className="mt-8">
            <View className="mb-2 flex-row items-center gap-2">
              <Mail size={16} color="#0B2559" />
              <Text className="font-sans-semibold text-[13px] text-ink">
                Email Address
              </Text>
            </View>

            <View className="rounded-2xl border border-white/60 bg-white/80 px-4 py-1.5 shadow-sm">
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
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
          </View>

          {/* Security badge note */}
          <View className="mt-3 flex-row items-center gap-2">
            <ShieldCheck size={14} color="#059669" />
            <Text className="flex-1 font-sans text-[12px] text-ink-muted">
              Secured by Clerk: We will email you a secure 6-digit one-time code.
            </Text>
          </View>

          {/* Continue Button */}
          <View className="mt-6">
            <PrimaryButton
              label={isSubmitting ? 'Sending code...' : 'Continue with Email'}
              onPress={handleContinue}
              disabled={!emailValid || isSubmitting}
            />
          </View>

          {/* Apple Guideline 5.1.1(i) Pre-Authentication Terms of Use & Privacy Policy Links */}
          <View className="mt-6 items-center">
            <Text className="text-center font-sans text-[11px] leading-[16px] text-ink-muted">
              By continuing, you agree to Siyashesha’s
            </Text>
            <View className="mt-1 flex-row items-center justify-center gap-3">
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Terms of Use and End User License Agreement"
                onPress={() => setLegalDoc('terms')}
              >
                <Text className="font-sans-semibold text-[12px] underline text-ink">
                  Terms of Use (EULA)
                </Text>
              </Pressable>
              <Text className="text-ink-muted">•</Text>
              <Pressable
                accessibilityRole="link"
                accessibilityLabel="Privacy Policy and POPIA Notice"
                onPress={() => setLegalDoc('privacy')}
              >
                <Text className="font-sans-semibold text-[12px] underline text-ink">
                  Privacy Policy (POPIA)
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </GradientBackground>
      <LegalDocumentModal visibleDoc={legalDoc} onClose={() => setLegalDoc(null)} />
    </KeyboardAvoidingView>
  );
}
