import { router, usePathname } from 'expo-router';
import {
  CalendarDays,
  CloudCheck,
  FileText,
  Home,
  LogOut,
  NotebookPen,
  Settings,
  ShieldAlert,
  Sparkles,
  Stethoscope,
} from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { useI18n } from '@/i18n/useI18n';
import { useSafeClerk } from '@/lib/clerkAvatar';
import { useAppStore } from '@/store/useAppStore';

const NAVY = '#0B1E40';
const RED = '#DC1F26';

const items = [
  { href: '/', match: (p: string) => p === '/' || p === '/index', icon: Home, label: 'tabs.home' },
  { href: '/records', match: (p: string) => p.startsWith('/records'), icon: FileText, label: 'tabs.records' },
  { href: '/assistant', match: (p: string) => p.startsWith('/assistant'), icon: Sparkles, label: 'tabs.assistant' },
  { href: '/calendar', match: (p: string) => p.startsWith('/calendar'), icon: CalendarDays, label: 'tabs.calendar' },
  { href: '/diary', match: (p: string) => p.startsWith('/diary'), icon: NotebookPen, label: 'tabs.diary' },
  { href: '/more', match: (p: string) => p.startsWith('/more'), icon: Settings, label: 'tabs.more' },
] as const;

/** Persistent desktop navigation for the web app. */
export function WebSidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const patient = useAppStore((s) => s.patientProfile);
  const userRole = useAppStore((s) => s.userRole);
  const doctorProfile = useAppStore((s) => s.doctorProfile);
  const registeredDoctors = useAppStore((s) => s.registeredDoctors);
  const isDoctor = userRole === 'doctor';

  const currentDoctor =
    doctorProfile ??
    registeredDoctors.find((d) => d.email.toLowerCase() === 'thobanisgabuzam2@gmail.com') ??
    registeredDoctors[0];

  const signOut = useAppStore((s) => s.signOut);
  const isSyncing = useAppStore((s) => s.isSyncingCloud);
  const lastSync = useAppStore((s) => s.lastCloudSyncAt);
  const hydrate = useAppStore((s) => s.hydrateFromCloud);
  const { signOut: clerkSignOut } = useSafeClerk();

  const name = isDoctor && currentDoctor
    ? `${currentDoctor.title} ${currentDoctor.fullName}`
    : [patient.preferredName || patient.firstName, patient.lastName].filter(Boolean).join(' ') || 'Your passport';
  const initial = (name[0] ?? 'S').toUpperCase();

  const label = (key: string) => {
    if (isDoctor) {
      if (key === 'tabs.home') return 'Practice';
      if (key === 'tabs.calendar') return 'Schedule';
      if (key === 'tabs.more') return 'Practice Info';
    }
    return key.includes('.') ? t(key as any) : key;
  };

  return (
    <View
      style={{
        width: 248,
        backgroundColor: '#FFFFFF',
        borderRightWidth: 1,
        borderRightColor: '#E5E9F2',
        paddingHorizontal: 12,
        paddingVertical: 20,
      }}
    >
      <View style={{ paddingHorizontal: 12, paddingBottom: 20 }}>
        <Text style={{ fontFamily: 'BebasNeue_400Regular', fontSize: 28, letterSpacing: 1, color: RED }}>SIYASHESHA</Text>
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: '#5B6478' }}>
          {isDoctor ? 'Practice Portal · Doctor' : 'Health Passport'}
        </Text>
      </View>

      {isDoctor ? (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginHorizontal: 4,
            marginBottom: 16,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: '#EFF6FF',
          }}
        >
          <Stethoscope size={16} color="#0B2559" />
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#0B2559' }}>
            Doctor Mode · Active
          </Text>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/more/emergency' as any)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginHorizontal: 4,
            marginBottom: 16,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: '#FEF2F2',
          }}
        >
          <ShieldAlert size={16} color={RED} />
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: RED }}>Emergency ICE card</Text>
        </Pressable>
      )}

      <View style={{ gap: 2 }}>
        {items.map((it) => {
          const active = it.match(pathname);
          const Icon = it.icon;
          return (
            <Pressable
              key={it.href}
              accessibilityRole="link"
              accessibilityState={{ selected: active }}
              onPress={() => router.navigate(it.href as any)}
              style={({ hovered }: any) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                height: 40,
                paddingHorizontal: 12,
                borderRadius: 10,
                backgroundColor: active ? NAVY : hovered ? '#F1F4F9' : 'transparent',
              })}
            >
              <Icon size={18} color={active ? '#FFFFFF' : '#3B4560'} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: active ? '#FFFFFF' : '#1B2540' }}>
                {label(it.label)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />

      <Pressable
        accessibilityRole="button"
        onPress={() => void hydrate()}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8 }}
      >
        <CloudCheck size={15} color={isSyncing ? '#B45309' : '#0D7C66'} />
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: '#5B6478' }}>
          {isSyncing ? 'Syncing…' : lastSync ? `Synced ${new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Sync now'}
        </Text>
      </Pressable>

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginTop: 8,
          paddingTop: 14,
          paddingHorizontal: 8,
          borderTopWidth: 1,
          borderTopColor: '#E5E9F2',
        }}
      >
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#FFFFFF' }}>{initial}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text numberOfLines={1} style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#1B2540' }}>{name}</Text>
          <Text numberOfLines={1} style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#5B6478' }}>{patient.email}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          onPress={async () => {
            try {
              await clerkSignOut?.();
            } catch {}
            signOut();
          }}
        >
          <LogOut size={16} color="#5B6478" />
        </Pressable>
      </View>
    </View>
  );
}
