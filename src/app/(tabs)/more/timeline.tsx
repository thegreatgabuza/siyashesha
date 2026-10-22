import dayjs from 'dayjs';
import { router } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { EmptyState } from '@/components/ui/EmptyState';
import { heroShadow } from '@/components/ui/HeroAction';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { hba1cSeries, sortedTimeline, timelineEventTypes, timelineProviders, type TimelineEvent } from '@/data/timeline';
import { useAccent } from '@/hooks/useAccent';

export default function TimelineScreen() {
  const { accent, accentSoft } = useAccent();
  const [providerFilter, setProviderFilter] = useState<string | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<string | 'All'>('All');

  const allEvents = useMemo(() => sortedTimeline(), []);

  const events = useMemo(() => {
    return allEvents.filter(
      (e) =>
        (providerFilter === 'All' || e.facility === providerFilter) &&
        (typeFilter === 'All' || e.type === typeFilter)
    );
  }, [allEvents, providerFilter, typeFilter]);

  const latest = hba1cSeries[hba1cSeries.length - 1];
  const previous = hba1cSeries.length > 1 ? hba1cSeries[hba1cSeries.length - 2] : undefined;
  const change = latest && previous ? +(latest.value - previous.value).toFixed(1) : null;

  const chartData = hba1cSeries.map((p) => ({
    value: p.value,
    label: dayjs(p.date).format('MMM YY'),
    dataPointText: `${p.value}%`,
  }));

  return (
    <Screen headerOwnsTopInset scroll={false}>
      <ScreenHeader title="Health Timeline" onBack={() => router.back()} />
      <ScreenScroll className="flex-1 px-5">
        {/* Summary */}
        <View className="rounded-[32px] bg-ink p-5 dark:bg-canvasdark-card" style={heroShadow}>
          <View className="flex-row items-center justify-between">
            <Text className="font-sans-semibold text-[13px] text-white/70">Latest HbA1c</Text>
            <View className="rounded-full bg-white/15 px-3 py-1">
              <Text className="font-sans-semibold text-[11px] text-white">{allEvents.length} events</Text>
            </View>
          </View>
          <View className="items-center py-5">
            <Text className="font-sans-bold text-[44px] leading-[48px] text-white">
              {latest ? `${latest.value}%` : '—'}
            </Text>
            <Text className="mt-1 font-sans text-[13px] text-white/60">
              {latest ? `on ${dayjs(latest.date).format('D MMM YYYY')}` : 'No HbA1c results yet'}
              {change !== null ? ` · ${change > 0 ? '+' : ''}${change} since last test` : ''}
            </Text>
          </View>
          <Text className="font-sans text-[12px] leading-[17px] text-white/60">
            Target range for most adults with diabetes is below 7%.
          </Text>
        </View>

        {/* Trend */}
        <View className="mt-5 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
          <Text className="font-sans-bold text-[14px] text-ink dark:text-slate-50">HbA1c trend</Text>
          <Text className="mb-3 font-sans text-[12px] text-ink-muted dark:text-slate-400">Each point is one test result.</Text>
          <LineChart
            data={chartData}
            curved
            areaChart
            color={accent}
            startFillColor={accent}
            endFillColor={accent}
            startOpacity={0.3}
            endOpacity={0.02}
            thickness={2.5}
            dataPointsColor="#0B2559"
            dataPointsRadius={4}
            textColor1="#0B2559"
            textFontSize={11}
            textShiftY={-8}
            yAxisTextStyle={{ color: '#5B6478', fontSize: 10 }}
            xAxisLabelTextStyle={{ color: '#5B6478', fontSize: 10 }}
            rulesColor="#E3E8F0"
            yAxisColor="transparent"
            xAxisColor="#E3E8F0"
            noOfSections={4}
            spacing={64}
            initialSpacing={24}
            height={160}
            maxValue={10}
          />
        </View>

        {/* Filters */}
        <View className="pt-6">
          <SectionHeader title="Provider" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-2">
              <Pill label="All" selected={providerFilter === 'All'} onPress={() => setProviderFilter('All')} />
              {timelineProviders.map((p) => (
                <Pill key={p} label={p} selected={providerFilter === p} onPress={() => setProviderFilter(p)} />
              ))}
            </View>
          </ScrollView>

          <SectionHeader title="Event type" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
            <View className="flex-row gap-2">
              <Pill label="All" selected={typeFilter === 'All'} onPress={() => setTypeFilter('All')} />
              {timelineEventTypes.map((t) => (
                <Pill key={t} label={t} selected={typeFilter === t} onPress={() => setTypeFilter(t)} />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Events */}
        <Text className="mb-3 font-sans text-[12px] text-ink-muted dark:text-slate-400">
          Showing {events.length} of {allEvents.length}
        </Text>
        {events.length === 0 ? (
          <EmptyState
            icon={<Clock size={32} color={accentSoft} />}
            title={allEvents.length === 0 ? 'Your timeline starts with your first record' : 'No matching events'}
            subtitle={allEvents.length === 0 ? 'Upload a document or add a visit and it will appear here in date order.' : undefined}
          />
        ) : (
          <View className="gap-3">
            {events.map((event, i) => (
              <View key={event.id} className="flex-row gap-3">
                <View className="items-center pt-2">
                  <View className="h-3 w-3 rounded-full bg-brand-500 dark:bg-brand-400" />
                  {i < events.length - 1 ? <View className="w-0.5 flex-1 bg-slate-200 dark:bg-canvasdark-card" /> : null}
                </View>
                <TimelineEventCard event={event} />
              </View>
            ))}
          </View>
        )}
      </ScreenScroll>
    </Screen>
  );
}

function TimelineEventCard({ event }: { event: TimelineEvent }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${event.title}`}
      onPress={() => {
        if (event.recordId) router.push(`/records/${event.recordId}`);
      }}
      disabled={!event.recordId}
      className="flex-1 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card"
    >
      <View className="mb-1.5 flex-row items-center justify-between">
        <View className="rounded-full bg-brand-100 px-2.5 py-0.5 dark:bg-brand-500/20">
          <Text className="font-sans-medium text-[10px] text-brand-600 dark:text-brand-300">{event.type}</Text>
        </View>
        <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">
          {dayjs(event.date).format('D MMM YYYY')}
        </Text>
      </View>
      <Text className="font-sans-semibold text-[15px] leading-[20px] text-ink dark:text-slate-50">{event.title}</Text>
      <Text className="mt-0.5 font-sans text-[12px] text-ink-muted dark:text-slate-400">
        {event.facility} · {event.provider}
      </Text>
      <Text className="mt-2 font-sans text-[13px] leading-[18px] text-ink-soft dark:text-slate-300">{event.summary}</Text>
      {event.recordId ? (
        <Text className="mt-2 font-sans-semibold text-[12px] text-brand-500 dark:text-brand-300">Open record</Text>
      ) : null}
    </Pressable>
  );
}
