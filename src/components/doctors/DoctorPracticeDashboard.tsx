import dayjs from 'dayjs';
import { router } from 'expo-router';
import {
  Building,
  Calendar,
  CheckCircle2,
  Clock,
  LogOut,
  MapPin,
  Phone,
  ShieldAlert,
  ShieldCheck,
  Stethoscope,
  User,
  Video,
  XCircle,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PatientClinicalSummaryModal } from '@/components/doctors/PatientClinicalSummaryModal';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import { initialDoctors, type DoctorBooking, type DoctorProfile } from '@/data/doctors';
import { formatDayMonth } from '@/lib/date';
import { getTelehealthRoomUrl } from '@/lib/doctorBooking';
import { tapFeedback } from '@/lib/feedback';
import { useAppStore } from '@/store/useAppStore';

export interface DoctorPracticeDashboardProps {
  doctor?: DoctorProfile | null;
}

export function DoctorPracticeDashboard({ doctor }: DoctorPracticeDashboardProps) {
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const doctorProfile = useAppStore((s) => s.doctorProfile);
  const registeredDoctors = useAppStore((s) => s.registeredDoctors);
  const doctorBookings = useAppStore((s) => s.doctorBookings);
  const updateDoctorBookingStatus = useAppStore((s) => s.updateDoctorBookingStatus);
  const signOut = useAppStore((s) => s.signOut);

  // Active doctor profile resolution
  const currentDoctor: DoctorProfile =
    doctor ??
    doctorProfile ??
    registeredDoctors.find((d) => d.email.toLowerCase() === 'thobanisgabuzam2@gmail.com') ??
    initialDoctors[0];

  const todayStr = dayjs().format('YYYY-MM-DD');

  // Booking filters: strictly focused on Bookings and Formats (Physical vs Video)
  const [bookingStatusFilter, setBookingStatusFilter] = useState<'all' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [bookingModeFilter, setBookingModeFilter] = useState<'all' | 'in_person' | 'video'>('all');

  // Modal for Viewing Patient Info & Clinical Summary
  const [selectedPatientBooking, setSelectedPatientBooking] = useState<DoctorBooking | null>(null);

  // Filter bookings for this doctor
  const myBookings = useMemo(
    () => doctorBookings.filter((b) => currentDoctor && b.doctorId === currentDoctor.id),
    [doctorBookings, currentDoctor]
  );

  const physicalBookings = useMemo(
    () => myBookings.filter((b) => b.mode === 'in_person'),
    [myBookings]
  );
  const onlineBookings = useMemo(
    () => myBookings.filter((b) => b.mode === 'video'),
    [myBookings]
  );

  const todayBookings = useMemo(
    () => myBookings.filter((b) => b.date === todayStr),
    [myBookings, todayStr]
  );

  const confirmedCount = myBookings.filter((b) => b.status === 'confirmed').length;

  // Filtered bookings according to status & format selection
  const displayedBookings = useMemo(() => {
    return myBookings.filter((b) => {
      const matchesStatus = bookingStatusFilter === 'all' || b.status === bookingStatusFilter;
      const matchesMode = bookingModeFilter === 'all' || b.mode === bookingModeFilter;
      return matchesStatus && matchesMode;
    });
  }, [myBookings, bookingStatusFilter, bookingModeFilter]);

  const handleStatusChange = (bookingId: string, status: 'completed' | 'cancelled') => {
    tapFeedback();
    updateDoctorBookingStatus(bookingId, status);
    toast.show(
      status === 'completed'
        ? 'Appointment marked as completed'
        : 'Appointment cancelled',
      'info'
    );
  };

  const handleCallPatient = (phone: string) => {
    tapFeedback();
    Linking.openURL(`tel:${phone}`).catch(() => {
      toast.show('Unable to dial patient number', 'warning');
    });
  };

  const handleJoinVideo = (booking: DoctorBooking) => {
    tapFeedback();
    const jitsiUrl = getTelehealthRoomUrl(booking.id);
    Linking.openURL(jitsiUrl).catch(() => {
      toast.show('Unable to launch video meeting browser', 'warning');
    });
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out of Doctor Account',
      `You are signed in as ${currentDoctor.title} ${currentDoctor.fullName} (${currentDoctor.email}).\n\nIf you want to use Siyashesha as a patient, sign in with a different patient email.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            tapFeedback();
            await signOut();
            router.replace('/(auth)/sign-in');
          },
        },
      ]
    );
  };

  return (
    <Screen scroll={false}>
      {/* Top Header Bar */}
      <View
        style={{ paddingTop: insets.top + 6 }}
        className="border-b border-slate-200/80 bg-white px-5 pb-3.5 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <View className="flex-row items-center gap-1.5">
              <Text className="font-display text-[22px] uppercase text-brand-900 dark:text-white">
                Doctor Practice Portal
              </Text>
              <View className="rounded-full bg-emerald-100 px-2 py-0.5 dark:bg-emerald-950/40">
                <Text className="font-sans-bold text-[10px] uppercase text-emerald-700 dark:text-emerald-400">
                  Role Locked
                </Text>
              </View>
            </View>
            <Text
              className="font-sans text-[12px] text-slate-500 dark:text-slate-400"
              numberOfLines={1}
            >
              {currentDoctor.practiceName} · {currentDoctor.city}
            </Text>
          </View>

          {/* Sign Out Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sign out of doctor account"
            onPress={handleSignOut}
            className="flex-row items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:active:bg-slate-700"
          >
            <LogOut size={13} color="#DC2626" />
            <Text className="font-sans-bold text-[11px] text-rose-600 dark:text-rose-400">
              Sign Out
            </Text>
          </Pressable>
        </View>

        {/* Doctor Identity Banner */}
        <View className="mt-3.5 flex-row items-center justify-between rounded-2xl bg-brand-50/80 p-3 dark:bg-brand-500/15">
          <View className="flex-row items-center gap-2.5 flex-1 pr-2">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-brand-500">
              <Stethoscope size={18} color="#FFFFFF" />
            </View>
            <View className="flex-1">
              <View className="flex-row items-center gap-1.5">
                <Text className="font-sans-bold text-[15px] text-brand-950 dark:text-white">
                  {currentDoctor.title} {currentDoctor.fullName}
                </Text>
                <ShieldCheck size={14} color="#16A34A" />
              </View>
              <Text className="font-sans text-[11px] text-brand-700 dark:text-brand-300">
                {currentDoctor.specialty} · HPCSA {currentDoctor.hpcsaNumber}
              </Text>
            </View>
          </View>

          <View className="items-end">
            <Text className="font-sans-bold text-[10px] uppercase tracking-wider text-slate-400">
              Practice Rooms
            </Text>
            <Text className="font-sans-semibold text-[11px] text-brand-800 dark:text-brand-200">
              {currentDoctor.practiceAddress?.split(',')[0] || 'Suite 204'}
            </Text>
          </View>
        </View>
      </View>

      {/* Main Content Stream: Focused Strictly on Bookings & Consultations */}
      <ScrollView
        className="flex-1 px-5 pt-3.5"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Clinical Metrics */}
        <View className="mb-4 flex-row gap-2">
          <View className="flex-1 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
            <Text className="font-sans text-[10px] uppercase tracking-wider text-slate-400">
              Total Bookings
            </Text>
            <Text className="mt-0.5 font-display text-[22px] text-brand-900 dark:text-white">
              {myBookings.length}
            </Text>
            <Text className="font-sans text-[10px] text-emerald-600 dark:text-emerald-400">
              {confirmedCount} upcoming
            </Text>
          </View>

          <View className="flex-1 rounded-2xl border border-brand-200/80 bg-brand-50/50 p-3 shadow-2xs dark:border-brand-900/40 dark:bg-brand-950/20">
            <Text className="font-sans text-[10px] uppercase tracking-wider text-brand-700 dark:text-brand-300">
              {"Today's Queue"}
            </Text>
            <Text className="mt-0.5 font-display text-[22px] text-brand-950 dark:text-brand-100">
              {todayBookings.length}
            </Text>
            <Text className="font-sans text-[10px] text-brand-600 dark:text-brand-400">
              scheduled today
            </Text>
          </View>

          <View className="flex-1 rounded-2xl border border-blue-200/80 bg-blue-50/50 p-3 shadow-2xs dark:border-blue-900/40 dark:bg-blue-950/20">
            <View className="flex-row items-center gap-1">
              <Building size={11} color="#1E40AF" />
              <Text className="font-sans text-[10px] uppercase tracking-wider text-blue-900 dark:text-blue-300">
                Physical
              </Text>
            </View>
            <Text className="mt-0.5 font-display text-[22px] text-blue-950 dark:text-blue-100">
              {physicalBookings.length}
            </Text>
            <Text className="font-sans text-[10px] text-blue-700/70 dark:text-blue-300/70">
              in rooms
            </Text>
          </View>

          <View className="flex-1 rounded-2xl border border-emerald-200/80 bg-emerald-50/50 p-3 shadow-2xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <View className="flex-row items-center gap-1">
              <Video size={11} color="#065F46" />
              <Text className="font-sans text-[10px] uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                Online
              </Text>
            </View>
            <Text className="mt-0.5 font-display text-[22px] text-emerald-950 dark:text-emerald-100">
              {onlineBookings.length}
            </Text>
            <Text className="font-sans text-[10px] text-emerald-700/70 dark:text-emerald-300/70">
              video calls
            </Text>
          </View>
        </View>

        {/* Consultation Format Filter (Physical vs Online) */}
        <View className="mb-2.5 flex-row gap-1.5">
          {[
            { key: 'all', label: `All Formats (${myBookings.length})`, icon: null },
            { key: 'in_person', label: `Physical Rooms (${physicalBookings.length})`, icon: Building },
            { key: 'video', label: `Online Video (${onlineBookings.length})`, icon: Video },
          ].map((fmt) => {
            const isSelected = bookingModeFilter === fmt.key;
            const Icon = fmt.icon;
            return (
              <Pressable
                key={fmt.key}
                onPress={() => {
                  tapFeedback();
                  setBookingModeFilter(fmt.key as any);
                }}
                className={`flex-row items-center gap-1 rounded-full px-3 py-1 border ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500'
                    : 'border-slate-200 bg-white active:bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                }`}
              >
                {Icon ? (
                  <Icon size={11} color={isSelected ? '#FFFFFF' : '#64748B'} />
                ) : null}
                <Text
                  className={`font-sans-bold text-[11px] ${
                    isSelected ? 'text-white' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {fmt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Status Filter Horizontal Scroll */}
        <View className="mb-3.5 flex-row gap-1.5">
          {[
            { key: 'all', label: 'All Statuses' },
            { key: 'confirmed', label: 'Confirmed' },
            { key: 'completed', label: 'Completed' },
            { key: 'cancelled', label: 'Cancelled' },
          ].map((item) => {
            const isSelected = bookingStatusFilter === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  tapFeedback();
                  setBookingStatusFilter(item.key as any);
                }}
                className={`rounded-full px-3 py-1 border ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 dark:border-white dark:bg-white'
                    : 'border-slate-200 bg-white active:bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                }`}
              >
                <Text
                  className={`font-sans-bold text-[11px] ${
                    isSelected
                      ? 'text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Bookings List Section */}
        {displayedBookings.length === 0 ? (
          <View className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 items-center justify-center dark:border-slate-800 dark:bg-canvasdark-card">
            <Calendar size={36} color="#94A3B8" />
            <Text className="mt-3 font-sans-bold text-[16px] text-slate-800 dark:text-slate-200">
              No Consultations Found
            </Text>
            <Text className="mt-1 text-center font-sans text-[12px] text-slate-500 dark:text-slate-400">
              {bookingStatusFilter !== 'all' || bookingModeFilter !== 'all'
                ? 'Try resetting the format or status filters above.'
                : 'Patient bookings will appear here once booked.'}
            </Text>
          </View>
        ) : (
          <View className="gap-3.5">
            {displayedBookings.map((b) => {
              const summary = b.patientSummary;
              const hasAllergies = (summary?.allergies?.length ?? 0) > 0;
              const isVideo = b.mode === 'video';

              return (
                <View
                  key={b.id}
                  className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card"
                >
                  {/* Distinct Format Ribbon */}
                  <View
                    className={`flex-row items-center justify-between px-4 py-2 ${
                      isVideo
                        ? 'border-b border-emerald-100 bg-emerald-50/80 dark:border-emerald-950 dark:bg-emerald-950/40'
                        : 'border-b border-blue-100 bg-blue-50/80 dark:border-blue-950 dark:bg-blue-950/40'
                    }`}
                  >
                    <View className="flex-row items-center gap-1.5">
                      {isVideo ? (
                        <Video size={13} color="#047857" />
                      ) : (
                        <Building size={13} color="#1E40AF" />
                      )}
                      <Text
                        className={`font-sans-bold text-[11px] tracking-wide ${
                          isVideo
                            ? 'text-emerald-950 dark:text-emerald-200'
                            : 'text-blue-950 dark:text-blue-200'
                        }`}
                      >
                        {isVideo ? 'ONLINE VIDEO CONSULTATION' : 'PHYSICAL PRACTICE ROOMS'}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-1">
                      <Clock size={11} color="#64748B" />
                      <Text className="font-sans-semibold text-[11px] text-slate-700 dark:text-slate-300">
                        {formatDayMonth(b.date)} · {b.time} ({b.durationMinutes}m)
                      </Text>
                    </View>
                  </View>

                  {/* Body Content */}
                  <View className="p-4">
                    {/* Patient & Service row */}
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-2">
                        <View className="flex-row items-center gap-2">
                          <Text className="font-sans-bold text-[16px] text-slate-900 dark:text-white">
                            {b.patientName}
                          </Text>
                          {summary?.bloodGroup ? (
                            <View className="rounded-full bg-rose-100 px-2 py-0.5 dark:bg-rose-950/40">
                              <Text className="font-sans-bold text-[10px] text-rose-700 dark:text-rose-300">
                                🩸 {summary.bloodGroup}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text className="mt-0.5 font-sans-medium text-[12px] text-slate-500 dark:text-slate-400">
                          {b.serviceName} · R{b.priceZar}
                        </Text>
                      </View>

                      {/* Status badge */}
                      <View
                        className={`rounded-full px-2.5 py-0.5 ${
                          b.status === 'completed'
                            ? 'bg-slate-100 dark:bg-slate-800'
                            : b.status === 'confirmed'
                            ? 'bg-emerald-100 dark:bg-emerald-950/40'
                            : 'bg-rose-100 dark:bg-rose-950/40'
                        }`}
                      >
                        <Text
                          className={`font-sans-bold text-[10px] uppercase tracking-wider ${
                            b.status === 'completed'
                              ? 'text-slate-600 dark:text-slate-300'
                              : b.status === 'confirmed'
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-rose-600 dark:text-rose-300'
                          }`}
                        >
                          {b.status}
                        </Text>
                      </View>
                    </View>

                    {/* Chief Complaint / Notes */}
                    {b.notes ? (
                      <View className="mt-2.5 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                        <Text className="font-sans text-[12px] text-slate-700 dark:text-slate-300">
                          {`"${b.notes}"`}
                        </Text>
                      </View>
                    ) : null}

                    {/* Clinical Tags: Allergies & Chronic Conditions */}
                    <View className="mt-3 flex-row flex-wrap items-center gap-1.5">
                      {hasAllergies ? (
                        <View className="flex-row items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900">
                          <ShieldAlert size={11} color="#E11D48" />
                          <Text className="font-sans-bold text-[10px] text-rose-700 dark:text-rose-300">
                            {summary!.allergies!.length} Critical Allergies
                          </Text>
                        </View>
                      ) : null}

                      {summary?.chronicConditions && summary.chronicConditions.length > 0 ? (
                        summary.chronicConditions.slice(0, 2).map((c, i) => (
                          <View
                            key={i}
                            className="rounded-full bg-slate-100 px-2.5 py-0.5 border border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                          >
                            <Text className="font-sans-semibold text-[10px] text-slate-700 dark:text-slate-300">
                              {c}
                            </Text>
                          </View>
                        ))
                      ) : null}

                      {b.patientPhone ? (
                        <Pressable
                          onPress={() => handleCallPatient(b.patientPhone)}
                          className="flex-row items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 active:bg-slate-200 dark:bg-slate-800"
                        >
                          <Phone size={10} color="#0B2559" />
                          <Text className="font-sans text-[10px] text-slate-600 dark:text-slate-300">
                            {b.patientPhone}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>

                    {/* Location or Room Info */}
                    {!isVideo ? (
                      <View className="mt-2.5 flex-row items-center gap-1.5">
                        <MapPin size={12} color="#64748B" />
                        <Text className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                          {b.practiceAddress || currentDoctor.practiceAddress}
                        </Text>
                      </View>
                    ) : null}

                    {/* Action Bar */}
                    <View className="mt-3.5 flex-row items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                      {/* View Patient Info Modal */}
                      <Pressable
                        onPress={() => {
                          tapFeedback();
                          setSelectedPatientBooking(b);
                        }}
                        className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-brand-500/30 bg-brand-50 py-2.5 active:bg-brand-100 dark:border-brand-500/20 dark:bg-brand-950/40"
                      >
                        <User size={13} color="#0B2559" />
                        <Text className="font-sans-bold text-[12px] text-brand-900 dark:text-brand-200">
                          View Patient Info
                        </Text>
                      </Pressable>

                      {/* Join Video Call if video */}
                      {isVideo ? (
                        <Pressable
                          onPress={() => handleJoinVideo(b)}
                          className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 active:bg-emerald-700 shadow-2xs"
                        >
                          <Video size={13} color="#FFFFFF" />
                          <Text className="font-sans-bold text-[12px] text-white">
                            Join Video Call
                          </Text>
                        </Pressable>
                      ) : null}

                      {/* Status toggles */}
                      {b.status === 'confirmed' ? (
                        <Pressable
                          onPress={() => handleStatusChange(b.id, 'completed')}
                          className="flex-row items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-2.5 active:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/30"
                        >
                          <CheckCircle2 size={13} color="#059669" />
                          <Text className="font-sans-bold text-[11px] text-emerald-800 dark:text-emerald-300">
                            Done
                          </Text>
                        </Pressable>
                      ) : null}

                      {b.status === 'confirmed' ? (
                        <Pressable
                          onPress={() => handleStatusChange(b.id, 'cancelled')}
                          className="flex-row items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-2.5 active:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/30"
                        >
                          <XCircle size={13} color="#DC2626" />
                          <Text className="font-sans-bold text-[11px] text-rose-800 dark:text-rose-300">
                            Cancel
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Patient Health Info Modal */}
      <PatientClinicalSummaryModal
        visible={selectedPatientBooking !== null}
        booking={selectedPatientBooking}
        onClose={() => setSelectedPatientBooking(null)}
      />
    </Screen>
  );
}
