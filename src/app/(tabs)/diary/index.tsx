import dayjs from 'dayjs';
import { router } from 'expo-router';
import {
  BookHeart,
  Mic,
  Paperclip,
  Pin,
  Plus,
  Search,
  Trash2,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/ui/EmptyState';
import { Pill } from '@/components/ui/Pill';
import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import { diaryCategories, type DiaryCategory, type DiaryNote } from '@/data/diarySeed';
import { useAppStore } from '@/store/useAppStore';

export default function DiaryScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const notes = useAppStore((s) => s.diaryNotes);
  const draft = useAppStore((s) => s.diaryDraft);
  const deleteDiaryNote = useAppStore((s) => s.deleteDiaryNote);
  const restoreDiaryNote = useAppStore((s) => s.restoreDiaryNote);
  const togglePin = useAppStore((s) => s.toggleDiaryPin);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<DiaryCategory | 'All'>('All');
  const [lastDeleted, setLastDeleted] = useState<{ note: DiaryNote; index: number } | null>(null);

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
    <Screen contentClassName="px-5" bottomInset={160}>
      <View className="pb-2 pt-4">
        <Text className="font-serif text-[26px] text-ink dark:text-slate-50">My Diary</Text>
        <Text className="mt-1 font-sans text-[13px] leading-[19px] text-ink-muted dark:text-slate-400">
          Write down your thoughts, questions or anything you want to remember about your health.
        </Text>
      </View>

      <View className="mb-3 flex-row items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1 dark:border-canvasdark-card dark:bg-canvasdark-card">
        <Search size={16} color="#5B6B8A" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search your notes"
          placeholderTextColor="#8C98B8"
          className="min-h-[44px] flex-1 font-sans text-[14px] text-ink dark:text-slate-50"
          accessibilityLabel="Search diary notes"
        />
      </View>

      <View className="mb-4 flex-row gap-2">
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
          className="mb-4 flex-row items-center gap-3 rounded-2xl border border-lavender-200 bg-lavender-50 px-4 py-3 dark:border-brand-500/30 dark:bg-brand-500/10"
        >
          <Mic size={18} color="#6D5BD0" />
          <Text className="flex-1 font-sans-medium text-[13px] text-ink dark:text-slate-100">
            Continue your unfinished note — {draft.title || 'Untitled note'}
          </Text>
        </Pressable>
      ) : null}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<BookHeart size={32} color="#C3B6F0" />}
          title="No notes yet"
          subtitle="Add your first note to start your diary."
        />
      ) : (
        <View className="gap-3">
          {pinned.length > 0 ? (
            <View className="gap-2.5">
              <Text className="font-sans-semibold text-[12px] uppercase tracking-wide text-ink-muted dark:text-slate-400">
                Pinned
              </Text>
              {pinned.map((note, i) => (
                <DiaryRow
                  key={note.id}
                  note={note}
                  onDelete={() => handleDelete(note, i)}
                  onTogglePin={() => togglePin(note.id)}
                />
              ))}
            </View>
          ) : null}
          <View className="gap-2.5">
            {pinned.length > 0 ? (
              <Text className="font-sans-semibold text-[12px] uppercase tracking-wide text-ink-muted dark:text-slate-400">
                All notes
              </Text>
            ) : null}
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
      )}

      {lastDeleted ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Undo delete"
          onPress={handleUndo}
          className="absolute left-5 right-20 flex-row items-center justify-between rounded-2xl bg-ink px-4 py-3 dark:bg-canvasdark-card"
          style={{ bottom: insets.bottom + 96 }}
        >
          <Text className="font-sans text-[13px] text-white">Note deleted</Text>
          <Text className="font-sans-semibold text-[13px] text-brand-400">Undo</Text>
        </Pressable>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add a note"
        onPress={() => router.push('/diary/new')}
        className="absolute h-14 w-14 items-center justify-center rounded-full bg-ink shadow-lg dark:bg-brand-500"
        style={{ right: 4, bottom: insets.bottom + 96 }}
      >
        <Plus size={24} color="#FFFFFF" />
      </Pressable>
    </Screen>
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
  return (
    <Swipeable
      renderRightActions={() => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Delete note ${note.title}`}
          onPress={onDelete}
          className="ml-2 w-20 items-center justify-center rounded-2xl bg-emergency-500"
        >
          <Trash2 size={20} color="#FFFFFF" />
        </Pressable>
      )}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open note ${note.title}`}
        onPress={() => router.push(`/diary/${note.id}`)}
        className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card"
      >
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              {note.category ? (
                <View className="rounded-full bg-lavender-100 px-2.5 py-0.5 dark:bg-brand-500/20">
                  <Text className="font-sans-medium text-[10px] text-brand-600 dark:text-brand-400">
                    {note.category}
                  </Text>
                </View>
              ) : null}
              <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">
                {dayjs(note.entryDate).format('D MMM YYYY')}
              </Text>
            </View>
            <Text className="mt-1 font-sans-semibold text-[15px] text-ink dark:text-slate-50" numberOfLines={1}>
              {note.title}
            </Text>
            <Text className="mt-0.5 font-sans text-[13px] text-ink-muted dark:text-slate-400" numberOfLines={2}>
              {note.body}
            </Text>
            {note.attachments.length > 0 ? (
              <View className="mt-2 flex-row items-center gap-1.5">
                <Paperclip size={12} color="#5B6B8A" />
                <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">
                  {note.attachments.length} attachment{note.attachments.length > 1 ? 's' : ''}
                </Text>
              </View>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={note.pinned ? 'Unpin note' : 'Pin note'}
            onPress={onTogglePin}
            className="h-9 w-9 items-center justify-center rounded-full"
          >
            <Pin size={18} color={note.pinned ? '#6D5BD0' : '#C3B6F0'} fill={note.pinned ? '#6D5BD0' : 'none'} />
          </Pressable>
        </View>
      </Pressable>
    </Swipeable>
  );
}
