import { router } from 'expo-router';
import { Archive, ShieldCheck, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { bloodGroupLabel } from '@/lib/bloodGroup';

import { Avatar } from '@/components/ui/Avatar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { heroShadow } from '@/components/ui/HeroAction';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useToast } from '@/components/ui/Toast';
import { useAppStore } from '@/store/useAppStore';
import { syncPatientProfileToDatabase } from '@/lib/supabase';
import { AccountDeletionModal } from '@/components/security/AccountDeletionModal';
import { DsarExportModal } from '@/components/security/DsarExportModal';

export default function ProfileScreen() {
  const toast = useToast();
  const profile = useAppStore((s) => s.patientProfile);
  const updateProfile = useAppStore((s) => s.updatePatientProfile);

  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [address, setAddress] = useState(profile.address);
  const [province, setProvince] = useState(profile.province || 'Gauteng');
  const [emergencyName, setEmergencyName] = useState(profile.emergencyContact.name);
  const [emergencyPhone, setEmergencyPhone] = useState(profile.emergencyContact.phone);

  const [dsarVisible, setDsarVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const handleSave = () => {
    const patch = {
      phone,
      email,
      address,
      province,
      emergencyContact: { ...profile.emergencyContact, name: emergencyName, phone: emergencyPhone },
    };
    updateProfile(patch);
    syncPatientProfileToDatabase({
      ...profile,
      ...patch,
    }).catch(() => {});
    toast.show('Profile updated & synced', 'success');
    router.back();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50 dark:bg-canvasdark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Profile" onBack={() => router.back()} />
      <ScreenScroll className="flex-1 px-5">
        <View className="mt-2 rounded-[32px] bg-ink p-5 dark:bg-canvasdark-card" style={heroShadow}>
          <View className="flex-row items-center gap-4">
            <Avatar name={profile.preferredName} size={64} />
            <View className="flex-1">
              <Text className="font-sans-bold text-[20px] text-white" numberOfLines={1}>
                {profile.firstName} {profile.lastName}
              </Text>
              <Text className="font-sans text-[12px] text-white/60">
                Member since {new Date(profile.memberSince).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}
              </Text>
            </View>
          </View>
          <View className="mt-4 flex-row rounded-2xl bg-white/10 px-4 py-3">
            <View className="flex-1">
              <Text className="font-sans text-[11px] text-white/60">Blood group</Text>
              <Text className="font-sans-bold text-[16px] text-white">{bloodGroupLabel(profile.bloodGroup)}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-sans text-[11px] text-white/60">Province</Text>
              <Text className="font-sans-bold text-[16px] text-white" numberOfLines={1}>{province}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-sans text-[11px] text-white/60">Contact</Text>
              <Text className="font-sans-bold text-[16px] text-white">{emergencyName.split(' ')[0] || 'Unknown'}</Text>
            </View>
          </View>
        </View>

        <SectionLabel text="Demographics" />
        <ReadOnlyRow label="Date of birth" value={profile.dateOfBirth} />
        <ReadOnlyRow label="ID number" value={profile.idNumber} />
        <ReadOnlyRow label="Gender" value={profile.gender} />
        <Field label="Province" value={province} onChangeText={setProvince} placeholder="e.g. Gauteng, Western Cape" />

        <SectionLabel text="Contact information" />
        <Field label="Mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Field label="Address" value={address} onChangeText={setAddress} multiline />

        <SectionLabel text="Clinical summary" />
        <ReadOnlyRow label="Blood group" value={bloodGroupLabel(profile.bloodGroup)} />
        <ReadOnlyRow
          label="Allergies"
          value={profile.allergies.map((a) => a.substance).join(', ') || 'None recorded'}
        />
        <ReadOnlyRow label="Chronic conditions" value={profile.chronicConditions.join(', ')} />

        <SectionLabel text="Emergency contact" />
        <Field label="Contact name" value={emergencyName} onChangeText={setEmergencyName} />
        <Field label="Contact number" value={emergencyPhone} onChangeText={setEmergencyPhone} keyboardType="phone-pad" />

        <View className="mt-4">
          <PrimaryButton label="Save changes" onPress={handleSave} />
        </View>

        {/* POPIA & HIPAA Data Rights Box */}
        <SectionLabel text="POPIA & HIPAA Data Rights" />
        <View className="mb-4 gap-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
          <View className="mb-1 flex-row items-center gap-2">
            <ShieldCheck size={16} color="#0D7C66" />
            <Text className="font-sans-bold text-[14px] text-ink dark:text-slate-50">
              Patient Data Sovereignty
            </Text>
          </View>
          <Text className="font-sans text-[12px] leading-[17px] text-ink-muted dark:text-slate-400">
            Under South Africa&apos;s POPIA Act Section 23/24 and HIPAA rules, you can download a complete archive of your health records or permanently erase your data at any time.
          </Text>

          <View className="mt-2 flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Export DSAR Archive"
              onPress={() => setDsarVisible(true)}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-slate-100 py-3 dark:bg-canvasdark"
            >
              <Archive size={15} color="#0B2559" />
              <Text className="font-sans-semibold text-[13px] text-ink dark:text-slate-50">Export (DSAR)</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Erase Data and Delete Account"
              onPress={() => setDeleteModalVisible(true)}
              className="flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-emergency-50/70 py-3 dark:bg-emergency-500/15"
            >
              <Trash2 size={15} color="#DC1F26" />
              <Text className="font-sans-semibold text-[13px] text-emergency-500">Erase Data</Text>
            </Pressable>
          </View>
        </View>

        <Text className="mt-1 text-center font-sans text-[11px] text-ink-muted dark:text-slate-500">
          Demographic and clinical details are drawn from your confirmed medical records. To update
          them, add or confirm a new record in your vault.
        </Text>
      </ScreenScroll>

      {/* POPIA / HIPAA Modals */}
      <DsarExportModal visible={dsarVisible} onClose={() => setDsarVisible(false)} />
      <AccountDeletionModal
        visible={deleteModalVisible}
        onClose={() => setDeleteModalVisible(false)}
        onOpenDsarExport={() => setDsarVisible(true)}
      />
    </KeyboardAvoidingView>
  );
}

function SectionLabel({ text }: { text: string }) {
  return (
    <View className="pt-6">
      <SectionHeader title={text} />
    </View>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-2.5 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-canvasdark-card dark:bg-canvasdark-card">
      <Text className="font-sans text-[13px] text-ink-muted dark:text-slate-400">{label}</Text>
      <Text className="flex-1 pl-3 text-right font-sans-medium text-[13px] text-ink dark:text-slate-50">
        {value}
      </Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  multiline,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'phone-pad' | 'email-address';
  multiline?: boolean;
  placeholder?: string;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholder={placeholder}
        placeholderTextColor="#8C98B8"
        className="min-h-[44px] rounded-2xl border border-slate-200 bg-white px-4 py-3 font-sans text-[14px] text-ink dark:border-canvasdark-card dark:bg-canvasdark-card dark:text-slate-50"
      />
    </View>
  );
}
