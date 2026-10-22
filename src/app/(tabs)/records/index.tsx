import { router } from 'expo-router';
import { Bell, FileText, LayoutGrid, MoreHorizontal, Plus, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CategoryChip } from '@/components/records/CategoryChip';
import { categoryStyle } from '@/components/records/categoryStyle';
import { RecordCard } from '@/components/records/RecordCard';
import { RecordSkeleton } from '@/components/records/RecordSkeleton';
import { type SheetOption, SheetList } from '@/components/records/SheetList';
import { SummaryRing } from '@/components/records/SummaryRing';
import { RecordsTokens } from '@/constants/recordsTokens';
import { recordCategories, type RecordCategory } from '@/data/records';
import { removeOriginal } from '@/lib/documents';
import { tapFeedback } from '@/lib/feedback';
import {
  countByCategory,
  distinctCategories,
  groupByMonth,
  matchesSearch,
  recordSortOptions,
  sortRecords,
  type RecordSort,
} from '@/lib/recordSearch';
import { useAppStore } from '@/store/useAppStore';

const HERO_HEIGHT = 164;
const COLLAPSE_AT = 140;
const QUICK_COUNT = 4;


export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const records = useAppStore((s) => s.records);
  const deleteRecord = useAppStore((s) => s.deleteRecord);

  // Stored records load asynchronously on first launch, so show placeholders until they are ready.
  const [hydrated, setHydrated] = useState(() => useAppStore.persist.hasHydrated());
  useEffect(() => useAppStore.persist.onFinishHydration(() => setHydrated(true)), []);

  const [category, setCategory] = useState<RecordCategory | 'All'>('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<RecordSort>('newest');
  const [sheet, setSheet] = useState<'sort' | 'more' | null>(null);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // The summary card shrinks away as the list scrolls, so the search and categories get more room.
  const heroStyle = useAnimatedStyle(() => ({
    height: interpolate(scrollY.value, [0, COLLAPSE_AT], [HERO_HEIGHT, 0], Extrapolation.CLAMP),
    opacity: interpolate(scrollY.value, [0, COLLAPSE_AT * 0.6], [1, 0], Extrapolation.CLAMP),
  }));

  // Whole-vault figures for the summary card.
  const totalCounts = useMemo(() => countByCategory(records), [records]);
  const lastUpdated = useMemo(
    () => records.reduce<string | null>((latest, r) => (latest === null || r.uploadedAt > latest ? r.uploadedAt : latest), null),
    [records]
  );

  // Search is applied first, so the chip counts always match what the user can see.
  const searchMatches = useMemo(() => records.filter((r) => matchesSearch(r, search)), [records, search]);
  const chipCounts = useMemo(() => countByCategory(searchMatches), [searchMatches]);

  // Quick chips: the four categories with the most records. The rest sit behind "More".
  const vaultCategories = useMemo(() => {
    const present = new Set(distinctCategories(records));
    return recordCategories.filter((c) => present.has(c));
  }, [records]);
  const quick = useMemo(
    () => [...vaultCategories].sort((a, b) => (totalCounts.get(b) ?? 0) - (totalCounts.get(a) ?? 0)).slice(0, QUICK_COUNT),
    [vaultCategories, totalCounts]
  );
  const more = vaultCategories.filter((c) => !quick.includes(c));

  const visible = useMemo(() => {
    const inCategory = category === 'All' ? searchMatches : searchMatches.filter((r) => r.category === category);
    return sortRecords(inCategory, sort);
  }, [searchMatches, category, sort]);

  const dateSorted = sort === 'newest' || sort === 'oldest';
  const groups = useMemo(() => (dateSorted ? groupByMonth(visible) : [{ label: '', records: visible }]), [dateSorted, visible]);

  const filtersActive = search.trim() !== '' || category !== 'All';
  const sortLabel = recordSortOptions.find((o) => o.key === sort)?.label ?? 'Newest first';

  const confirmDelete = (id: string, title: string) => {
    const record = records.find((r) => r.id === id);
    Alert.alert('Delete record?', `${title} will be permanently removed from your vault.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          removeOriginal(record?.originalFile);
          deleteRecord(id);
        },
      },
    ]);
  };

  const sortOptions: SheetOption[] = recordSortOptions.map((o) => ({ key: o.key, label: o.label }));
  const moreOptions: SheetOption[] = more.map((c) => ({ key: c, label: `${categoryStyle[c].short} (${chipCounts.get(c) ?? 0})` }));

  return (
    <View className="flex-1" style={{ backgroundColor: RecordsTokens.background }}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        stickyHeaderIndices={[2]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 170, gap: 0 }}
      >
        {/* 0: header */}
        <View className="flex-row items-center justify-between pb-4">
          <View>
            <Text style={{ color: RecordsTokens.text, fontSize: RecordsTokens.type.title, fontWeight: '700' }}>Medical Records</Text>
            <Text style={{ color: RecordsTokens.textMuted, fontSize: RecordsTokens.type.meta }}>
              {records.length} {records.length === 1 ? 'record' : 'records'}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications and reminders"
            onPress={() => {
              tapFeedback();
              router.push('/more/notifications' as any);
            }}
            className="h-11 w-11 items-center justify-center rounded-full"
            style={({ pressed }) => ({ backgroundColor: RecordsTokens.surface, ...RecordsTokens.shadow, opacity: pressed ? 0.85 : 1 })}
          >
            <Bell size={20} color={RecordsTokens.text} />
          </Pressable>
        </View>

        {/* 1: summary, collapses on scroll */}
        <Animated.View style={[heroStyle, { overflow: 'hidden' }]}>
          <View
            className="p-5"
            style={{ height: HERO_HEIGHT, backgroundColor: RecordsTokens.surface, borderRadius: RecordsTokens.radius.card, ...RecordsTokens.shadow }}
          >
            <SummaryRing counts={totalCounts} total={records.length} lastUpdated={lastUpdated} />
          </View>
        </Animated.View>

        {/* 2: sticky search and categories */}
        <View className="gap-2 pb-2" style={{ backgroundColor: RecordsTokens.background, paddingTop: 8 }}>
          <View
            className="h-14 flex-row items-center gap-2 pl-4 pr-1"
            style={{ backgroundColor: RecordsTokens.surface, borderRadius: RecordsTokens.radius.pill, ...RecordsTokens.shadow }}
          >
            <Search size={18} color={RecordsTokens.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search title, diagnosis, doctor, facility"
              placeholderTextColor={RecordsTokens.textMuted}
              autoCorrect={false}
              returnKeyType="search"
              className="flex-1 font-sans"
              style={{ color: RecordsTokens.text, fontSize: 15 }}
              accessibilityLabel="Search medical records"
            />
            {search.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                onPress={() => setSearch('')}
                className="h-11 w-11 items-center justify-center"
              >
                <X size={18} color={RecordsTokens.textMuted} />
              </Pressable>
            ) : null}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sort and filter"
              onPress={() => setSheet('sort')}
              className="h-11 w-11 items-center justify-center rounded-full"
              style={{ backgroundColor: RecordsTokens.accentSoft }}
            >
              <SlidersHorizontal size={18} color={RecordsTokens.accent} />
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 6, paddingRight: 8 }}>
            <CategoryChip label="All" count={searchMatches.length} icon={LayoutGrid} active={category === 'All'} onPress={() => setCategory('All')} />
            {quick.map((c) => (
              <CategoryChip
                key={c}
                label={categoryStyle[c].short}
                count={chipCounts.get(c) ?? 0}
                icon={categoryStyle[c].icon}
                active={category === c}
                onPress={() => setCategory(c)}
              />
            ))}
            {more.length > 0 ? (
              <CategoryChip
                label="More"
                count={more.reduce((sum, c) => sum + (chipCounts.get(c) ?? 0), 0)}
                icon={MoreHorizontal}
                active={!!more.includes(category as RecordCategory)}
                onPress={() => setSheet('more')}
              />
            ) : null}
          </ScrollView>
        </View>

        {/* 3: sort line */}
        <View className="flex-row items-center justify-between pb-3 pt-2">
          <Text style={{ color: RecordsTokens.text, fontSize: 16, fontWeight: '700' }}>
            {filtersActive ? `Showing ${visible.length} of ${records.length}` : 'Recent records'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Sort: ${sortLabel}. Change`}
            onPress={() => setSheet('sort')}
            className="min-h-[44px] flex-row items-center gap-1 rounded-full px-3"
            style={{ backgroundColor: RecordsTokens.surface, ...RecordsTokens.shadow }}
          >
            <Text style={{ color: RecordsTokens.text, fontSize: RecordsTokens.type.meta, fontWeight: '600' }}>{sortLabel}</Text>
            <Text style={{ color: RecordsTokens.textMuted, fontSize: 10 }}>▼</Text>
          </Pressable>
        </View>

        {/* 4+: list */}
        {!hydrated ? (
          <RecordSkeleton />
        ) : records.length === 0 ? (
          <View className="items-center gap-3 p-8" style={{ backgroundColor: RecordsTokens.surface, borderRadius: RecordsTokens.radius.card, ...RecordsTokens.shadow }}>
            <View className="h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: RecordsTokens.accentSoft }}>
              <FileText size={26} color={RecordsTokens.accent} />
            </View>
            <Text style={{ color: RecordsTokens.text, fontSize: 17, fontWeight: '700' }}>No medical records yet</Text>
            <Text className="text-center" style={{ color: RecordsTokens.textMuted, fontSize: RecordsTokens.type.meta }}>
              Upload a document, scan one, or add a record by hand.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add a record"
              onPress={() => router.push('/records/upload')}
              className="min-h-[44px] justify-center rounded-full px-6"
              style={{ backgroundColor: RecordsTokens.accent }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Add a record</Text>
            </Pressable>
          </View>
        ) : visible.length === 0 ? (
          <View className="items-center gap-3 p-8" style={{ backgroundColor: RecordsTokens.surface, borderRadius: RecordsTokens.radius.card, ...RecordsTokens.shadow }}>
            <Text style={{ color: RecordsTokens.text, fontSize: 17, fontWeight: '700' }}>
              {search.trim() ? `No records match "${search.trim()}"` : `No ${category} records`}
            </Text>
            <Text className="text-center" style={{ color: RecordsTokens.textMuted, fontSize: RecordsTokens.type.meta }}>
              {search.trim() ? 'Try fewer words, or search by a different detail.' : 'Choose another category to see your other records.'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={search.trim() ? 'Clear search' : 'Show all records'}
              onPress={() => {
                setSearch('');
                setCategory('All');
              }}
              className="min-h-[44px] justify-center rounded-full px-6"
              style={{ backgroundColor: RecordsTokens.accent }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>
                {search.trim() ? 'Clear search' : 'Show all records'}
              </Text>
            </Pressable>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.label || 'all'} className="gap-3 pb-4">
              {group.label ? (
                <Text style={{ color: RecordsTokens.textMuted, fontSize: RecordsTokens.type.meta, fontWeight: '600' }}>
                  {group.label} · {group.records.length}
                </Text>
              ) : null}
              {group.records.map((record) => (
                <RecordCard
                  key={record.id}
                  record={record}
                  onOpen={() => router.push(`/records/${record.id}`)}
                  onShare={() => router.push({ pathname: '/more/sharing', params: { recordId: record.id } })}
                  onDelete={() => confirmDelete(record.id, record.title)}
                />
              ))}
            </View>
          ))
        )}
      </Animated.ScrollView>

      {/* Floating add button, above the tab bar */}
      <View pointerEvents="box-none" className="absolute inset-x-0 items-center" style={{ bottom: insets.bottom + 92 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add record"
          onPress={() => {
            tapFeedback();
            router.push('/records/upload');
          }}
          className="h-16 w-16 items-center justify-center rounded-full"
          style={({ pressed }) => ({ backgroundColor: RecordsTokens.accent, transform: [{ scale: pressed ? 0.94 : 1 }], shadowColor: RecordsTokens.accent, shadowOpacity: 0.35, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 6 })}
        >
          <Plus size={28} color="#FFFFFF" />
        </Pressable>
      </View>

      <SheetList
        visible={sheet === 'sort'}
        title="Sort records"
        options={sortOptions}
        selected={sort}
        onSelect={(key) => {
          setSort(key as RecordSort);
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
      <SheetList
        visible={sheet === 'more'}
        title="More categories"
        options={moreOptions}
        selected={more.includes(category as RecordCategory) ? category : null}
        onSelect={(key) => {
          setCategory(key as RecordCategory);
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}
