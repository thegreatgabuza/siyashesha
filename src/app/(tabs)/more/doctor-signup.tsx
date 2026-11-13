import { router } from 'expo-router';
import {
  ChevronLeft,
  ShieldCheck,
} from 'lucide-react-native';
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

import { ChunkyButton } from '@/components/onboarding/ChunkyButton';
import { useToast } from '@/components/ui/Toast';
import { DOCTOR_SPECIALTIES, type DoctorService } from '@/data/doctors';
import { tapFeedback } from '@/lib/feedback';
import { useAppStore } from '@/store/useAppStore';

export default function DoctorSignupScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const registerAsDoctor = useAppStore((s) => s.registerAsDoctor);
  const existingDoctor = useAppStore((s) => s.doctorProfile);
  const patient = useAppStore((s) => s.patientProfile);

  const [title, setTitle] = useState(existingDoctor?.title || 'Dr.');
  const [fullName, setFullName] = useState(
    existingDoctor?.fullName ||
      [patient.firstName, patient.lastName].filter(Boolean).join(' ') ||
      ''
  );
  const [specialty, setSpecialty] = useState(
    existingDoctor?.specialty || 'General Practitioner'
  );
  const [hpcsaNumber, setHpcsaNumber] = useState(existingDoctor?.hpcsaNumber || 'MP ');
  const [practiceName, setPracticeName] = useState(
    existingDoctor?.practiceName || ''
  );
  const [practiceAddress, setPracticeAddress] = useState(
    existingDoctor?.practiceAddress || ''
  );
  const [city, setCity] = useState(existingDoctor?.city || 'Johannesburg');
  const [province] = useState(existingDoctor?.province || 'Gauteng');
  const [phone, setPhone] = useState(existingDoctor?.phone || patient.phone || '');
  const [email, setEmail] = useState(existingDoctor?.email || patient.email || '');
  const [bio, setBio] = useState(existingDoctor?.bio || '');
  const [initialFee, setInitialFee] = useState('550');

  const handleRegister = () => {
    if (!fullName.trim()) {
      toast.show('Please enter your full name', 'warning');
      return;
    }
    if (!hpcsaNumber.trim() || hpcsaNumber.trim() === 'MP') {
      toast.show('Please enter your HPCSA / Professional registration number', 'warning');
      return;
    }
    if (!practiceName.trim()) {
      toast.show('Please enter your practice or clinic name', 'warning');
      return;
    }
    if (!phone.trim()) {
      toast.show('Please enter your contact phone number', 'warning');
      return;
    }

    tapFeedback();

    const startingFee = parseInt(initialFee.replace(/[^0-9]/g, ''), 10) || 500;

    // Create 2 starting services for the practitioner
    const starterServices: Omit<DoctorService, 'id' | 'doctorId'>[] = [
      {
        name: `${specialty} Consultation`,
        description: `Standard clinical consultation, diagnosis, and prescription at ${practiceName.trim()}.`,
        durationMinutes: 30,
        priceZar: startingFee,
        category: 'Consultation',
        mode: 'both',
        isActive: true,
      },
      {
        name: 'Follow-up & Prescription Renewal',
        description: 'Review of symptoms, lab tests, and medication adjustment.',
        durationMinutes: 15,
        priceZar: Math.round(startingFee * 0.6),
        category: 'Follow-up',
        mode: 'both',
        isActive: true,
      },
    ];

    const newDoc = registerAsDoctor(
      {
        title,
        fullName: fullName.trim(),
        specialty,
        hpcsaNumber: hpcsaNumber.trim().toUpperCase(),
        practiceName: practiceName.trim(),
        practiceAddress: practiceAddress.trim() || 'Medical Suites',
        city: city.trim(),
        province,
        phone: phone.trim(),
        email: email.trim(),
        bio:
          bio.trim() ||
          `Registered ${specialty} offering patient-centred care and consultations at ${practiceName.trim()}.`,
        qualifications: ['MBChB / Professional Degree'],
        rating: 5.0,
        reviewsCount: 1,
        consultationModes: ['in_person', 'video'],
        availability: {
          days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          startTime: '08:30',
          endTime: '17:00',
          slotDurationMinutes: 30,
        },
      },
      starterServices
    );

    toast.show(`Welcome, ${newDoc.title} ${newDoc.fullName}! Your practice is live.`, 'success');
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-slate-50 dark:bg-canvasdark"
    >
      {/* Header */}
      <View
        style={{ paddingTop: insets.top + 6 }}
        className="border-b border-slate-200/80 bg-white px-5 pb-3 shadow-xs dark:border-slate-800 dark:bg-canvasdark-card"
      >
        <View className="flex-row items-center gap-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
          >
            <ChevronLeft size={20} color="#0B2559" />
          </Pressable>
          <View>
            <Text className="font-display text-[24px] uppercase text-brand-900 dark:text-white">
              Practitioner Registration
            </Text>
            <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
              List your practice, add services, and accept patient bookings
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Verification Trust Pill */}
        <View className="mb-5 flex-row items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-50 p-3.5 dark:bg-emerald-950/20">
          <ShieldCheck size={20} color="#16A34A" />
          <View className="flex-1">
            <Text className="font-sans-bold text-[13px] text-emerald-900 dark:text-emerald-300">
              Verified Healthcare Provider Network
            </Text>
            <Text className="font-sans text-[12px] text-emerald-700 dark:text-emerald-400">
              Your HPCSA / Professional council number will display on your profile with a verified badge.
            </Text>
          </View>
        </View>

        {/* Form */}
        <View className="gap-4">
          {/* Title & Full Name */}
          <View className="flex-row gap-3">
            <View style={{ width: 85 }}>
              <Text className="mb-1.5 font-sans-semibold text-[13px] text-slate-700 dark:text-slate-300">
                Title
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Dr."
                placeholderTextColor="#94A3B8"
                className="rounded-xl border border-slate-200 bg-white px-3 py-3 font-sans text-[15px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </View>

            <View className="flex-1">
              <Text className="mb-1.5 font-sans-semibold text-[13px] text-slate-700 dark:text-slate-300">
                Full Name *
              </Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Sipho Sithole"
                placeholderTextColor="#94A3B8"
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-sans text-[15px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </View>
          </View>

          {/* HPCSA Number */}
          <View>
            <Text className="mb-1.5 font-sans-semibold text-[13px] text-slate-700 dark:text-slate-300">
              HPCSA / Professional Registration Number *
            </Text>
            <TextInput
              value={hpcsaNumber}
              onChangeText={setHpcsaNumber}
              placeholder="e.g. MP 0789201"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-sans text-[15px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </View>

          {/* Specialty */}
          <View>
            <Text className="mb-1.5 font-sans-semibold text-[13px] text-slate-700 dark:text-slate-300">
              Primary Medical Specialty *
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
              {DOCTOR_SPECIALTIES.map((sp) => {
                const isSelected = specialty === sp;
                return (
                  <Pressable
                    key={sp}
                    onPress={() => {
                      tapFeedback();
                      setSpecialty(sp);
                    }}
                    className={`rounded-full px-3.5 py-2 border ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                    }`}
                  >
                    <Text
                      className={`font-sans-semibold text-[12px] ${
                        isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {sp}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Practice Name */}
          <View>
            <Text className="mb-1.5 font-sans-semibold text-[13px] text-slate-700 dark:text-slate-300">
              Practice / Clinic Name *
            </Text>
            <TextInput
              value={practiceName}
              onChangeText={setPracticeName}
              placeholder="e.g. Sithole Family Health Clinic, Sandton Medical Suites"
              placeholderTextColor="#94A3B8"
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 font-sans text-[15px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </View>

          {/* Practice Address & City */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-1.5 font-sans-semibold text-[13px] text-slate-700 dark:text-slate-300">
                Street Address
              </Text>
              <TextInput
                value={practiceAddress}
                onChangeText={setPracticeAddress}
                placeholder="Suite 101, 45 Central Ave"
                placeholderTextColor="#94A3B8"
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-sans text-[14px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </View>
            <View style={{ width: 130 }}>
              <Text className="mb-1.5 font-sans-semibold text-[13px] text-slate-700 dark:text-slate-300">
                City
              </Text>
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="Johannesburg"
                placeholderTextColor="#94A3B8"
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-sans text-[14px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </View>
          </View>

          {/* Phone & Email */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-1.5 font-sans-semibold text-[13px] text-slate-700 dark:text-slate-300">
                Contact Phone *
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="+27 11 456 7890"
                keyboardType="phone-pad"
                placeholderTextColor="#94A3B8"
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-sans text-[14px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </View>
            <View className="flex-1">
              <Text className="mb-1.5 font-sans-semibold text-[13px] text-slate-700 dark:text-slate-300">
                Email
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="dr.sithole@clinic.co.za"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#94A3B8"
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 font-sans text-[14px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </View>
          </View>

          {/* Standard Consultation Fee */}
          <View>
            <Text className="mb-1.5 font-sans-semibold text-[13px] text-slate-700 dark:text-slate-300">
              Standard Consultation Fee (ZAR R)
            </Text>
            <View className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800">
              <Text className="font-sans-bold text-[15px] text-brand-700 dark:text-brand-300 mr-2">
                R
              </Text>
              <TextInput
                value={initialFee}
                onChangeText={setInitialFee}
                keyboardType="numeric"
                placeholder="550"
                placeholderTextColor="#94A3B8"
                className="flex-1 py-1.5 font-sans text-[15px] text-slate-900 dark:text-white"
              />
            </View>
            <Text className="mt-1 font-sans text-[11px] text-slate-400">
              You can add more custom services, follow-up rates, and procedures inside your practice portal.
            </Text>
          </View>

          {/* Professional Bio */}
          <View>
            <Text className="mb-1.5 font-sans-semibold text-[13px] text-slate-700 dark:text-slate-300">
              Professional Bio & Clinical Focus
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell patients about your clinical experience, special interests, and approach to care..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              style={{ textAlignVertical: 'top' }}
              className="min-h-[85px] rounded-xl border border-slate-200 bg-white p-3 font-sans text-[14px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </View>

          {/* Submit Button */}
          <View className="mt-4 mb-8">
            <ChunkyButton
              label="Register Practice & Open Doctor Portal"
              onPress={handleRegister}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
