import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  CalendarDays,
  CalendarPlus,
  Clock,
  Edit2,
  FileText,
  MapPin,
  Pill as PillIcon,
  Plus,
  Stethoscope,
  Target,
  Trash2,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

import { CalendarDayCell } from '@/components/CalendarDayCell';
import { AppointmentModal } from '@/components/calendar/AppointmentModal';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { HeroAction, heroShadow } from '@/components/ui/HeroAction';
import { JournalSwitch } from '@/components/JournalSwitch';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useToast } from '@/components/ui/Toast';
import { Txt } from '@/components/ui/Txt';
import { nextAppointment, type Appointment } from '@/data/appointments';
import { elevation, fonts, radii } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { useAccent } from '@/hooks/useAccent';
import { getDayAgenda, getMonthMarks, upcomingHealthDays } from '@/lib/calendarMarks';
import { formatDayMonth, formatFriendlyDate, formatTime12 } from '@/lib/date';
import { healthDayIcons } from '@/lib/healthDayIcons';
import { useAppStore } from '@/store/useAppStore';

export default function CalendarScreen() {
  const { accent, accentSoft } = useAccent();
  const t = useTokens();
  const toast = useToast();

  const appointments = useAppStore((s) => s.appointments);
  const addAppointment = useAppStore((s) => s.addAppointment);
  const updateAppointment = useAppStore((s) => s.updateAppointment);
  const deleteAppointment = useAppStore((s) => s.deleteAppointment);
  const diaryNotes = useAppStore((s) => s.diaryNotes);

  const today = dayjs().format('YYYY-MM-DD');
  const [visibleMonth, setVisibleMonth] = useState(dayjs().format('YYYY-MM'));
  const [selectedDate, setSelectedDate] = useState(today);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | undefined>();

  const openNewAppointmentModal = (dateToUse?: string) => {
    setSelectedAppointment(undefined);
    if (dateToUse) setSelectedDate(dateToUse);
    setModalVisible(true);
  };

  const openEditAppointmentModal = (appt: Appointment) => {
    setSelectedAppointment(appt);
    setModalVisible(true);
  };

  const handleSaveAppointment = (data: Omit<Appointment, 'id'>) => {
    if (selectedAppointment) {
      updateAppointment(selectedAppointment.id, data);
      toast.show('Visit details updated', 'success');
    } else {
      addAppointment(data);
      toast.show('Visit scheduled in your calendar', 'success');
    }
  };

  const handleDeleteAppointment = (id: string) => {
    deleteAppointment(id);
    toast.show('Visit cancelled', 'info');
  };

  const openAppointmentDiary = (appt: Appointment) => {
    const linkedNote = diaryNotes.find((n) => n.linkedAppointmentId === appt.id);
    if (linkedNote) {
      router.push(`/diary/${linkedNote.id}`);
    } else {
      router.push({
        pathname: '/diary/new',
        params: {
          linkedAppointmentId: appt.id,
          title: `Questions for ${appt.title}`,
          category: 'Appointment',
        },
      });
    }
  };

  const monthMarks = useMemo(() => getMonthMarks(visibleMonth, appointments), [visibleMonth, appointments]);
  const agenda = useMemo(() => getDayAgenda(selectedDate, appointments), [selectedDate, appointments]);
  const upcoming = useMemo(() => upcomingHealthDays(), []);
  const next = useMemo(() => nextAppointment(appointments), [appointments]);

  // Month totals come directly from the dynamic appointments store
  const monthTotals = useMemo(() => {
    let apptCount = 0;
    let healthDayCount = 0;
    for (const day of Object.values(monthMarks)) {
      apptCount += day.appointments.length;
      healthDayCount += day.healthDays.length;
    }
    return { appointments: apptCount, healthDays: healthDayCount };
  }, [monthMarks]);

  const markedDates = useMemo(() => {
    const result: Record<string, any> = {};
    for (const [dateKey, dayAgenda] of Object.entries(monthMarks)) {
      const dots: { color: string }[] = [];
      if (dayAgenda.appointments.some((a) => a.type === 'Appointment')) dots.push({ color: accent });
      if (dayAgenda.appointments.some((a) => a.type === 'Medication Refill')) dots.push({ color: '#16A34A' });
      result[dateKey] = { marked: true, dots };
    }
    result[selectedDate] = { ...(result[selectedDate] ?? {}), selected: true };
    return result;
  }, [monthMarks, selectedDate, accent]);

  return (
    <Screen contentClassName="px-5">
      <View className="pb-4 pt-4">
        <JournalSwitch active="calendar" />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 }}>
        <View>
          <Txt variant="title">Health Calendar</Txt>
          <Txt variant="callout" tone="muted" style={{ marginTop: 2 }}>
            Plan ahead & track clinical visits
          </Txt>
        </View>
        <PressableScale
          accessibilityLabel="Schedule new visit"
          onPress={() => openNewAppointmentModal(selectedDate)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: radii.pill,
            backgroundColor: t.accent,
          }}
        >
          <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
          <Txt variant="footnote" tone="onNavy" style={{ fontFamily: fonts.semibold }}>
            Book Visit
          </Txt>
        </PressableScale>
      </View>

      {/* Next visit summary */}
      <View className="rounded-[32px] bg-ink p-5 dark:bg-canvasdark-card" style={heroShadow}>
        <View className="flex-row items-center justify-between">
          <Text className="font-sans-semibold text-[13px] text-white/70">Next upcoming visit</Text>
          {next ? (
            <View className="rounded-full bg-white/15 px-3 py-1">
              <Text className="font-sans-semibold text-[11px] text-white">
                {next.type === 'Medication Refill' ? 'Refill' : 'Appointment'}
              </Text>
            </View>
          ) : null}
        </View>

        {next ? (
          <View className="py-5">
            <Text className="font-sans-bold text-[22px] leading-[27px] text-white" numberOfLines={2}>
              {next.title}
            </Text>
            <Text className="mt-1 font-sans text-[13px] text-white/60">
              {formatDayMonth(next.date)}
              {next.time !== '00:00' ? ` · ${formatTime12(next.time)}` : ''} · {next.facility}
            </Text>
            {next.provider ? (
              <Text className="mt-1 font-sans text-[12px] text-white/50">Attending: {next.provider}</Text>
            ) : null}
          </View>
        ) : (
          <View className="py-5">
            <Text className="font-sans-bold text-[22px] text-white">No upcoming visits</Text>
            <Text className="mt-1 font-sans text-[13px] text-white/60">
              Schedule your next doctor appointment or refill date.
            </Text>
          </View>
        )}

        <View className="flex-row items-center gap-2">
          <HeroAction
            label="Today"
            icon={<Target size={16} color="#FFFFFF" />}
            onPress={() => {
              setVisibleMonth(dayjs().format('YYYY-MM'));
              setSelectedDate(today);
            }}
          />
          {next ? (
            <HeroAction
              label="Visit notes"
              icon={<Stethoscope size={16} color="#FFFFFF" />}
              onPress={() => openAppointmentDiary(next)}
            />
          ) : null}
          <HeroAction
            label="+ Schedule"
            icon={<CalendarPlus size={16} color="#FFFFFF" />}
            onPress={() => openNewAppointmentModal(selectedDate)}
          />
        </View>
      </View>

      {/* Month totals */}
      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
          <Text className="font-sans-medium text-[12px] text-ink-muted dark:text-slate-400">Visits this month</Text>
          <Text className="mt-2 font-sans-bold text-[30px] text-ink dark:text-slate-50">{monthTotals.appointments}</Text>
          <Text className="mt-0.5 font-sans text-[11px] text-ink-muted dark:text-slate-500">appointments and refills</Text>
        </View>
        <View className="flex-1 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
          <Text className="font-sans-medium text-[12px] text-ink-muted dark:text-slate-400">Health days</Text>
          <Text className="mt-2 font-sans-bold text-[30px] text-ink dark:text-slate-50">{monthTotals.healthDays}</Text>
          <Text className="mt-0.5 font-sans text-[11px] text-ink-muted dark:text-slate-500">WHO awareness days</Text>
        </View>
      </View>

      {/* Calendar Grid */}
      <View className="pt-6">
        <SectionHeader title="Month View" />
      </View>
      <Card>
        <Calendar
          current={`${visibleMonth}-01`}
          markingType="custom"
          markedDates={markedDates}
          dayComponent={CalendarDayCell as any}
          onDayPress={(d) => setSelectedDate(d.dateString)}
          onMonthChange={(d) => setVisibleMonth(dayjs(d.dateString).format('YYYY-MM'))}
          theme={{
            backgroundColor: 'transparent',
            calendarBackground: 'transparent',
            textMonthFontFamily: 'Inter_700Bold',
            textMonthFontSize: 16,
            monthTextColor: '#0B2559',
            arrowColor: accent,
            textDayHeaderFontFamily: 'Inter_500Medium',
            textDayHeaderFontSize: 11,
            textSectionTitleColor: '#5B6478',
          }}
          style={{ paddingBottom: 4 }}
        />
        <View className="flex-row items-center justify-center gap-5 border-t border-slate-100 pt-3 dark:border-canvasdark-card">
          <Legend color={accent} label="Appointment" />
          <Legend color="#16A34A" label="Medicine refill" />
          <View className="flex-row items-center gap-1.5">
            <View className="h-3.5 w-3.5 items-center justify-center">
              <Text className="text-[10px]">🏷️</Text>
            </View>
            <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">Health day</Text>
          </View>
        </View>
      </Card>

      {/* Selected Day Agenda */}
      <View className="pt-6">
        <SectionHeader
          title={formatFriendlyDate(selectedDate)}
          action="+ Add Visit"
          onActionPress={() => openNewAppointmentModal(selectedDate)}
        />
        {agenda.appointments.length === 0 && agenda.healthDays.length === 0 ? (
          <Card>
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <Txt variant="body" tone="muted">
                Nothing scheduled on this day.
              </Txt>
              <PressableScale
                onPress={() => openNewAppointmentModal(selectedDate)}
                style={{
                  marginTop: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: radii.pill,
                  backgroundColor: t.surfaceMuted,
                }}
              >
                <Plus size={14} color={t.accent} />
                <Txt variant="footnote" color={t.accent} style={{ fontFamily: fonts.semibold }}>
                  Schedule visit for this day
                </Txt>
              </PressableScale>
            </View>
          </Card>
        ) : (
          <View className="gap-3">
            {/* Appointments */}
            {agenda.appointments.map((appt) => (
              <View
                key={appt.id}
                style={[
                  {
                    borderRadius: radii.xl,
                    backgroundColor: t.surface,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: t.border,
                  },
                  elevation[1],
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
                  <View
                    style={{
                      height: 44,
                      width: 44,
                      borderRadius: radii.md,
                      backgroundColor:
                        appt.type === 'Medication Refill' ? 'rgba(22, 163, 74, 0.12)' : 'rgba(14, 116, 144, 0.12)',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {appt.type === 'Medication Refill' ? (
                      <PillIcon size={20} color="#16A34A" />
                    ) : (
                      <Stethoscope size={20} color={t.accent} />
                    )}
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Txt variant="bodyStrong" numberOfLines={1}>
                        {appt.title}
                      </Txt>
                      <View
                        style={{
                          backgroundColor:
                            appt.type === 'Medication Refill' ? 'rgba(22, 163, 74, 0.12)' : t.surfaceMuted,
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: radii.pill,
                        }}
                      >
                        <Txt
                          variant="label"
                          color={appt.type === 'Medication Refill' ? '#16A34A' : t.textMuted}
                        >
                          {appt.type === 'Medication Refill' ? 'Refill' : 'Visit'}
                        </Txt>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <MapPin size={13} color={t.textMuted} />
                      <Txt variant="footnote" tone="muted" numberOfLines={1}>
                        {appt.facility}
                      </Txt>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <Clock size={13} color={t.textMuted} />
                      <Txt variant="footnote" tone="muted">
                        {appt.time !== '00:00' ? formatTime12(appt.time) : 'All day'}
                        {appt.provider ? ` · ${appt.provider}` : ''}
                      </Txt>
                    </View>

                    {appt.notes ? (
                      <View
                        style={{
                          marginTop: 10,
                          backgroundColor: t.surfaceMuted,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: radii.sm,
                        }}
                      >
                        <Txt variant="footnote" tone="muted">
                          Notes: {appt.notes}
                        </Txt>
                      </View>
                    ) : null}
                  </View>
                </View>

                {/* Action buttons */}
                <View
                  style={{
                    flexDirection: 'row',
                    gap: 8,
                    marginTop: 12,
                    paddingTop: 10,
                    borderTopWidth: 1,
                    borderTopColor: t.border,
                  }}
                >
                  <PressableScale
                    onPress={() => openAppointmentDiary(appt)}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      paddingVertical: 7,
                      borderRadius: radii.pill,
                      backgroundColor: t.surfaceMuted,
                    }}
                  >
                    <FileText size={14} color={t.text} />
                    <Txt variant="footnote" style={{ fontFamily: fonts.medium }}>
                      Doctor Notes
                    </Txt>
                  </PressableScale>

                  <PressableScale
                    onPress={() => openEditAppointmentModal(appt)}
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      paddingVertical: 7,
                      borderRadius: radii.pill,
                      backgroundColor: t.surfaceMuted,
                    }}
                  >
                    <Edit2 size={14} color={t.accent} />
                    <Txt variant="footnote" color={t.accent} style={{ fontFamily: fonts.medium }}>
                      Reschedule
                    </Txt>
                  </PressableScale>

                  <PressableScale
                    onPress={() => {
                      Alert.alert('Cancel Appointment', `Cancel "${appt.title}"?`, [
                        { text: 'Keep', style: 'cancel' },
                        {
                          text: 'Cancel Visit',
                          style: 'destructive',
                          onPress: () => handleDeleteAppointment(appt.id),
                        },
                      ]);
                    }}
                    style={{
                      width: 36,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: radii.pill,
                      backgroundColor: 'rgba(220, 31, 38, 0.08)',
                    }}
                  >
                    <Trash2 size={14} color="#DC1F26" />
                  </PressableScale>
                </View>
              </View>
            ))}

            {/* Health Days on that day */}
            {agenda.healthDays.map((card) => (
              <PressableScale
                key={card.id}
                accessibilityRole="button"
                accessibilityLabel={card.title}
                onPress={() => router.push(`/calendar/${card.id}`)}
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 14,
                    padding: 16,
                    borderRadius: radii.xl,
                    backgroundColor: t.surface,
                    borderWidth: 1,
                    borderColor: t.border,
                  },
                  elevation[1],
                ]}
              >
                <View
                  style={{
                    height: 44,
                    width: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radii.md,
                    backgroundColor: t.surfaceMuted,
                  }}
                >
                  <Image source={healthDayIcons[card.icon]} style={{ width: 28, height: 28 }} contentFit="contain" />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="footnote" tone="muted">
                    {card.dateLabel} · WHO Awareness Day
                  </Txt>
                  <Txt variant="bodyStrong" numberOfLines={2} style={{ marginTop: 2 }}>
                    {card.title}
                  </Txt>
                </View>
              </PressableScale>
            ))}
          </View>
        )}
      </View>

      {/* Upcoming Health Awareness Days Carousel */}
      <View className="pt-6 pb-8">
        <SectionHeader title="Upcoming Health Awareness Days" />
        <FlatList
          data={upcoming}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingRight: 8 }}
          renderItem={({ item }) => (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={item.title}
              onPress={() => router.push(`/calendar/${item.id}`)}
              style={[
                {
                  width: 170,
                  gap: 8,
                  borderRadius: radii.xl,
                  backgroundColor: t.surface,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: t.border,
                },
                elevation[1],
              ]}
            >
              <View
                style={{
                  height: 48,
                  width: 48,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: radii.md,
                  backgroundColor: t.surfaceMuted,
                }}
              >
                <Image source={healthDayIcons[item.icon]} style={{ width: 30, height: 30 }} contentFit="contain" />
              </View>
              <Txt variant="label" tone="muted" style={{ fontSize: 10 }}>
                {item.dateLabel}
              </Txt>
              <Txt variant="bodyStrong" numberOfLines={2}>
                {item.title}
              </Txt>
            </PressableScale>
          )}
        />
        {upcoming.length === 0 ? (
          <EmptyState icon={<CalendarDays size={32} color={accentSoft} />} title="No upcoming health days" />
        ) : null}
      </View>

      {/* Interactive Appointment Modal */}
      <AppointmentModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveAppointment}
        onDelete={handleDeleteAppointment}
        initialDate={selectedDate}
        existingAppointment={selectedAppointment}
      />
    </Screen>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">{label}</Text>
    </View>
  );
}
