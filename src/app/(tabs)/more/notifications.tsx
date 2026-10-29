import { PlatformDatePicker } from '@/components/ui/PlatformDatePicker';
import dayjs from 'dayjs';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { safeBack } from '@/lib/navigation';
import {
  AlertTriangle,
  BellRing,
  BookHeart,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cloud,
  Pill,
  RefreshCw,
  Send,
  SkipForward,
  Sparkles,
  Trash2,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Switch, Text, TextInput, View } from 'react-native';

import { heroShadow } from '@/components/ui/HeroAction';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { useToast } from '@/components/ui/Toast';
import { Txt } from '@/components/ui/Txt';
import { todaysReminders } from '@/data/medications';
import { elevation, fonts, radii } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { useAccent } from '@/hooks/useAccent';
import { upcomingHealthDays } from '@/lib/calendarMarks';
import { todayKey } from '@/lib/date';
import { tapFeedback } from '@/lib/feedback';
import { healthDayIcons } from '@/lib/healthDayIcons';
import {
  ensureNotificationPermission,
  notificationsGranted,
  remindersAvailable,
  snoozeReminder,
  syncPushTokenAndRemindersWithBackend,
  syncReminders,
  triggerTestAppointmentAlert,
  triggerTestHealthDayAlert,
  triggerTestMissedDoseAlert,
} from '@/lib/reminders';
import { isSupabaseConfigured } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';

type Item = { id: string; label: string; time: string; custom: boolean };

/** Notifications: today's reminders with Taken, Snooze and Skip, WHO health days, push server sync, and custom reminders. */
export default function NotificationsScreen() {
  const { accent } = useAccent();
  const t = useTokens();
  const toast = useToast();

  const takenLog = useAppStore((s) => s.takenLog);
  const skippedLog = useAppStore((s) => s.skippedLog);
  const toggleTaken = useAppStore((s) => s.toggleTaken);
  const skipReminder = useAppStore((s) => s.skipReminder);
  const customReminders = useAppStore((s) => s.customReminders);
  const addCustomReminder = useAppStore((s) => s.addCustomReminder);
  const removeCustomReminder = useAppStore((s) => s.removeCustomReminder);
  const notifications = useAppStore((s) => s.notifications);
  const setNotification = useAppStore((s) => s.setNotification);
  const pushToken = useAppStore((s) => s.pushToken);
  const lastPushSyncAt = useAppStore((s) => s.lastPushSyncAt);

  const dateKey = todayKey();
  const [permitted, setPermitted] = useState<boolean | null>(null);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [testingHealthDay, setTestingHealthDay] = useState(false);
  const [testingMissedAlert, setTestingMissedAlert] = useState(false);
  const [testingApptAlert, setTestingApptAlert] = useState(false);
  const [syncingServer, setSyncingServer] = useState(false);

  const nextHealthDays = useMemo(() => upcomingHealthDays(new Date(), 4), []);

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
    toast.show(
      statusOf(item.id) === 'skipped'
        ? `${item.label} is back on your list`
        : `${item.label} skipped for today`,
      'info'
    );
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

  const handleToggleHealthDays = async (value: boolean) => {
    setNotification('educationalTips', value);
    if (value && !(await notificationsGranted())) {
      const granted = await ensureNotificationPermission();
      setPermitted(granted);
    }
    await syncReminders();
    toast.show(value ? '20 WHO health days scheduled' : 'Health day alerts paused', 'success');
  };

  const handleToggleMissedDose = async (value: boolean) => {
    setNotification('missedDoseAlerts', value);
    if (value && !(await notificationsGranted())) {
      const granted = await ensureNotificationPermission();
      setPermitted(granted);
    }
    await syncReminders();
    toast.show(
      value ? 'Missed dose alerts active (45m follow-up)' : 'Missed dose alerts paused',
      'info'
    );
  };

  const handleToggleAppointmentAlerts = async (value: boolean) => {
    setNotification('appointmentAlerts', value);
    if (value && !(await notificationsGranted())) {
      const granted = await ensureNotificationPermission();
      setPermitted(granted);
    }
    await syncReminders();
    toast.show(
      value ? 'Doctor appointment alerts active (24h & 2h prior)' : 'Appointment alerts paused',
      'info'
    );
  };

  const handleTestHealthDayAlert = async () => {
    setTestingHealthDay(true);
    const ok = await triggerTestHealthDayAlert();
    setTestingHealthDay(false);
    if (ok) {
      toast.show('Sample WHO awareness alert triggered!', 'success');
    } else {
      toast.show('Please enable notification permissions to preview alerts', 'warning');
    }
  };

  const handleTestMissedDoseAlert = async () => {
    setTestingMissedAlert(true);
    const ok = await triggerTestMissedDoseAlert();
    setTestingMissedAlert(false);
    if (ok) {
      toast.show('Test missed-dose alert triggered with interactive actions', 'success');
    } else {
      toast.show('Please enable notification permissions to preview alerts', 'warning');
    }
  };

  const handleTestAppointmentAlert = async () => {
    setTestingApptAlert(true);
    const ok = await triggerTestAppointmentAlert();
    setTestingApptAlert(false);
    if (ok) {
      toast.show('Test appointment alert linked to consultation notes triggered', 'success');
    } else {
      toast.show('Please enable notification permissions to preview alerts', 'warning');
    }
  };

  const handleSyncServer = async () => {
    setSyncingServer(true);
    tapFeedback();
    try {
      const res = await syncPushTokenAndRemindersWithBackend();
      if (res.success) {
        toast.show(res.message, 'success');
      } else {
        toast.show(res.message, 'info');
      }
    } catch {
      toast.show('Failed to sync with push server', 'warning');
    } finally {
      setSyncingServer(false);
    }
  };

  const allowNotifications = async () => {
    const granted = await ensureNotificationPermission();
    setPermitted(granted);
    if (granted) await syncReminders();
  };

  return (
    <Screen headerOwnsTopInset scroll={false}>
      <ScreenHeader title="Notifications" onBack={() => safeBack('/(tabs)/more')} />
      <ScreenScroll className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 64 }}>
        {/* Summary Card */}
        <View className="mt-2 rounded-[32px] bg-ink p-5 dark:bg-canvasdark-card" style={heroShadow}>
          <View className="flex-row items-center justify-between">
            <Text className="font-sans-semibold text-[13px] text-white/70">Today&apos;s Schedule</Text>
            <View className="rounded-full bg-white/15 px-3 py-1">
              <Text className="font-sans-semibold text-[11px] text-white">{items.length} reminders</Text>
            </View>
          </View>
          <View className="items-center py-5">
            <Text className="font-sans-bold text-[44px] leading-[48px] text-white">
              {done}/{items.length}
            </Text>
            <Text className="mt-1 font-sans text-[13px] text-white/60">
              medications or checks completed today
            </Text>
          </View>
        </View>

        {!remindersAvailable() ? (
          <View className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
            <Text className="font-sans-semibold text-[13px] text-ink dark:text-slate-50">
              Reminders are not available in this preview environment.
            </Text>
            <Text className="mt-1 font-sans text-[12px] leading-[17px] text-ink-muted dark:text-slate-400">
              Background triggers will deliver natively on your device.
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
              Notifications are currently off on this phone. Tap to turn them on.
            </Text>
          </Pressable>
        ) : null}

        {/* Push Notification Server Sync Card (Spec §4.6 & §8.2) */}
        <View style={{ marginTop: 24 }}>
          <SectionHeader title="Push Notification Server Sync" />
          <View
            style={[
              {
                borderRadius: radii.xl,
                backgroundColor: t.surface,
                padding: 16,
                borderWidth: 1,
                borderColor: t.border,
              },
              elevation[1],
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 12 }}>
                <View
                  style={{
                    height: 42,
                    width: 42,
                    borderRadius: radii.md,
                    backgroundColor: 'rgba(59, 130, 246, 0.12)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Cloud size={20} color="#2563EB" />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong">Cloud Backend Push Engine</Txt>
                  <Txt variant="footnote" tone="muted" style={{ marginTop: 2 }}>
                    {isSupabaseConfigured
                      ? 'Connected to Supabase Notification Sync'
                      : 'Local Device Notification Engine'}
                  </Txt>
                </View>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: radii.pill,
                  backgroundColor: 'rgba(22, 163, 74, 0.12)',
                }}
              >
                <CheckCircle2 size={12} color="#16A34A" />
                <Txt variant="footnote" color="#16A34A" style={{ fontSize: 11, fontFamily: fonts.semibold }}>
                  Active
                </Txt>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: t.border, marginVertical: 12 }} />

            <View style={{ gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Txt variant="footnote" tone="muted">
                  Device Push Token
                </Txt>
                <Txt variant="footnote" style={{ fontFamily: fonts.medium }}>
                  {pushToken ? `${pushToken.slice(0, 16)}...` : 'Registered on sync'}
                </Txt>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Txt variant="footnote" tone="muted">
                  Last Server Sync
                </Txt>
                <Txt variant="footnote" style={{ fontFamily: fonts.medium }}>
                  {lastPushSyncAt ? dayjs(lastPushSyncAt).format('MMM D, YYYY · HH:mm') : 'Pending sync'}
                </Txt>
              </View>
            </View>

            <PressableScale
              onPress={handleSyncServer}
              disabled={syncingServer}
              style={{
                marginTop: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 10,
                borderRadius: radii.pill,
                backgroundColor: t.accent,
                opacity: syncingServer ? 0.7 : 1,
              }}
            >
              {syncingServer ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <RefreshCw size={14} color="#FFFFFF" />
              )}
              <Txt variant="footnote" color="#FFFFFF" style={{ fontFamily: fonts.semibold }}>
                {syncingServer ? 'Syncing with Server...' : 'Sync Reminders to Cloud Backend'}
              </Txt>
            </PressableScale>
          </View>
        </View>

        {/* Automated Clinical Alert Scheduling (Spec §4.6 & §8.2) */}
        <View style={{ marginTop: 24 }}>
          <SectionHeader title="Clinical Alert Scheduling" />
          <View
            style={[
              {
                borderRadius: radii.xl,
                backgroundColor: t.surface,
                padding: 16,
                borderWidth: 1,
                borderColor: t.border,
              },
              elevation[1],
            ]}
          >
            {/* Missed Dose Alerts (Spec §4.6) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 12 }}>
                <View
                  style={{
                    height: 42,
                    width: 42,
                    borderRadius: radii.md,
                    backgroundColor: 'rgba(234, 88, 12, 0.12)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertTriangle size={20} color="#EA580C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong">Missed Dose Follow-up</Txt>
                  <Txt variant="footnote" tone="muted" style={{ marginTop: 2 }}>
                    Automatic alert 45m after dose time if unlogged
                  </Txt>
                </View>
              </View>
              <Switch
                thumbColor="#FFFFFF"
                value={notifications.missedDoseAlerts}
                onValueChange={handleToggleMissedDose}
                trackColor={{ true: accent, false: '#E2E8F0' }}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
              <PressableScale
                onPress={handleTestMissedDoseAlert}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: radii.pill,
                  backgroundColor: t.surfaceMuted,
                }}
              >
                <Pill size={12} color={t.accent} />
                <Txt variant="footnote" color={t.accent} style={{ fontFamily: fonts.semibold }}>
                  {testingMissedAlert ? 'Testing...' : 'Test Missed Dose Alert'}
                </Txt>
              </PressableScale>
            </View>

            <View style={{ height: 1, backgroundColor: t.border, marginVertical: 14 }} />

            {/* Doctor Appointment Alerts & Diary Linking (Spec §8.2) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 12 }}>
                <View
                  style={{
                    height: 42,
                    width: 42,
                    borderRadius: radii.md,
                    backgroundColor: 'rgba(124, 58, 237, 0.12)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Calendar size={20} color="#7C3AED" />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong">Doctor Visit Reminders</Txt>
                  <Txt variant="footnote" tone="muted" style={{ marginTop: 2 }}>
                    24h & 2h alerts linked to your consultation notes
                  </Txt>
                </View>
              </View>
              <Switch
                thumbColor="#FFFFFF"
                value={notifications.appointmentAlerts}
                onValueChange={handleToggleAppointmentAlerts}
                trackColor={{ true: accent, false: '#E2E8F0' }}
              />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
              <PressableScale
                onPress={handleTestAppointmentAlert}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: radii.pill,
                  backgroundColor: t.surfaceMuted,
                }}
              >
                <Calendar size={12} color={t.accent} />
                <Txt variant="footnote" color={t.accent} style={{ fontFamily: fonts.semibold }}>
                  {testingApptAlert ? 'Testing...' : 'Test Appointment Alert'}
                </Txt>
              </PressableScale>
            </View>
          </View>
        </View>

        {/* WHO Health Awareness Days (Spec §7 F-02) */}
        <View style={{ marginTop: 24 }}>
          <SectionHeader title="WHO Health Awareness Days" />
          <View
            style={[
              {
                borderRadius: radii.xl,
                backgroundColor: t.surface,
                padding: 16,
                borderWidth: 1,
                borderColor: t.border,
              },
              elevation[1],
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1, paddingRight: 12 }}>
                <View
                  style={{
                    height: 42,
                    width: 42,
                    borderRadius: radii.md,
                    backgroundColor: 'rgba(14, 116, 144, 0.12)',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BookHeart size={20} color={t.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong">Annual Health Day Alerts</Txt>
                  <Txt variant="footnote" tone="muted" style={{ marginTop: 2 }}>
                    20 WHO dates scheduled every year at 08:00 AM
                  </Txt>
                </View>
              </View>
              <Switch
                thumbColor="#FFFFFF"
                value={notifications.educationalTips}
                onValueChange={handleToggleHealthDays}
                trackColor={{ true: accent, false: '#E2E8F0' }}
              />
            </View>

            <View style={{ height: 1, backgroundColor: t.border, marginVertical: 14 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="#16A34A" />
                <Txt variant="footnote" color="#16A34A" style={{ fontFamily: fonts.medium }}>
                  {notifications.educationalTips ? 'Active: 20 days scheduled' : 'Alerts paused'}
                </Txt>
              </View>

              <PressableScale
                onPress={handleTestHealthDayAlert}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: radii.pill,
                  backgroundColor: t.surfaceMuted,
                }}
              >
                <Send size={12} color={t.accent} />
                <Txt variant="footnote" color={t.accent} style={{ fontFamily: fonts.semibold }}>
                  {testingHealthDay ? 'Sending...' : 'Test Alert'}
                </Txt>
              </PressableScale>
            </View>

            {/* Upcoming Awareness Days Preview */}
            <View style={{ marginTop: 14, gap: 8 }}>
              <Txt variant="label" tone="muted" style={{ fontSize: 11 }}>
                UPCOMING WHO RECOGNISED DAYS
              </Txt>
              {nextHealthDays.map((hd) => (
                <PressableScale
                  key={hd.id}
                  onPress={() => router.push(`/calendar/${hd.id}`)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingVertical: 6,
                  }}
                >
                  <Image source={healthDayIcons[hd.icon]} style={{ width: 22, height: 22 }} contentFit="contain" />
                  <View style={{ flex: 1 }}>
                    <Txt variant="footnote" style={{ fontFamily: fonts.medium }} numberOfLines={1}>
                      {hd.title}
                    </Txt>
                    <Txt variant="footnote" tone="muted" style={{ fontSize: 11 }}>
                      {hd.dateLabel}
                    </Txt>
                  </View>
                  <ChevronRight size={14} color={t.textMuted} />
                </PressableScale>
              ))}
            </View>
          </View>
        </View>

        {/* Today's Medication & Custom Reminders */}
        <View style={{ marginTop: 24 }}>
          <SectionHeader title="Today's Reminders" />
          {items.length === 0 ? (
            <Text className="font-sans text-[13px] text-ink-muted dark:text-slate-400">
              No reminders scheduled for today. Add one below.
            </Text>
          ) : (
            <View className="gap-3">
              {items.map((item) => {
                const status = statusOf(item.id);
                return (
                  <View
                    key={item.id}
                    className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card"
                  >
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
                      <ActionPill
                        label="Taken"
                        icon={<Check size={14} color={status === 'taken' ? '#FFFFFF' : '#0B2559'} />}
                        active={status === 'taken'}
                        onPress={() => handleTaken(item)}
                      />
                      <ActionPill
                        label="Snooze"
                        icon={<Clock size={14} color="#0B2559" />}
                        onPress={() => handleSnooze(item)}
                      />
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
        </View>

        {/* Custom reminder builder */}
        <View style={{ marginTop: 24 }}>
          <SectionHeader title="Add a Custom Reminder" />
          <View className="gap-3 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Check blood glucose before dinner"
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
            <PlatformDatePicker
              visible={showTimePicker}
              value={dayjs(`2000-01-01T${time ?? '08:00'}`).toDate()}
              mode="time"
              title="Select Reminder Time"
              onClose={() => setShowTimePicker(false)}
              onChange={(date) => {
                setShowTimePicker(false);
                if (date) setTime(dayjs(date).format('HH:mm'));
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add reminder"
              accessibilityState={{ disabled: !title.trim() || !time }}
              disabled={!title.trim() || !time}
              onPress={handleAddCustom}
              className={`min-h-[48px] items-center justify-center rounded-full bg-ink dark:bg-brand-400 ${
                !title.trim() || !time ? 'opacity-40' : ''
              }`}
            >
              <Text className="font-sans-bold text-[15px] text-white">Add reminder</Text>
            </Pressable>
          </View>
        </View>

        {customReminders.length > 0 ? (
          <View className="mt-4 gap-2">
            {customReminders.map((r) => (
              <View
                key={r.id}
                className="flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-canvasdark-card dark:bg-canvasdark-card"
              >
                <Text className="flex-1 font-sans-medium text-[14px] text-ink dark:text-slate-50">
                  {r.title} · {dayjs(`2000-01-01T${r.time}`).format('h:mm A')}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${r.title}`}
                  onPress={() => handleRemoveCustom(r.id, r.title)}
                  hitSlop={8}
                  className="h-11 w-11 items-center justify-center"
                >
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
      className={`min-h-[44px] flex-1 flex-row items-center justify-center gap-1.5 rounded-full ${
        active ? 'bg-ink dark:bg-brand-400' : 'bg-brand-50 dark:bg-brand-500/10'
      }`}
    >
      {icon}
      <Text className={`font-sans-semibold text-[12px] ${active ? 'text-white' : 'text-ink dark:text-slate-50'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
