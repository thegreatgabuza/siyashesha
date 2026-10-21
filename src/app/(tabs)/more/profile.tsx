import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { heroShadow } from '@/components/ui/HeroAction';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useToast } from '@/components/ui/Toast';
import { useAppStore } from '@/store/useAppStore';

export default function ProfileScreen() {
  const toast = useToast();
  const profile = useAppStore((s) => s.patientProfile);
  const updateProfile = useAppStore((s) => s.updatePatientProfile);

  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);
  const [address, setAddress] = useState(profile.address);
  const [emergencyName, setEmergencyName] = useState(profile.emergencyContact.name);
  const [emergencyPhone, setEmergencyPhone] = useState(profile.emergencyContact.phone);

  const handleSave = () => {
    updateProfile({
      phone,
      email,
      address,
      emergencyContact: { ...profile.emergencyContact, name: emergencyName, phone: emergencyPhone },
    });
    toast.show('Profile updated', 'success');
    router.back();
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50 dark:bg-canvasdark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Profile" onBack={() => router.back()} />
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 48 }}>
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
              <Text className="font-sans-bold text-[16px] text-white">{profile.bloodGroup}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-sans text-[11px] text-white/60">Province</Text>
              <Text className="font-sans-bold text-[16px] text-white" numberOfLines={1}>{profile.province}</Text>
            </View>
            <View className="flex-1">
              <Text className="font-sans text-[11px] text-white/60">Contact</Text>
              <Text className="font-sans-bold text-[16px] text-white">{profile.emergencyContact.name.split(' ')[0]}</Text>
            </View>
          </View>
        </View>

        <SectionLabel text="Demographics" />
        <ReadOnlyRow label="Date of birth" value={profile.dateOfBirth} />
        <ReadOnlyRow label="ID number" value={profile.idNumber} />
        <ReadOnlyRow label="Gender" value={profile.gender} />
        <ReadOnlyRow label="Province" value={profile.province} />

        <SectionLabel text="Contact information" />
        <Field label="Mobile number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Field label="Email address" value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Field label="Address" value={address} onChangeText={setAddress} multiline />

        <SectionLabel text="Clinical summary" />
        <ReadOnlyRow label="Blood group" value={profile.bloodGroup} />
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

        <Text className="mt-4 text-center font-sans text-[11px] text-ink-muted dark:text-slate-500">
          Demographic and clinical details are drawn from your confirmed medical records. To update
          them, add or confirm a new record in your vault.
        </Text>
      </ScrollView>
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
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'phone-pad' | 'email-address';
  multiline?: boolean;
}) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        className="min-h-[44px] rounded-2xl border border-slate-200 bg-white px-4 py-3 font-sans text-[14px] text-ink dark:border-canvasdark-card dark:bg-canvasdark-card dark:text-slate-50"
      />
    </View>
  );
}
