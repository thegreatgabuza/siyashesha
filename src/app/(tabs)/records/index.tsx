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
  X,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { recordCategories, type MedicalRecord, type RecordCategory } from '@/data/records';
import { useAccent } from '@/hooks/useAccent';
import {
  countByCategory,
  distinctCategories,
  formatEventDate,
  matchesSearch,
  recordSortOptions,
  reviewLabel,
  sortRecords,
  type RecordSort,
} from '@/lib/recordSearch';
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
  const { accent, accentSoft } = useAccent();
  const records = useAppStore((s) => s.records);
  const [category, setCategory] = useState<RecordCategory | 'All'>('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<RecordSort>('newest');

  // Categories that exist in the vault, in the app's standard order, with no duplicates.
  const vaultCategories = useMemo(() => {
    const present = new Set(distinctCategories(records));
    return recordCategories.filter((c) => present.has(c));
  }, [records]);

  // Search is applied first, so category counts always match what the user can see.
  const searchMatches = useMemo(() => records.filter((r) => matchesSearch(r, search)), [records, search]);

  const counts = useMemo(() => countByCategory(searchMatches), [searchMatches]);

  const visible = useMemo(() => {
    const inCategory = category === 'All' ? searchMatches : searchMatches.filter((r) => r.category === category);
    return sortRecords(inCategory, sort);
  }, [searchMatches, category, sort]);

  // Quick-access categories are the four with the most records; the rest sit behind "More categories".
  const quickCategories = useMemo(() => {
    const totals = countByCategory(records);
    return [...vaultCategories].sort((a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0)).slice(0, 4);
  }, [records, vaultCategories]);
  const moreCategories = vaultCategories.filter((c) => !quickCategories.includes(c));
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  // Keep a selected category visible even when it sits behind "More categories".
  const expandCategories = showMoreCategories || (category !== 'All' && moreCategories.includes(category));

  const filtersActive = search.trim() !== '' || category !== 'All' || sort !== 'newest';

  const clearFilters = () => {
    setSearch('');
    setCategory('All');
    setSort('newest');
  };

  return (
    <Screen scroll={false}>
      <View className="px-5 pb-2 pt-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <Text className="font-sans-bold text-[26px] text-ink dark:text-slate-50">Medical Records</Text>
            <Text className="font-sans text-[13px] text-ink-muted dark:text-slate-400">
              {records.length} {records.length === 1 ? 'record' : 'records'} · {vaultCategories.length}{' '}
              {vaultCategories.length === 1 ? 'category' : 'categories'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add record"
            onPress={() => router.push('/records/upload')}
            className="min-h-[44px] flex-row items-center gap-1.5 rounded-full bg-ink px-4 dark:bg-brand-400"
          >
            <Plus size={18} color="#FFFFFF" />
            <Text className="font-sans-semibold text-[13px] text-white">Add Record</Text>
          </Pressable>
        </View>

        <View className="mt-4 flex-row items-center gap-2 rounded-full border border-slate-200 bg-white px-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
          <Search size={16} color="#5B6478" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search records, diagnoses, doctors…"
            placeholderTextColor="#8C98B8"
            autoCorrect={false}
            returnKeyType="search"
            className="min-h-[44px] flex-1 font-sans text-[14px] text-ink dark:text-slate-50"
            accessibilityLabel="Search medical records"
          />
          {search.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setSearch('')}
              hitSlop={8}
              className="h-8 w-8 items-center justify-center"
            >
              <X size={16} color="#5B6478" />
            </Pressable>
          ) : null}
        </View>
      </View>

      {records.length === 0 ? (
        <EmptyState
          icon={<FileText size={32} color={accentSoft} />}
          title="No medical records yet"
          subtitle="Upload a document, scan one with your camera, or add a record by hand."
          action={<AddRecordButton />}
        />
      ) : (
        <>
          <View className="flex-row flex-wrap gap-2 px-5 pb-2 pt-2.5">
            <Pill label={`All (${searchMatches.length})`} selected={category === 'All'} onPress={() => setCategory('All')} />
            {quickCategories.map((c) => (
              <Pill
                key={c}
                label={`${c} (${counts.get(c) ?? 0})`}
                selected={category === c}
                onPress={() => setCategory(c)}
              />
            ))}
            {moreCategories.length > 0 && !expandCategories ? (
              <Pill
                label={`More categories (${moreCategories.length})`}
                selected={false}
                onPress={() => setShowMoreCategories(true)}
              />
            ) : null}
            {expandCategories
              ? moreCategories.map((c) => (
                  <Pill
                    key={c}
                    label={`${c} (${counts.get(c) ?? 0})`}
                    selected={category === c}
                    onPress={() => setCategory(c)}
                  />
                ))
              : null}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 8 }}>
            {recordSortOptions.map((o) => (
              <Pill key={o.key} label={o.label} selected={sort === o.key} onPress={() => setSort(o.key)} />
            ))}
          </ScrollView>

          <View className="flex-row items-center justify-between px-5 pb-2">
            <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">
              Showing {visible.length} of {records.length}
            </Text>
            {filtersActive ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Clear all filters" onPress={clearFilters} hitSlop={8}>
                <Text className="font-sans-semibold text-[12px] text-brand-600 dark:text-brand-300">Clear filters</Text>
              </Pressable>
            ) : null}
          </View>

          <FlatList
            data={visible}
            keyExtractor={(r) => r.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 160, gap: 10 }}
            ListEmptyComponent={
              search.trim() !== '' ? (
                <EmptyState
                  icon={<Search size={32} color={accentSoft} />}
                  title={`No records match "${search.trim()}"`}
                  subtitle="Check the spelling, try fewer words, or search by a different detail."
                  action={<ActionButton label="Clear search" onPress={() => setSearch('')} />}
                />
              ) : category !== 'All' ? (
                <EmptyState
                  icon={<FileText size={32} color={accentSoft} />}
                  title={`No ${category} records`}
                  subtitle="Choose another category to see your other records."
                  action={<ActionButton label="Show all records" onPress={() => setCategory('All')} />}
                />
              ) : null
            }
            renderItem={({ item }) => <RecordRow record={item} accent={accent} />}
          />
        </>
      )}
    </Screen>
  );
}

function RecordRow({ record, accent }: { record: MedicalRecord; accent: string }) {
  const Icon = categoryIcons[record.category] ?? FileText;
  const review = reviewLabel(record);
  const provider = [record.doctor, record.facility].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${record.title}, ${formatEventDate(record)}`}
      onPress={() => router.push(`/records/${record.id}`)}
      className="flex-row gap-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card"
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-500/20">
        <Icon size={20} color={accent} />
      </View>
      <View className="flex-1 gap-1">
        <Text className="font-sans-semibold text-[15px] leading-[20px] text-ink dark:text-slate-50">{record.title}</Text>
        <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">
          {record.documentType} · {formatEventDate(record)}
        </Text>
        {provider ? (
          <Text className="font-sans text-[12px] text-ink-soft dark:text-slate-300">{provider}</Text>
        ) : null}
        {record.diagnosis ? (
          <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400" numberOfLines={2}>
            {record.diagnosis}
          </Text>
        ) : null}
        <View className="mt-1 flex-row flex-wrap gap-1.5">
          <View className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-canvasdark-card">
            <Text className="font-sans-medium text-[10px] text-ink-muted dark:text-slate-400">{record.category}</Text>
          </View>
          <View
            className={`rounded-full px-2.5 py-1 ${
              review === 'Reviewed' ? 'bg-success-50 dark:bg-success-500/15' : 'bg-slate-100 dark:bg-canvasdark-card'
            }`}
          >
            <Text
              className={`font-sans-medium text-[10px] ${
                review === 'Reviewed' ? 'text-success-600 dark:text-success-500' : 'text-ink-muted dark:text-slate-400'
              }`}
            >
              {review}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function AddRecordButton() {
  return <ActionButton label="Add Record" onPress={() => router.push('/records/upload')} />;
}

function ActionButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="min-h-[44px] items-center justify-center rounded-full bg-ink px-5 dark:bg-brand-400"
    >
      <Text className="font-sans-semibold text-[13px] text-white">{label}</Text>
    </Pressable>
  );
}
