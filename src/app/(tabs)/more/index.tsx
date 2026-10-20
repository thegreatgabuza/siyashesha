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
import { Screen } from '@/components/ui/Screen';
import { useAppStore } from '@/store/useAppStore';

const sections: {
  title: string;
  items: { label: string; icon: any; route: string; tint: string }[];
}[] = [
  {
    title: 'Health',
    items: [
      { label: 'Medications', icon: PillIcon, route: '/more/medications', tint: '#0D9488' },
      { label: 'Emergency Profile', icon: ShieldAlert, route: '/more/emergency', tint: '#DC2626' },
      { label: 'Health Timeline', icon: Clock, route: '/more/timeline', tint: '#6D5BD0' },
    ],
  },
  {
    title: 'Connect',
    items: [
      { label: 'Sharing', icon: Share2, route: '/more/sharing', tint: '#6D5BD0' },
      { label: 'Siyashesha Assistant', icon: MessageCircle, route: '/more/assistant', tint: '#128C7E' },
    ],
  },
  {
    title: 'Account',
    items: [
      { label: 'Language', icon: Globe, route: '/more/language', tint: '#6D5BD0' },
      { label: 'Profile', icon: UserRound, route: '/more/profile', tint: '#5B6B8A' },
      { label: 'Settings', icon: SettingsIcon, route: '/more/settings', tint: '#5B6B8A' },
    ],
  },
];

export default function MoreScreen() {
  const patient = useAppStore((s) => s.patientProfile);
  return (
    <Screen contentClassName="px-5">
      <View className="flex-row items-center gap-3 pb-5 pt-4">
        <Avatar name={patient.preferredName} size={52} />
        <View>
          <Text className="font-serif text-[22px] text-ink dark:text-slate-50">
            {patient.firstName} {patient.lastName}
          </Text>
          <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">{patient.phone}</Text>
        </View>
      </View>

      {sections.map((section) => (
        <View key={section.title} className="mb-6">
          <Text className="mb-2 font-sans-semibold text-[12px] uppercase tracking-wide text-ink-muted dark:text-slate-400">
            {section.title}
          </Text>
          <View className="rounded-3xl border border-slate-200 bg-white dark:border-canvasdark-card dark:bg-canvasdark-card">
            {section.items.map((item, i) => {
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
                  <View
                    className="h-10 w-10 items-center justify-center rounded-2xl"
                    style={{ backgroundColor: `${item.tint}1A` }}
                  >
                    <Icon size={18} color={item.tint} />
                  </View>
                  <Text className="flex-1 font-sans-medium text-[15px] text-ink dark:text-slate-50">
                    {item.label}
                  </Text>
                  <ChevronRight size={18} color="#C3B6F0" />
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
    </Screen>
  );
}
