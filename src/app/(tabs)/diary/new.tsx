import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import {
  Calendar as CalendarIcon,
  FileText,
  Image as ImageIcon,
  Link2,
  Mic,
  Volume2,
  X,
} from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Pill } from '@/components/ui/Pill';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useToast } from '@/components/ui/Toast';
import { PressableScale } from '@/components/ui/PressableScale';
import { VoiceDictationModal } from '@/components/diary/VoiceDictationModal';
import { fonts } from '@/design/tokens';
import { appointments } from '@/data/appointments';
import { diaryCategories, type DiaryAttachment, type DiaryCategory } from '@/data/diarySeed';
import { useAppStore } from '@/store/useAppStore';
import { useAccent } from '@/hooks/useAccent';

export default function DiaryEditorScreen() {
  const { accent } = useAccent();
  const params = useLocalSearchParams<{
    id?: string;
    linkedAppointmentId?: string;
    title?: string;
    category?: string;
  }>();
  const toast = useToast();
  const notes = useAppStore((s) => s.diaryNotes);
  const draft = useAppStore((s) => s.diaryDraft);
  const addDiaryNote = useAppStore((s) => s.addDiaryNote);
  const updateDiaryNote = useAppStore((s) => s.updateDiaryNote);
  const saveDiaryDraft = useAppStore((s) => s.saveDiaryDraft);

  const existing = params.id ? notes.find((n) => n.id === params.id) : undefined;
  const isEditing = !!existing;

  const [title, setTitle] = useState(existing?.title ?? draft?.title ?? params.title ?? '');
  const [body, setBody] = useState(existing?.body ?? draft?.body ?? '');
  const [entryDate, setEntryDate] = useState(
    existing?.entryDate ?? draft?.entryDate ?? dayjs().format('YYYY-MM-DD')
  );
  const [category, setCategory] = useState<DiaryCategory | undefined>(
    existing?.category ?? draft?.category ?? (params.category as DiaryCategory | undefined)
  );
  const [attachments, setAttachments] = useState<DiaryAttachment[]>(existing?.attachments ?? []);
  const [reminderEnabled, setReminderEnabled] = useState(!!existing?.reminderAt);
  const [reminderAt, setReminderAt] = useState(existing?.reminderAt);
  const [linkedAppointmentId, setLinkedAppointmentId] = useState(
    existing?.linkedAppointmentId ?? draft?.linkedAppointmentId ?? params.linkedAppointmentId
  );
  const [pickingAppointment, setPickingAppointment] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [voiceModalVisible, setVoiceModalVisible] = useState(false);

  const bodyRef = useRef<TextInput>(null);
  const draftTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isEditing) return;
    if (draftTimeout.current) clearTimeout(draftTimeout.current);
    draftTimeout.current = setTimeout(() => {
      if (title.trim() || body.trim()) {
        saveDiaryDraft({ title, body, entryDate, category, linkedAppointmentId });
      }
    }, 600);
    return () => {
      if (draftTimeout.current) clearTimeout(draftTimeout.current);
    };
  }, [title, body, entryDate, category, linkedAppointmentId, isEditing, saveDiaryDraft]);

  const linkedAppointment = appointments.find((a) => a.id === linkedAppointmentId);

  const handleSave = () => {
    if (!title.trim()) {
      toast.show('Add a title before saving', 'warning');
      return;
    }
    if (isEditing && existing) {
      updateDiaryNote(existing.id, {
        title: title.trim(),
        body,
        entryDate,
        category,
        attachments,
        reminderAt: reminderEnabled ? reminderAt : undefined,
        linkedAppointmentId,
      });
      toast.show('Note updated', 'success');
      router.back();
    } else {
      const id = addDiaryNote({
        title: title.trim(),
        body,
        entryDate,
        category,
        attachments,
        reminderAt: reminderEnabled ? reminderAt : undefined,
        linkedAppointmentId,
      });
      toast.show('Note saved', 'success');
      router.replace(`/diary/${id}`);
    }
  };

  const addPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setAttachments((a) => [
        ...a,
        { id: `att-${Date.now()}`, kind: 'photo', name: 'Photo', uri: result.assets[0].uri },
      ]);
    }
  };

  const addDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({});
    if (!result.canceled && result.assets[0]) {
      setAttachments((a) => [
        ...a,
        {
          id: `att-${Date.now()}`,
          kind: 'document',
          name: result.assets[0].name,
          uri: result.assets[0].uri,
        },
      ]);
    }
  };

  const handleInsertDictatedText = (text: string, mode: 'append' | 'replace') => {
    if (mode === 'append' && body.trim()) {
      setBody((prev) => `${prev.trim()}\n\n${text}`);
    } else {
      setBody(text);
    }
    toast.show('Dictated text added to your note', 'success');
  };

  const handleAttachVoiceNote = (name: string, duration: string) => {
    setAttachments((prev) => [
      ...prev,
      {
        id: `att-voice-${Date.now()}`,
        kind: 'voice',
        name,
        duration,
      },
    ]);
    toast.show('Voice note attached', 'success');
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-50 dark:bg-canvasdark"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title={isEditing ? 'Edit note' : 'Add a note'}
        onBack={() => router.back()}
        right={
          <PrimaryButtonSmall label="Save" onPress={handleSave} />
        }
      />
      <ScreenScroll className="flex-1 px-5">
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Note title"
          placeholderTextColor="#8C98B8"
          className="mb-3 font-sans-bold text-[20px] text-ink dark:text-slate-50"
          accessibilityLabel="Note title"
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Entry date ${entryDate}`}
          onPress={() => setShowDatePicker(true)}
          className="mb-4 flex-row items-center gap-2 self-start rounded-full bg-slate-100 px-3 py-1.5 dark:bg-canvasdark-card"
        >
          <CalendarIcon size={14} color="#5B6478" />
          <Text className="font-sans-medium text-[12px] text-ink-soft dark:text-slate-200">
            {dayjs(entryDate).format('D MMMM YYYY')}
          </Text>
        </Pressable>
        {showDatePicker ? (
          <DateTimePicker
            value={dayjs(entryDate).toDate()}
            mode="date"
            onChange={(_, date) => {
              setShowDatePicker(false);
              if (date) setEntryDate(dayjs(date).format('YYYY-MM-DD'));
            }}
          />
        ) : null}

        <View className="mb-2 flex-row items-center justify-between">
          <Text className="font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">
            Your note
          </Text>
          <PressableScale
            accessibilityLabel="Dictate note using microphone"
            onPress={() => setVoiceModalVisible(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: 'rgba(220, 31, 38, 0.1)',
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 100,
            }}
          >
            <Mic size={14} color="#DC1F26" />
            <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: '#DC1F26' }}>
              Dictate Note
            </Text>
          </PressableScale>
        </View>
        <TextInput
          ref={bodyRef}
          value={body}
          onChangeText={setBody}
          placeholder="Write down your thoughts, questions or anything you want to remember about your health."
          placeholderTextColor="#8C98B8"
          multiline
          textAlignVertical="top"
          style={{ minHeight: 140 }}
          className="mb-1.5 rounded-3xl border border-slate-200 bg-white p-4 font-sans text-[15px] leading-[22px] text-ink dark:border-canvasdark-card dark:bg-canvasdark-card dark:text-slate-50"
          accessibilityLabel="Note text"
        />
        <Text className="mb-5 font-sans text-[11px] text-ink-muted dark:text-slate-500">
          Tip: tap the microphone key on your keyboard to dictate this note.
        </Text>

        <Text className="mb-2 font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">
          Category (optional)
        </Text>
        <View className="mb-5 flex-row flex-wrap gap-2">
          {diaryCategories.map((c) => (
            <Pill
              key={c}
              label={c}
              selected={category === c}
              onPress={() => setCategory(category === c ? undefined : c)}
            />
          ))}
        </View>

        <Text className="mb-2 font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">
          Attachments
        </Text>
        <View className="mb-2 flex-row flex-wrap gap-2">
          <AttachButton label="Add photo" icon={<ImageIcon size={16} color={accent} />} onPress={addPhoto} />
          <AttachButton label="Add document" icon={<FileText size={16} color={accent} />} onPress={addDocument} />
          <AttachButton label="Record voice note" icon={<Mic size={16} color="#DC1F26" />} onPress={() => setVoiceModalVisible(true)} />
        </View>
        {attachments.length > 0 ? (
          <View className="mb-5 gap-2">
            {attachments.map((att) => (
              <View
                key={att.id}
                className="flex-row items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-canvasdark-card dark:bg-canvasdark-card"
              >
                {att.kind === 'photo' ? (
                  <ImageIcon size={14} color="#5B6478" />
                ) : att.kind === 'voice' ? (
                  <Volume2 size={14} color="#DC1F26" />
                ) : (
                  <FileText size={14} color="#5B6478" />
                )}
                <Text className="flex-1 font-sans text-[12px] text-ink-soft dark:text-slate-200" numberOfLines={1}>
                  {att.name} {att.duration ? `(${att.duration})` : ''}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove attachment ${att.name}`}
                  onPress={() => setAttachments((a) => a.filter((x) => x.id !== att.id))}
                >
                  <X size={14} color="#5B6478" />
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <View className="mb-5" />
        )}

        <View className="mb-5 flex-row items-center justify-between rounded-3xl border border-slate-200 bg-white px-4 py-3.5 dark:border-canvasdark-card dark:bg-canvasdark-card">
          <View className="flex-1 pr-3">
            <Text className="font-sans-semibold text-[14px] text-ink dark:text-slate-50">
              Remind me about this note
            </Text>
            {reminderEnabled ? (
              <Pressable accessibilityRole="button" onPress={() => setShowTimePicker(true)}>
                <Text className="font-sans text-[12px] text-brand-500 dark:text-brand-300">
                  {reminderAt ? dayjs(reminderAt).format('D MMM, h:mm A') : 'Set a time'}
                </Text>
              </Pressable>
            ) : null}
          </View>
          <Switch
                thumbColor="#FFFFFF"
            value={reminderEnabled}
            onValueChange={(v) => {
              setReminderEnabled(v);
              if (v && !reminderAt) {
                setReminderAt(dayjs(entryDate).hour(9).minute(0).toISOString());
              }
            }}
            trackColor={{ true: accent, false: '#E3E8F0' }}
          />
        </View>
        {showTimePicker ? (
          <DateTimePicker
            value={reminderAt ? dayjs(reminderAt).toDate() : new Date()}
            mode="time"
            onChange={(_, date) => {
              setShowTimePicker(false);
              if (date) setReminderAt(dayjs(date).toISOString());
            }}
          />
        ) : null}

        <Text className="mb-2 font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">
          Link to an appointment (optional)
        </Text>
        {linkedAppointment ? (
          <View className="mb-5 flex-row items-center gap-2 rounded-3xl border border-brand-200 bg-brand-50 px-4 py-3 dark:border-brand-500/30 dark:bg-brand-500/10">
            <Link2 size={16} color={accent} />
            <Text className="flex-1 font-sans-medium text-[13px] text-ink dark:text-slate-100" numberOfLines={1}>
              {linkedAppointment.title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove appointment link"
              onPress={() => setLinkedAppointmentId(undefined)}
            >
              <X size={16} color={accent} />
            </Pressable>
          </View>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Link to an appointment"
            onPress={() => setPickingAppointment((v) => !v)}
            className="mb-3 min-h-[44px] flex-row items-center gap-2 rounded-3xl border border-dashed border-slate-300 bg-white px-4 py-3 dark:border-canvasdark-card dark:bg-canvasdark-card"
          >
            <Link2 size={16} color="#5B6478" />
            <Text className="font-sans-medium text-[13px] text-ink-muted dark:text-slate-400">
              Link this note to an appointment
            </Text>
          </Pressable>
        )}
        {pickingAppointment ? (
          <View className="mb-5 gap-2">
            {appointments.map((appt) => (
              <Pressable
                key={appt.id}
                accessibilityRole="button"
                accessibilityLabel={`Link to ${appt.title}`}
                onPress={() => {
                  setLinkedAppointmentId(appt.id);
                  setPickingAppointment(false);
                  if (!category) setCategory('Appointment');
                }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-canvasdark-card dark:bg-canvasdark-card"
              >
                <Text className="font-sans-medium text-[13px] text-ink dark:text-slate-50">{appt.title}</Text>
                <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">
                  {appt.facility} · {dayjs(appt.date).format('D MMM')}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        <PrimaryButton label={isEditing ? 'Save changes' : 'Save note'} onPress={handleSave} />
      </ScreenScroll>

      <VoiceDictationModal
        visible={voiceModalVisible}
        onClose={() => setVoiceModalVisible(false)}
        onInsertText={handleInsertDictatedText}
        onAttachVoiceNote={handleAttachVoiceNote}
        existingBody={body}
      />
    </KeyboardAvoidingView>
  );
}

function PrimaryButtonSmall({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="min-h-[36px] rounded-full bg-ink px-4 py-1.5 dark:bg-brand-400"
    >
      <Text className="font-sans-semibold text-[13px] text-white">{label}</Text>
    </Pressable>
  );
}

function AttachButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="min-h-[44px] flex-1 flex-row items-center justify-center gap-2 rounded-3xl border border-slate-200 bg-white py-3 dark:border-canvasdark-card dark:bg-canvasdark-card"
    >
      {icon}
      <Text className="font-sans-medium text-[13px] text-ink dark:text-slate-50">{label}</Text>
    </Pressable>
  );
}
