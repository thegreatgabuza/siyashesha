import dayjs from 'dayjs';
import { router } from 'expo-router';
import {
  BookHeart,
  Paperclip,
  Pin,
  Plus,
  Search,
  Trash2,
} from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { useAboveTabBar } from '@/hooks/useTabBarInset';

import { EmptyState } from '@/components/ui/EmptyState';
import { HeroAction, heroShadow } from '@/components/ui/HeroAction';
import { Pill } from '@/components/ui/Pill';
import { JournalSwitch } from '@/components/JournalSwitch';
import { Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useToast } from '@/components/ui/Toast';
import { diaryCategories, type DiaryCategory, type DiaryNote } from '@/data/diarySeed';
import { useAppStore } from '@/store/useAppStore';
import { useAccent } from '@/hooks/useAccent';

export default function DiaryScreen() {
  const { accent, accentSoft } = useAccent();
  const aboveTabBar = useAboveTabBar();
  const toast = useToast();
  const notes = useAppStore((s) => s.diaryNotes);
  const draft = useAppStore((s) => s.diaryDraft);
  const deleteDiaryNote = useAppStore((s) => s.deleteDiaryNote);
  const restoreDiaryNote = useAppStore((s) => s.restoreDiaryNote);
  const togglePin = useAppStore((s) => s.toggleDiaryPin);

  const searchInput = useRef<React.ComponentRef<typeof TextInput>>(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<DiaryCategory | 'All'>('All');
  const [lastDeleted, setLastDeleted] = useState<{ note: DiaryNote; index: number } | null>(null);

  // Summary figures come from every note, not the filtered list.
  const summary = useMemo(() => {
    const pinnedCount = notes.filter((n) => n.pinned).length;
    const attachmentCount = notes.reduce((total, n) => total + n.attachments.length, 0);
    const latest = notes.reduce<string | null>((latestDate, n) => {
      if (!n.entryDate || !dayjs(n.entryDate).isValid()) return latestDate;
      return latestDate === null || n.entryDate > latestDate ? n.entryDate : latestDate;
    }, null);
    return { pinnedCount, attachmentCount, latest };
  }, [notes]);

  const filtered = useMemo(() => {
    return notes
      .filter((n) => (category === 'All' ? true : n.category === category))
      .filter((n) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q);
      })
      .sort((a, b) => (a.entryDate < b.entryDate ? 1 : -1));
  }, [notes, category, search]);

  const pinned = filtered.filter((n) => n.pinned);
  const rest = filtered.filter((n) => !n.pinned);

  const handleDelete = (note: DiaryNote, index: number) => {
    deleteDiaryNote(note.id);
    setLastDeleted({ note, index });
    setTimeout(() => {
      setLastDeleted((current) => (current?.note.id === note.id ? null : current));
    }, 5000);
  };

  const handleUndo = () => {
    if (!lastDeleted) return;
    restoreDiaryNote(lastDeleted.note, lastDeleted.index);
    toast.show('Note restored', 'success');
    setLastDeleted(null);
  };

  return (
    <Screen contentClassName="px-5" bottomInset={72}>
      <View className="pb-4 pt-4">
        <JournalSwitch active="diary" />
      </View>

      <View className="pb-4 pt-2">
        <Txt variant="title">My Diary</Txt>
        <Txt variant="callout" tone="muted" style={{ marginTop: 2 }}>
          Thoughts, questions and anything you want to remember.
        </Txt>
      </View>

      {/* Summary card */}
      <View className="rounded-[32px] bg-ink p-5 dark:bg-canvasdark-card" style={heroShadow}>
        <View className="flex-row items-center justify-between">
          <Text className="font-sans-semibold text-[13px] text-white/70">Notes in your diary</Text>
          <View className="rounded-full bg-white/15 px-3 py-1">
            <Text className="font-sans-semibold text-[11px] text-white">{summary.pinnedCount} pinned</Text>
          </View>
        </View>

        <View className="items-center py-6">
          <Text className="font-sans-bold text-[44px] leading-[48px] text-white">{notes.length}</Text>
          <Text className="mt-1 font-sans text-[13px] text-white/60">
            {summary.latest ? `Last entry ${dayjs(summary.latest).format('D MMM YYYY')}` : 'No entries yet'}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <HeroAction label="Add a note" icon={<Plus size={16} color="#FFFFFF" />} onPress={() => router.push('/diary/new')} />
          <HeroAction
            label="Search"
            icon={<Search size={16} color="#FFFFFF" />}
            onPress={() => searchInput.current?.focus()}
          />
        </View>
      </View>

      {/* Stat row */}
      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
          <Text className="font-sans-medium text-[12px] text-ink-muted dark:text-slate-400">Pinned</Text>
          <Text className="mt-2 font-sans-bold text-[30px] text-ink dark:text-slate-50">{summary.pinnedCount}</Text>
          <Text className="mt-0.5 font-sans text-[11px] text-ink-muted dark:text-slate-500">kept at the top</Text>
        </View>
        <View className="flex-1 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
          <Text className="font-sans-medium text-[12px] text-ink-muted dark:text-slate-400">Attachments</Text>
          <Text className="mt-2 font-sans-bold text-[30px] text-ink dark:text-slate-50">{summary.attachmentCount}</Text>
          <Text className="mt-0.5 font-sans text-[11px] text-ink-muted dark:text-slate-500">files on your notes</Text>
        </View>
      </View>

      <View className="pt-7">
        <SectionHeader title="Your notes" />

        <View className="mb-3 flex-row items-center gap-2 rounded-full border border-slate-200 bg-white px-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
          <Search size={16} color="#5B6478" />
          <TextInput
            ref={searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search your notes"
            placeholderTextColor="#8C98B8"
            className="min-h-[44px] flex-1 font-sans text-[14px] text-ink dark:text-slate-50"
            accessibilityLabel="Search diary notes"
          />
        </View>

        <View className="mb-4 flex-row flex-wrap gap-2">
          <Pill label="All" selected={category === 'All'} onPress={() => setCategory('All')} />
          {diaryCategories.map((c) => (
            <Pill key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
          ))}
        </View>

        {draft ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue your draft note"
            onPress={() => router.push('/diary/new')}
            className="mb-4 flex-row items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-500/30 dark:bg-brand-500/10"
          >
            <BookHeart size={18} color={accent} />
            <Text className="flex-1 font-sans-medium text-[13px] text-ink dark:text-slate-100">
              Continue your unfinished note — {draft.title || 'Untitled note'}
            </Text>
          </Pressable>
        ) : null}

        {filtered.length === 0 ? (
          <EmptyState
            icon={<BookHeart size={32} color={accentSoft} />}
            title={search.trim() ? `No notes match "${search.trim()}"` : 'No notes yet'}
            subtitle={search.trim() ? 'Try a different word or clear the search.' : 'Add your first note to start your diary.'}
            action={
              search.trim() ? (
                <ActionButton label="Clear search" onPress={() => setSearch('')} />
              ) : (
                <ActionButton label="Add a note" onPress={() => router.push('/diary/new')} />
              )
            }
          />
        ) : (
          <View className="gap-4">
            {pinned.length > 0 ? (
              <View>
                <SectionHeader title="Pinned" />
                <View className="gap-2.5">
                  {pinned.map((note, i) => (
                    <DiaryRow
                      key={note.id}
                      note={note}
                      onDelete={() => handleDelete(note, i)}
                      onTogglePin={() => togglePin(note.id)}
                    />
                  ))}
                </View>
              </View>
            ) : null}
            {rest.length > 0 ? (
              <View>
                {pinned.length > 0 ? <SectionHeader title="All notes" /> : null}
                <View className="gap-2.5">
                  {rest.map((note, i) => (
                    <DiaryRow
                      key={note.id}
                      note={note}
                      onDelete={() => handleDelete(note, i)}
                      onTogglePin={() => togglePin(note.id)}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        )}
      </View>

      {lastDeleted ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Undo delete"
          onPress={handleUndo}
          className="absolute left-5 right-5 flex-row items-center justify-between rounded-2xl bg-ink px-4 py-3 dark:bg-canvasdark-card"
          style={{ bottom: aboveTabBar }}
        >
          <Text className="font-sans text-[13px] text-white">Note deleted</Text>
          <Text className="font-sans-semibold text-[13px] text-brand-400">Undo</Text>
        </Pressable>
      ) : null}
    </Screen>
  );
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

function DiaryRow({
  note,
  onDelete,
  onTogglePin,
}: {
  note: DiaryNote;
  onDelete: () => void;
  onTogglePin: () => void;
}) {
  const { accent, accentSoft } = useAccent();
  return (
    <ReanimatedSwipeable
      renderRightActions={() => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete note ${note.title}`}
          onPress={onDelete}
          className="ml-2 w-20 items-center justify-center rounded-3xl bg-emergency-500"
        >
          <Trash2 size={20} color="#FFFFFF" />
        </Pressable>
      )}
    >
      <View className="flex-row items-start justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open note ${note.title}`}
          onPress={() => router.push(`/diary/${note.id}`)}
          className="flex-1"
        >
          <View className="flex-row flex-wrap items-center gap-2">
            {note.category ? (
              <View className="rounded-full bg-brand-100 px-2.5 py-0.5 dark:bg-brand-500/20">
                <Text className="font-sans-medium text-[10px] text-brand-600 dark:text-brand-300">
                  {note.category}
                </Text>
              </View>
            ) : null}
            <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">
              {dayjs(note.entryDate).format('D MMM YYYY')}
            </Text>
          </View>
          <Text className="mt-1.5 font-sans-semibold text-[15px] text-ink dark:text-slate-50" numberOfLines={1}>
            {note.title}
          </Text>
          <Text className="mt-0.5 font-sans text-[13px] text-ink-muted dark:text-slate-400" numberOfLines={2}>
            {note.body}
          </Text>
          {note.attachments.length > 0 ? (
            <View className="mt-2 flex-row items-center gap-1.5">
              <Paperclip size={12} color="#5B6478" />
              <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">
                {note.attachments.length} attachment{note.attachments.length > 1 ? 's' : ''}
              </Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={note.pinned ? 'Unpin note' : 'Pin note'}
          onPress={onTogglePin}
          hitSlop={8}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <Pin size={18} color={note.pinned ? accent : accentSoft} fill={note.pinned ? accent : 'none'} />
        </Pressable>
      </View>
    </ReanimatedSwipeable>
  );
}
