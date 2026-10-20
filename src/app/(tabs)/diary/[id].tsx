import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import {
  FileText,
  Link2,
  Pencil,
  Pin,
  Share2,
  Trash2,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useToast } from '@/components/ui/Toast';
import { appointments } from '@/data/appointments';
import { useAppStore } from '@/store/useAppStore';

export default function DiaryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const notes = useAppStore((s) => s.diaryNotes);
  const deleteDiaryNote = useAppStore((s) => s.deleteDiaryNote);
  const togglePin = useAppStore((s) => s.toggleDiaryPin);
  const note = notes.find((n) => n.id === id);
  const [deleted, setDeleted] = useState(false);

  if (!note || deleted) {
    return (
      <Screen>
        <ScreenHeader title="Diary note" onBack={() => router.back()} />
        <Text className="px-5 font-sans text-ink-muted dark:text-slate-400">
          This note is no longer available.
        </Text>
      </Screen>
    );
  }

  const linkedAppointment = appointments.find((a) => a.id === note.linkedAppointmentId);

  const handleDelete = () => {
    Alert.alert('Delete note?', 'This diary note will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteDiaryNote(note.id);
          setDeleted(true);
          toast.show('Note deleted', 'info');
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen bottomInset={60}>
      <ScreenHeader
        title="Diary note"
        onBack={() => router.back()}
        right={
          <View className="flex-row gap-2">
            <IconButton accessibilityLabel={note.pinned ? 'Unpin note' : 'Pin note'} onPress={() => togglePin(note.id)}>
              <Pin size={18} color={note.pinned ? '#6D5BD0' : '#5B6B8A'} fill={note.pinned ? '#6D5BD0' : 'none'} />
            </IconButton>
            <IconButton accessibilityLabel="Edit note" onPress={() => router.push(`/diary/new?id=${note.id}`)}>
              <Pencil size={18} color="#5B6B8A" />
            </IconButton>
            <IconButton accessibilityLabel="Delete note" variant="danger" onPress={handleDelete}>
              <Trash2 size={18} color="#DC2626" />
            </IconButton>
          </View>
        }
      />
      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 48 }}>
        <View className="mb-1 flex-row items-center gap-2">
          {note.category ? (
            <View className="rounded-full bg-lavender-100 px-2.5 py-0.5 dark:bg-brand-500/20">
              <Text className="font-sans-medium text-[11px] text-brand-600 dark:text-brand-400">
                {note.category}
              </Text>
            </View>
          ) : null}
          <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">
            {dayjs(note.entryDate).format('D MMMM YYYY')}
          </Text>
        </View>
        <Text className="mb-3 font-serif text-[24px] text-ink dark:text-slate-50">{note.title}</Text>
        <Text className="mb-5 font-sans text-[15px] leading-[23px] text-ink-soft dark:text-slate-200">
          {note.body}
        </Text>

        {note.attachments.length > 0 ? (
          <View className="mb-5 gap-2">
            <Text className="font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">
              Attachments
            </Text>
            {note.attachments.map((att) =>
              att.kind === 'photo' && att.uri ? (
                <Image
                  key={att.id}
                  source={{ uri: att.uri }}
                  style={{ width: '100%', height: 180, borderRadius: 16 }}
                  contentFit="cover"
                />
              ) : (
                <View
                  key={att.id}
                  className="flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-canvasdark-card dark:bg-canvasdark-card"
                >
                  <FileText size={16} color="#5B6B8A" />
                  <Text className="font-sans text-[13px] text-ink-soft dark:text-slate-200">{att.name}</Text>
                </View>
              )
            )}
          </View>
        ) : null}

        {linkedAppointment ? (
          <View className="mb-5 flex-row items-center gap-3 rounded-2xl border border-lavender-200 bg-lavender-50 px-4 py-3 dark:border-brand-500/30 dark:bg-brand-500/10">
            <Link2 size={16} color="#6D5BD0" />
            <View className="flex-1">
              <Text className="font-sans-semibold text-[13px] text-ink dark:text-slate-100">
                {linkedAppointment.title}
              </Text>
              <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">
                {linkedAppointment.facility} · {dayjs(linkedAppointment.date).format('D MMM')}
              </Text>
            </View>
          </View>
        ) : null}

        {note.reminderAt ? (
          <View className="mb-5 rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-canvasdark-card dark:bg-canvasdark-card">
            <Text className="font-sans-medium text-[13px] text-ink dark:text-slate-50">
              Reminder set for {dayjs(note.reminderAt).format('D MMM, h:mm A')}
            </Text>
          </View>
        ) : null}

        <View className="rounded-2xl bg-slate-100 px-4 py-3 dark:bg-canvasdark-card">
          <View className="flex-row items-center gap-2">
            <Share2 size={14} color="#5B6B8A" />
            <Text className="flex-1 font-sans text-[12px] text-ink-muted dark:text-slate-400">
              Private by default. Diary notes are excluded from record sharing unless you choose to
              include this note from the Sharing wizard.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}
