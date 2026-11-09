import dayjs from 'dayjs';
import { router } from 'expo-router';
import {
  CheckCircle2,
  ChevronLeft,
  Clock,
  Edit2,
  MapPin,
  Phone,
  Plus,
  RefreshCw,
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
import { type DoctorService } from '@/data/doctors';
import { tapFeedback } from '@/lib/feedback';
import { useAppStore } from '@/store/useAppStore';

export default function DoctorPortalScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const userRole = useAppStore((s) => s.userRole);
  const setUserRole = useAppStore((s) => s.setUserRole);
  const doctorProfile = useAppStore((s) => s.doctorProfile);
  const registeredDoctors = useAppStore((s) => s.registeredDoctors);
  const doctorBookings = useAppStore((s) => s.doctorBookings);
  const addDoctorService = useAppStore((s) => s.addDoctorService);
  const updateDoctorService = useAppStore((s) => s.updateDoctorService);
  const deleteDoctorService = useAppStore((s) => s.deleteDoctorService);
  const updateDoctorBookingStatus = useAppStore((s) => s.updateDoctorBookingStatus);

  // If user has a registered profile, use it; otherwise fallback to primary community doctor for preview
  const currentDoctor =
    doctorProfile ?? registeredDoctors.find((d) => d.id === 'doc-001') ?? registeredDoctors[0];

  const [activeTab, setActiveTab] = useState<'bookings' | 'services' | 'settings'>('bookings');
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<DoctorService | null>(null);

  // Filter bookings for this doctor
  const myBookings = doctorBookings.filter(
    (b) => currentDoctor && b.doctorId === currentDoctor.id
  );

  const totalValue = myBookings.reduce((sum, b) => sum + (b.priceZar || 0), 0);

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

  return (
    <Screen scroll={false}>
      {/* Header */}
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
                Doctor Practice Portal
              </Text>
              <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
                {currentDoctor?.practiceName ?? 'Clinical Services & Bookings'}
              </Text>
            </View>
          </View>

          {/* Switch View Button */}
          <Pressable
            onPress={() => {
              tapFeedback();
              const nextRole = userRole === 'doctor' ? 'patient' : 'doctor';
              setUserRole(nextRole);
              toast.show(
                nextRole === 'doctor' ? 'Switched to Doctor Mode' : 'Switched to Patient Mode',
                'info'
              );
            }}
            className="flex-row items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800"
          >
            <RefreshCw size={12} color="#0B2559" />
            <Text className="font-sans-bold text-[11px] text-slate-700 dark:text-slate-200">
              {userRole === 'doctor' ? 'Doctor Mode' : 'Patient View'}
            </Text>
          </Pressable>
        </View>

        {/* Doctor Identity Banner */}
        {currentDoctor ? (
          <View className="mt-3.5 flex-row items-center justify-between rounded-2xl bg-brand-50 p-3 dark:bg-brand-500/15">
            <View className="flex-row items-center gap-2.5">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-white">
                <Stethoscope size={20} color="#FFFFFF" />
              </View>
              <View>
                <View className="flex-row items-center gap-1.5">
                  <Text className="font-sans-bold text-[15px] text-brand-950 dark:text-white">
                    {currentDoctor.title} {currentDoctor.fullName}
                  </Text>
                  <ShieldCheck size={15} color="#16A34A" />
                </View>
                <Text className="font-sans text-[12px] text-brand-700 dark:text-brand-300">
                  {currentDoctor.specialty} · HPCSA {currentDoctor.hpcsaNumber}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={() => router.push('/more/doctor-signup')}
              className="rounded-xl border border-brand-300 bg-white px-3 py-1.5 shadow-2xs dark:border-brand-500 dark:bg-slate-800"
            >
              <Text className="font-sans-semibold text-[11px] text-brand-700 dark:text-brand-300">
                {doctorProfile ? 'Edit Profile' : 'Sign Up as Doctor'}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* Navigation Tabs */}
        <View className="mt-3.5 flex-row rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
          <Pressable
            onPress={() => {
              tapFeedback();
              setActiveTab('bookings');
            }}
            className={`flex-1 items-center justify-center rounded-xl py-2 ${
              activeTab === 'bookings' ? 'bg-white shadow-xs dark:bg-slate-700' : ''
            }`}
          >
            <Text
              className={`font-sans-bold text-[13px] ${
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
              activeTab === 'services' ? 'bg-white shadow-xs dark:bg-slate-700' : ''
            }`}
          >
            <Text
              className={`font-sans-bold text-[13px] ${
                activeTab === 'services'
                  ? 'text-brand-900 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              My Services ({currentDoctor?.services.length ?? 0})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              tapFeedback();
              setActiveTab('settings');
            }}
            className={`flex-1 items-center justify-center rounded-xl py-2 ${
              activeTab === 'settings' ? 'bg-white shadow-xs dark:bg-slate-700' : ''
            }`}
          >
            <Text
              className={`font-sans-bold text-[13px] ${
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

      {/* Content */}
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* TAB 1: BOOKINGS */}
        {activeTab === 'bookings' ? (
          <View>
            {/* Stats row */}
            <View className="mb-4 flex-row gap-3">
              <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-canvasdark-card">
                <Text className="font-sans text-[11px] uppercase tracking-wider text-slate-400">
                  Total Bookings
                </Text>
                <Text className="mt-1 font-display text-[26px] text-brand-900 dark:text-white">
                  {myBookings.length}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-canvasdark-card">
                <Text className="font-sans text-[11px] uppercase tracking-wider text-slate-400">
                  Consultation Value
                </Text>
                <Text className="mt-1 font-display text-[26px] text-emerald-600 dark:text-emerald-400">
                  R{totalValue}
                </Text>
              </View>
            </View>

            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-sans-bold text-[14px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Patient Consultations
              </Text>
              <Pressable
                onPress={() => router.push('/more/doctors')}
                className="flex-row items-center gap-1"
              >
                <Text className="font-sans-semibold text-[12px] text-brand-600 dark:text-brand-300">
                  Browse Patient Directory
                </Text>
              </Pressable>
            </View>

            {myBookings.length === 0 ? (
              <View className="items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-12 px-6 dark:border-slate-800 dark:bg-canvasdark-card">
                <Users size={36} color="#94A3B8" />
                <Text className="mt-3 font-sans-bold text-[16px] text-slate-800 dark:text-white">
                  No Patient Bookings Yet
                </Text>
                <Text className="mt-1 text-center font-sans text-[13px] leading-[18px] text-slate-500 dark:text-slate-400">
                  Patients booking your published services will appear here in real-time.
                </Text>
                <Pressable
                  onPress={() => router.push('/more/doctors')}
                  className="mt-4 rounded-full bg-brand-500 px-5 py-2.5 shadow-sm"
                >
                  <Text className="font-sans-bold text-[13px] text-white">
                    Test Booking a Service
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-3.5">
                {myBookings.map((b) => {
                  const isConfirmed = b.status === 'confirmed';
                  const isCompleted = b.status === 'completed';
                  const isCancelled = b.status === 'cancelled';

                  return (
                    <View
                      key={b.id}
                      className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-canvasdark-card"
                    >
                      {/* Top Row: Service & Status */}
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-2">
                          <Text className="font-sans-bold text-[16px] text-slate-900 dark:text-white">
                            {b.serviceName}
                          </Text>
                          <View className="mt-1 flex-row items-center gap-2">
                            <Clock size={12} color="#64748B" />
                            <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
                              {dayjs(b.date).format('ddd, D MMM YYYY')} at {b.time} ({b.durationMinutes}m)
                            </Text>
                          </View>
                        </View>

                        <View
                          className={`rounded-full px-2.5 py-1 ${
                            isCompleted
                              ? 'bg-emerald-100 dark:bg-emerald-500/20'
                              : isCancelled
                              ? 'bg-rose-100 dark:bg-rose-500/20'
                              : 'bg-brand-100 dark:bg-brand-500/20'
                          }`}
                        >
                          <Text
                            className={`font-sans-bold text-[11px] uppercase ${
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
                            <User size={15} color="#0B2559" />
                            <Text className="font-sans-bold text-[14px] text-slate-900 dark:text-white">
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
                            <Phone size={12} color="#16A34A" />
                            <Text className="font-sans-medium text-[12px] text-slate-600 dark:text-slate-300">
                              {b.patientPhone}
                            </Text>
                          </Pressable>
                        ) : null}

                        {b.notes ? (
                          <Text className="mt-2 font-sans text-[12px] italic text-slate-600 dark:text-slate-300">
                            Reason: &ldquo;{b.notes}&rdquo;
                          </Text>
                        ) : null}

                        <View className="mt-2 flex-row items-center gap-1.5">
                          {b.mode === 'video' ? (
                            <View className="flex-row items-center gap-1 rounded-md bg-blue-100 px-2 py-0.5 dark:bg-blue-900/40">
                              <Video size={11} color="#2563EB" />
                              <Text className="font-sans-semibold text-[11px] text-blue-700 dark:text-blue-300">
                                Video Telehealth
                              </Text>
                            </View>
                          ) : (
                            <View className="flex-row items-center gap-1 rounded-md bg-slate-200 px-2 py-0.5 dark:bg-slate-700">
                              <MapPin size={11} color="#64748B" />
                              <Text className="font-sans-semibold text-[11px] text-slate-700 dark:text-slate-300">
                                In-Person Practice
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Doctor Actions */}
                      {isConfirmed ? (
                        <View className="mt-3 flex-row gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                          <Pressable
                            onPress={() => handleStatusChange(b.id, 'completed')}
                            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 shadow-xs active:bg-emerald-700"
                          >
                            <CheckCircle2 size={14} color="#FFFFFF" />
                            <Text className="font-sans-bold text-[12px] text-white">
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
                              className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl bg-brand-500 py-2 shadow-xs active:bg-brand-600"
                            >
                              <Video size={14} color="#FFFFFF" />
                              <Text className="font-sans-bold text-[12px] text-white">
                                Start Video
                              </Text>
                            </Pressable>
                          ) : null}

                          <Pressable
                            onPress={() => handleStatusChange(b.id, 'cancelled')}
                            className="items-center justify-center rounded-xl border border-slate-200 px-3 py-2 dark:border-slate-700"
                          >
                            <XCircle size={16} color="#DC1F26" />
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

        {/* TAB 2: MY SERVICES */}
        {activeTab === 'services' ? (
          <View>
            <View className="mb-4 flex-row items-center justify-between">
              <View>
                <Text className="font-sans-bold text-[14px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Published Services ({currentDoctor?.services.length ?? 0})
                </Text>
                <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
                  Services visible to patients for booking
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  tapFeedback();
                  setEditingService(null);
                  setServiceModalOpen(true);
                }}
                className="flex-row items-center gap-1.5 rounded-2xl bg-brand-500 px-4 py-2 shadow-xs"
              >
                <Plus size={15} color="#FFFFFF" />
                <Text className="font-sans-bold text-[12px] text-white">Add Service</Text>
              </Pressable>
            </View>

            <View className="gap-3">
              {currentDoctor?.services.map((srv) => (
                <View
                  key={srv.id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-canvasdark-card"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <View className="flex-row items-center gap-2">
                        <Text className="font-sans-bold text-[16px] text-slate-900 dark:text-white">
                          {srv.name}
                        </Text>
                        <View className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-700">
                          <Text className="font-sans-semibold text-[10px] text-slate-600 dark:text-slate-300">
                            {srv.category}
                          </Text>
                        </View>
                      </View>
                      <Text className="mt-1 font-sans text-[13px] leading-[18px] text-slate-500 dark:text-slate-400">
                        {srv.description}
                      </Text>
                    </View>

                    <Text className="font-display text-[24px] text-emerald-600 dark:text-emerald-400">
                      R{srv.priceZar}
                    </Text>
                  </View>

                  <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                    <View className="flex-row items-center gap-2">
                      <Clock size={13} color="#64748B" />
                      <Text className="font-sans-medium text-[12px] text-slate-600 dark:text-slate-300">
                        {srv.durationMinutes} mins ·{' '}
                        {srv.mode === 'both'
                          ? 'In-person & Video'
                          : srv.mode === 'video'
                          ? 'Video Only'
                          : 'In-person Only'}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-2">
                      <Pressable
                        onPress={() => {
                          tapFeedback();
                          setEditingService(srv);
                          setServiceModalOpen(true);
                        }}
                        className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
                      >
                        <Edit2 size={13} color="#0B2559" />
                      </Pressable>
                      <Pressable
                        onPress={() => handleDeleteService(srv)}
                        className="h-8 w-8 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/30"
                      >
                        <Trash2 size={13} color="#DC1F26" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* TAB 3: PRACTICE SETTINGS */}
        {activeTab === 'settings' && currentDoctor ? (
          <View className="gap-4">
            <View className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-canvasdark-card">
              <Text className="font-sans-bold text-[16px] text-slate-900 dark:text-white">
                Practice Information
              </Text>

              <View className="mt-3 gap-3">
                <View>
                  <Text className="font-sans text-[11px] uppercase tracking-wider text-slate-400">
                    Practice / Clinic Name
                  </Text>
                  <Text className="font-sans-semibold text-[14px] text-slate-800 dark:text-slate-200">
                    {currentDoctor.practiceName}
                  </Text>
                </View>

                <View>
                  <Text className="font-sans text-[11px] uppercase tracking-wider text-slate-400">
                    Physical Practice Address
                  </Text>
                  <Text className="font-sans-semibold text-[14px] text-slate-800 dark:text-slate-200">
                    {currentDoctor.practiceAddress}, {currentDoctor.city}, {currentDoctor.province}
                  </Text>
                </View>

                <View>
                  <Text className="font-sans text-[11px] uppercase tracking-wider text-slate-400">
                    HPCSA / Professional Registration
                  </Text>
                  <Text className="font-sans-semibold text-[14px] text-slate-800 dark:text-slate-200">
                    {currentDoctor.hpcsaNumber} (Active & Verified)
                  </Text>
                </View>

                <View>
                  <Text className="font-sans text-[11px] uppercase tracking-wider text-slate-400">
                    Contact Phone & Email
                  </Text>
                  <Text className="font-sans-semibold text-[14px] text-slate-800 dark:text-slate-200">
                    {currentDoctor.phone} · {currentDoctor.email}
                  </Text>
                </View>

                <View>
                  <Text className="font-sans text-[11px] uppercase tracking-wider text-slate-400">
                    Consultation Hours
                  </Text>
                  <Text className="font-sans-semibold text-[14px] text-slate-800 dark:text-slate-200">
                    {currentDoctor.availability.days.join(', ')} ({currentDoctor.availability.startTime} -{' '}
                    {currentDoctor.availability.endTime})
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={() => router.push('/more/doctor-signup')}
                className="mt-5 rounded-2xl bg-slate-100 py-3 items-center dark:bg-slate-800"
              >
                <Text className="font-sans-bold text-[13px] text-slate-700 dark:text-slate-200">
                  Update Practice Details & Schedule
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Service Modal */}
      <DoctorServiceModal
        visible={serviceModalOpen}
        editingService={editingService}
        onClose={() => {
          setServiceModalOpen(false);
          setEditingService(null);
        }}
        onSave={(data, id) => {
          if (id) {
            updateDoctorService(id, data);
          } else {
            addDoctorService(data);
          }
        }}
      />
    </Screen>
  );
}
