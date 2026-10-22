import { router } from 'expo-router';
import { Bell, ChevronRight, Globe, LogOut, Settings, UserRound } from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { BrandLockup } from '@/components/ui/BrandLockup';
import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { elevation, fonts, radii, springs } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { useAppStore } from '@/store/useAppStore';

/** Logo on the left; bell and avatar on the right. Settings live in the avatar menu. */
export function HomeHeader() {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const patient = useAppStore((s) => s.patientProfile);
  const signOut = useAppStore((s) => s.signOut);
  const [menu, setMenu] = useState(false);

  const go = (route: string) => {
    setMenu(false);
    router.push(route as any);
  };

  const items = [
    { label: 'Profile', icon: UserRound, onPress: () => go('/more/profile') },
    { label: 'Settings', icon: Settings, onPress: () => go('/more/settings') },
    { label: 'Language', icon: Globe, onPress: () => go('/more/language') },
  ];

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 4 }}>
      <BrandLockup />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <PressableScale
          accessibilityLabel="Notifications and reminders"
          onPress={() => router.push('/more/notifications')}
          haptic="selection"
          style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}
        >
          <Bell size={22} color={t.text} />
        </PressableScale>
        <PressableScale
          accessibilityLabel="Account menu"
          accessibilityHint="Profile, settings, language and sign out"
          onPress={() => setMenu(true)}
          haptic="selection"
          style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
        >
          <Avatar name={patient.preferredName || patient.firstName || '?'} size={40} />
        </PressableScale>
      </View>

      <Modal visible={menu} transparent animationType="none" onRequestClose={() => setMenu(false)}>
        <Animated.View entering={FadeIn.duration(160)} exiting={FadeOut.duration(120)} style={{ flex: 1, backgroundColor: t.scrim }}>
          <Pressable accessibilityLabel="Close menu" style={{ flex: 1 }} onPress={() => setMenu(false)}>
            <Animated.View
              entering={ZoomIn.springify().damping(springs.bouncy.damping).stiffness(springs.bouncy.stiffness)}
              style={[
                {
                  position: 'absolute',
                  right: 16,
                  top: insets.top + 60,
                  width: 260,
                  backgroundColor: t.surface,
                  borderRadius: radii.md,
                  paddingVertical: 6,
                  transformOrigin: 'top right',
                },
                elevation[3],
              ]}
            >
              <Pressable onPress={() => go('/more/profile')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}>
                <Avatar name={patient.preferredName || patient.firstName || '?'} size={40} />
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong">
                    {patient.firstName} {patient.lastName}
                  </Txt>
                  <Txt variant="footnote" tone="muted">
                    View your profile
                  </Txt>
                </View>
              </Pressable>
              <View style={{ height: 1, backgroundColor: t.border, marginHorizontal: 14 }} />
              {items.map((item) => (
                <Pressable
                  key={item.label}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  onPress={item.onPress}
                  style={({ pressed }) => ({
                    minHeight: 48,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    paddingHorizontal: 14,
                    backgroundColor: pressed ? t.surfaceMuted : 'transparent',
                  })}
                >
                  <item.icon size={18} color={t.textSecondary} />
                  <Txt variant="callout" style={{ flex: 1 }}>
                    {item.label}
                  </Txt>
                  <ChevronRight size={16} color={t.textMuted} />
                </Pressable>
              ))}
              <View style={{ height: 1, backgroundColor: t.border, marginHorizontal: 14 }} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                onPress={() => {
                  setMenu(false);
                  signOut();
                }}
                style={({ pressed }) => ({ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, backgroundColor: pressed ? t.surfaceMuted : 'transparent' })}
              >
                <LogOut size={18} color={t.textMuted} />
                <Txt variant="callout" tone="muted" style={{ fontFamily: fonts.medium }}>
                  Sign out
                </Txt>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Modal>
    </View>
  );
}
