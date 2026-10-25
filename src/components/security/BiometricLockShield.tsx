import * as Haptics from 'expo-haptics';
import {
  AlertTriangle,
  Fingerprint,
  HeartPulse,
  LogOut,
  ScanFace,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandLockup } from '@/components/ui/BrandLockup';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { heroShadow } from '@/components/ui/HeroAction';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import {
  authenticateWithBiometrics,
  getBiometricCapabilities,
  type BiometricCapabilities,
} from '@/lib/security/enclaveSecurity';
import { useAppStore } from '@/store/useAppStore';

export function BiometricLockShield() {
  const insets = useSafeAreaInsets();

  const unlockApp = useAppStore((s) => s.unlockApp);
  const signOut = useAppStore((s) => s.signOut);
  const patient = useAppStore((s) => s.patientProfile);

  const [capabilities, setCapabilities] = useState<BiometricCapabilities | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  useEffect(() => {
    getBiometricCapabilities().then((caps) => {
      setCapabilities(caps);
    });
  }, []);

  const triggerAuth = useCallback(async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);

    try {
      const result = await authenticateWithBiometrics('Unlock Siyashesha Health Passport');

      if (result.success) {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        }
        unlockApp();
      } else {
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        }
        setErrorMessage(result.error || 'Authentication cancelled or unsuccessful. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Authentication error occurred.');
    } finally {
      setIsAuthenticating(false);
    }
  }, [unlockApp]);

  // Auto-prompt on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      triggerAuth();
    }, 350);
    return () => clearTimeout(timer);
  }, [triggerAuth]);

  const isFaceId = capabilities?.primaryType === 'facial_recognition';
  const biometricLabel = capabilities?.label || 'Face ID / Fingerprint';

  return (
    <View className="absolute inset-0 z-50 flex-1">
      <GradientBackground variant="hero">
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'space-between',
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 24,
          }}
        >
          {/* Top Brand Lockup */}
          <View>
            <BrandLockup />

            <View className="mt-8 items-center">
              {/* Vault Shield Graphic */}
              <View
                className="h-28 w-28 items-center justify-center rounded-3xl bg-white/10 shadow-lg"
                style={heroShadow}
              >
                <View className="h-20 w-20 items-center justify-center rounded-2xl bg-white/20">
                  {isFaceId ? (
                    <ScanFace size={44} color="#FFFFFF" />
                  ) : (
                    <Fingerprint size={44} color="#FFFFFF" />
                  )}
                </View>
              </View>

              <Text className="mt-6 font-display text-[32px] text-white">Health Passport Locked</Text>
              <Text className="mt-2 text-center font-sans text-[14px] leading-[22px] text-white/80">
                Encrypted with device Secure Enclave. Verify your identity with{' '}
                <Text className="font-sans-bold text-white">{biometricLabel}</Text> to decrypt your medical records.
              </Text>

              {/* Security Badge */}
              <View className="mt-4 flex-row items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5">
                <ShieldCheck size={14} color="#4ADE80" />
                <Text className="font-sans-semibold text-[11px] uppercase tracking-wider text-white">
                  POPIA & HIPAA Hardware Enclave Protected
                </Text>
              </View>
            </View>
          </View>

          {/* Action Center */}
          <View className="mt-8 w-full">
            {errorMessage ? (
              <View className="mb-4 flex-row items-center gap-2.5 rounded-2xl bg-emergency-500/20 border border-emergency-500/40 p-3.5">
                <AlertTriangle size={18} color="#F87171" />
                <Text className="flex-1 font-sans text-[12px] leading-[17px] text-white">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            <PrimaryButton
              label={
                isAuthenticating
                  ? 'Verifying identity...'
                  : `Unlock with ${biometricLabel}`
              }
              onPress={triggerAuth}
              disabled={isAuthenticating}
            />

            {/* Quick emergency access for paramedics without unlock */}
            <Pressable
              onPress={() => setShowEmergencyModal(true)}
              accessibilityRole="button"
              accessibilityLabel="Open First Responder ICE Emergency Card"
              className="mt-3 flex-row items-center justify-center gap-2 rounded-2xl border border-emergency-500/40 bg-emergency-500/10 py-3"
            >
              <HeartPulse size={16} color="#DC1F26" />
              <Text className="font-sans-semibold text-[13px] text-emergency-500">
                First Responder / Emergency ICE
              </Text>
            </Pressable>

            {/* Sign out fallback */}
            <Pressable
              onPress={() => signOut()}
              accessibilityRole="button"
              accessibilityLabel="Sign out of health passport"
              className="mt-4 flex-row items-center justify-center gap-1.5 py-2"
            >
              <LogOut size={14} color="#94A3B8" />
              <Text className="font-sans text-[12px] text-white/60">
                Switch account or sign out
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </GradientBackground>

      {/* Emergency First Responder ICE Modal */}
      <Modal visible={showEmergencyModal} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <View
            className="rounded-t-[32px] bg-white p-6 dark:bg-canvasdark-card"
            style={{ paddingBottom: insets.bottom + 24 }}
          >
            <View className="flex-row items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <View className="flex-row items-center gap-2.5">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-emergency-50 dark:bg-emergency-500/20">
                  <HeartPulse size={20} color="#DC1F26" />
                </View>
                <View>
                  <Text className="font-sans-bold text-[17px] text-ink dark:text-white">Emergency ICE Card</Text>
                  <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">First-responder read-only view</Text>
                </View>
              </View>
              <Pressable
                onPress={() => setShowEmergencyModal(false)}
                accessibilityRole="button"
                accessibilityLabel="Close emergency view"
                className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-canvasdark"
              >
                <X size={18} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView className="max-h-96 pt-4">
              {/* Patient Name & Blood Group */}
              <View className="flex-row gap-3">
                <View className="flex-1 rounded-2xl bg-slate-50 p-3.5 dark:bg-canvasdark">
                  <Text className="font-sans text-[11px] uppercase tracking-wider text-ink-muted dark:text-slate-400">Patient</Text>
                  <Text className="mt-0.5 font-sans-bold text-[16px] text-ink dark:text-white">
                    {patient.firstName} {patient.lastName}
                  </Text>
                  <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">DOB: {patient.dateOfBirth}</Text>
                </View>

                <View className="w-28 items-center justify-center rounded-2xl bg-emergency-50 p-3 dark:bg-emergency-500/15">
                  <Text className="font-sans text-[11px] uppercase tracking-wider text-emergency-500">Blood Type</Text>
                  <Text className="mt-0.5 font-display text-[26px] leading-[28px] text-emergency-500">
                    {patient.bloodGroup}
                  </Text>
                </View>
              </View>

              {/* Severe Allergies */}
              <View className="mt-3 rounded-2xl border border-emergency-100 bg-emergency-50/50 p-3.5 dark:border-emergency-500/30 dark:bg-emergency-500/10">
                <Text className="font-sans-bold text-[12px] uppercase text-emergency-500">Allergies (Critical)</Text>
                <View className="mt-1.5 flex-row flex-wrap gap-1.5">
                  {patient.allergies.map((a, i) => (
                    <View key={i} className="rounded-lg bg-white px-2 py-1 shadow-xs dark:bg-canvasdark-card">
                      <Text className="font-sans-semibold text-[12px] text-emergency-500">{a.substance}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Chronic Conditions */}
              <View className="mt-3 rounded-2xl bg-slate-50 p-3.5 dark:bg-canvasdark">
                <Text className="font-sans-bold text-[12px] uppercase text-ink-muted dark:text-slate-400">Chronic Conditions</Text>
                <Text className="mt-1 font-sans text-[13px] text-ink dark:text-white">
                  {patient.chronicConditions.join(', ')}
                </Text>
              </View>

              {/* Emergency Contact */}
              <View className="mt-3 rounded-2xl bg-slate-50 p-3.5 dark:bg-canvasdark">
                <Text className="font-sans-bold text-[12px] uppercase text-ink-muted dark:text-slate-400">Next of Kin / Contact</Text>
                <Text className="mt-1 font-sans-semibold text-[14px] text-ink dark:text-white">
                  {patient.emergencyContact.name} ({patient.emergencyContact.relationship})
                </Text>
                <Text className="font-sans text-[13px] text-brand-600 dark:text-brand-400">
                  {patient.emergencyContact.phone}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
