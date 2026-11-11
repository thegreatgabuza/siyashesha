import {
  Building,
  Calendar,
  Heart,
  Mail,
  Phone,
  Search,
  ShieldAlert,
  User,
  Users,
  Video,
  X,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { PatientClinicalSummaryModal } from '@/components/doctors/PatientClinicalSummaryModal';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import { type DoctorBooking, type DoctorProfile, type PatientClinicalSummary } from '@/data/doctors';
import { formatDayMonth } from '@/lib/date';
import { tapFeedback } from '@/lib/feedback';
import { useAppStore } from '@/store/useAppStore';

type PatientFilterKind = 'all' | 'allergies' | 'chronic' | 'in_person' | 'video';

interface DirectoryPatient {
  id: string;
  name: string;
  phone: string;
  email: string;
  summary?: PatientClinicalSummary;
  totalConsultations: number;
  inPersonConsultations: number;
  videoConsultations: number;
  lastConsultationDate: string;
  lastConsultationMode: 'in_person' | 'video';
  lastBooking: DoctorBooking;
  allBookings: DoctorBooking[];
}

export function DoctorPatientRecordsScreen() {
  const toast = useToast();

  const doctorProfile = useAppStore((s) => s.doctorProfile);
  const registeredDoctors = useAppStore((s) => s.registeredDoctors);
  const doctorBookings = useAppStore((s) => s.doctorBookings);

  const activeDoctor: DoctorProfile | undefined =
    doctorProfile ??
    registeredDoctors.find((d) => d.email.toLowerCase() === 'thobanisgabuzam2@gmail.com') ??
    registeredDoctors[0];

  const [search, setSearch] = useState('');
  const [filterKind, setFilterKind] = useState<PatientFilterKind>('all');
  const [selectedBookingForModal, setSelectedBookingForModal] = useState<DoctorBooking | null>(null);

  // Group doctor's bookings into unique patient directory entries
  const patientsDirectory = useMemo(() => {
    if (!activeDoctor) return [];

    const myBookings = doctorBookings.filter(
      (b) => b.doctorId === activeDoctor.id || b.doctorName.includes(activeDoctor.fullName)
    );

    const map = new Map<string, DirectoryPatient>();

    myBookings.forEach((b) => {
      const key = b.patientId || b.patientEmail.toLowerCase() || b.patientName.toLowerCase();
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          id: b.patientId || key,
          name: b.patientName,
          phone: b.patientPhone,
          email: b.patientEmail,
          summary: b.patientSummary,
          totalConsultations: 1,
          inPersonConsultations: b.mode === 'in_person' ? 1 : 0,
          videoConsultations: b.mode === 'video' ? 1 : 0,
          lastConsultationDate: b.date,
          lastConsultationMode: b.mode,
          lastBooking: b,
          allBookings: [b],
        });
      } else {
        existing.totalConsultations += 1;
        if (b.mode === 'in_person') existing.inPersonConsultations += 1;
        if (b.mode === 'video') existing.videoConsultations += 1;
        existing.allBookings.push(b);

        // Keep latest booking as reference
        if (b.date > existing.lastConsultationDate) {
          existing.lastConsultationDate = b.date;
          existing.lastConsultationMode = b.mode;
          existing.lastBooking = b;
          if (b.patientSummary) existing.summary = b.patientSummary;
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [doctorBookings, activeDoctor]);

  // Filtered patients
  const filteredPatients = useMemo(() => {
    let list = patientsDirectory;

    // Filter kind
    if (filterKind === 'allergies') {
      list = list.filter((p) => (p.summary?.allergies?.length ?? 0) > 0);
    } else if (filterKind === 'chronic') {
      list = list.filter((p) => (p.summary?.chronicConditions?.length ?? 0) > 0);
    } else if (filterKind === 'in_person') {
      list = list.filter((p) => p.inPersonConsultations > 0);
    } else if (filterKind === 'video') {
      list = list.filter((p) => p.videoConsultations > 0);
    }

    // Search query
    const query = search.trim().toLowerCase();
    if (!query) return list;

    return list.filter((p) => {
      return (
        p.name.toLowerCase().includes(query) ||
        p.phone.toLowerCase().includes(query) ||
        p.email.toLowerCase().includes(query) ||
        (p.summary?.bloodGroup?.toLowerCase() || '').includes(query) ||
        (p.summary?.chronicConditions || []).some((c) => c.toLowerCase().includes(query)) ||
        (p.summary?.allergies || []).some((a) => a.substance.toLowerCase().includes(query))
      );
    });
  }, [patientsDirectory, filterKind, search]);

  // Overall directory statistics
  const stats = useMemo(() => {
    const total = patientsDirectory.length;
    const withAllergies = patientsDirectory.filter((p) => (p.summary?.allergies?.length ?? 0) > 0).length;
    const withChronic = patientsDirectory.filter((p) => (p.summary?.chronicConditions?.length ?? 0) > 0).length;
    const videoPatients = patientsDirectory.filter((p) => p.videoConsultations > 0).length;
    return { total, withAllergies, withChronic, videoPatients };
  }, [patientsDirectory]);

  const handleCall = (phoneNum: string) => {
    tapFeedback();
    Linking.openURL(`tel:${phoneNum}`).catch(() => {
      toast.show('Unable to dial phone number', 'warning');
    });
  };

  const handleEmail = (emailAddr: string) => {
    tapFeedback();
    Linking.openURL(`mailto:${emailAddr}`).catch(() => {
      toast.show('Unable to open email client', 'warning');
    });
  };

  return (
    <Screen contentClassName="px-4 pb-28">
      {/* Header Banner */}
      <View className="pt-3 pb-2">
        <View className="flex-row items-center gap-1.5">
          <Users size={15} color="#0B2559" />
          <Text className="font-sans-bold text-[12px] uppercase tracking-wider text-brand-900 dark:text-brand-300">
            Doctor Practice Portal
          </Text>
        </View>
        <Text className="font-sans-bold text-[24px] text-ink dark:text-white">
          Patient Records & Directory
        </Text>
        <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
          Search registered patients, view clinical medical passports, allergies & consultations
        </Text>
      </View>

      {/* Directory Metrics Strip */}
      <View className="mt-3 flex-row gap-2">
        <View className="flex-1 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
          <Text className="font-sans-medium text-[11px] text-slate-500 dark:text-slate-400">
            Patients
          </Text>
          <Text className="mt-0.5 font-sans-bold text-[20px] text-ink dark:text-slate-50">
            {stats.total}
          </Text>
          <Text className="font-sans text-[10px] text-slate-400">registered</Text>
        </View>

        <View className="flex-1 rounded-2xl border border-rose-200/80 bg-rose-50/50 p-3 shadow-2xs dark:border-rose-950 dark:bg-rose-950/20">
          <Text className="font-sans-bold text-[11px] text-rose-800 dark:text-rose-300">
            Allergies
          </Text>
          <Text className="mt-0.5 font-sans-bold text-[20px] text-rose-950 dark:text-rose-100">
            {stats.withAllergies}
          </Text>
          <Text className="font-sans text-[10px] text-rose-700/70 dark:text-rose-300/70">
            critical alerts
          </Text>
        </View>

        <View className="flex-1 rounded-2xl border border-amber-200/80 bg-amber-50/50 p-3 shadow-2xs dark:border-amber-950 dark:bg-amber-950/20">
          <Text className="font-sans-bold text-[11px] text-amber-800 dark:text-amber-300">
            Chronic
          </Text>
          <Text className="mt-0.5 font-sans-bold text-[20px] text-amber-950 dark:text-amber-100">
            {stats.withChronic}
          </Text>
          <Text className="font-sans text-[10px] text-amber-700/70 dark:text-amber-300/70">
            active conditions
          </Text>
        </View>

        <View className="flex-1 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3 shadow-2xs dark:border-emerald-950 dark:bg-emerald-950/20">
          <Text className="font-sans-bold text-[11px] text-emerald-800 dark:text-emerald-300">
            Video Calls
          </Text>
          <Text className="mt-0.5 font-sans-bold text-[20px] text-emerald-950 dark:text-emerald-100">
            {stats.videoPatients}
          </Text>
          <Text className="font-sans text-[10px] text-emerald-700/70 dark:text-emerald-300/70">
            telehealth users
          </Text>
        </View>
      </View>

      {/* Search Input Bar */}
      <View className="mt-4 flex-row items-center rounded-2xl border border-slate-200 bg-white px-3 py-2.5 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
        <Search size={16} color="#64748B" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, phone, blood group, condition..."
          placeholderTextColor="#94A3B8"
          className="ml-2 flex-1 font-sans text-[13px] text-ink dark:text-white"
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} className="p-1">
            <X size={15} color="#64748B" />
          </Pressable>
        ) : null}
      </View>

      {/* Filter Chips Horizontal Scroll */}
      <View className="mt-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Pressable
            onPress={() => {
              tapFeedback();
              setFilterKind('all');
            }}
            className={`rounded-full px-3 py-1.5 border ${
              filterKind === 'all'
                ? 'border-brand-500 bg-brand-500'
                : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-canvasdark-card'
            }`}
          >
            <Text
              className={`font-sans-bold text-[11px] ${
                filterKind === 'all' ? 'text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              All Patients ({patientsDirectory.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              tapFeedback();
              setFilterKind('allergies');
            }}
            className={`flex-row items-center gap-1 rounded-full px-3 py-1.5 border ${
              filterKind === 'allergies'
                ? 'border-rose-600 bg-rose-600'
                : 'border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/30'
            }`}
          >
            <ShieldAlert size={12} color={filterKind === 'allergies' ? '#FFFFFF' : '#E11D48'} />
            <Text
              className={`font-sans-bold text-[11px] ${
                filterKind === 'allergies' ? 'text-white' : 'text-rose-800 dark:text-rose-200'
              }`}
            >
              ⚠️ Critical Allergies
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              tapFeedback();
              setFilterKind('chronic');
            }}
            className={`flex-row items-center gap-1 rounded-full px-3 py-1.5 border ${
              filterKind === 'chronic'
                ? 'border-amber-600 bg-amber-600'
                : 'border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30'
            }`}
          >
            <Heart size={12} color={filterKind === 'chronic' ? '#FFFFFF' : '#D97706'} />
            <Text
              className={`font-sans-bold text-[11px] ${
                filterKind === 'chronic' ? 'text-white' : 'text-amber-800 dark:text-amber-200'
              }`}
            >
              🩺 Chronic Diagnoses
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              tapFeedback();
              setFilterKind('in_person');
            }}
            className={`flex-row items-center gap-1 rounded-full px-3 py-1.5 border ${
              filterKind === 'in_person'
                ? 'border-blue-600 bg-blue-600'
                : 'border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/30'
            }`}
          >
            <Building size={12} color={filterKind === 'in_person' ? '#FFFFFF' : '#1D4ED8'} />
            <Text
              className={`font-sans-bold text-[11px] ${
                filterKind === 'in_person' ? 'text-white' : 'text-blue-800 dark:text-blue-200'
              }`}
            >
              🏢 Physical Rooms
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              tapFeedback();
              setFilterKind('video');
            }}
            className={`flex-row items-center gap-1 rounded-full px-3 py-1.5 border ${
              filterKind === 'video'
                ? 'border-emerald-600 bg-emerald-600'
                : 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/30'
            }`}
          >
            <Video size={12} color={filterKind === 'video' ? '#FFFFFF' : '#047857'} />
            <Text
              className={`font-sans-bold text-[11px] ${
                filterKind === 'video' ? 'text-white' : 'text-emerald-800 dark:text-emerald-200'
              }`}
            >
              📹 Video Telehealth
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Patient Directory List */}
      <View className="mt-5 gap-3.5">
        {filteredPatients.length === 0 ? (
          <View className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 items-center justify-center dark:border-slate-800 dark:bg-canvasdark-card">
            <User size={36} color="#94A3B8" />
            <Text className="mt-3 font-sans-bold text-[16px] text-ink dark:text-white">
              No Patients Found
            </Text>
            <Text className="mt-1 text-center font-sans text-[12px] text-slate-500 dark:text-slate-400">
              {search
                ? `No patient records match the query "${search}". Try searching by another keyword.`
                : 'No patients registered under this filter.'}
            </Text>
          </View>
        ) : (
          filteredPatients.map((p) => {
            const summary = p.summary;
            const allergies = summary?.allergies || [];
            const chronic = summary?.chronicConditions || [];
            const initials = p.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase();

            return (
              <View
                key={p.id}
                className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card"
              >
                {/* Patient Top Row: Avatar + Name + Blood Group */}
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center gap-3">
                    <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 shadow-2xs">
                      <Text className="font-sans-bold text-[14px] text-white">
                        {initials}
                      </Text>
                    </View>
                    <View>
                      <View className="flex-row items-center gap-2">
                        <Text className="font-sans-bold text-[16px] text-ink dark:text-white">
                          {p.name}
                        </Text>
                        {summary?.bloodGroup ? (
                          <View className="rounded-full bg-rose-100 px-2 py-0.5 dark:bg-rose-950">
                            <Text className="font-sans-bold text-[10px] text-rose-700 dark:text-rose-300">
                              🩸 {summary.bloodGroup}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                        {summary?.gender || 'Patient'}
                        {summary?.dateOfBirth ? ` · DOB: ${summary.dateOfBirth}` : ''}
                      </Text>
                    </View>
                  </View>

                  {/* Consultation Count Badge */}
                  <View className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
                    <Text className="font-sans-semibold text-[11px] text-slate-700 dark:text-slate-300">
                      {p.totalConsultations} {p.totalConsultations === 1 ? 'Visit' : 'Visits'}
                    </Text>
                  </View>
                </View>

                {/* Consultation History Summary */}
                <View className="mt-3 flex-row items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                  <Calendar size={13} color="#64748B" />
                  <Text className="font-sans text-[11px] text-slate-600 dark:text-slate-300">
                    Last Visit: {formatDayMonth(p.lastConsultationDate)} ·{' '}
                    {p.lastConsultationMode === 'video'
                      ? '📹 Online Video Call'
                      : '🏢 Physical Practice Rooms'}
                  </Text>
                </View>

                {/* Allergies Alert Box */}
                {allergies.length > 0 ? (
                  <View className="mt-2.5 rounded-xl border border-rose-100 bg-rose-50/70 p-2.5 dark:border-rose-950 dark:bg-rose-950/30">
                    <View className="flex-row items-center gap-1">
                      <ShieldAlert size={12} color="#E11D48" />
                      <Text className="font-sans-bold text-[11px] uppercase tracking-wider text-rose-900 dark:text-rose-200">
                        Critical Patient Allergies ({allergies.length})
                      </Text>
                    </View>
                    <View className="mt-1 flex-row flex-wrap gap-1">
                      {allergies.map((alg, i) => (
                        <View
                          key={i}
                          className="rounded-md bg-rose-200/80 px-2 py-0.5 dark:bg-rose-900/60"
                        >
                          <Text className="font-sans-semibold text-[10px] text-rose-950 dark:text-rose-100">
                            {alg.substance} ({alg.reaction})
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {/* Chronic Conditions */}
                {chronic.length > 0 ? (
                  <View className="mt-2.5 flex-row flex-wrap items-center gap-1.5">
                    <Text className="font-sans-medium text-[11px] text-slate-400">
                      Chronic:
                    </Text>
                    {chronic.map((cond, i) => (
                      <View
                        key={i}
                        className="rounded-full bg-slate-100 px-2.5 py-0.5 border border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                      >
                        <Text className="font-sans-semibold text-[10px] text-slate-700 dark:text-slate-300">
                          {cond}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {/* Action Bar */}
                <View className="mt-3.5 flex-row items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  {/* View Patient Info Modal */}
                  <Pressable
                    onPress={() => {
                      tapFeedback();
                      setSelectedBookingForModal(p.lastBooking);
                    }}
                    className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-brand-500 py-2.5 active:bg-brand-600 shadow-2xs"
                  >
                    <User size={13} color="#FFFFFF" />
                    <Text className="font-sans-bold text-[12px] text-white">
                      View Patient Info
                    </Text>
                  </Pressable>

                  {/* Quick Call */}
                  {p.phone ? (
                    <Pressable
                      onPress={() => handleCall(p.phone)}
                      className="flex-row items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 active:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <Phone size={13} color="#0B2559" />
                      <Text className="font-sans-semibold text-[11px] text-slate-700 dark:text-slate-300">
                        Call
                      </Text>
                    </Pressable>
                  ) : null}

                  {/* Quick Email */}
                  {p.email ? (
                    <Pressable
                      onPress={() => handleEmail(p.email)}
                      className="flex-row items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2.5 active:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <Mail size={13} color="#0B2559" />
                      <Text className="font-sans-semibold text-[11px] text-slate-700 dark:text-slate-300">
                        Email
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* Patient Clinical Summary Modal */}
      <PatientClinicalSummaryModal
        visible={!!selectedBookingForModal}
        booking={selectedBookingForModal}
        onClose={() => setSelectedBookingForModal(null)}
      />
    </Screen>
  );
}
