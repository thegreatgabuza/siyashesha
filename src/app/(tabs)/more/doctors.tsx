import { router } from 'expo-router';
import {
  CalendarPlus,
  ChevronLeft,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Stethoscope,
  User,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Image } from 'expo-image';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DoctorBookingModal } from '@/components/doctors/DoctorBookingModal';
import { Screen } from '@/components/ui/Screen';
import {
  DOCTOR_SPECIALTIES,
  type DoctorProfile,
} from '@/data/doctors';
import { tapFeedback } from '@/lib/feedback';
import { useAppStore } from '@/store/useAppStore';

export default function FindDoctorsScreen() {
  const insets = useSafeAreaInsets();
  const registeredDoctors = useAppStore((s) => s.registeredDoctors);
  const userRole = useAppStore((s) => s.userRole);
  const doctorProfile = useAppStore((s) => s.doctorProfile);

  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [bookingDoctor, setBookingDoctor] = useState<DoctorProfile | null>(null);

  const specialtiesFilter = ['All', ...DOCTOR_SPECIALTIES];

  const filteredDoctors = useMemo(() => {
    return registeredDoctors.filter((doc) => {
      const matchSpecialty =
        selectedSpecialty === 'All' || doc.specialty.toLowerCase() === selectedSpecialty.toLowerCase();

      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        doc.fullName.toLowerCase().includes(q) ||
        doc.specialty.toLowerCase().includes(q) ||
        doc.practiceName.toLowerCase().includes(q) ||
        doc.city.toLowerCase().includes(q) ||
        doc.services.some((s) => s.name.toLowerCase().includes(q));

      return matchSpecialty && matchSearch;
    });
  }, [registeredDoctors, selectedSpecialty, search]);

  return (
    <Screen scroll={false}>
      {/* Top Navigation Bar */}
      <View
        style={{ paddingTop: insets.top + 6 }}
        className="border-b border-slate-200/80 bg-white px-5 pb-3 shadow-xs dark:border-slate-800 dark:bg-canvasdark-card"
      >
        <View className="flex-row items-center justify-between">
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
                Find & Book Doctors
              </Text>
              <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
                Verified South African Healthcare Practitioners
              </Text>
            </View>
          </View>

          {/* Quick Doctor Portal Link */}
          {userRole === 'doctor' || doctorProfile ? (
            <Pressable
              onPress={() => {
                tapFeedback();
                router.push('/more/doctor-portal');
              }}
              className="flex-row items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-50 px-3 py-1.5 dark:border-brand-400 dark:bg-brand-500/20"
            >
              <Stethoscope size={14} color="#0B2559" />
              <Text className="font-sans-bold text-[11px] text-brand-700 dark:text-brand-300">
                My Practice
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => {
                tapFeedback();
                router.push('/more/doctor-signup');
              }}
              className="rounded-full bg-brand-500 px-3 py-1.5"
            >
              <Text className="font-sans-bold text-[11px] text-white">Doctor Sign Up</Text>
            </Pressable>
          )}
        </View>

        {/* Search Bar */}
        <View className="mt-3.5 flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-800">
          <Search size={18} color="#94A3B8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search doctors, specialties, clinics, or procedures..."
            placeholderTextColor="#94A3B8"
            className="ml-2 flex-1 font-sans text-[14px] text-slate-900 dark:text-white"
          />
        </View>

        {/* Specialty Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 flex-row gap-2"
        >
          {specialtiesFilter.map((sp) => {
            const isSelected = selectedSpecialty === sp;
            return (
              <Pressable
                key={sp}
                onPress={() => {
                  tapFeedback();
                  setSelectedSpecialty(sp);
                }}
                className={`rounded-full px-3 py-1.5 border ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800'
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

      {/* Main Doctor List */}
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Practitioner Banner */}
        <Pressable
          onPress={() => router.push(doctorProfile ? '/more/doctor-portal' : '/more/doctor-signup')}
          className="mb-4 flex-row items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-50/80 p-3.5 dark:border-emerald-500/20 dark:bg-emerald-950/20"
        >
          <View className="flex-1 pr-2">
            <View className="flex-row items-center gap-1.5">
              <Stethoscope size={15} color="#16A34A" />
              <Text className="font-sans-bold text-[13px] text-emerald-800 dark:text-emerald-300">
                Are you a Healthcare Practitioner?
              </Text>
            </View>
            <Text className="mt-0.5 font-sans text-[12px] text-emerald-700 dark:text-emerald-400">
              Sign up your practice, publish custom services & pricing, and manage patient bookings.
            </Text>
          </View>
          <View className="rounded-xl bg-emerald-600 px-3 py-1.5 shadow-xs">
            <Text className="font-sans-bold text-[11px] text-white">
              {doctorProfile ? 'Open Portal' : 'Register'}
            </Text>
          </View>
        </Pressable>

        <Text className="mb-3 font-sans-bold text-[14px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Available Doctors ({filteredDoctors.length})
        </Text>

        {filteredDoctors.length === 0 ? (
          <View className="items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-12 px-6 dark:border-slate-800 dark:bg-canvasdark-card">
            <Stethoscope size={40} color="#94A3B8" />
            <Text className="mt-3 font-sans-bold text-[16px] text-slate-800 dark:text-white">
              No doctors found matching &ldquo;{search}&rdquo;
            </Text>
            <Text className="mt-1 text-center font-sans text-[13px] text-slate-500 dark:text-slate-400">
              Try searching by a different specialty or clearing your search filters.
            </Text>
            <Pressable
              onPress={() => {
                setSearch('');
                setSelectedSpecialty('All');
              }}
              className="mt-4 rounded-full bg-slate-100 px-4 py-2 dark:bg-slate-800"
            >
              <Text className="font-sans-semibold text-[12px] text-slate-700 dark:text-slate-300">
                Clear Filters
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-3.5">
            {filteredDoctors.map((doc) => {
              const activeServices = doc.services.filter((s) => s.isActive);
              const lowestPrice =
                activeServices.length > 0
                  ? Math.min(...activeServices.map((s) => s.priceZar))
                  : null;

              return (
                <View
                  key={doc.id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-canvasdark-card"
                >
                  {/* Top Doctor Row */}
                  <View className="flex-row items-start gap-3.5">
                    <View className="h-16 w-16 overflow-hidden rounded-2xl bg-brand-100 dark:bg-brand-500/20">
                      {doc.avatarUrl ? (
                        <Image source={{ uri: doc.avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                      ) : (
                        <View className="h-full w-full items-center justify-center">
                          <User size={28} color="#0B2559" />
                        </View>
                      )}
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="font-sans-bold text-[17px] text-slate-900 dark:text-white">
                          {doc.title} {doc.fullName}
                        </Text>
                        <ShieldCheck size={16} color="#16A34A" />
                      </View>

                      <Text className="font-sans-semibold text-[13px] text-brand-700 dark:text-brand-300">
                        {doc.specialty}
                      </Text>

                      <View className="mt-1 flex-row items-center gap-1">
                        <MapPin size={13} color="#64748B" />
                        <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400" numberOfLines={1}>
                          {doc.practiceName} · {doc.city}
                        </Text>
                      </View>

                      <View className="mt-1 flex-row items-center gap-2">
                        <View className="flex-row items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 dark:bg-amber-500/15">
                          <Star size={11} color="#D97706" fill="#D97706" />
                          <Text className="font-sans-bold text-[11px] text-amber-800 dark:text-amber-300">
                            {doc.rating ?? 4.9}
                          </Text>
                        </View>
                        <Text className="font-sans text-[11px] text-slate-400">
                          HPCSA {doc.hpcsaNumber}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Bio snippet */}
                  {doc.bio ? (
                    <Text className="mt-3 font-sans text-[13px] leading-[18px] text-slate-600 dark:text-slate-300" numberOfLines={2}>
                      {doc.bio}
                    </Text>
                  ) : null}

                  {/* Services preview chips */}
                  <View className="mt-3 flex-row flex-wrap gap-1.5">
                    {activeServices.slice(0, 3).map((srv) => (
                      <View
                        key={srv.id}
                        className="rounded-lg border border-slate-200/80 bg-slate-50 px-2.5 py-1 dark:border-slate-700 dark:bg-slate-800"
                      >
                        <Text className="font-sans-medium text-[11px] text-slate-700 dark:text-slate-300">
                          {srv.name} (R{srv.priceZar})
                        </Text>
                      </View>
                    ))}
                    {activeServices.length > 3 ? (
                      <View className="rounded-lg bg-slate-100 px-2 py-1 dark:bg-slate-800">
                        <Text className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                          +{activeServices.length - 3} more
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Bottom Action Row */}
                  <View className="mt-4 flex-row items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                    <View>
                      <Text className="font-sans text-[11px] uppercase tracking-wider text-slate-400">
                        Consultation from
                      </Text>
                      <Text className="font-display text-[22px] leading-[22px] text-emerald-600 dark:text-emerald-400">
                        {lowestPrice !== null ? `R${lowestPrice}` : 'Free'}
                      </Text>
                    </View>

                    <Pressable
                      onPress={() => {
                        tapFeedback();
                        setBookingDoctor(doc);
                      }}
                      className="flex-row items-center gap-1.5 rounded-2xl bg-brand-500 px-5 py-2.5 shadow-sm active:bg-brand-600"
                    >
                      <CalendarPlus size={16} color="#FFFFFF" />
                      <Text className="font-sans-bold text-[13px] text-white">
                        Book Appointment
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Booking Modal */}
      <DoctorBookingModal
        visible={Boolean(bookingDoctor)}
        doctor={bookingDoctor}
        onClose={() => setBookingDoctor(null)}
      />
    </Screen>
  );
}
