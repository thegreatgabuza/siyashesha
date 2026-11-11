import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  CreditCard,
  Filter,
  MapPin,
  RotateCcw,
  Search,
  ShieldCheck,
  Star,
  Stethoscope,
  User,
  X,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DoctorBookingModal } from '@/components/doctors/DoctorBookingModal';
import { Screen } from '@/components/ui/Screen';
import { DOCTOR_SPECIALTIES, type DoctorProfile } from '@/data/doctors';
import {
  COMMON_MEDICAL_AIDS,
  COMMON_SA_CITIES,
  filterDoctorsZocdoc,
  generateDoctorSlotSchedule,
} from '@/lib/doctorBooking';
import { tapFeedback } from '@/lib/feedback';
import { useAppStore } from '@/store/useAppStore';

export default function FindDoctorsScreen() {
  const insets = useSafeAreaInsets();
  const registeredDoctors = useAppStore((s) => s.registeredDoctors);
  const userRole = useAppStore((s) => s.userRole);
  const doctorProfile = useAppStore((s) => s.doctorProfile);

  // Filter State
  const [search, setSearch] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [selectedCity, setSelectedCity] = useState<string>('All Cities');
  const [selectedMode, setSelectedMode] = useState<'all' | 'in_person' | 'video'>('all');
  const [selectedMedicalAid, setSelectedMedicalAid] = useState<string>('All Medical Aids');
  const [showFiltersDrawer, setShowFiltersDrawer] = useState(false);

  // Booking Modal State (with instant slot pre-selection)
  const [bookingDoctor, setBookingDoctor] = useState<DoctorProfile | null>(null);
  const [bookingInitialDate, setBookingInitialDate] = useState<string | undefined>(undefined);
  const [bookingInitialTime, setBookingInitialTime] = useState<string | undefined>(undefined);
  const [bookingInitialMode, setBookingInitialMode] = useState<'in_person' | 'video' | undefined>(
    undefined
  );

  const specialtiesFilter = ['All', ...DOCTOR_SPECIALTIES];

  const filteredDoctors = useMemo(() => {
    return filterDoctorsZocdoc(registeredDoctors, {
      specialty: selectedSpecialty,
      query: search,
      city: selectedCity,
      mode: selectedMode,
      medicalAid: selectedMedicalAid,
    });
  }, [registeredDoctors, selectedSpecialty, search, selectedCity, selectedMode, selectedMedicalAid]);

  const activeFiltersCount =
    (selectedSpecialty !== 'All' ? 1 : 0) +
    (selectedCity !== 'All Cities' ? 1 : 0) +
    (selectedMode !== 'all' ? 1 : 0) +
    (selectedMedicalAid !== 'All Medical Aids' ? 1 : 0) +
    (search.trim().length > 0 ? 1 : 0);

  const handleOpenBooking = (
    doc: DoctorProfile,
    dateStr?: string,
    slotTime?: string,
    mode?: 'in_person' | 'video'
  ) => {
    tapFeedback();
    setBookingDoctor(doc);
    setBookingInitialDate(dateStr);
    setBookingInitialTime(slotTime);
    setBookingInitialMode(mode);
  };

  const handleClearFilters = () => {
    tapFeedback();
    setSearch('');
    setSelectedSpecialty('All');
    setSelectedCity('All Cities');
    setSelectedMode('all');
    setSelectedMedicalAid('All Medical Aids');
  };

  return (
    <Screen scroll={false}>
      {/* Top Header Bar */}
      <View
        style={{ paddingTop: insets.top + 6 }}
        className="border-b border-slate-200/80 bg-white px-5 pb-3.5 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              className="h-9 w-9 items-center justify-center rounded-full border border-slate-200/80 bg-slate-50 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:active:bg-slate-700"
            >
              <ChevronLeft size={18} color="#0B2559" />
            </Pressable>
            <View>
              <Text className="font-display text-[22px] uppercase text-brand-900 dark:text-white">
                Book a Doctor
              </Text>
              <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
                Verified South African Healthcare Practitioners
              </Text>
            </View>
          </View>

          {/* Quick Doctor Portal / Practitioner Sign-up */}
          {userRole === 'doctor' || doctorProfile ? (
            <Pressable
              onPress={() => {
                tapFeedback();
                router.push('/more/doctor-portal');
              }}
              className="flex-row items-center gap-1.5 rounded-full border border-brand-500/20 bg-brand-50 px-3 py-1.5 dark:border-brand-400/30 dark:bg-brand-500/15"
            >
              <Stethoscope size={13} color="#0B2559" />
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
              className="rounded-full bg-brand-500 px-3.5 py-1.5 shadow-2xs active:bg-brand-600"
            >
              <Text className="font-sans-bold text-[11px] text-white">Join as Doctor</Text>
            </Pressable>
          )}
        </View>

        {/* Search Input & Filter Button */}
        <View className="mt-3.5 flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-800">
            <Search size={16} color="#94A3B8" />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search condition, doctor, or clinic..."
              placeholderTextColor="#94A3B8"
              className="ml-2 flex-1 font-sans text-[13px] text-slate-900 dark:text-white"
            />
            {search.length > 0 ? (
              <Pressable onPress={() => setSearch('')} className="p-1">
                <X size={15} color="#94A3B8" />
              </Pressable>
            ) : null}
          </View>

          {/* Filter Drawer Toggle */}
          <Pressable
            onPress={() => {
              tapFeedback();
              setShowFiltersDrawer(!showFiltersDrawer);
            }}
            className={`h-11 px-3 flex-row items-center gap-1.5 rounded-2xl border ${
              activeFiltersCount > 0
                ? 'border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/20'
                : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
            }`}
          >
            <Filter size={15} color={activeFiltersCount > 0 ? '#0B2559' : '#64748B'} />
            <Text
              className={`font-sans-semibold text-[12px] ${
                activeFiltersCount > 0
                  ? 'text-brand-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Filters{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
            </Text>
          </Pressable>
        </View>

        {/* Collapsible Filter Panel */}
        {showFiltersDrawer ? (
          <View className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/80">
            {/* City Selector */}
            <View className="mb-2.5">
              <Text className="mb-1.5 font-sans-bold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                City / Location
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1.5">
                {COMMON_SA_CITIES.map((city) => {
                  const isSelected = selectedCity === city;
                  return (
                    <Pressable
                      key={city}
                      onPress={() => {
                        tapFeedback();
                        setSelectedCity(city);
                      }}
                      className={`rounded-full px-3 py-1 border ${
                        isSelected
                          ? 'border-brand-500 bg-brand-500'
                          : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-700'
                      }`}
                    >
                      <Text
                        className={`font-sans-semibold text-[11px] ${
                          isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {city}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Visit Mode & Medical Aid Row */}
            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="mb-1.5 font-sans-bold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Visit Format
                </Text>
                <View className="flex-row rounded-xl bg-slate-200/70 p-0.5 dark:bg-slate-700">
                  <Pressable
                    onPress={() => {
                      tapFeedback();
                      setSelectedMode('all');
                    }}
                    className={`flex-1 items-center py-1.5 rounded-lg ${
                      selectedMode === 'all' ? 'bg-white shadow-2xs dark:bg-slate-800' : ''
                    }`}
                  >
                    <Text className="font-sans-semibold text-[11px] text-slate-800 dark:text-white">
                      All
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      tapFeedback();
                      setSelectedMode('in_person');
                    }}
                    className={`flex-1 items-center py-1.5 rounded-lg ${
                      selectedMode === 'in_person' ? 'bg-white shadow-2xs dark:bg-slate-800' : ''
                    }`}
                  >
                    <Text className="font-sans-semibold text-[11px] text-slate-800 dark:text-white">
                      In-Person
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      tapFeedback();
                      setSelectedMode('video');
                    }}
                    className={`flex-1 items-center py-1.5 rounded-lg ${
                      selectedMode === 'video' ? 'bg-white shadow-2xs dark:bg-slate-800' : ''
                    }`}
                  >
                    <Text className="font-sans-semibold text-[11px] text-slate-800 dark:text-white">
                      Video
                    </Text>
                  </Pressable>
                </View>
              </View>

              <View className="flex-1">
                <Text className="mb-1.5 font-sans-bold text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Medical Aid
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-1">
                  {COMMON_MEDICAL_AIDS.map((aid) => {
                    const isSelected = selectedMedicalAid === aid;
                    return (
                      <Pressable
                        key={aid}
                        onPress={() => {
                          tapFeedback();
                          setSelectedMedicalAid(aid);
                        }}
                        className={`rounded-lg px-2.5 py-1.5 border ${
                          isSelected
                            ? 'border-brand-500 bg-brand-500'
                            : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-700'
                        }`}
                      >
                        <Text
                          className={`font-sans-semibold text-[11px] ${
                            isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {aid}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
                <Pressable
                  onPress={() => router.push('/more/medical-aid-directory')}
                  className="mt-1 flex-row items-center gap-1"
                >
                  <Text className="font-sans-medium text-[10px] text-brand-600 dark:text-brand-300">
                    Browse 16 Medical Aids &rarr;
                  </Text>
                </Pressable>
              </View>
            </View>

            {activeFiltersCount > 0 ? (
              <Pressable
                onPress={handleClearFilters}
                className="mt-2.5 flex-row items-center justify-center gap-1 py-1"
              >
                <RotateCcw size={11} color="#DC2626" />
                <Text className="font-sans-semibold text-[11px] text-rose-600 dark:text-rose-400">
                  Reset All Filters
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {/* Clean Specialty Filter Chips (No emoji spam) */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 flex-row gap-1.5"
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
                    ? 'border-brand-500 bg-brand-500 shadow-2xs'
                    : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                }`}
              >
                <Text
                  className={`font-sans-semibold text-[11px] ${
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

      {/* Main Doctors Stream */}
      <ScrollView
        className="flex-1 px-5 pt-3.5"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Results Header Count */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-sans-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {filteredDoctors.length} {filteredDoctors.length === 1 ? 'Doctor' : 'Doctors'} Available
          </Text>
          <Text className="font-sans text-[11px] text-slate-400">
            Direct Calendar Booking
          </Text>
        </View>

        {filteredDoctors.length === 0 ? (
          <View className="items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-14 px-6 dark:border-slate-800 dark:bg-canvasdark-card">
            <Stethoscope size={40} color="#94A3B8" />
            <Text className="mt-3 font-sans-bold text-[16px] text-slate-800 dark:text-white">
              No Doctors Matching Search
            </Text>
            <Text className="mt-1 text-center font-sans text-[12px] leading-[17px] text-slate-500 dark:text-slate-400">
              We couldn&rsquo;t find healthcare providers matching your current filters. Try
              adjusting specialty or clearing search terms.
            </Text>
            <Pressable
              onPress={handleClearFilters}
              className="mt-4 rounded-full bg-brand-500 px-5 py-2 shadow-2xs"
            >
              <Text className="font-sans-bold text-[12px] text-white">Reset Filters</Text>
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

              // Inline slot schedule for next 3 days
              const slotSchedule = generateDoctorSlotSchedule(doc, 3);
              const hasAnySlot = slotSchedule.some((day) => day.slots.length > 0);

              return (
                <View
                  key={doc.id}
                  className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card"
                >
                  {/* Doctor Profile Row (clickable to view and book) */}
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`View ${doc.title} ${doc.fullName} and book appointment`}
                    onPress={() => handleOpenBooking(doc)}
                    className="flex-row items-start gap-3"
                  >
                    <View className="relative">
                      <View className="h-14 w-14 overflow-hidden rounded-2xl bg-brand-100 dark:bg-brand-500/20">
                        {doc.avatarUrl ? (
                          <Image
                            source={{ uri: doc.avatarUrl }}
                            style={{ width: '100%', height: '100%' }}
                            contentFit="cover"
                          />
                        ) : (
                          <View className="h-full w-full items-center justify-center">
                            <User size={24} color="#0B2559" />
                          </View>
                        )}
                      </View>
                      {/* Verified Badge */}
                      <View className="absolute -bottom-1 -right-1 h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900">
                        <Check size={9} color="#FFFFFF" strokeWidth={3} />
                      </View>
                    </View>

                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="font-sans-bold text-[16px] text-slate-900 dark:text-white">
                          {doc.title} {doc.fullName}
                        </Text>
                        <ShieldCheck size={15} color="#16A34A" />
                      </View>

                      <Text className="font-sans-semibold text-[12px] text-brand-600 dark:text-brand-300">
                        {doc.specialty}
                      </Text>

                      <View className="mt-0.5 flex-row items-center gap-1">
                        <MapPin size={11} color="#64748B" />
                        <Text
                          className="font-sans text-[11px] text-slate-500 dark:text-slate-400"
                          numberOfLines={1}
                        >
                          {doc.practiceName} · {doc.city}
                        </Text>
                      </View>

                      {/* Ratings & Qualifications */}
                      <View className="mt-1 flex-row flex-wrap items-center gap-2">
                        <View className="flex-row items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 dark:bg-amber-500/15">
                          <Star size={10} color="#D97706" fill="#D97706" />
                          <Text className="font-sans-bold text-[11px] text-amber-800 dark:text-amber-300">
                            {doc.rating ?? 4.9}
                          </Text>
                          <Text className="font-sans text-[10px] text-amber-700/80 dark:text-amber-400">
                            ({doc.reviewsCount ?? 30})
                          </Text>
                        </View>

                        <Text className="font-sans text-[11px] text-slate-400">
                          HPCSA {doc.hpcsaNumber}
                        </Text>
                      </View>
                    </View>
                  </Pressable>

                  {/* Patient Testimonial Quote */}
                  {doc.patientHighlight ? (
                    <View className="mt-2.5 rounded-xl bg-slate-50 px-3 py-1.5 dark:bg-slate-800/50">
                      <Text className="font-sans text-[11px] italic text-slate-600 dark:text-slate-300">
                        &ldquo;{doc.patientHighlight}&rdquo;
                      </Text>
                    </View>
                  ) : null}

                  {/* Medical Aids & Price Badge */}
                  <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
                    <View className="flex-row items-center gap-1.5 flex-1 pr-2">
                      <CreditCard size={12} color="#64748B" />
                      <Text
                        className="font-sans text-[11px] text-slate-500 dark:text-slate-400"
                        numberOfLines={1}
                      >
                        {doc.medicalAids?.slice(0, 3).join(', ') ?? 'Discovery, Bonitas, Cash'}
                      </Text>
                    </View>

                    <Text className="font-sans-bold text-[16px] text-slate-900 dark:text-white">
                      {lowestPrice !== null ? `From R${lowestPrice}` : 'Free'}
                    </Text>
                  </View>

                  {/* ======================================================== */}
                  {/* INLINE AVAILABILITY SCHEDULE GRID                        */}
                  {/* ======================================================== */}
                  <View className="mt-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-800/40">
                    <View className="mb-2 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5">
                        <Calendar size={12} color="#0B2559" />
                        <Text className="font-sans-bold text-[10px] uppercase tracking-wider text-slate-600 dark:text-slate-300">
                          Next Available Slots
                        </Text>
                      </View>
                      <Pressable onPress={() => handleOpenBooking(doc)}>
                        <Text className="font-sans-medium text-[10px] text-brand-600 dark:text-brand-300">
                          Tap slot to book &rarr;
                        </Text>
                      </Pressable>
                    </View>

                    {hasAnySlot ? (
                      <View className="flex-row gap-1.5">
                        {slotSchedule.map((day) => (
                          <View
                            key={day.dateStr}
                            className="flex-1 rounded-xl border border-slate-200/70 bg-white p-1.5 dark:border-slate-700/70 dark:bg-slate-800"
                          >
                            <Text className="text-center font-sans-bold text-[10px] uppercase text-slate-700 dark:text-slate-300">
                              {day.dayLabel}
                            </Text>

                            <View className="mt-1.5 gap-1">
                              {day.slots.length > 0 ? (
                                day.slots.map((slot) => (
                                  <Pressable
                                    key={slot}
                                    onPress={() => handleOpenBooking(doc, day.dateStr, slot)}
                                    className="items-center justify-center rounded-lg border border-emerald-200/80 bg-emerald-50 py-1 active:bg-emerald-600 dark:border-emerald-800/80 dark:bg-emerald-950/40"
                                  >
                                    <Text className="font-sans-bold text-[11px] text-emerald-800 dark:text-emerald-300">
                                      {slot}
                                    </Text>
                                  </Pressable>
                                ))
                              ) : (
                                <View className="items-center justify-center py-2">
                                  <Text className="font-sans text-[10px] text-slate-400">
                                    No slots
                                  </Text>
                                </View>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View className="items-center justify-center py-2">
                        <Text className="font-sans text-[11px] text-slate-400">
                          Contact practice directly for availability
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Card Bottom CTA Row */}
                  <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
                    <View className="flex-row items-center gap-1.5">
                      <Clock size={12} color="#64748B" />
                      <Text className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                        {activeServices.length} {activeServices.length === 1 ? 'service' : 'services'} available
                      </Text>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Book appointment with ${doc.title} ${doc.fullName}`}
                      onPress={() => handleOpenBooking(doc)}
                      className="flex-row items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 shadow-2xs active:bg-brand-600"
                    >
                      <Calendar size={13} color="#FFFFFF" />
                      <Text className="font-sans-bold text-[12px] text-white">
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

      {/* Doctor Fast Booking Modal */}
      <DoctorBookingModal
        visible={Boolean(bookingDoctor)}
        doctor={bookingDoctor}
        initialDate={bookingInitialDate}
        initialTime={bookingInitialTime}
        initialMode={bookingInitialMode}
        onClose={() => {
          setBookingDoctor(null);
          setBookingInitialDate(undefined);
          setBookingInitialTime(undefined);
          setBookingInitialMode(undefined);
        }}
      />
    </Screen>
  );
}
