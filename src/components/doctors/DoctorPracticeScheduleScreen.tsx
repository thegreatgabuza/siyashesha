import dayjs from 'dayjs';
import {
  Building,
  CalendarDays,
  Clock,
  MapPin,
  Phone,
  ShieldAlert,
  Stethoscope,
  Target,
  User,
  Video,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

import { PatientClinicalSummaryModal } from '@/components/doctors/PatientClinicalSummaryModal';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import { type DoctorBooking, type DoctorProfile } from '@/data/doctors';
import { formatFriendlyDate } from '@/lib/date';
import { getTelehealthRoomUrl } from '@/lib/doctorBooking';
import { tapFeedback } from '@/lib/feedback';
import { useAppStore } from '@/store/useAppStore';

type FormatFilter = 'all' | 'in_person' | 'video';

export function DoctorPracticeScheduleScreen() {
  const toast = useToast();

  const doctorProfile = useAppStore((s) => s.doctorProfile);
  const registeredDoctors = useAppStore((s) => s.registeredDoctors);
  const doctorBookings = useAppStore((s) => s.doctorBookings);

  const activeDoctor: DoctorProfile | undefined =
    doctorProfile ??
    registeredDoctors.find((d) => d.email.toLowerCase() === 'thobanisgabuzam2@gmail.com') ??
    registeredDoctors[0];

  const today = dayjs().format('YYYY-MM-DD');
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [visibleMonth, setVisibleMonth] = useState<string>(dayjs().format('YYYY-MM'));
  const [formatFilter, setFormatFilter] = useState<FormatFilter>('all');

  // Modal for Viewing Patient Info & Clinical Passport
  const [selectedBookingForModal, setSelectedBookingForModal] = useState<DoctorBooking | null>(null);

  // All bookings for this doctor
  const myBookings = useMemo(() => {
    if (!activeDoctor) return [];
    return doctorBookings
      .filter((b) => b.doctorId === activeDoctor.id || b.doctorName.includes(activeDoctor.fullName))
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.time.localeCompare(b.time);
      });
  }, [doctorBookings, activeDoctor]);

  // Filtered by format (all, in-person, video)
  const filteredBookings = useMemo(() => {
    if (formatFilter === 'all') return myBookings;
    return myBookings.filter((b) => b.mode === formatFilter);
  }, [myBookings, formatFilter]);

  // Aggregate monthly stats
  const monthStats = useMemo(() => {
    const inMonth = myBookings.filter((b) => b.date.startsWith(visibleMonth));
    const physical = inMonth.filter((b) => b.mode === 'in_person').length;
    const video = inMonth.filter((b) => b.mode === 'video').length;
    const todayCount = myBookings.filter((b) => b.date === today).length;
    return {
      total: inMonth.length,
      physical,
      video,
      todayCount,
    };
  }, [myBookings, visibleMonth, today]);

  // Marked dates for Calendar
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    myBookings.forEach((b) => {
      const dateKey = b.date;
      if (!marks[dateKey]) {
        marks[dateKey] = {
          dots: [],
          marked: true,
        };
      }
      const isVideo = b.mode === 'video';
      const dotColor = isVideo ? '#059669' : '#2563EB'; // Green for video, Blue for physical
      const alreadyHasColor = marks[dateKey].dots.some((d: any) => d.color === dotColor);
      if (!alreadyHasColor) {
        marks[dateKey].dots.push({ key: isVideo ? 'video' : 'physical', color: dotColor });
      }
    });

    // Mark selected date
    marks[selectedDate] = {
      ...(marks[selectedDate] || {}),
      selected: true,
      selectedColor: '#0B2559',
      selectedTextColor: '#FFFFFF',
    };

    return marks;
  }, [myBookings, selectedDate]);

  // Selected date's bookings
  const dayBookings = useMemo(() => {
    return filteredBookings.filter((b) => b.date === selectedDate);
  }, [filteredBookings, selectedDate]);

  // Handle open video call
  const handleJoinVideo = (booking: DoctorBooking) => {
    tapFeedback();
    const jitsiUrl = getTelehealthRoomUrl(booking.id);
    Linking.openURL(jitsiUrl).catch(() => {
      toast.show('Unable to launch video meeting browser', 'warning');
    });
  };

  // Handle call patient
  const handleCallPatient = (phone: string) => {
    tapFeedback();
    Linking.openURL(`tel:${phone}`).catch(() => {
      toast.show('Unable to dial patient number', 'warning');
    });
  };

  return (
    <Screen contentClassName="px-4 pb-28">
      {/* Header Banner */}
      <View className="pt-3 pb-2">
        <View className="flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center gap-1.5">
              <Stethoscope size={15} color="#0B2559" />
              <Text className="font-sans-bold text-[12px] uppercase tracking-wider text-brand-900 dark:text-brand-300">
                Doctor Practice Portal
              </Text>
            </View>
            <Text className="font-sans-bold text-[24px] text-ink dark:text-white">
              Practice Schedule
            </Text>
            <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
              {activeDoctor?.practiceName || 'Consultation Schedule & Patient Appointments'}
            </Text>
          </View>

          <Pressable
            onPress={() => {
              tapFeedback();
              setSelectedDate(today);
              setVisibleMonth(dayjs().format('YYYY-MM'));
            }}
            className="flex-row items-center gap-1 rounded-full border border-brand-500/30 bg-brand-50 px-3 py-1.5 active:bg-brand-100 dark:border-brand-500/20 dark:bg-brand-950/40"
          >
            <Target size={13} color="#0B2559" />
            <Text className="font-sans-bold text-[11px] text-brand-900 dark:text-brand-200">
              Today
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Monthly Summary Metrics */}
      <View className="mt-3 flex-row gap-2.5">
        <View className="flex-1 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
          <Text className="font-sans-medium text-[11px] text-slate-500 dark:text-slate-400">
            Total Consultations
          </Text>
          <Text className="mt-1 font-sans-bold text-[22px] text-ink dark:text-slate-50">
            {monthStats.total}
          </Text>
          <Text className="font-sans text-[10px] text-slate-400">
            in {dayjs(visibleMonth).format('MMMM YYYY')}
          </Text>
        </View>

        <View className="flex-1 rounded-2xl border border-blue-200/80 bg-blue-50/60 p-3.5 shadow-2xs dark:border-blue-900/40 dark:bg-blue-950/20">
          <View className="flex-row items-center gap-1">
            <Building size={12} color="#1E40AF" />
            <Text className="font-sans-bold text-[11px] text-blue-900 dark:text-blue-300">
              Physical Rooms
            </Text>
          </View>
          <Text className="mt-1 font-sans-bold text-[22px] text-blue-950 dark:text-blue-100">
            {monthStats.physical}
          </Text>
          <Text className="font-sans text-[10px] text-blue-700/70 dark:text-blue-300/70">
            in-practice visits
          </Text>
        </View>

        <View className="flex-1 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-3.5 shadow-2xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <View className="flex-row items-center gap-1">
            <Video size={12} color="#065F46" />
            <Text className="font-sans-bold text-[11px] text-emerald-900 dark:text-emerald-300">
              Online Video
            </Text>
          </View>
          <Text className="mt-1 font-sans-bold text-[22px] text-emerald-950 dark:text-emerald-100">
            {monthStats.video}
          </Text>
          <Text className="font-sans text-[10px] text-emerald-700/70 dark:text-emerald-300/70">
            telehealth calls
          </Text>
        </View>
      </View>

      {/* Format Filter Segment */}
      <View className="mt-4 flex-row rounded-xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900">
        <Pressable
          onPress={() => {
            tapFeedback();
            setFormatFilter('all');
          }}
          className={`flex-1 items-center justify-center rounded-lg py-2 ${
            formatFilter === 'all'
              ? 'bg-white shadow-2xs dark:bg-slate-800'
              : ''
          }`}
        >
          <Text
            className={`font-sans-semibold text-[12px] ${
              formatFilter === 'all'
                ? 'text-brand-900 dark:text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All Formats ({myBookings.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            tapFeedback();
            setFormatFilter('in_person');
          }}
          className={`flex-1 flex-row items-center justify-center gap-1 rounded-lg py-2 ${
            formatFilter === 'in_person'
              ? 'bg-white shadow-2xs dark:bg-slate-800'
              : ''
          }`}
        >
          <Building size={12} color={formatFilter === 'in_person' ? '#1E40AF' : '#64748B'} />
          <Text
            className={`font-sans-semibold text-[12px] ${
              formatFilter === 'in_person'
                ? 'text-blue-900 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Physical Rooms
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            tapFeedback();
            setFormatFilter('video');
          }}
          className={`flex-1 flex-row items-center justify-center gap-1 rounded-lg py-2 ${
            formatFilter === 'video'
              ? 'bg-white shadow-2xs dark:bg-slate-800'
              : ''
          }`}
        >
          <Video size={12} color={formatFilter === 'video' ? '#047857' : '#64748B'} />
          <Text
            className={`font-sans-semibold text-[12px] ${
              formatFilter === 'video'
                ? 'text-emerald-900 dark:text-emerald-300'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Online Video
          </Text>
        </Pressable>
      </View>

      {/* Calendar View Card */}
      <View className="mt-4">
        <Card>
          <Calendar
            current={`${visibleMonth}-01`}
            markingType="multi-dot"
            markedDates={markedDates}
            onDayPress={(d) => {
              tapFeedback();
              setSelectedDate(d.dateString);
            }}
            onMonthChange={(d) => setVisibleMonth(dayjs(d.dateString).format('YYYY-MM'))}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              textMonthFontFamily: 'Inter_700Bold',
              textMonthFontSize: 16,
              monthTextColor: '#0B2559',
              arrowColor: '#0B2559',
              textDayHeaderFontFamily: 'Inter_500Medium',
              textDayHeaderFontSize: 11,
              textSectionTitleColor: '#5B6478',
              todayTextColor: '#0284C7',
            }}
            style={{ paddingBottom: 4 }}
          />

          {/* Color Legend */}
          <View className="flex-row items-center justify-center gap-6 border-t border-slate-100 pt-3 dark:border-slate-800">
            <View className="flex-row items-center gap-1.5">
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#2563EB' }} />
              <Text className="font-sans text-[12px] text-slate-600 dark:text-slate-400">
                🏢 Physical Rooms
              </Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#059669' }} />
              <Text className="font-sans text-[12px] text-slate-600 dark:text-slate-400">
                📹 Online Video
              </Text>
            </View>
          </View>
        </Card>
      </View>

      {/* Daily Agenda Section */}
      <View className="pt-6">
        <View className="flex-row items-center justify-between pb-3">
          <View>
            <Text className="font-sans-bold text-[17px] text-ink dark:text-white">
              {formatFriendlyDate(selectedDate)}
            </Text>
            <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
              {dayBookings.length === 1
                ? '1 Consultation Scheduled'
                : `${dayBookings.length} Consultations Scheduled`}
            </Text>
          </View>

          {selectedDate !== today ? (
            <Pressable
              onPress={() => {
                tapFeedback();
                setSelectedDate(today);
                setVisibleMonth(dayjs().format('YYYY-MM'));
              }}
              className="rounded-full bg-slate-100 px-3 py-1 active:bg-slate-200 dark:bg-slate-800"
            >
              <Text className="font-sans-semibold text-[11px] text-slate-700 dark:text-slate-300">
                Jump to Today
              </Text>
            </Pressable>
          ) : null}
        </View>

        {dayBookings.length === 0 ? (
          <View className="mt-2 rounded-3xl border border-dashed border-slate-200 bg-white p-8 items-center justify-center dark:border-slate-800 dark:bg-canvasdark-card">
            <CalendarDays size={36} color="#94A3B8" />
            <Text className="mt-3 font-sans-bold text-[16px] text-ink dark:text-white">
              No Consultations on this Date
            </Text>
            <Text className="mt-1 text-center font-sans text-[12px] text-slate-500 dark:text-slate-400">
              {formatFilter !== 'all'
                ? `No ${formatFilter === 'in_person' ? 'physical' : 'online'} appointments on ${dayjs(selectedDate).format('D MMMM YYYY')}.`
                : `No patient bookings scheduled for ${dayjs(selectedDate).format('D MMMM YYYY')}.`}
            </Text>

            {myBookings.length > 0 ? (
              <Pressable
                onPress={() => {
                  tapFeedback();
                  const nextBooking = myBookings.find((b) => b.date >= today) || myBookings[0];
                  setSelectedDate(nextBooking.date);
                  setVisibleMonth(dayjs(nextBooking.date).format('YYYY-MM'));
                }}
                className="mt-4 rounded-xl bg-brand-500 px-4 py-2 active:bg-brand-600"
              >
                <Text className="font-sans-bold text-[12px] text-white">
                  View Next Scheduled Booking
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View className="gap-3.5">
            {dayBookings.map((b) => {
              const isVideo = b.mode === 'video';
              const summary = b.patientSummary;
              const hasAllergies = (summary?.allergies?.length ?? 0) > 0;
              const hasChronic = (summary?.chronicConditions?.length ?? 0) > 0;

              return (
                <View
                  key={b.id}
                  className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card"
                >
                  {/* Distinct Format Header Ribbon */}
                  <View
                    className={`flex-row items-center justify-between px-4 py-2.5 ${
                      isVideo
                        ? 'border-b border-emerald-100 bg-emerald-50/80 dark:border-emerald-950 dark:bg-emerald-950/40'
                        : 'border-b border-blue-100 bg-blue-50/80 dark:border-blue-950 dark:bg-blue-950/40'
                    }`}
                  >
                    <View className="flex-row items-center gap-1.5">
                      {isVideo ? (
                        <Video size={14} color="#047857" />
                      ) : (
                        <Building size={14} color="#1E40AF" />
                      )}
                      <Text
                        className={`font-sans-bold text-[12px] tracking-wide ${
                          isVideo
                            ? 'text-emerald-950 dark:text-emerald-200'
                            : 'text-blue-950 dark:text-blue-200'
                        }`}
                      >
                        {isVideo ? 'ONLINE VIDEO CONSULTATION' : 'PHYSICAL PRACTICE ROOMS'}
                      </Text>
                    </View>

                    <View className="flex-row items-center gap-1.5">
                      <Clock size={12} color="#64748B" />
                      <Text className="font-sans-semibold text-[12px] text-slate-700 dark:text-slate-300">
                        {b.time} ({b.durationMinutes} min)
                      </Text>
                    </View>
                  </View>

                  {/* Body Content */}
                  <View className="p-4">
                    {/* Patient identity row */}
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-3">
                        <View className="flex-row items-center gap-2">
                          <Text className="font-sans-bold text-[16px] text-ink dark:text-white">
                            {b.patientName}
                          </Text>
                          {summary?.bloodGroup ? (
                            <View className="rounded-full bg-rose-100 px-2 py-0.5 dark:bg-rose-950">
                              <Text className="font-sans-bold text-[10px] text-rose-700 dark:text-rose-300">
                                🩸 {summary.bloodGroup}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <Text className="font-sans-medium text-[12px] text-slate-500 dark:text-slate-400">
                          {b.serviceName} · R{b.priceZar}
                        </Text>
                      </View>

                      {/* Status badge */}
                      <View
                        className={`rounded-full px-2.5 py-1 ${
                          b.status === 'completed'
                            ? 'bg-slate-100 dark:bg-slate-800'
                            : b.status === 'confirmed'
                            ? 'bg-emerald-100 dark:bg-emerald-950'
                            : 'bg-amber-100 dark:bg-amber-950'
                        }`}
                      >
                        <Text
                          className={`font-sans-bold text-[11px] capitalize ${
                            b.status === 'completed'
                              ? 'text-slate-700 dark:text-slate-300'
                              : b.status === 'confirmed'
                              ? 'text-emerald-800 dark:text-emerald-300'
                              : 'text-amber-800 dark:text-amber-300'
                          }`}
                        >
                          {b.status}
                        </Text>
                      </View>
                    </View>

                    {/* Chief Complaint / Notes */}
                    {b.notes ? (
                      <View className="mt-2.5 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/60">
                        <Text className="font-sans-medium text-[11px] text-slate-400">
                          Reason for visit:
                        </Text>
                        <Text className="mt-0.5 font-sans text-[12px] text-slate-700 dark:text-slate-300">
                          {`"${b.notes}"`}
                        </Text>
                      </View>
                    ) : null}

                    {/* Clinical Tags: Allergies & Chronic Conditions */}
                    <View className="mt-3 flex-row flex-wrap items-center gap-1.5">
                      {hasAllergies ? (
                        <View className="flex-row items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900">
                          <ShieldAlert size={11} color="#E11D48" />
                          <Text className="font-sans-bold text-[10px] text-rose-700 dark:text-rose-300">
                            {summary!.allergies!.length} Critical Allergies
                          </Text>
                        </View>
                      ) : null}

                      {hasChronic ? (
                        summary!.chronicConditions!.slice(0, 2).map((c, i) => (
                          <View
                            key={i}
                            className="rounded-full bg-slate-100 px-2.5 py-1 border border-slate-200 dark:bg-slate-800 dark:border-slate-700"
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
                          className="flex-row items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 active:bg-slate-200 dark:bg-slate-800"
                        >
                          <Phone size={10} color="#0B2559" />
                          <Text className="font-sans text-[10px] text-slate-600 dark:text-slate-300">
                            {b.patientPhone}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>

                    {/* Location or Room Information */}
                    {!isVideo ? (
                      <View className="mt-2.5 flex-row items-center gap-1.5">
                        <MapPin size={12} color="#64748B" />
                        <Text className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                          {b.practiceAddress || activeDoctor?.practiceAddress}
                        </Text>
                      </View>
                    ) : null}

                    {/* Action Buttons */}
                    <View className="mt-3.5 flex-row items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                      {/* View Patient Info Button */}
                      <Pressable
                        onPress={() => {
                          tapFeedback();
                          setSelectedBookingForModal(b);
                        }}
                        className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-brand-500/30 bg-brand-50 py-2.5 active:bg-brand-100 dark:border-brand-500/20 dark:bg-brand-950/40"
                      >
                        <User size={13} color="#0B2559" />
                        <Text className="font-sans-bold text-[12px] text-brand-900 dark:text-brand-200">
                          View Patient Info
                        </Text>
                      </Pressable>

                      {/* Video Call Button if video */}
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
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
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
