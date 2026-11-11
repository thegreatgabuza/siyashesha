import dayjs from 'dayjs';
import { router } from 'expo-router';
import {
  CheckCircle2,
  Clock,
  Edit2,
  LogOut,
  MapPin,
  Phone,
  Plus,
  ShieldCheck,
  Stethoscope,
  Trash2,
  User,
  Users,
  Video,
  XCircle,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DoctorServiceModal } from '@/components/doctors/DoctorServiceModal';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import { initialDoctors, type DoctorProfile, type DoctorService } from '@/data/doctors';
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
  const addDoctorService = useAppStore((s) => s.addDoctorService);
  const updateDoctorService = useAppStore((s) => s.updateDoctorService);
  const deleteDoctorService = useAppStore((s) => s.deleteDoctorService);
  const updateDoctorBookingStatus = useAppStore((s) => s.updateDoctorBookingStatus);
  const signOut = useAppStore((s) => s.signOut);

  // Active doctor profile resolution
  const currentDoctor: DoctorProfile =
    doctor ??
    doctorProfile ??
    registeredDoctors.find((d) => d.email.toLowerCase() === 'thobanisgabuzam2@gmail.com') ??
    initialDoctors[0];

  const [activeTab, setActiveTab] = useState<'bookings' | 'services' | 'settings'>('bookings');
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<DoctorService | null>(null);

  // Filter bookings for this doctor
  const myBookings = doctorBookings.filter(
    (b) => currentDoctor && b.doctorId === currentDoctor.id
  );

  const totalValue = myBookings.reduce((sum, b) => sum + (b.priceZar || 0), 0);
  const confirmedCount = myBookings.filter((b) => b.status === 'confirmed').length;

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

  const handleDeleteService = (service: DoctorService) => {
    Alert.alert(
      'Remove Service',
      `Are you sure you want to remove "${service.name}" from your practice offerings?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            tapFeedback();
            deleteDoctorService(service.id);
            toast.show('Service removed from practice', 'info');
          },
        },
      ]
    );
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

          {/* Sign Out Button (to use patient email if desired) */}
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
              Account
            </Text>
            <Text className="font-sans-semibold text-[11px] text-brand-800 dark:text-brand-200">
              Doctor Mode
            </Text>
          </View>
        </View>

        {/* Segmented Tabs */}
        <View className="mt-3.5 flex-row rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          <Pressable
            onPress={() => {
              tapFeedback();
              setActiveTab('bookings');
            }}
            className={`flex-1 items-center justify-center rounded-xl py-2 ${
              activeTab === 'bookings' ? 'bg-white shadow-2xs dark:bg-slate-700' : ''
            }`}
          >
            <Text
              className={`font-sans-bold text-[12px] ${
                activeTab === 'bookings'
                  ? 'text-brand-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Bookings ({myBookings.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              tapFeedback();
              setActiveTab('services');
            }}
            className={`flex-1 items-center justify-center rounded-xl py-2 ${
              activeTab === 'services' ? 'bg-white shadow-2xs dark:bg-slate-700' : ''
            }`}
          >
            <Text
              className={`font-sans-bold text-[12px] ${
                activeTab === 'services'
                  ? 'text-brand-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Services ({currentDoctor.services.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              tapFeedback();
              setActiveTab('settings');
            }}
            className={`flex-1 items-center justify-center rounded-xl py-2 ${
              activeTab === 'settings' ? 'bg-white shadow-2xs dark:bg-slate-700' : ''
            }`}
          >
            <Text
              className={`font-sans-bold text-[12px] ${
                activeTab === 'settings'
                  ? 'text-brand-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Practice Info
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Main Tab Content Stream */}
      <ScrollView
        className="flex-1 px-5 pt-3.5"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ======================================================== */}
        {/* TAB 1: PATIENT BOOKINGS                                  */}
        {/* ======================================================== */}
        {activeTab === 'bookings' ? (
          <View>
            {/* Quick Metrics */}
            <View className="mb-4 flex-row gap-3">
              <View className="flex-1 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
                <Text className="font-sans text-[10px] uppercase tracking-wider text-slate-400">
                  Total Bookings
                </Text>
                <Text className="mt-1 font-display text-[24px] text-brand-900 dark:text-white">
                  {myBookings.length}
                </Text>
                <Text className="font-sans text-[11px] text-emerald-600 dark:text-emerald-400">
                  {confirmedCount} upcoming
                </Text>
              </View>

              <View className="flex-1 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
                <Text className="font-sans text-[10px] uppercase tracking-wider text-slate-400">
                  Consultation Value
                </Text>
                <Text className="mt-1 font-display text-[24px] text-emerald-600 dark:text-emerald-400">
                  R{totalValue}
                </Text>
                <Text className="font-sans text-[11px] text-slate-400">
                  Direct Claims & Cash
                </Text>
              </View>
            </View>

            {/* Bookings Section Header */}
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-sans-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Patient Consultations
              </Text>
              <Pressable
                onPress={() => router.push('/more/doctors')}
                className="flex-row items-center gap-1"
              >
                <Text className="font-sans-semibold text-[11px] text-brand-600 dark:text-brand-300">
                  View Patient Directory &rarr;
                </Text>
              </Pressable>
            </View>

            {myBookings.length === 0 ? (
              <View className="items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-12 px-6 dark:border-slate-800 dark:bg-canvasdark-card">
                <Users size={36} color="#94A3B8" />
                <Text className="mt-3 font-sans-bold text-[16px] text-slate-800 dark:text-white">
                  No Patient Bookings Yet
                </Text>
                <Text className="mt-1 text-center font-sans text-[12px] leading-[17px] text-slate-500 dark:text-slate-400">
                  Patients booking your published services on Siyashesha will appear here in real-time.
                </Text>
                <Pressable
                  onPress={() => router.push('/more/doctors')}
                  className="mt-4 rounded-full bg-brand-500 px-5 py-2 shadow-2xs"
                >
                  <Text className="font-sans-bold text-[12px] text-white">
                    Browse Directory
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-3">
                {myBookings.map((b) => {
                  const isConfirmed = b.status === 'confirmed';
                  const isCompleted = b.status === 'completed';
                  const isCancelled = b.status === 'cancelled';

                  return (
                    <View
                      key={b.id}
                      className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card"
                    >
                      {/* Top Row: Service & Status */}
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-2">
                          <Text className="font-sans-bold text-[15px] text-slate-900 dark:text-white">
                            {b.serviceName}
                          </Text>
                          <View className="mt-1 flex-row items-center gap-1.5">
                            <Clock size={12} color="#64748B" />
                            <Text className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                              {dayjs(b.date).format('ddd, D MMM YYYY')} at {b.time} ({b.durationMinutes}m)
                            </Text>
                          </View>
                        </View>

                        <View
                          className={`rounded-full px-2.5 py-0.5 ${
                            isCompleted
                              ? 'bg-emerald-100 dark:bg-emerald-500/20'
                              : isCancelled
                              ? 'bg-rose-100 dark:bg-rose-500/20'
                              : 'bg-brand-100 dark:bg-brand-500/20'
                          }`}
                        >
                          <Text
                            className={`font-sans-bold text-[10px] uppercase ${
                              isCompleted
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : isCancelled
                                ? 'text-rose-700 dark:text-rose-300'
                                : 'text-brand-700 dark:text-brand-300'
                            }`}
                          >
                            {b.status}
                          </Text>
                        </View>
                      </View>

                      {/* Patient Info Card */}
                      <View className="mt-3 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center gap-2">
                            <User size={14} color="#0B2559" />
                            <Text className="font-sans-bold text-[13px] text-slate-900 dark:text-white">
                              {b.patientName}
                            </Text>
                          </View>
                          <Text className="font-sans-bold text-[14px] text-emerald-600 dark:text-emerald-400">
                            R{b.priceZar}
                          </Text>
                        </View>

                        {b.patientPhone ? (
                          <Pressable
                            onPress={() => Linking.openURL(`tel:${b.patientPhone}`)}
                            className="mt-1.5 flex-row items-center gap-1.5"
                          >
                            <Phone size={11} color="#16A34A" />
                            <Text className="font-sans-medium text-[11px] text-slate-600 dark:text-slate-300">
                              {b.patientPhone}
                            </Text>
                          </Pressable>
                        ) : null}

                        {b.notes ? (
                          <Text className="mt-1.5 font-sans text-[11px] italic text-slate-600 dark:text-slate-300">
                            &ldquo;{b.notes}&rdquo;
                          </Text>
                        ) : null}

                        <View className="mt-2 flex-row items-center gap-1.5">
                          {b.mode === 'video' ? (
                            <View className="flex-row items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 dark:bg-blue-900/40">
                              <Video size={10} color="#2563EB" />
                              <Text className="font-sans-semibold text-[10px] text-blue-700 dark:text-blue-300">
                                Video Telehealth
                              </Text>
                            </View>
                          ) : (
                            <View className="flex-row items-center gap-1 rounded-md bg-slate-200 px-2 py-0.5 dark:bg-slate-700">
                              <MapPin size={10} color="#64748B" />
                              <Text className="font-sans-semibold text-[10px] text-slate-700 dark:text-slate-300">
                                In-Person Practice Visit
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Doctor Clinical Actions */}
                      {isConfirmed ? (
                        <View className="mt-3 flex-row gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                          <Pressable
                            onPress={() => handleStatusChange(b.id, 'completed')}
                            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 shadow-2xs active:bg-emerald-700"
                          >
                            <CheckCircle2 size={13} color="#FFFFFF" />
                            <Text className="font-sans-bold text-[11px] text-white">
                              Mark Completed
                            </Text>
                          </Pressable>

                          {b.mode === 'video' ? (
                            <Pressable
                              onPress={() => {
                                Alert.alert(
                                  'Telehealth Video Call',
                                  `Start secure video consultation with ${b.patientName}?`,
                                  [
                                    { text: 'Cancel', style: 'cancel' },
                                    {
                                      text: 'Start Video Call',
                                      onPress: () =>
                                        Linking.openURL('https://meet.jit.si/siyashesha-' + b.id).catch(
                                          () => {}
                                        ),
                                    },
                                  ]
                                );
                              }}
                              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-brand-500 py-2 shadow-2xs active:bg-brand-600"
                            >
                              <Video size={13} color="#FFFFFF" />
                              <Text className="font-sans-bold text-[11px] text-white">
                                Start Video
                              </Text>
                            </Pressable>
                          ) : null}

                          <Pressable
                            onPress={() => handleStatusChange(b.id, 'cancelled')}
                            className="items-center justify-center rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700"
                          >
                            <XCircle size={15} color="#DC2626" />
                          </Pressable>
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}

        {/* ======================================================== */}
        {/* TAB 2: PRACTICE SERVICES                                 */}
        {/* ======================================================== */}
        {activeTab === 'services' ? (
          <View>
            <View className="mb-3.5 flex-row items-center justify-between">
              <View>
                <Text className="font-sans-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Published Services ({currentDoctor.services.length})
                </Text>
                <Text className="font-sans text-[11px] text-slate-400">
                  Visible to patients for online booking
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  tapFeedback();
                  setEditingService(null);
                  setServiceModalOpen(true);
                }}
                className="flex-row items-center gap-1.5 rounded-full bg-brand-500 px-3.5 py-1.5 shadow-2xs active:bg-brand-600"
              >
                <Plus size={13} color="#FFFFFF" />
                <Text className="font-sans-bold text-[11px] text-white">Add Service</Text>
              </Pressable>
            </View>

            <View className="gap-3">
              {currentDoctor.services.map((srv) => (
                <View
                  key={srv.id}
                  className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <View className="flex-row items-center gap-2">
                        <Text className="font-sans-bold text-[15px] text-slate-900 dark:text-white">
                          {srv.name}
                        </Text>
                        <View className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-700">
                          <Text className="font-sans-medium text-[10px] text-slate-600 dark:text-slate-300">
                            {srv.durationMinutes} mins
                          </Text>
                        </View>
                      </View>

                      {srv.description ? (
                        <Text className="mt-1 font-sans text-[12px] leading-[17px] text-slate-500 dark:text-slate-400">
                          {srv.description}
                        </Text>
                      ) : null}

                      <View className="mt-2.5 flex-row items-center gap-2">
                        <View className="rounded-md bg-brand-50 px-2 py-0.5 dark:bg-brand-500/20">
                          <Text className="font-sans-semibold text-[10px] text-brand-700 dark:text-brand-300">
                            {srv.category}
                          </Text>
                        </View>
                        <Text className="font-sans text-[10px] text-slate-400">
                          {srv.mode === 'video'
                            ? 'Video Only'
                            : srv.mode === 'in_person'
                            ? 'In-Person Only'
                            : 'In-Person & Video'}
                        </Text>
                      </View>
                    </View>

                    <View className="items-end">
                      <Text className="font-display text-[22px] text-emerald-600 dark:text-emerald-400">
                        R{srv.priceZar}
                      </Text>

                      <View className="mt-2.5 flex-row items-center gap-1.5">
                        <Pressable
                          onPress={() => {
                            tapFeedback();
                            setEditingService(srv);
                            setServiceModalOpen(true);
                          }}
                          className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200 dark:bg-slate-800 dark:active:bg-slate-700"
                        >
                          <Edit2 size={13} color="#0B2559" />
                        </Pressable>

                        <Pressable
                          onPress={() => handleDeleteService(srv)}
                          className="h-8 w-8 items-center justify-center rounded-full bg-rose-50 active:bg-rose-100 dark:bg-rose-950/40 dark:active:bg-rose-900/60"
                        >
                          <Trash2 size={13} color="#DC2626" />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* ======================================================== */}
        {/* TAB 3: PRACTICE INFO & ROLE SETTINGS                     */}
        {/* ======================================================== */}
        {activeTab === 'settings' ? (
          <View className="gap-3.5">
            {/* Practice Details Card */}
            <View className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
              <Text className="mb-3 font-sans-bold text-[14px] text-slate-900 dark:text-white">
                Practice Registration Details
              </Text>

              <View className="gap-2.5">
                <View className="flex-row justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
                    Practice Name
                  </Text>
                  <Text className="max-w-[210px] text-right font-sans-semibold text-[12px] text-slate-900 dark:text-white">
                    {currentDoctor.practiceName}
                  </Text>
                </View>

                <View className="flex-row justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
                    Physical Address
                  </Text>
                  <Text className="max-w-[210px] text-right font-sans-semibold text-[12px] text-slate-900 dark:text-white">
                    {currentDoctor.practiceAddress}
                  </Text>
                </View>

                <View className="flex-row justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
                    City & Province
                  </Text>
                  <Text className="font-sans-semibold text-[12px] text-slate-900 dark:text-white">
                    {currentDoctor.city}, {currentDoctor.province}
                  </Text>
                </View>

                <View className="flex-row justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
                    HPCSA Council Number
                  </Text>
                  <Text className="font-sans-bold text-[12px] text-brand-700 dark:text-brand-300">
                    {currentDoctor.hpcsaNumber}
                  </Text>
                </View>

                <View className="flex-row justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
                    Practice Phone
                  </Text>
                  <Text className="font-sans-semibold text-[12px] text-slate-900 dark:text-white">
                    {currentDoctor.phone}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
                    Doctor Email
                  </Text>
                  <Text className="font-sans-semibold text-[12px] text-slate-900 dark:text-white">
                    {currentDoctor.email}
                  </Text>
                </View>
              </View>
            </View>

            {/* Consulting Availability */}
            <View className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
              <Text className="mb-2 font-sans-bold text-[14px] text-slate-900 dark:text-white">
                Consulting Schedule
              </Text>
              <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
                Operating Days: {currentDoctor.availability?.days?.join(', ') || 'Monday – Friday'}
              </Text>
              <Text className="mt-1 font-sans text-[12px] text-slate-500 dark:text-slate-400">
                Hours: {currentDoctor.availability?.startTime || '08:30'} –{' '}
                {currentDoctor.availability?.endTime || '17:00'} ({currentDoctor.availability?.slotDurationMinutes || 30} min slots)
              </Text>
            </View>

            {/* Strict Role Separation Banner */}
            <View className="rounded-3xl border border-brand-200 bg-brand-50/70 p-4 dark:border-brand-900/60 dark:bg-brand-950/30">
              <View className="flex-row items-center gap-2">
                <ShieldCheck size={18} color="#0B2559" />
                <Text className="font-sans-bold text-[14px] text-brand-950 dark:text-white">
                  Role-Locked Doctor Account
                </Text>
              </View>
              <Text className="mt-1.5 font-sans text-[12px] leading-[18px] text-brand-900 dark:text-brand-200">
                This account is dedicated to your clinical healthcare practice ({currentDoctor.email}). To use Siyashesha as a patient, please sign out and sign in with a different personal patient email.
              </Text>
              <Pressable
                onPress={handleSignOut}
                className="mt-3.5 flex-row items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 active:bg-brand-600"
              >
                <LogOut size={14} color="#FFFFFF" />
                <Text className="font-sans-bold text-[12px] text-white">
                  Sign Out of Doctor Account
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Service Modal for Adding / Editing Practice Offerings */}
      <DoctorServiceModal
        visible={serviceModalOpen}
        editingService={editingService}
        onClose={() => {
          setServiceModalOpen(false);
          setEditingService(null);
        }}
        onSave={(data, editingId) => {
          if (editingId) {
            updateDoctorService(editingId, data);
          } else {
            addDoctorService(data);
          }
        }}
      />
    </Screen>
  );
}
