import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  Check,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  User,
  Video,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
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
import { type DoctorProfile } from '@/data/doctors';
import { tapFeedback } from '@/lib/feedback';
import { useAppStore } from '@/store/useAppStore';

interface DoctorBookingModalProps {
  visible: boolean;
  doctor: DoctorProfile | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DoctorBookingModal({
  visible,
  doctor,
  onClose,
  onSuccess,
}: DoctorBookingModalProps) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const patient = useAppStore((s) => s.patientProfile);
  const bookDoctorService = useAppStore((s) => s.bookDoctorService);

  const activeServices = doctor?.services.filter((s) => s.isActive) ?? [];
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    activeServices[0]?.id ?? ''
  );

  const todayStr = dayjs().format('YYYY-MM-DD');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedTime, setSelectedTime] = useState('09:30');
  const [mode, setMode] = useState<'in_person' | 'video'>('in_person');
  const [patientName, setPatientName] = useState(
    [patient.firstName, patient.lastName].filter(Boolean).join(' ') || 'Jessica Tebatso'
  );
  const [patientPhone, setPatientPhone] = useState(patient.phone || '+27 82 456 7890');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);

  if (!doctor) return null;

  const currentService =
    activeServices.find((s) => s.id === selectedServiceId) ?? activeServices[0];

  // Generate next 14 days
  const daysList = Array.from({ length: 14 }).map((_, i) => {
    const d = dayjs().add(i, 'day');
    return {
      dateStr: d.format('YYYY-MM-DD'),
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.format('ddd'),
      dayNum: d.format('D'),
      monthName: d.format('MMM'),
    };
  });

  // Time slots
  const timeSlots = [
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
  ];

  const handleConfirm = () => {
    if (!currentService) {
      toast.show('Please select a service', 'warning');
      return;
    }
    if (!selectedDate || !selectedTime) {
      toast.show('Please select a date and time slot', 'warning');
      return;
    }

    setIsSubmitting(true);
    tapFeedback();

    try {
      const { booking } = bookDoctorService({
        doctorId: doctor.id,
        serviceId: currentService.id,
        date: selectedDate,
        time: selectedTime,
        mode,
        notes: notes.trim(),
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        patientEmail: patient.email || '',
      });

      setConfirmedBooking(booking);
      toast.show(
        `Appointment booked with ${doctor.title} ${doctor.fullName}!`,
        'success'
      );
      onSuccess?.();
    } catch (err: any) {
      toast.show(err?.message || 'Failed to book appointment', 'warning');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setConfirmedBooking(null);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={resetAndClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end bg-black/60"
      >
        <View
          style={{ maxHeight: '92%', paddingBottom: Math.max(insets.bottom, 16) }}
          className="rounded-t-3xl border-t border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-canvasdark-card"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
            <View>
              <Text className="font-display text-[24px] uppercase text-brand-900 dark:text-white">
                Book Consultation
              </Text>
              <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
                Direct clinical booking into Siyashesha Health Calendar
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={resetAndClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
            >
              <X size={18} color="#0B2559" />
            </Pressable>
          </View>

          {confirmedBooking ? (
            /* Booking Confirmation View */
            <View className="items-center px-6 py-8">
              <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                <CheckCircle2 size={36} color="#16A34A" />
              </View>
              <Text className="text-center font-display text-[26px] uppercase text-slate-900 dark:text-white">
                Booking Confirmed!
              </Text>
              <Text className="mt-1 text-center font-sans text-[14px] text-slate-600 dark:text-slate-300">
                Your appointment with{' '}
                <Text className="font-sans-bold text-brand-700 dark:text-brand-300">
                  {doctor.title} {doctor.fullName}
                </Text>{' '}
                has been scheduled and added to your Health Calendar.
              </Text>

              {/* Receipt Summary Card */}
              <View className="my-6 w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <View className="flex-row justify-between py-1">
                  <Text className="font-sans text-[13px] text-slate-500 dark:text-slate-400">
                    Service
                  </Text>
                  <Text className="font-sans-bold text-[13px] text-slate-900 dark:text-white">
                    {confirmedBooking.serviceName}
                  </Text>
                </View>
                <View className="flex-row justify-between py-1">
                  <Text className="font-sans text-[13px] text-slate-500 dark:text-slate-400">
                    Date & Time
                  </Text>
                  <Text className="font-sans-bold text-[13px] text-slate-900 dark:text-white">
                    {dayjs(confirmedBooking.date).format('ddd, D MMMM YYYY')} at{' '}
                    {confirmedBooking.time}
                  </Text>
                </View>
                <View className="flex-row justify-between py-1">
                  <Text className="font-sans text-[13px] text-slate-500 dark:text-slate-400">
                    Format
                  </Text>
                  <Text className="font-sans-bold text-[13px] text-slate-900 dark:text-white">
                    {confirmedBooking.mode === 'video' ? 'Secure Video Telehealth' : 'In-Person Practice'}
                  </Text>
                </View>
                <View className="flex-row justify-between py-1">
                  <Text className="font-sans text-[13px] text-slate-500 dark:text-slate-400">
                    Location / Link
                  </Text>
                  <Text className="max-w-[200px] text-right font-sans-medium text-[13px] text-slate-700 dark:text-slate-300">
                    {confirmedBooking.mode === 'video'
                      ? 'Video link sent via SMS & In-App'
                      : doctor.practiceAddress}
                  </Text>
                </View>
                <View className="mt-2 border-t border-slate-200 pt-2 flex-row justify-between dark:border-slate-700">
                  <Text className="font-sans-bold text-[14px] text-slate-900 dark:text-white">
                    Consultation Fee
                  </Text>
                  <Text className="font-sans-bold text-[16px] text-emerald-600 dark:text-emerald-400">
                    R{confirmedBooking.priceZar}
                  </Text>
                </View>
              </View>

              <View className="w-full gap-3">
                <ChunkyButton
                  label="View in Calendar & Appointments"
                  onPress={() => {
                    resetAndClose();
                    router.push('/(tabs)/calendar');
                  }}
                />
                <ChunkyButton
                  variant="ghost"
                  label="Done"
                  onPress={resetAndClose}
                />
              </View>
            </View>
          ) : (
            /* Booking Selection View */
            <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
              {/* Doctor Brief Card */}
              <View className="mb-5 flex-row items-center gap-3.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
                <View className="h-14 w-14 overflow-hidden rounded-2xl bg-brand-100 dark:bg-brand-500/20">
                  {doctor.avatarUrl ? (
                    <Image source={{ uri: doctor.avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : (
                    <View className="h-full w-full items-center justify-center">
                      <User size={24} color="#0B2559" />
                    </View>
                  )}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="font-sans-bold text-[16px] text-slate-900 dark:text-white">
                      {doctor.title} {doctor.fullName}
                    </Text>
                    <ShieldCheck size={16} color="#16A34A" />
                  </View>
                  <Text className="font-sans-medium text-[13px] text-brand-600 dark:text-brand-300">
                    {doctor.specialty} · HPCSA {doctor.hpcsaNumber}
                  </Text>
                  <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400" numberOfLines={1}>
                    {doctor.practiceName} · {doctor.city}
                  </Text>
                </View>
              </View>

              {/* Step 1: Services List */}
              <View className="mb-5">
                <Text className="mb-2 font-sans-bold text-[14px] text-slate-900 dark:text-white">
                  1. Select Consultation Service
                </Text>
                <View className="gap-2.5">
                  {activeServices.map((srv) => {
                    const isSelected = selectedServiceId === srv.id;
                    return (
                      <Pressable
                        key={srv.id}
                        onPress={() => {
                          tapFeedback();
                          setSelectedServiceId(srv.id);
                        }}
                        className={`rounded-2xl border p-3.5 transition-all ${
                          isSelected
                            ? 'border-brand-500 bg-brand-50/70 shadow-sm dark:border-brand-400 dark:bg-brand-500/15'
                            : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                        }`}
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
                          </View>
                          <View className="items-end">
                            <Text className="font-display text-[20px] text-emerald-600 dark:text-emerald-400">
                              R{srv.priceZar}
                            </Text>
                            {isSelected ? (
                              <View className="mt-1 h-5 w-5 items-center justify-center rounded-full bg-brand-500">
                                <Check size={12} color="#FFFFFF" strokeWidth={3} />
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Step 2: Format (In-person vs Video) */}
              <View className="mb-5">
                <Text className="mb-2 font-sans-bold text-[14px] text-slate-900 dark:text-white">
                  2. Consultation Format
                </Text>
                <View className="flex-row gap-2.5">
                  <Pressable
                    onPress={() => {
                      tapFeedback();
                      setMode('in_person');
                    }}
                    className={`flex-1 flex-row items-center justify-center gap-2 rounded-2xl border p-3 ${
                      mode === 'in_person'
                        ? 'border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/20'
                        : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                    }`}
                  >
                    <MapPin size={16} color={mode === 'in_person' ? '#0B2559' : '#64748B'} />
                    <Text
                      className={`font-sans-semibold text-[13px] ${
                        mode === 'in_person'
                          ? 'text-brand-900 dark:text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      In-Person Visit
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      tapFeedback();
                      setMode('video');
                    }}
                    className={`flex-1 flex-row items-center justify-center gap-2 rounded-2xl border p-3 ${
                      mode === 'video'
                        ? 'border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/20'
                        : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                    }`}
                  >
                    <Video size={16} color={mode === 'video' ? '#0B2559' : '#64748B'} />
                    <Text
                      className={`font-sans-semibold text-[13px] ${
                        mode === 'video'
                          ? 'text-brand-900 dark:text-white'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      Video Telehealth
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Step 3: Select Date */}
              <View className="mb-5">
                <Text className="mb-2 font-sans-bold text-[14px] text-slate-900 dark:text-white">
                  3. Select Date
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                  {daysList.map((day) => {
                    const isSelected = selectedDate === day.dateStr;
                    return (
                      <Pressable
                        key={day.dateStr}
                        onPress={() => {
                          tapFeedback();
                          setSelectedDate(day.dateStr);
                        }}
                        className={`h-20 w-16 items-center justify-center rounded-2xl border ${
                          isSelected
                            ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                            : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                        }`}
                      >
                        <Text
                          className={`font-sans text-[11px] uppercase ${
                            isSelected ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {day.dayName}
                        </Text>
                        <Text
                          className={`font-display text-[22px] leading-[26px] ${
                            isSelected ? 'text-white' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {day.dayNum}
                        </Text>
                        <Text
                          className={`font-sans text-[10px] uppercase ${
                            isSelected ? 'text-white/80' : 'text-slate-400'
                          }`}
                        >
                          {day.monthName}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Step 4: Time Slot */}
              <View className="mb-5">
                <Text className="mb-2 font-sans-bold text-[14px] text-slate-900 dark:text-white">
                  4. Select Time Slot
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {timeSlots.map((slot) => {
                    const isSelected = selectedTime === slot;
                    return (
                      <Pressable
                        key={slot}
                        onPress={() => {
                          tapFeedback();
                          setSelectedTime(slot);
                        }}
                        style={{ width: '23%' }}
                        className={`items-center justify-center rounded-xl border py-2.5 ${
                          isSelected
                            ? 'border-brand-500 bg-brand-500 text-white'
                            : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                        }`}
                      >
                        <Text
                          className={`font-sans-bold text-[13px] ${
                            isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {slot}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Step 5: Patient Details & Visit Notes */}
              <View className="mb-6">
                <Text className="mb-2 font-sans-bold text-[14px] text-slate-900 dark:text-white">
                  5. Patient Contact & Visit Reason
                </Text>
                <View className="gap-2.5">
                  <View>
                    <Text className="mb-1 font-sans text-[12px] text-slate-600 dark:text-slate-400">
                      Patient Full Name
                    </Text>
                    <TextInput
                      value={patientName}
                      onChangeText={setPatientName}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-sans text-[14px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </View>
                  <View>
                    <Text className="mb-1 font-sans text-[12px] text-slate-600 dark:text-slate-400">
                      Phone Number (for SMS & reminder alerts)
                    </Text>
                    <TextInput
                      value={patientPhone}
                      onChangeText={setPatientPhone}
                      keyboardType="phone-pad"
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 font-sans text-[14px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </View>
                  <View>
                    <Text className="mb-1 font-sans text-[12px] text-slate-600 dark:text-slate-400">
                      Symptoms or Reason for Visit (Optional)
                    </Text>
                    <TextInput
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="e.g. Follow-up for persistent cough, routine pap smear, prescription refill..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      numberOfLines={2}
                      className="min-h-[64px] rounded-xl border border-slate-200 bg-slate-50 p-3 font-sans text-[13px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </View>
                </View>
              </View>

              {/* Confirm Booking CTA */}
              <View className="mb-8">
                <ChunkyButton
                  label={
                    currentService
                      ? `Confirm Appointment · R${currentService.priceZar}`
                      : 'Confirm Appointment'
                  }
                  onPress={handleConfirm}
                  disabled={isSubmitting || !currentService}
                />
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
