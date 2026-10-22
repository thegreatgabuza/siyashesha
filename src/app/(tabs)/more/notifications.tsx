import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import { router } from 'expo-router';
import { BellRing, Check, Clock, SkipForward, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';

import { heroShadow } from '@/components/ui/HeroAction';
import { Screen } from '@/components/ui/Screen';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useToast } from '@/components/ui/Toast';
import { todaysReminders } from '@/data/medications';
import { todayKey } from '@/lib/date';
import { ensureNotificationPermission, notificationsGranted, remindersAvailable, snoozeReminder, syncReminders } from '@/lib/reminders';
import { tapFeedback } from '@/lib/feedback';
import { useAppStore } from '@/store/useAppStore';

type Item = { id: string; label: string; time: string; custom: boolean };

/** Notifications: today's reminders with Taken, Snooze and Skip, plus a custom reminder builder. */
export default function NotificationsScreen() {
  const toast = useToast();
  const takenLog = useAppStore((s) => s.takenLog);
  const skippedLog = useAppStore((s) => s.skippedLog);
  const toggleTaken = useAppStore((s) => s.toggleTaken);
  const skipReminder = useAppStore((s) => s.skipReminder);
  const customReminders = useAppStore((s) => s.customReminders);
  const addCustomReminder = useAppStore((s) => s.addCustomReminder);
  const removeCustomReminder = useAppStore((s) => s.removeCustomReminder);

  const dateKey = todayKey();
  const [permitted, setPermitted] = useState<boolean | null>(null);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    notificationsGranted().then(setPermitted);
  }, []);

  const items: Item[] = useMemo(
    () => [
      ...todaysReminders().map((r) => ({ id: r.id, label: r.label, time: r.time, custom: false })),
      ...customReminders.map((r) => ({ id: r.id, label: r.title, time: r.time, custom: true })),
    ].sort((a, b) => a.time.localeCompare(b.time)),
    [customReminders]
  );

  const statusOf = (id: string): 'taken' | 'skipped' | 'due' => {
    const key = `${id}__${dateKey}`;
    if (takenLog[key]) return 'taken';
    if (skippedLog[key]) return 'skipped';
    return 'due';
  };

  const done = items.filter((i) => statusOf(i.id) !== 'due').length;

  const handleTaken = (item: Item) => {
    if (statusOf(item.id) === 'taken') return;
    toggleTaken(item.id, dateKey);
    toast.show(`${item.label} marked as taken`, 'success');
  };

  const handleSnooze = async (item: Item) => {
    await snoozeReminder(item.label, 15);
    toast.show('We will remind you in 15 minutes', 'info');
  };

  const handleSkip = (item: Item) => {
    skipReminder(item.id, dateKey);
    toast.show(statusOf(item.id) === 'skipped' ? `${item.label} is back on your list` : `${item.label} skipped for today`, 'info');
  };

  const handleAddCustom = async () => {
    if (!title.trim() || !time) return;
    addCustomReminder({ title: title.trim(), time });
    setTitle('');
    setTime(null);
    if (await ensureNotificationPermission()) {
      setPermitted(true);
      await syncReminders();
    } else {
      setPermitted(false);
    }
    toast.show('Reminder added', 'success');
  };

  const handleRemoveCustom = (id: string, label: string) => {
    Alert.alert('Remove reminder?', `"${label}" will stop.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          removeCustomReminder(id);
          await syncReminders();
          toast.show('Reminder removed', 'info');
        },
      },
    ]);
  };

  const allowNotifications = async () => {
    const granted = await ensureNotificationPermission();
    setPermitted(granted);
    if (granted) await syncReminders();
  };

  return (
    <Screen headerOwnsTopInset scroll={false}>
      <ScreenHeader title="Notifications" onBack={() => router.back()} />
      <ScreenScroll className="flex-1 px-5">
        {/* Summary */}
        <View className="mt-2 rounded-[32px] bg-ink p-5 dark:bg-canvasdark-card" style={heroShadow}>
          <View className="flex-row items-center justify-between">
            <Text className="font-sans-semibold text-[13px] text-white/70">Today</Text>
            <View className="rounded-full bg-white/15 px-3 py-1">
              <Text className="font-sans-semibold text-[11px] text-white">{items.length} reminders</Text>
            </View>
          </View>
          <View className="items-center py-5">
            <Text className="font-sans-bold text-[44px] leading-[48px] text-white">
              {done}/{items.length}
            </Text>
            <Text className="mt-1 font-sans text-[13px] text-white/60">taken or skipped so far today</Text>
          </View>
        </View>

        {!remindersAvailable() ? (
          <View className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
            <Text className="font-sans-semibold text-[13px] text-ink dark:text-slate-50">
              Reminders are not available in this version of the app.
            </Text>
            <Text className="mt-1 font-sans text-[12px] leading-[17px] text-ink-muted dark:text-slate-400">
              They work in a development build of Siyashesha.
            </Text>
          </View>
        ) : permitted === false ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Turn on notifications"
            onPress={allowNotifications}
            className="mt-4 flex-row items-center gap-3 rounded-3xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/30 dark:bg-brand-500/10"
          >
            <BellRing size={18} color="#0B2559" />
            <Text className="flex-1 font-sans-semibold text-[13px] text-ink dark:text-slate-50">
              Notifications are off on this phone. Turn them on to get reminders.
            </Text>
          </Pressable>
        ) : null}

        <SectionHeader title="Today's reminders" />
        {items.length === 0 ? (
          <Text className="font-sans text-[13px] text-ink-muted dark:text-slate-400">No reminders yet. Add one below.</Text>
        ) : (
          <View className="gap-3">
            {items.map((item) => {
              const status = statusOf(item.id);
              return (
                <View key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
                  <View className="flex-row items-center justify-between gap-3">
                    <View className="flex-1">
                      <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">{item.label}</Text>
                      <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">
                        {dayjs(`2000-01-01T${item.time}`).format('h:mm A')}
                        {item.custom ? ' · your reminder' : ''}
                      </Text>
                    </View>
                    <StatusChip status={status} />
                  </View>
                  <View className="mt-3 flex-row gap-2">
                    <ActionPill label="Taken" icon={<Check size={14} color={status === 'taken' ? '#FFFFFF' : '#0B2559'} />} active={status === 'taken'} onPress={() => handleTaken(item)} />
                    <ActionPill label="Snooze" icon={<Clock size={14} color="#0B2559" />} onPress={() => handleSnooze(item)} />
                    <ActionPill
                      label={status === 'skipped' ? 'Undo skip' : 'Skip'}
                      icon={<SkipForward size={14} color={status === 'skipped' ? '#FFFFFF' : '#0B2559'} />}
                      active={status === 'skipped'}
                      onPress={() => handleSkip(item)}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Custom reminder builder */}
        <SectionHeader title="Add your own reminder" />
        <View className="gap-3 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Check blood pressure"
            placeholderTextColor="#8C98B8"
            className="min-h-[48px] rounded-2xl border border-slate-200 bg-white px-4 font-sans text-[15px] text-ink dark:border-canvasdark-card dark:bg-canvasdark dark:text-slate-50"
            accessibilityLabel="Reminder title"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={time ? `Time ${time}. Change` : 'Choose a time'}
            onPress={() => {
              tapFeedback();
              setShowTimePicker(true);
            }}
            className="min-h-[48px] flex-row items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 dark:border-canvasdark-card dark:bg-canvasdark"
          >
            <Clock size={16} color="#0B2559" />
            <Text className="font-sans-semibold text-[14px] text-ink dark:text-slate-50">
              {time ? dayjs(`2000-01-01T${time}`).format('h:mm A') : 'Choose a time, every day'}
            </Text>
          </Pressable>
          {showTimePicker ? (
            <DateTimePicker
              value={dayjs(`2000-01-01T${time ?? '08:00'}`).toDate()}
              mode="time"
              onChange={(_, date) => {
                setShowTimePicker(false);
                if (date) setTime(dayjs(date).format('HH:mm'));
              }}
            />
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add reminder"
            accessibilityState={{ disabled: !title.trim() || !time }}
            disabled={!title.trim() || !time}
            onPress={handleAddCustom}
            className={`min-h-[48px] items-center justify-center rounded-full bg-ink dark:bg-brand-400 ${!title.trim() || !time ? 'opacity-40' : ''}`}
          >
            <Text className="font-sans-bold text-[15px] text-white">Add reminder</Text>
          </Pressable>
        </View>

        {customReminders.length > 0 ? (
          <View className="mt-4 gap-2">
            {customReminders.map((r) => (
              <View key={r.id} className="flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-canvasdark-card dark:bg-canvasdark-card">
                <Text className="flex-1 font-sans-medium text-[14px] text-ink dark:text-slate-50">
                  {r.title} · {dayjs(`2000-01-01T${r.time}`).format('h:mm A')}
                </Text>
                <Pressable accessibilityRole="button" accessibilityLabel={`Remove ${r.title}`} onPress={() => handleRemoveCustom(r.id, r.title)} hitSlop={8} className="h-11 w-11 items-center justify-center">
                  <Trash2 size={16} color="#DC1F26" />
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </ScreenScroll>
    </Screen>
  );
}

function StatusChip({ status }: { status: 'taken' | 'skipped' | 'due' }) {
  const styles =
    status === 'taken'
      ? 'bg-success-50 dark:bg-success-500/15'
      : status === 'skipped'
        ? 'bg-slate-100 dark:bg-canvasdark'
        : 'bg-brand-100 dark:bg-brand-500/20';
  const text = status === 'taken' ? 'text-success-600' : 'text-ink-muted dark:text-slate-300';
  const label = status === 'taken' ? 'Taken' : status === 'skipped' ? 'Skipped' : 'Due';
  return (
    <View className={`rounded-full px-2.5 py-1 ${styles}`}>
      <Text className={`font-sans-semibold text-[11px] ${text}`}>{label}</Text>
    </View>
  );
}

function ActionPill({
  label,
  icon,
  onPress,
  active,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      className={`min-h-[44px] flex-1 flex-row items-center justify-center gap-1.5 rounded-full ${active ? 'bg-ink dark:bg-brand-400' : 'bg-brand-50 dark:bg-brand-500/10'}`}
    >
      {icon}
      <Text className={`font-sans-semibold text-[12px] ${active ? 'text-white' : 'text-ink dark:text-slate-50'}`}>{label}</Text>
    </Pressable>
  );
}
