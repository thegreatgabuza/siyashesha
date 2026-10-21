import { router } from 'expo-router';
import {
  ChevronRight,
  Clock,
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
import { HeroAction, heroShadow } from '@/components/ui/HeroAction';
import { Screen } from '@/components/ui/Screen';
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
    ],
  },
  {
    title: 'Connect',
    items: [
      { label: 'Sharing', icon: Share2, route: '/more/sharing', tint: 'accent' },
      { label: 'Siyashesha Assistant', icon: MessageCircle, route: '/more/assistant', tint: 'accent' },
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
  const patient = useAppStore((s) => s.patientProfile);
  const recordCount = useAppStore((s) => s.records.length);

  return (
    <Screen contentClassName="px-5" bottomInset={140}>
      <View className="pb-1 pt-4">
        <BrandLockup />
      </View>

      <View className="pb-4 pt-5">
        <Text className="font-sans text-[14px] text-ink-muted dark:text-slate-400">Your account</Text>
        <Text className="font-sans-bold text-[32px] leading-[36px] text-ink dark:text-slate-50">More</Text>
      </View>

      {/* Profile summary */}
      <View className="rounded-[32px] bg-ink p-5 dark:bg-canvasdark-card" style={heroShadow}>
        <View className="flex-row items-center gap-3">
          <Avatar name={patient.preferredName} size={52} />
          <View className="flex-1">
            <Text className="font-sans-bold text-[18px] text-white" numberOfLines={1}>
              {patient.firstName} {patient.lastName}
            </Text>
            <Text className="font-sans text-[12px] text-white/60">
              {patient.bloodGroup} · {patient.phone}
            </Text>
          </View>
        </View>

        <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-white/10 px-4 py-3">
          <Text className="font-sans-medium text-[12px] tracking-wide text-white/80">ID ···{patient.idNumber.slice(-4)}</Text>
          <Text className="font-sans-bold text-[11px] uppercase tracking-[1.5px] text-white/70">Health Passport</Text>
        </View>

        <View className="mt-4 flex-row items-center gap-2">
          <HeroAction
            label="Emergency card"
            icon={<ShieldAlert size={16} color="#FFFFFF" />}
            onPress={() => router.push('/more/emergency')}
            filled
          />
          <HeroAction label="Edit profile" icon={<UserRound size={16} color="#FFFFFF" />} onPress={() => router.push('/more/profile')} />
        </View>
      </View>

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
