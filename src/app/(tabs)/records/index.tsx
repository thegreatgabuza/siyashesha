import dayjs from 'dayjs';
import { router } from 'expo-router';
import {
  FileText,
  FlaskConical,
  HeartPulse,
  Pill as PillIcon,
  Plus,
  Scan,
  Search,
  Stethoscope,
  Syringe,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { recordCategories, type MedicalRecord, type RecordCategory } from '@/data/records';
import { useAppStore } from '@/store/useAppStore';

const categoryIcons: Record<RecordCategory, any> = {
  'Blood Tests': FlaskConical,
  Radiology: Scan,
  Prescriptions: PillIcon,
  'Discharge Summaries': FileText,
  'Hospital Visits': HeartPulse,
  'Clinic Visits': Stethoscope,
  Operations: Syringe,
  'Specialist Letters': FileText,
  Vaccinations: Syringe,
  'Chronic Care': HeartPulse,
  Other: FileText,
};

export default function RecordsScreen() {
  const records = useAppStore((s) => s.records);
  const [category, setCategory] = useState<RecordCategory | 'All'>('All');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => {
    const result: Record<string, number> = { All: records.length };
    for (const cat of recordCategories) {
      result[cat] = records.filter((r) => r.category === cat).length;
    }
    return result;
  }, [records]);

  const filtered = useMemo(() => {
    return records
      .filter((r) => (category === 'All' ? true : r.category === category))
      .filter((r) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
          r.title.toLowerCase().includes(q) ||
          r.facility.toLowerCase().includes(q) ||
          (r.doctor ?? '').toLowerCase().includes(q) ||
          (r.diagnosis ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (a.eventDate < b.eventDate ? 1 : -1));
  }, [records, category, search]);

  return (
    <Screen scroll={false}>
      <View className="px-5 pb-2 pt-4">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="font-serif text-[26px] text-ink dark:text-slate-50">Medical Records</Text>
            <Text className="font-sans text-[13px] text-ink-muted dark:text-slate-400">
              {records.length} documents across {recordCategories.length} categories
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Upload a record"
            onPress={() => router.push('/records/upload')}
            className="h-12 w-12 items-center justify-center rounded-full bg-ink dark:bg-brand-500"
          >
            <Plus size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <View className="mt-4 flex-row items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1 dark:border-canvasdark-card dark:bg-canvasdark-card">
          <Search size={16} color="#5B6B8A" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search diagnosis, facility or doctor"
            placeholderTextColor="#8C98B8"
            className="min-h-[44px] flex-1 font-sans text-[14px] text-ink dark:text-slate-50"
            accessibilityLabel="Search medical records"
          />
        </View>
      </View>

      <FlatList
        data={recordCategories}
        horizontal
        keyExtractor={(c) => c}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingVertical: 12 }}
        ListHeaderComponent={<Pill label={`All (${counts.All})`} selected={category === 'All'} onPress={() => setCategory('All')} />}
        renderItem={({ item }) => (
          <Pill label={`${item} (${counts[item] ?? 0})`} selected={category === item} onPress={() => setCategory(item)} />
        )}
        ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
      />

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140, gap: 10 }}
        ListEmptyComponent={
          <EmptyState
            icon={<FileText size={32} color="#C3B6F0" />}
            title="No records found"
            subtitle="Try a different category or search term."
          />
        }
        renderItem={({ item }) => <RecordRow record={item} />}
      />
    </Screen>
  );
}

function RecordRow({ record }: { record: MedicalRecord }) {
  const Icon = categoryIcons[record.category] ?? FileText;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${record.title}`}
      onPress={() => router.push(`/records/${record.id}`)}
      className="flex-row items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card"
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-lavender-100 dark:bg-brand-500/20">
        <Icon size={20} color="#6D5BD0" />
      </View>
      <View className="flex-1">
        <Text className="font-sans-semibold text-[14px] text-ink dark:text-slate-50" numberOfLines={1}>
          {record.title}
        </Text>
        <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400" numberOfLines={1}>
          {record.facility} · {dayjs(record.eventDate).format('D MMM YYYY')}
        </Text>
      </View>
      <View className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-canvasdark-card">
        <Text className="font-sans-medium text-[10px] text-ink-muted dark:text-slate-400">
          {record.category}
        </Text>
      </View>
    </Pressable>
  );
}
