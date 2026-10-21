import { router } from 'expo-router';
import {
  ChevronRight,
  Globe,
  LogOut,
  Moon,
  ShieldCheck,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { heroShadow } from '@/components/ui/HeroAction';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useToast } from '@/components/ui/Toast';
import { languageNames } from '@/i18n/translations';
import { useAppStore, type ThemePreference } from '@/store/useAppStore';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAccent } from '@/hooks/useAccent';
import { ensureNotificationPermission, syncReminders } from '@/lib/reminders';

export default function SettingsScreen() {
  const { accent, accentSoft } = useAccent();
  const toast = useToast();
  const mfaEnabled = useAppStore((s) => s.mfaEnabled);
  const setMfaEnabled = useAppStore((s) => s.setMfaEnabled);
  const sharingRequiresPin = useAppStore((s) => s.sharingRequiresPin);
  const setSharingRequiresPin = useAppStore((s) => s.setSharingRequiresPin);
  const notifications = useAppStore((s) => s.notifications);
  const setNotification = useAppStore((s) => s.setNotification);
  const themePreference = useAppStore((s) => s.themePreference);
  const setThemePreference = useAppStore((s) => s.setThemePreference);
  const language = useAppStore((s) => s.language);
  const auditEvents = useAppStore((s) => s.auditEvents);
  const signOut = useAppStore((s) => s.signOut);
  const biometricLock = useAppStore((s) => s.biometricLock);
  const setBiometricLock = useAppStore((s) => s.setBiometricLock);

  const toggleBiometric = async (value: boolean) => {
    if (!value) {
      setBiometricLock(false);
      return;
    }
    const hardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hardware || !enrolled) {
      toast.show('Set up Face ID or a fingerprint in your phone settings first', 'warning');
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Confirm to turn on biometric lock', cancelLabel: 'Cancel' });
    if (result.success) {
      setBiometricLock(true);
      toast.show('Biometric lock on', 'success');
    }
  };

  const notificationValues = Object.values(notifications);
  const notificationsOn = notificationValues.filter(Boolean).length;
  const notificationTotal = notificationValues.length;

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  return (
    <View className="flex-1 bg-slate-50 dark:bg-canvasdark">
      <ScreenHeader title="Settings" onBack={() => router.back()} />
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 48 }}>
        <View className="mt-2 rounded-[32px] bg-ink p-5 dark:bg-canvasdark-card" style={heroShadow}>
          <Text className="font-sans-semibold text-[13px] text-white/70">Account protection</Text>
          <View className="mt-4 flex-row gap-2">
            <View className="flex-1 rounded-2xl bg-white/10 px-4 py-3">
              <Text className="font-sans text-[11px] text-white/60">Two-factor</Text>
              <Text className="font-sans-bold text-[16px] text-white">{mfaEnabled ? 'On' : 'Off'}</Text>
            </View>
            <View className="flex-1 rounded-2xl bg-white/10 px-4 py-3">
              <Text className="font-sans text-[11px] text-white/60">Sharing PIN</Text>
              <Text className="font-sans-bold text-[16px] text-white">{sharingRequiresPin ? 'Required' : 'Off'}</Text>
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
          label="Lock with Face ID or fingerprint"
          caption="Asks for you before the app opens"
          value={biometricLock}
          onValueChange={toggleBiometric}
        />
        <View className="mt-2 gap-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
          <Text className="mb-1 font-sans-semibold text-[13px] text-ink dark:text-slate-50">
            Change password
          </Text>
          <SecretInput placeholder="Current password" value={currentPw} onChangeText={setCurrentPw} />
          <SecretInput placeholder="New password" value={newPw} onChangeText={setNewPw} />
          <SecretInput placeholder="Confirm new password" value={confirmPw} onChangeText={setConfirmPw} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Password change is not available yet"
            accessibilityState={{ disabled: true }}
            disabled
            className="mt-1 min-h-[40px] items-center justify-center rounded-full bg-slate-200 dark:bg-canvasdark"
          >
            <Text className="font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">
              Available once account sign-in is set up
            </Text>
          </Pressable>
        </View>

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

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={() =>
            Alert.alert('Sign out?', 'You will need to verify your phone number again to sign back in.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign out', style: 'destructive', onPress: signOut },
            ])
          }
          className="mb-2 mt-6 flex-row items-center justify-center gap-2 rounded-full border border-emergency-500 py-3.5"
        >
          <LogOut size={16} color="#DC1F26" />
          <Text className="font-sans-semibold text-[14px] text-emergency-500">Sign out</Text>
        </Pressable>
      </ScrollView>
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
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: accent, false: '#E3E8F0' }} />
    </View>
  );
}

function SecretInput(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      secureTextEntry
      placeholderTextColor="#8C98B8"
      className="mb-2 min-h-[40px] rounded-xl border border-slate-200 bg-slate-50 px-3 font-sans text-[13px] text-ink dark:border-canvasdark dark:bg-canvasdark dark:text-slate-50"
    />
  );
}
