import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Bell, FileText, Link2, Lock, Pencil, Pin, Trash2, Volume2 } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { IconButton } from '@/components/ui/IconButton';
import { heroShadow } from '@/components/ui/HeroAction';
import { Screen } from '@/components/ui/Screen';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useToast } from '@/components/ui/Toast';
import { appointments } from '@/data/appointments';
import { useAppStore } from '@/store/useAppStore';
import { useAccent } from '@/hooks/useAccent';

export default function DiaryDetailScreen() {
  const { accent } = useAccent();
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const notes = useAppStore((s) => s.diaryNotes);
  const deleteDiaryNote = useAppStore((s) => s.deleteDiaryNote);
  const togglePin = useAppStore((s) => s.toggleDiaryPin);
  const note = notes.find((n) => n.id === id);
  const [deleted, setDeleted] = useState(false);

  if (!note || deleted) {
    return (
      <Screen headerOwnsTopInset scroll={false}>
        <ScreenHeader title="Diary note" onBack={() => router.back()} />
        <Text className="px-5 font-sans text-ink-muted dark:text-slate-400">This note is no longer available.</Text>
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
    <Screen headerOwnsTopInset scroll={false}>
      <ScreenHeader
        title="Diary note"
        onBack={() => router.back()}
        right={
          <View className="flex-row gap-2">
            <IconButton accessibilityLabel={note.pinned ? 'Unpin note' : 'Pin note'} onPress={() => togglePin(note.id)}>
              <Pin size={18} color={note.pinned ? accent : '#5B6478'} fill={note.pinned ? accent : 'none'} />
            </IconButton>
            <IconButton accessibilityLabel="Edit note" onPress={() => router.push(`/diary/new?id=${note.id}`)}>
              <Pencil size={18} color="#5B6478" />
            </IconButton>
            <IconButton accessibilityLabel="Delete note" variant="danger" onPress={handleDelete}>
              <Trash2 size={18} color="#DC1F26" />
            </IconButton>
          </View>
        }
      />
      <ScreenScroll className="flex-1 px-5" contentContainerStyle={{ gap: 12 }}>
        {/* Header card */}
        <View className="rounded-[32px] bg-ink p-5 dark:bg-canvasdark-card" style={heroShadow}>
          <View className="flex-row items-center justify-between">
            {note.category ? (
              <View className="rounded-full bg-white/15 px-3 py-1">
                <Text className="font-sans-semibold text-[11px] text-white">{note.category}</Text>
              </View>
            ) : (
              <View />
            )}
            <Text className="font-sans-semibold text-[12px] text-white/70">
              {dayjs(note.entryDate).format('D MMM YYYY')}
            </Text>
          </View>
          <Text className="mt-4 font-sans-bold text-[24px] leading-[30px] text-white">{note.title}</Text>
          {note.pinned ? (
            <View className="mt-3 flex-row items-center gap-1.5">
              <Pin size={12} color="#FFFFFF" fill="#FFFFFF" />
              <Text className="font-sans-medium text-[12px] text-white/70">Pinned to the top of your diary</Text>
            </View>
          ) : null}
        </View>

        {/* Body */}
        <View className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-canvasdark-card dark:bg-canvasdark-card">
          <Text className="font-sans text-[15px] leading-[23px] text-ink-soft dark:text-slate-200">{note.body}</Text>
        </View>

        {note.attachments.length > 0 ? (
          <View>
            <SectionHeader title="Attachments" />
            <View className="gap-2">
              {note.attachments.map((att) =>
                att.kind === 'photo' && att.uri ? (
                  <Image
                    key={att.id}
                    source={{ uri: att.uri }}
                    style={{ width: '100%', height: 180, borderRadius: 24 }}
                    contentFit="cover"
                  />
                ) : (
                  <View
                    key={att.id}
                    className="flex-row items-center gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 dark:border-canvasdark-card dark:bg-canvasdark-card"
                  >
                    <View
                      className={`h-9 w-9 items-center justify-center rounded-2xl ${att.kind === 'voice' ? 'bg-emergency-50 dark:bg-emergency-500/20' : 'bg-brand-100 dark:bg-brand-500/20'}`}
                    >
                      {att.kind === 'voice' ? (
                        <Volume2 size={16} color="#DC1F26" />
                      ) : (
                        <FileText size={16} color={accent} />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="font-sans text-[13px] text-ink-soft dark:text-slate-200">{att.name}</Text>
                      {att.duration ? (
                        <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">
                          Recorded Voice Note · ${att.duration}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                )
              )}
            </View>
          </View>
        ) : null}

        {linkedAppointment ? (
          <View>
            <SectionHeader title="Linked visit" />
            <View className="flex-row items-center gap-3 rounded-3xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
              <View className="h-9 w-9 items-center justify-center rounded-2xl bg-white dark:bg-canvasdark-card">
                <Link2 size={16} color={accent} />
              </View>
              <View className="flex-1">
                <Text className="font-sans-semibold text-[14px] text-ink dark:text-slate-100">{linkedAppointment.title}</Text>
                <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">
                  {linkedAppointment.facility} · {dayjs(linkedAppointment.date).format('D MMM YYYY')}
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        {note.reminderAt ? (
          <View>
            <SectionHeader title="Reminder" />
            <View className="flex-row items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
              <Bell size={16} color={accent} />
              <Text className="flex-1 font-sans-medium text-[13px] text-ink dark:text-slate-50">
                {dayjs(note.reminderAt).format('D MMM, h:mm A')}
              </Text>
            </View>
          </View>
        ) : null}

        <View className="mt-2 flex-row items-start gap-3 rounded-3xl bg-slate-100 p-4 dark:bg-canvasdark-card">
          <Lock size={14} color="#5B6478" />
          <Text className="flex-1 font-sans text-[12px] leading-[17px] text-ink-muted dark:text-slate-400">
            Private by default. This note is only included in a record share if you pick it in the Sharing wizard.
          </Text>
        </View>
      </ScreenScroll>
    </Screen>
  );
}
