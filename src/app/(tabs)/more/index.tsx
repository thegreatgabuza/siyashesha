import { router } from 'expo-router';
import {
  ChevronRight,
  Clock,
  BellRing,
  Globe,
  MessageCircle,
  Pill as PillIcon,
  Settings as SettingsIcon,
  Share2,
  ShieldAlert,
  UserRound,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { Avatar } from '@/components/ui/Avatar';
import { BrandLockup } from '@/components/ui/BrandLockup';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Txt } from '@/components/ui/Txt';
import { elevation, fonts, radii } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { bloodGroupLabel } from '@/lib/bloodGroup';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { activeMedications } from '@/data/medications';
import { useAppStore } from '@/store/useAppStore';
import { useAccent } from '@/hooks/useAccent';

const sections: {
  title: string;
  items: { label: string; icon: any; route: string; tint: string }[];
}[] = [
  {
    title: 'Health',
    items: [
      { label: 'Medications', icon: PillIcon, route: '/more/medications', tint: '#16A34A' },
      { label: 'Emergency Profile', icon: ShieldAlert, route: '/more/emergency', tint: '#DC1F26' },
      { label: 'Health Timeline', icon: Clock, route: '/more/timeline', tint: 'accent' },
      { label: 'Notifications', icon: BellRing, route: '/more/notifications', tint: 'accent' },
    ],
  },
  {
    title: 'Connect',
    items: [
      { label: 'Sharing', icon: Share2, route: '/more/sharing', tint: 'accent' },
      { label: 'Siyashesha Assistant', icon: MessageCircle, route: '/assistant', tint: 'accent' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Language', icon: Globe, route: '/more/language', tint: 'accent' },
      { label: 'Profile', icon: UserRound, route: '/more/profile', tint: '#5B6478' },
      { label: 'Settings', icon: SettingsIcon, route: '/more/settings', tint: '#5B6478' },
    ],
  },
];

export default function MoreScreen() {
  const { accent, accentSoft } = useAccent();
  const t = useTokens();
  const patient = useAppStore((s) => s.patientProfile);
  const recordCount = useAppStore((s) => s.records.length);

  return (
    <Screen contentClassName="px-5">
      <View className="pb-1 pt-4">
        <BrandLockup />
      </View>

      <View className="pb-4 pt-5">
        <Text className="font-sans text-[14px] text-ink-muted dark:text-slate-400">Your account</Text>
        <Text className="font-sans-bold text-[32px] leading-[36px] text-ink dark:text-slate-50">More</Text>
      </View>

      {/* Identity: compact, so the lists below are the point of this screen */}
      <PressableScale
        accessibilityLabel={`${patient.firstName} ${patient.lastName}. Blood group ${bloodGroupLabel(patient.bloodGroup)}. Open profile`}
        onPress={() => router.push('/more/profile')}
        style={[{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radii.lg, backgroundColor: t.surface }, elevation[1]]}
      >
        <Avatar name={patient.preferredName || patient.firstName || '?'} size={52} />
        <View style={{ flex: 1 }}>
          <Txt variant="headline">
            {patient.firstName} {patient.lastName}
          </Txt>
          <Txt variant="footnote" tone="muted">
            Blood group {bloodGroupLabel(patient.bloodGroup)} · ID ···{patient.idNumber.slice(-4)}
          </Txt>
        </View>
        <ChevronRight size={18} color={t.textMuted} />
      </PressableScale>
      <PressableScale
        accessibilityLabel="Open emergency ICE card"
        haptic="impact"
        onPress={() => router.push('/more/emergency')}
        style={{ marginTop: 12, minHeight: 52, borderRadius: radii.pill, backgroundColor: t.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <ShieldAlert size={18} color="#FFFFFF" />
        <Txt variant="callout" tone="onNavy" style={{ fontFamily: fonts.semibold }}>
          Emergency card & QR
        </Txt>
      </PressableScale>

      {/* Quick totals */}
      <View className="mt-4 flex-row gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${recordCount} records`}
          onPress={() => router.push('/records')}
          className="flex-1 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card"
        >
          <Text className="font-sans-medium text-[12px] text-ink-muted dark:text-slate-400">Records</Text>
          <Text className="mt-2 font-sans-bold text-[30px] text-ink dark:text-slate-50">{recordCount}</Text>
          <Text className="mt-0.5 font-sans text-[11px] text-ink-muted dark:text-slate-500">in your vault</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${activeMedications.length} active medications`}
          onPress={() => router.push('/more/medications')}
          className="flex-1 rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card"
        >
          <Text className="font-sans-medium text-[12px] text-ink-muted dark:text-slate-400">Medications</Text>
          <Text className="mt-2 font-sans-bold text-[30px] text-ink dark:text-slate-50">{activeMedications.length}</Text>
          <Text className="mt-0.5 font-sans text-[11px] text-ink-muted dark:text-slate-500">active</Text>
        </Pressable>
      </View>

      {sections.map((section) => (
        <View key={section.title} className="pt-6">
          <SectionHeader title={section.title} />
          <View className="rounded-3xl border border-slate-200 bg-white dark:border-canvasdark-card dark:bg-canvasdark-card">
            {section.items.map((item, i) => {
              const color = item.tint === 'accent' ? accent : item.tint;
              const Icon = item.icon;
              return (
                <Pressable
                  key={item.label}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  onPress={() => router.push(item.route as any)}
                  className={`min-h-[56px] flex-row items-center gap-3 px-4 py-3.5 ${
                    i > 0 ? 'border-t border-slate-100 dark:border-canvasdark' : ''
                  }`}
                >
                  <View className="h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: `${color}1A` }}>
                    <Icon size={18} color={color} />
                  </View>
                  <Text className="flex-1 font-sans-medium text-[15px] text-ink dark:text-slate-50">{item.label}</Text>
                  <ChevronRight size={18} color={accentSoft} />
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </Screen>
  );
}
