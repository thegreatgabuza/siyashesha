import dayjs from 'dayjs';
import { router } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { hba1cSeries, sortedTimeline, timelineEventTypes, timelineProviders, type TimelineEvent } from '@/data/timeline';

export default function TimelineScreen() {
  const [providerFilter, setProviderFilter] = useState<string | 'All'>('All');
  const [typeFilter, setTypeFilter] = useState<string | 'All'>('All');

  const events = useMemo(() => {
    return sortedTimeline().filter(
      (e) =>
        (providerFilter === 'All' || e.facility === providerFilter) &&
        (typeFilter === 'All' || e.type === typeFilter)
    );
  }, [providerFilter, typeFilter]);

  const chartData = hba1cSeries.map((p) => ({
    value: p.value,
    label: dayjs(p.date).format('MMM YY'),
    dataPointText: `${p.value}%`,
  }));

  return (
    <Screen bottomInset={60}>
      <ScreenHeader title="Health Timeline" onBack={() => router.back()} />
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 48 }}>
        <Card className="mb-5">
          <Text className="mb-1 font-sans-bold text-[14px] text-ink dark:text-slate-50">HbA1c Trend</Text>
          <Text className="mb-3 font-sans text-[12px] text-ink-muted dark:text-slate-400">
            Target range for most adults with diabetes is below 7%.
          </Text>
          <LineChart
            data={chartData}
            curved
            areaChart
            color="#6D5BD0"
            startFillColor="#6D5BD0"
            endFillColor="#6D5BD0"
            startOpacity={0.3}
            endOpacity={0.02}
            thickness={2.5}
            dataPointsColor="#0B1E40"
            dataPointsRadius={4}
            textColor1="#0B1E40"
            textFontSize={11}
            textShiftY={-8}
            yAxisTextStyle={{ color: '#5B6B8A', fontSize: 10 }}
            xAxisLabelTextStyle={{ color: '#5B6B8A', fontSize: 10 }}
            rulesColor="#E3E8F0"
            yAxisColor="transparent"
            xAxisColor="#E3E8F0"
            noOfSections={4}
            spacing={64}
            initialSpacing={24}
            height={160}
            maxValue={10}
          />
        </Card>

        <Text className="mb-2 font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">
          Filter by provider
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          <View className="flex-row gap-2">
            <Pill label="All" selected={providerFilter === 'All'} onPress={() => setProviderFilter('All')} />
            {timelineProviders.map((p) => (
              <Pill key={p} label={p} selected={providerFilter === p} onPress={() => setProviderFilter(p)} />
            ))}
          </View>
        </ScrollView>

        <Text className="mb-2 font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">
          Filter by event type
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5">
          <View className="flex-row gap-2">
            <Pill label="All" selected={typeFilter === 'All'} onPress={() => setTypeFilter('All')} />
            {timelineEventTypes.map((t) => (
              <Pill key={t} label={t} selected={typeFilter === t} onPress={() => setTypeFilter(t)} />
            ))}
          </View>
        </ScrollView>

        {events.length === 0 ? (
          <EmptyState icon={<Clock size={32} color="#C3B6F0" />} title="No matching events" />
        ) : (
          <View className="gap-3">
            {events.map((event, i) => (
              <View key={event.id} className="flex-row gap-3">
                <View className="items-center">
                  <View className="h-3 w-3 rounded-full bg-brand-500" />
                  {i < events.length - 1 ? <View className="w-0.5 flex-1 bg-slate-200 dark:bg-canvasdark-card" /> : null}
                </View>
                <TimelineEventCard event={event} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
      className="mb-4 flex-1 rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-canvasdark-card dark:bg-canvasdark-card"
    >
      <View className="mb-1 flex-row items-center justify-between">
        <View className="rounded-full bg-lavender-100 px-2.5 py-0.5 dark:bg-brand-500/20">
          <Text className="font-sans-medium text-[10px] text-brand-600 dark:text-brand-400">{event.type}</Text>
        </View>
        <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">
          {dayjs(event.date).format('D MMM YYYY')}
        </Text>
      </View>
      <Text className="font-sans-semibold text-[14px] text-ink dark:text-slate-50" numberOfLines={2}>
        {event.title}
      </Text>
      <Text className="mt-0.5 font-sans text-[12px] text-ink-muted dark:text-slate-400" numberOfLines={1}>
        {event.facility} · {event.provider}
      </Text>
      <Text className="mt-1.5 font-sans text-[12px] text-ink-soft dark:text-slate-300" numberOfLines={2}>
        {event.summary}
      </Text>
    </Pressable>
  );
}
