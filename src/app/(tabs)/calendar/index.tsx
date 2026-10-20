import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { CalendarDays, Pill as PillIcon, Stethoscope } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

import { healthDayIcons } from '@/lib/healthDayIcons';
import { CalendarDayCell } from '@/components/CalendarDayCell';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { getDayAgenda, getMonthMarks, upcomingHealthDays } from '@/lib/calendarMarks';
import { formatFriendlyDate, formatTime12 } from '@/lib/date';
import { useAppStore } from '@/store/useAppStore';
import type { Appointment } from '@/data/appointments';

export default function CalendarScreen() {
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

  const [visibleMonth, setVisibleMonth] = useState(dayjs().format('YYYY-MM'));
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));

  const monthMarks = useMemo(() => getMonthMarks(visibleMonth), [visibleMonth]);
  const agenda = useMemo(() => getDayAgenda(selectedDate), [selectedDate]);
  const upcoming = useMemo(() => upcomingHealthDays(), []);

  const markedDates = useMemo(() => {
    const result: Record<string, any> = {};
    for (const [dateKey, dayAgenda] of Object.entries(monthMarks)) {
      const dots: { color: string }[] = [];
      if (dayAgenda.appointments.some((a) => a.type === 'Appointment')) dots.push({ color: '#6D5BD0' });
      if (dayAgenda.appointments.some((a) => a.type === 'Medication Refill')) dots.push({ color: '#0D9488' });
      result[dateKey] = { marked: true, dots };
    }
    result[selectedDate] = { ...(result[selectedDate] ?? {}), selected: true };
    return result;
  }, [monthMarks, selectedDate]);

  return (
    <Screen contentClassName="px-5" bottomInset={140}>
      <View className="pb-2 pt-4">
        <Text className="font-serif text-[26px] text-ink dark:text-slate-50">Health Calendar</Text>
        <Text className="font-sans text-[13px] text-ink-muted dark:text-slate-400">
          Appointments, medicine refills and WHO health awareness days.
        </Text>
      </View>

      <Card className="mt-2">
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
            monthTextColor: '#0B1E40',
            arrowColor: '#6D5BD0',
            textDayHeaderFontFamily: 'Inter_500Medium',
            textDayHeaderFontSize: 11,
            textSectionTitleColor: '#5B6B8A',
          }}
          style={{ paddingBottom: 4 }}
        />
        <View className="flex-row items-center justify-center gap-5 border-t border-slate-100 pt-3 dark:border-canvasdark-card">
          <Legend color="#6D5BD0" label="Appointment" />
          <Legend color="#0D9488" label="Medicine refill" />
          <View className="flex-row items-center gap-1.5">
            <View className="h-3.5 w-3.5 items-center justify-center">
              <Text className="text-[10px]">🏷️</Text>
            </View>
            <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">Health day</Text>
          </View>
        </View>
      </Card>

      <View className="pt-5">
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
                className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-canvasdark-card dark:bg-canvasdark-card"
              >
                <View className="h-10 w-10 items-center justify-center rounded-full bg-lavender-100 dark:bg-brand-500/20">
                  {appt.type === 'Medication Refill' ? (
                    <PillIcon size={18} color="#0D9488" />
                  ) : (
                    <Stethoscope size={18} color="#6D5BD0" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="font-sans-semibold text-[14px] text-ink dark:text-slate-50">
                    {appt.title}
                  </Text>
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
                className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-canvasdark-card dark:bg-canvasdark-card"
              >
                <Image source={healthDayIcons[card.icon]} style={{ width: 36, height: 36 }} contentFit="contain" />
                <View className="flex-1">
                  <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">
                    {card.dateLabel}
                  </Text>
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
      </View>
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
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-lavender-100 dark:bg-brand-500/20">
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
        <EmptyState icon={<CalendarDays size={32} color="#C3B6F0" />} title="No upcoming health days" />
      ) : null}
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
