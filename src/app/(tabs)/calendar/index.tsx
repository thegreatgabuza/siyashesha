import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { CalendarDays, Pill as PillIcon, Stethoscope, Target } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

import { healthDayIcons } from '@/lib/healthDayIcons';
import { CalendarDayCell } from '@/components/CalendarDayCell';
import { BrandLockup } from '@/components/ui/BrandLockup';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { HeroAction, heroShadow } from '@/components/ui/HeroAction';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { nextAppointment, type Appointment } from '@/data/appointments';
import { getDayAgenda, getMonthMarks, upcomingHealthDays } from '@/lib/calendarMarks';
import { formatDayMonth, formatFriendlyDate, formatTime12 } from '@/lib/date';
import { useAppStore } from '@/store/useAppStore';
import { useAccent } from '@/hooks/useAccent';

export default function CalendarScreen() {
  const { accent, accentSoft } = useAccent();
  const diaryNotes = useAppStore((s) => s.diaryNotes);

  const openAppointmentDiary = (appt: Appointment) => {
    const linkedNote = diaryNotes.find((n) => n.linkedAppointmentId === appt.id);
    if (linkedNote) {
      router.push(`/diary/${linkedNote.id}`);
    } else {
      router.push({
        pathname: '/diary/new',
        params: {
          linkedAppointmentId: appt.id,
          title: 'Questions for my doctor',
          category: 'Appointment',
        },
      });
    }
  };

  const today = dayjs().format('YYYY-MM-DD');
  const [visibleMonth, setVisibleMonth] = useState(dayjs().format('YYYY-MM'));
  const [selectedDate, setSelectedDate] = useState(today);

  const monthMarks = useMemo(() => getMonthMarks(visibleMonth), [visibleMonth]);
  const agenda = useMemo(() => getDayAgenda(selectedDate), [selectedDate]);
  const upcoming = useMemo(() => upcomingHealthDays(), []);
  const next = useMemo(() => nextAppointment(), []);

  // Month totals come from the same marks the grid shows, so the numbers always agree with it.
  const monthTotals = useMemo(() => {
    let appointments = 0;
    let healthDays = 0;
    for (const day of Object.values(monthMarks)) {
      appointments += day.appointments.length;
      healthDays += day.healthDays.length;
    }
    return { appointments, healthDays };
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
    <Screen contentClassName="px-5" bottomInset={140}>
      <View className="pb-1 pt-4">
        <BrandLockup />
      </View>

      <View className="pb-4 pt-5">
        <Text className="font-sans text-[14px] text-ink-muted dark:text-slate-400">Plan ahead</Text>
        <Text className="font-sans-bold text-[32px] leading-[36px] text-ink dark:text-slate-50">Health Calendar</Text>
      </View>

      {/* Next visit summary */}
      <View className="rounded-[32px] bg-ink p-5 dark:bg-canvasdark-card" style={heroShadow}>
        <View className="flex-row items-center justify-between">
          <Text className="font-sans-semibold text-[13px] text-white/70">Next visit</Text>
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
          </View>
        ) : (
          <View className="py-5">
            <Text className="font-sans-bold text-[22px] text-white">Nothing booked</Text>
            <Text className="mt-1 font-sans text-[13px] text-white/60">Upcoming visits will appear here.</Text>
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

      <View className="pt-6">
        <SectionHeader title="Month" />
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

      <View className="pt-6">
        <SectionHeader title={formatFriendlyDate(selectedDate)} />
        {agenda.appointments.length === 0 && agenda.healthDays.length === 0 ? (
          <Card>
            <Text className="text-center font-sans text-[13px] text-ink-muted dark:text-slate-400">
              Nothing scheduled on this day.
            </Text>
          </Card>
        ) : (
          <View className="gap-2.5">
            {agenda.appointments.map((appt) => (
              <Pressable
                key={appt.id}
                accessibilityRole="button"
                accessibilityLabel={`${appt.title}. Open related diary note`}
                onPress={() => openAppointmentDiary(appt)}
                className="flex-row items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card"
              >
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-500/20">
                  {appt.type === 'Medication Refill' ? (
                    <PillIcon size={18} color="#16A34A" />
                  ) : (
                    <Stethoscope size={18} color={accent} />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="font-sans-semibold text-[14px] text-ink dark:text-slate-50">{appt.title}</Text>
                  <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">
                    {appt.facility}
                    {appt.time !== '00:00' ? ` · ${formatTime12(appt.time)}` : ''}
                  </Text>
                </View>
              </Pressable>
            ))}
            {agenda.healthDays.map((card) => (
              <Pressable
                key={card.id}
                accessibilityRole="button"
                accessibilityLabel={card.title}
                onPress={() => router.push(`/calendar/${card.id}`)}
                className="flex-row items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card"
              >
                <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-500/20">
                  <Image source={healthDayIcons[card.icon]} style={{ width: 28, height: 28 }} contentFit="contain" />
                </View>
                <View className="flex-1">
                  <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">{card.dateLabel}</Text>
                  <Text className="font-sans-semibold text-[14px] text-ink dark:text-slate-50" numberOfLines={2}>
                    {card.title}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View className="pt-6">
        <SectionHeader title="Upcoming health days" />
        <FlatList
          data={upcoming}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingRight: 8 }}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.title}
              onPress={() => router.push(`/calendar/${item.id}`)}
              className="w-40 gap-2 rounded-3xl border border-slate-200 bg-white p-3 dark:border-canvasdark-card dark:bg-canvasdark-card"
            >
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-500/20">
                <Image source={healthDayIcons[item.icon]} style={{ width: 28, height: 28 }} contentFit="contain" />
              </View>
              <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">{item.dateLabel}</Text>
              <Text className="font-sans-semibold text-[13px] text-ink dark:text-slate-50" numberOfLines={2}>
                {item.title}
              </Text>
            </Pressable>
          )}
        />
        {upcoming.length === 0 ? (
          <EmptyState icon={<CalendarDays size={32} color={accentSoft} />} title="No upcoming health days" />
        ) : null}
      </View>
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
