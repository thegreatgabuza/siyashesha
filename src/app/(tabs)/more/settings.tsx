import { useClerk } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { safeBack } from '@/lib/navigation';
import {
  Archive,
  BookOpen,
  ChevronRight,
  Download,
  FileText,
  Globe,
  Lock,
  LogOut,
  Moon,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Platform, Pressable, Switch, Text, View } from 'react-native';

import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { heroShadow } from '@/components/ui/HeroAction';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useToast } from '@/components/ui/Toast';
import { languageNames } from '@/i18n/translations';
import { useAppStore, type ThemePreference } from '@/store/useAppStore';
import { AccountDeletionModal } from '@/components/security/AccountDeletionModal';
import { AiConsentModal } from '@/components/security/AiConsentModal';
import { ClinicalCitationsModal } from '@/components/security/ClinicalCitationsModal';
import { DsarExportModal } from '@/components/security/DsarExportModal';
import { LegalDocumentModal, type LegalDocKind } from '@/components/security/LegalDocumentModal';
import { useAccent } from '@/hooks/useAccent';
import { ensureNotificationPermission, syncReminders } from '@/lib/reminders';
import {
  authenticateWithBiometrics,
  getBiometricCapabilities,
  getOrCreateEnclaveKey,
  type BiometricCapabilities,
} from '@/lib/security/enclaveSecurity';

export default function SettingsScreen() {
  const { accent, accentSoft } = useAccent();
  const toast = useToast();
  const mfaEnabled = useAppStore((s) => s.mfaEnabled);
  const setMfaEnabled = useAppStore((s) => s.setMfaEnabled);
  const sharingRequiresPin = useAppStore((s) => s.sharingRequiresPin);
  const setSharingRequiresPin = useAppStore((s) => s.setSharingRequiresPin);
  const aiConsentGranted = useAppStore((s) => s.aiConsentGranted);
  const setAiConsentGranted = useAppStore((s) => s.setAiConsentGranted);
  const notifications = useAppStore((s) => s.notifications);
  const setNotification = useAppStore((s) => s.setNotification);
  const themePreference = useAppStore((s) => s.themePreference);
  const setThemePreference = useAppStore((s) => s.setThemePreference);
  const language = useAppStore((s) => s.language);
  const auditEvents = useAppStore((s) => s.auditEvents);
  const signOut = useAppStore((s) => s.signOut);
  const biometricLock = useAppStore((s) => s.biometricLock);
  const setBiometricLock = useAppStore((s) => s.setBiometricLock);
  const lockApp = useAppStore((s) => s.lockApp);
  const { signOut: clerkSignOut } = useClerk();

  const [capabilities, setCapabilities] = useState<BiometricCapabilities | null>(null);
  const [dsarVisible, setDsarVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [aiConsentModalVisible, setAiConsentModalVisible] = useState(false);
  const [citationsVisible, setCitationsVisible] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocKind>(null);

  useEffect(() => {
    getBiometricCapabilities().then(setCapabilities);
  }, []);

  const toggleBiometric = async (value: boolean) => {
    if (!value) {
      const verify = await authenticateWithBiometrics('Confirm identity to disable biometric lock');
      if (!verify.success) {
        toast.show('Identity verification required to turn off biometric lock', 'warning');
        return;
      }
      setBiometricLock(false);
      toast.show('Biometric lock disabled', 'info');
      return;
    }

    if (capabilities && !capabilities.hasHardware && Platform.OS !== 'web') {
      toast.show('Biometric hardware is not available on this device', 'warning');
      return;
    }

    const result = await authenticateWithBiometrics(
      `Confirm to enable ${capabilities?.label || 'biometric lock'}`
    );
    if (result.success) {
      await getOrCreateEnclaveKey();
      setBiometricLock(true);
      toast.show(`${capabilities?.label || 'Biometric lock'} enabled with Secure Enclave`, 'success');
    } else {
      toast.show(result.error || 'Authentication cancelled', 'warning');
    }
  };

  const notificationValues = Object.values(notifications);
  const notificationsOn = notificationValues.filter(Boolean).length;
  const notificationTotal = notificationValues.length;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-canvasdark">
      <ScreenHeader title="Settings" onBack={() => safeBack('/(tabs)/more')} />
      <ScreenScroll className="flex-1 px-5">
        <View className="mt-2 rounded-[32px] bg-ink p-5 dark:bg-canvasdark-card" style={heroShadow}>
          <Text className="font-sans-semibold text-[13px] text-white/70">Account protection</Text>
          <View className="mt-4 flex-row gap-2">
            <View className="flex-1 rounded-2xl bg-white/10 px-4 py-3">
              <Text className="font-sans text-[11px] text-white/60">Two-factor</Text>
              <Text className="font-sans-bold text-[16px] text-white">{mfaEnabled ? 'On' : 'Off'}</Text>
            </View>
            <View className="flex-1 rounded-2xl bg-white/10 px-4 py-3">
              <Text className="font-sans text-[11px] text-white/60">Sharing PIN</Text>
              <Text className="font-sans-bold text-[16px] text-white">{sharingRequiresPin ? 'On' : 'Off'}</Text>
            </View>
            <View className="flex-1 rounded-2xl bg-white/10 px-4 py-3">
              <Text className="font-sans text-[11px] text-white/60">Reminders</Text>
              <Text className="font-sans-bold text-[16px] text-white">{notificationsOn}/{notificationTotal}</Text>
            </View>
          </View>
          <Text className="mt-4 font-sans text-[12px] leading-[17px] text-white/60">
            Language: {languageNames[language]} · {auditEvents.length} account events logged
          </Text>
        </View>

        <SectionLabel text="Security" />
        <ToggleRow
          icon={<ShieldCheck size={16} color={accent} />}
          label="Two-factor authentication"
          caption="Require a 6-digit code on every login"
          value={mfaEnabled}
          onValueChange={setMfaEnabled}
        />
        <ToggleRow
          icon={<Lock size={16} color={accent} />}
          label={`Lock with ${capabilities?.label || 'Face ID / Fingerprint'}`}
          caption="Enclave-encrypted; prompts on launch and after 15s in background"
          value={biometricLock}
          onValueChange={toggleBiometric}
        />
        {biometricLock ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Lock Health Passport Now"
            onPress={() => {
              lockApp();
              toast.show('Health passport locked', 'info');
            }}
            className="mb-2 mt-1 flex-row items-center justify-center gap-2 rounded-2xl border border-brand-500/30 bg-brand-50/70 py-3 dark:border-brand-500/20 dark:bg-brand-500/10"
          >
            <Lock size={15} color={accent} />
            <Text className="font-sans-semibold text-[13px] text-brand-700 dark:text-brand-300">
              Lock Health Passport Now
            </Text>
          </Pressable>
        ) : null}

        <ToggleRow
          icon={<Sparkles size={16} color={accent} />}
          label="Cloud AI Assistant & OCR (Google Gemini)"
          caption="Explicit permission to process questions & scans with Google Gemini AI"
          value={aiConsentGranted}
          onValueChange={(value) => {
            if (value) {
              setAiConsentModalVisible(true);
            } else {
              setAiConsentGranted(false);
              toast.show('Switched to 100% On-Device Offline Mode', 'info');
            }
          }}
        />

        <SectionLabel text="Sharing security" />
        <ToggleRow
          label="Require access PIN"
          caption="Recipients need a temporary PIN before opening shared records"
          value={sharingRequiresPin}
          onValueChange={setSharingRequiresPin}
        />

        <SectionLabel text="Notifications" />
        <ToggleRow
          label="Medication reminders"
          value={notifications.medicationReminders}
          onValueChange={async (v) => {
            if (v && !(await ensureNotificationPermission())) {
              toast.show('Allow notifications in your phone settings to get reminders', 'warning');
              return;
            }
            setNotification('medicationReminders', v);
            await syncReminders();
          }}
        />
        <ToggleRow
          label="Educational health tips"
          value={notifications.educationalTips}
          onValueChange={async (v) => {
            if (v && !(await ensureNotificationPermission())) {
              toast.show('Allow notifications in your phone settings to get tips', 'warning');
              return;
            }
            setNotification('educationalTips', v);
            await syncReminders();
          }}
        />
        <ToggleRow
          label="Wellness check-ins"
          value={notifications.wellnessCheckins}
          onValueChange={async (v) => {
            if (v && !(await ensureNotificationPermission())) {
              toast.show('Allow notifications in your phone settings to get check-ins', 'warning');
              return;
            }
            setNotification('wellnessCheckins', v);
            await syncReminders();
          }}
        />

        <SectionLabel text="Appearance" />
        <View className="mb-2 flex-row gap-2 rounded-2xl border border-slate-200 bg-white p-2 dark:border-canvasdark-card dark:bg-canvasdark-card">
          {(['system', 'light', 'dark'] as ThemePreference[]).map((mode) => (
            <Pressable
              key={mode}
              accessibilityRole="radio"
              accessibilityState={{ selected: themePreference === mode }}
              accessibilityLabel={`${mode} appearance`}
              onPress={() => setThemePreference(mode)}
              className={`min-h-[40px] flex-1 flex-row items-center justify-center gap-1.5 rounded-xl ${
                themePreference === mode ? 'bg-ink dark:bg-brand-400' : ''
              }`}
            >
              {mode === 'dark' ? (
                <Moon size={14} color={themePreference === mode ? '#FFFFFF' : '#5B6478'} />
              ) : null}
              <Text
                className={`font-sans-medium text-[13px] capitalize ${
                  themePreference === mode ? 'text-white' : 'text-ink-muted dark:text-slate-400'
                }`}
              >
                {mode}
              </Text>
            </Pressable>
          ))}
        </View>

        <SectionLabel text="Language" />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change language"
          onPress={() => router.push('/more/language')}
          className="mb-2 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 dark:border-canvasdark-card dark:bg-canvasdark-card"
        >
          <View className="flex-row items-center gap-2.5">
            <Globe size={16} color="#5B6478" />
            <Text className="font-sans-medium text-[14px] text-ink dark:text-slate-50">App language</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Text className="font-sans text-[13px] text-ink-muted dark:text-slate-400">
              {languageNames[language]}
            </Text>
            <ChevronRight size={16} color={accentSoft} />
          </View>
        </Pressable>

        <SectionLabel text="Account activity audit" />
        <View className="rounded-2xl border border-slate-200 bg-white dark:border-canvasdark-card dark:bg-canvasdark-card">
          {auditEvents.slice(0, 8).map((event, i) => (
            <View
              key={event.id}
              className={`px-4 py-3 ${i > 0 ? 'border-t border-slate-100 dark:border-canvasdark' : ''}`}
            >
              <Text className="font-sans text-[13px] text-ink dark:text-slate-50">{event.description}</Text>
              <Text className="mt-0.5 font-sans text-[11px] text-ink-muted dark:text-slate-500">
                {new Date(event.timestamp).toLocaleString('en-ZA', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            </View>
          ))}
        </View>

        <SectionLabel text="POPIA & HIPAA Data Rights" />
        <View className="mb-2 gap-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
          <View className="mb-1 flex-row items-center gap-2">
            <ShieldCheck size={16} color="#0D7C66" />
            <Text className="font-sans-bold text-[14px] text-ink dark:text-slate-50">
              Patient Data Rights & Erasure
            </Text>
          </View>
          <Text className="font-sans text-[12px] leading-[17px] text-ink-muted dark:text-slate-400">
            Under South Africa&apos;s POPIA Act Section 23/24 and HIPAA rules, you have the right to download a complete archive of your health records, or permanently erase your data.
          </Text>

          {/* Download DSAR Archive Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Download Health Data Archive under POPIA Section 23"
            onPress={() => setDsarVisible(true)}
            className="mt-2 flex-row items-center justify-between rounded-xl bg-slate-50 p-3.5 dark:bg-canvasdark"
          >
            <View className="flex-1 flex-row items-center gap-3 pr-2">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-brand-50 dark:bg-brand-500/20">
                <Archive size={17} color={accent} />
              </View>
              <View className="flex-1">
                <Text className="font-sans-semibold text-[13px] text-ink dark:text-slate-50">
                  Export Health Archive (DSAR)
                </Text>
                <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">
                  Full machine-readable JSON & certified records archive
                </Text>
              </View>
            </View>
            <Download size={16} color={accent} />
          </Pressable>

          {/* Delete Account & Erase Data Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete Account and Erase Health Data under POPIA Section 24"
            onPress={() => setDeleteModalVisible(true)}
            className="mt-1 flex-row items-center justify-between rounded-xl bg-emergency-50/50 p-3.5 dark:bg-emergency-500/10"
          >
            <View className="flex-1 flex-row items-center gap-3 pr-2">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-emergency-100 dark:bg-emergency-500/20">
                <Trash2 size={17} color="#DC1F26" />
              </View>
              <View className="flex-1">
                <Text className="font-sans-semibold text-[13px] text-emergency-500">
                  Delete Account & Erase Data
                </Text>
                <Text className="font-sans text-[11px] text-emergency-500/70">
                  POPIA §24 & Apple Guideline 5.1.1(v) · Permanent & irreversible
                </Text>
              </View>
            </View>
            <ChevronRight size={16} color="#DC1F26" />
          </Pressable>
        </View>

        <SectionLabel text="Legal, Privacy & Medical Citations" />
        <View className="mb-2 gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Medical Disclaimer and Clinical Citations"
            onPress={() => setCitationsVisible(true)}
            className="flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 dark:border-canvasdark-card dark:bg-canvasdark-card"
          >
            <View className="flex-row items-center gap-2.5">
              <BookOpen size={16} color={accent} />
              <Text className="font-sans-medium text-[14px] text-ink dark:text-slate-50">
                Clinical Disclaimer & Medical Sources
              </Text>
            </View>
            <ChevronRight size={16} color={accentSoft} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Terms of Use and End User License Agreement"
            onPress={() => setLegalDoc('terms')}
            className="flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 dark:border-canvasdark-card dark:bg-canvasdark-card"
          >
            <View className="flex-row items-center gap-2.5">
              <FileText size={16} color="#5B6478" />
              <Text className="font-sans-medium text-[14px] text-ink dark:text-slate-50">
                Terms of Use (EULA)
              </Text>
            </View>
            <ChevronRight size={16} color={accentSoft} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Privacy Policy and POPIA Notice"
            onPress={() => setLegalDoc('privacy')}
            className="flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 dark:border-canvasdark-card dark:bg-canvasdark-card"
          >
            <View className="flex-row items-center gap-2.5">
              <Lock size={16} color="#5B6478" />
              <Text className="font-sans-medium text-[14px] text-ink dark:text-slate-50">
                Privacy Policy (POPIA & Data Notice)
              </Text>
            </View>
            <ChevronRight size={16} color={accentSoft} />
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={() =>
            Alert.alert('Sign out?', 'You will need to verify your email again to sign back in.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Sign out',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await clerkSignOut();
                  } catch (err) {
                    console.warn('[Clerk] Sign out error:', err);
                  }
                  signOut();
                },
              },
            ])
          }
          className="mb-2 mt-6 flex-row items-center justify-center gap-2 rounded-full border border-emergency-500 py-3.5"
        >
          <LogOut size={16} color="#DC1F26" />
          <Text className="font-sans-semibold text-[14px] text-emergency-500">Sign out</Text>
        </Pressable>
      </ScreenScroll>

      {/* POPIA / HIPAA & Apple Compliance Modals */}
      <DsarExportModal visible={dsarVisible} onClose={() => setDsarVisible(false)} />
      <AccountDeletionModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onOpenDsarExport={() => setDsarVisible(true)}
      />
      <AiConsentModal
        visible={aiConsentModalVisible}
        onAllowCloudAi={() => {
          setAiConsentGranted(true);
          setAiConsentModalVisible(false);
          toast.show('Cloud AI (Google Gemini) enabled', 'success');
        }}
        onUseOnDeviceOnly={() => {
          setAiConsentGranted(false);
          setAiConsentModalVisible(false);
          toast.show('On-Device Offline Mode active', 'info');
        }}
        onClose={() => setAiConsentModalVisible(false)}
      />
      <ClinicalCitationsModal visible={citationsVisible} onClose={() => setCitationsVisible(false)} />
      <LegalDocumentModal visibleDoc={legalDoc} onClose={() => setLegalDoc(null)} />
    </View>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <View className="pt-6">
      <SectionHeader title={text} />
    </View>
  );
}

function ToggleRow({
  icon,
  label,
  caption,
  value,
  onValueChange,
}: {
  icon?: React.ReactNode;
  label: string;
  caption?: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
}) {
  const { accent } = useAccent();
  return (
    <View className="mb-2 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3.5 dark:border-canvasdark-card dark:bg-canvasdark-card">
      <View className="flex-1 flex-row items-center gap-2.5 pr-3">
        {icon}
        <View className="flex-1">
          <Text className="font-sans-medium text-[14px] text-ink dark:text-slate-50">{label}</Text>
          {caption ? (
            <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">{caption}</Text>
          ) : null}
        </View>
      </View>
      <Switch
                thumbColor="#FFFFFF" value={value} onValueChange={onValueChange} trackColor={{ true: accent, false: '#E3E8F0' }} />
    </View>
  );
}
