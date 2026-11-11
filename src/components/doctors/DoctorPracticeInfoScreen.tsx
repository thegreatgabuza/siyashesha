import { router } from 'expo-router';
import {
  AlertCircle,
  Building,
  ChevronRight,
  Clock,
  CreditCard,
  FileText,
  Globe,
  LogOut,
  MapPin,
  Phone,
  Settings as SettingsIcon,
  ShieldCheck,
  Stethoscope,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { AccountDeletionModal } from '@/components/security/AccountDeletionModal';
import { LegalDocumentModal, type LegalDocKind } from '@/components/security/LegalDocumentModal';
import { BrandLockup } from '@/components/ui/BrandLockup';
import { Screen } from '@/components/ui/Screen';
import { type DoctorProfile } from '@/data/doctors';
import { languageNames } from '@/i18n/translations';
import { useSafeClerk } from '@/lib/clerkAvatar';
import { useAppStore } from '@/store/useAppStore';

export function DoctorPracticeInfoScreen() {
  const doctorProfile = useAppStore((s) => s.doctorProfile);
  const registeredDoctors = useAppStore((s) => s.registeredDoctors);
  const language = useAppStore((s) => s.language);
  const signOut = useAppStore((s) => s.signOut);
  const { signOut: clerkSignOut } = useSafeClerk();

  const activeDoctor: DoctorProfile | undefined =
    doctorProfile ??
    registeredDoctors.find((d) => d.email.toLowerCase() === 'thobanisgabuzam2@gmail.com') ??
    registeredDoctors[0];

  const [legalDoc, setLegalDoc] = useState<LegalDocKind>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const confirmSignOut = () => {
    Alert.alert(
      'Sign Out of Practice Portal',
      'Are you sure you want to sign out? To access Siyashesha as a patient, sign in with your personal patient email.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await clerkSignOut();
            } catch (err) {
              console.warn('[Clerk] Sign out:', err);
            }
            signOut();
            router.replace('/(auth)/sign-in');
          },
        },
      ]
    );
  };

  return (
    <Screen contentClassName="px-4 pb-28">
      {/* Brand header */}
      <View className="pt-3 pb-2">
        <BrandLockup />
      </View>

      {/* Screen Title */}
      <View className="pt-2 pb-4">
        <View className="flex-row items-center gap-1.5">
          <Stethoscope size={14} color="#0B2559" />
          <Text className="font-sans-bold text-[12px] uppercase tracking-wider text-brand-900 dark:text-brand-300">
            Healthcare Practitioner
          </Text>
        </View>
        <Text className="font-sans-bold text-[24px] text-ink dark:text-white">
          Practice Information
        </Text>
        <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
          HPCSA credentials, practice rooms, consulting services & security
        </Text>
      </View>

      {/* Doctor & Practice Credentials Card */}
      <View className="overflow-hidden rounded-3xl border border-brand-500/30 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <View className="flex-row items-center gap-1.5">
              <Text className="font-sans-bold text-[20px] text-ink dark:text-white">
                {activeDoctor?.title || 'Dr.'} {activeDoctor?.fullName || 'Thobani Gabuza'}
              </Text>
              <View className="rounded-full bg-emerald-100 px-2.5 py-0.5 dark:bg-emerald-950">
                <Text className="font-sans-bold text-[10px] text-emerald-800 dark:text-emerald-300">
                  HPCSA Verified
                </Text>
              </View>
            </View>

            <Text className="mt-0.5 font-sans-medium text-[13px] text-brand-700 dark:text-brand-300">
              {activeDoctor?.specialty || 'General Practitioner'}
            </Text>

            <Text className="mt-1 font-sans text-[11px] text-slate-500 dark:text-slate-400">
              Registration: {activeDoctor?.hpcsaNumber || 'MP 0849210'}
            </Text>
          </View>

          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 shadow-2xs">
            <Stethoscope size={24} color="#FFFFFF" />
          </View>
        </View>

        {/* Practice Rooms Details */}
        <View className="mt-4 rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-800/60">
          <View className="flex-row items-center gap-1.5">
            <Building size={14} color="#0B2559" />
            <Text className="font-sans-bold text-[12px] text-brand-950 dark:text-white">
              {activeDoctor?.practiceName || 'Gabuza Family Medicine Practice'}
            </Text>
          </View>

          <View className="mt-2 flex-row items-start gap-1.5">
            <MapPin size={13} color="#64748B" style={{ marginTop: 2 }} />
            <Text className="flex-1 font-sans text-[12px] text-slate-600 dark:text-slate-300">
              {activeDoctor?.practiceAddress || 'Suite 204, Sandton Medical Suites, 83 Rivonia Rd'},{' '}
              {activeDoctor?.city || 'Johannesburg'}, {activeDoctor?.province || 'Gauteng'}
            </Text>
          </View>

          <View className="mt-2 flex-row items-center gap-1.5">
            <Phone size={13} color="#64748B" />
            <Text className="font-sans text-[12px] text-slate-600 dark:text-slate-300">
              {activeDoctor?.phone || '+27 82 456 7890'}
            </Text>
          </View>
        </View>

        {/* Consulting Availability */}
        <View className="mt-3 flex-row items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/30">
          <View className="flex-row items-center gap-1.5">
            <Clock size={13} color="#0B2559" />
            <Text className="font-sans-semibold text-[11px] text-slate-700 dark:text-slate-300">
              Consulting Hours
            </Text>
          </View>
          <Text className="font-sans text-[11px] text-slate-600 dark:text-slate-400">
            {activeDoctor?.availability
              ? `${activeDoctor.availability.days.join(', ')} · ${activeDoctor.availability.startTime} - ${activeDoctor.availability.endTime}`
              : 'Mon - Fri · 08:30 - 17:00'}
          </Text>
        </View>
      </View>

      {/* Services & Tariffs Card */}
      <View className="mt-4 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
        <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <View className="flex-row items-center gap-2">
            <CreditCard size={15} color="#0B2559" />
            <Text className="font-sans-bold text-[14px] text-ink dark:text-white">
              Consultation Services & Tariffs
            </Text>
          </View>
          <View className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
            <Text className="font-sans text-[10px] text-slate-600 dark:text-slate-400">
              {activeDoctor?.services?.length || 4} Active Services
            </Text>
          </View>
        </View>

        <View className="mt-3 gap-2.5">
          {(activeDoctor?.services || []).map((srv) => (
            <View
              key={srv.id}
              className="flex-row items-center justify-between rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"
            >
              <View className="flex-1 pr-3">
                <Text className="font-sans-bold text-[13px] text-ink dark:text-white">
                  {srv.name}
                </Text>
                <Text className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                  {srv.durationMinutes} minutes ·{' '}
                  {srv.mode === 'video'
                    ? '📹 Online Video'
                    : srv.mode === 'in_person'
                    ? '🏢 Physical Rooms'
                    : '🏢 Physical & 📹 Video'}
                </Text>
              </View>
              <View className="items-end">
                <Text className="font-sans-bold text-[14px] text-emerald-800 dark:text-emerald-300">
                  R{srv.priceZar}
                </Text>
                <Text className="font-sans text-[10px] text-slate-400">per consult</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Practice Preferences & App Configuration */}
      <View className="mt-4 rounded-3xl border border-slate-200/90 bg-white p-2 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
        {/* Settings & Security */}
        <Pressable
          onPress={() => router.push('/more/settings')}
          className="flex-row items-center justify-between rounded-2xl p-3 active:bg-slate-50 dark:active:bg-slate-800"
        >
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
              <SettingsIcon size={17} color="#0B2559" />
            </View>
            <View>
              <Text className="font-sans-bold text-[13px] text-ink dark:text-white">
                Security & Biometrics
              </Text>
              <Text className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                PIN lock, biometrics & consultation security
              </Text>
            </View>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </Pressable>

        {/* Language Selection */}
        <Pressable
          onPress={() => router.push('/more/language')}
          className="flex-row items-center justify-between rounded-2xl p-3 active:bg-slate-50 dark:active:bg-slate-800"
        >
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950">
              <Globe size={17} color="#2563EB" />
            </View>
            <View>
              <Text className="font-sans-bold text-[13px] text-ink dark:text-white">
                Interface Language
              </Text>
              <Text className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                {languageNames[language] || 'English'}
              </Text>
            </View>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </Pressable>

        {/* Privacy Policy & POPIA Compliance */}
        <Pressable
          onPress={() => setLegalDoc('privacy')}
          className="flex-row items-center justify-between rounded-2xl p-3 active:bg-slate-50 dark:active:bg-slate-800"
        >
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950">
              <ShieldCheck size={17} color="#059669" />
            </View>
            <View>
              <Text className="font-sans-bold text-[13px] text-ink dark:text-white">
                POPIA & Medical Records Privacy
              </Text>
              <Text className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                South African Health Record & POPI Act compliance
              </Text>
            </View>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </Pressable>

        {/* HPCSA Ethical Rules & Terms */}
        <Pressable
          onPress={() => setLegalDoc('terms')}
          className="flex-row items-center justify-between rounded-2xl p-3 active:bg-slate-50 dark:active:bg-slate-800"
        >
          <View className="flex-row items-center gap-3">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950">
              <FileText size={17} color="#7C3AED" />
            </View>
            <View>
              <Text className="font-sans-bold text-[13px] text-ink dark:text-white">
                Terms of Service & Clinical Governance
              </Text>
              <Text className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                Practitioner duties & Telehealth ethical rules
              </Text>
            </View>
          </View>
          <ChevronRight size={16} color="#94A3B8" />
        </Pressable>
      </View>

      {/* Role Notice & Account Session */}
      <View className="mt-4 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
        <View className="rounded-2xl bg-amber-50/70 p-3 border border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-900/40">
          <View className="flex-row items-center gap-1.5">
            <AlertCircle size={14} color="#D97706" />
            <Text className="font-sans-bold text-[12px] text-amber-900 dark:text-amber-200">
              Role-Locked Practitioner Mode
            </Text>
          </View>
          <Text className="mt-1 font-sans text-[11px] leading-4 text-amber-800/90 dark:text-amber-300">
            You are signed in as a verified practitioner. Your view is focused exclusively on patient bookings and medical info. If you wish to use Siyashesha as a patient, please sign in with your personal patient email.
          </Text>
        </View>

        {/* Sign Out Action */}
        <Pressable
          onPress={confirmSignOut}
          className="mt-3.5 flex-row items-center justify-center gap-2 rounded-2xl bg-rose-50 py-3 active:bg-rose-100 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900"
        >
          <LogOut size={15} color="#DC1F26" />
          <Text className="font-sans-bold text-[12px] text-rose-700 dark:text-rose-300">
            Sign Out of Practitioner Portal
          </Text>
        </Pressable>
      </View>

      {/* Legal Document Modal */}
      <LegalDocumentModal
        visibleDoc={legalDoc}
        onClose={() => setLegalDoc(null)}
      />

      {/* Account Deletion Modal */}
      <AccountDeletionModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
      />
    </Screen>
  );
}
