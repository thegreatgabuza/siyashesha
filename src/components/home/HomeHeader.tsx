import { useClerk } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import {
  Bell,
  ChevronRight,
  Globe,
  LogOut,
  Settings,
  ShieldAlert,
  UserRound,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Modal, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/ui/Avatar';
import { BrandLockup } from '@/components/ui/BrandLockup';
import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { elevation, fonts, radii, springs } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { languageNames } from '@/i18n/translations';
import { bloodGroupLabel } from '@/lib/bloodGroup';
import { tapFeedback } from '@/lib/feedback';
import { useAppStore } from '@/store/useAppStore';

/** Logo on the left; bell and avatar on the right. Account quick-sheet opens from the avatar. */
export function HomeHeader() {
  const t = useTokens();
  const insets = useSafeAreaInsets();
  const patient = useAppStore((s) => s.patientProfile);
  const language = useAppStore((s) => s.language);
  const signOut = useAppStore((s) => s.signOut);
  const { signOut: clerkSignOut } = useClerk();
  const [menu, setMenu] = useState(false);
  const { width } = useWindowDimensions();

  const go = (route: string) => {
    tapFeedback();
    setMenu(false);
    setTimeout(() => {
      router.push(route as any);
    }, 60);
  };

  const performSignOut = async () => {
    setMenu(false);
    try {
      await clerkSignOut();
    } catch (err) {
      console.warn('[Clerk] Sign out:', err);
    }
    signOut();
    router.replace('/(auth)/sign-in');
  };

  const handleSignOutPress = () => {
    tapFeedback();
    if (Platform.OS === 'web') {
      void performSignOut();
      return;
    }
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your health passport?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            void performSignOut();
          },
        },
      ]
    );
  };

  const items = [
    {
      label: 'View your profile',
      subtitle: 'Personal details, medical aid & ID',
      icon: UserRound,
      tint: '#0284C7',
      onPress: () => go('/more/profile'),
    },
    {
      label: 'Emergency Profile (ICE)',
      subtitle: `Blood group ${bloodGroupLabel(patient.bloodGroup)} · Allergies`,
      icon: ShieldAlert,
      tint: '#DC1F26',
      onPress: () => go('/more/emergency'),
    },
    {
      label: 'Settings',
      subtitle: 'Appearance, privacy & security lock',
      icon: Settings,
      tint: '#6366F1',
      onPress: () => go('/more/settings'),
    },
    {
      label: 'Language',
      subtitle: 'App display & translation language',
      badge: languageNames[language] ?? 'English',
      icon: Globe,
      tint: '#0D9488',
      onPress: () => go('/more/language'),
    },
  ];

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 8, paddingBottom: 4 }}>
      <BrandLockup compact={width < 360} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <PressableScale
          accessibilityLabel="Notifications and reminders"
          onPress={() => router.push('/more/notifications')}
          haptic="selection"
          style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
        >
          <Bell size={22} color={t.text} />
        </PressableScale>
        <PressableScale
          accessibilityLabel="Account menu"
          accessibilityHint="Profile, settings, language and sign out"
          onPress={() => {
            tapFeedback();
            setMenu(true);
          }}
          haptic="selection"
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Avatar name={patient.preferredName || patient.firstName || '?'} size={40} />
        </PressableScale>
      </View>

      {menu ? (
        <Modal
          visible={menu}
          transparent
          statusBarTranslucent
          animationType="none"
          onRequestClose={() => setMenu(false)}
        >
          <Animated.View
            entering={FadeIn.duration(160)}
            exiting={FadeOut.duration(120)}
            style={{
              flex: 1,
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              paddingTop: insets.top + 56,
              paddingHorizontal: 16,
              alignItems: 'flex-end',
            }}
          >
            {/* Sibling backdrop so touches inside the card never bubble to close */}
            <Pressable
              accessibilityLabel="Close menu"
              style={StyleSheet.absoluteFill}
              onPress={() => setMenu(false)}
            />

            <Animated.View
              entering={FadeInDown.springify().damping(springs.gentle.damping).stiffness(springs.gentle.stiffness)}
              style={[
                {
                  width: Math.min(width - 32, 340),
                  backgroundColor: t.surface,
                  borderRadius: 24,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: t.border,
                  gap: 10,
                },
                elevation[3],
              ]}
            >
              {/* Patient Identity Card */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  padding: 12,
                  borderRadius: 18,
                  backgroundColor: t.surfaceMuted,
                  borderWidth: 1,
                  borderColor: t.border,
                }}
              >
                <PressableScale
                  accessibilityRole="button"
                  accessibilityLabel={`View profile for ${patient.firstName} ${patient.lastName}`}
                  onPress={() => go('/more/profile')}
                  scaleTo={0.98}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <Avatar name={patient.preferredName || patient.firstName || '?'} size={48} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt variant="bodyStrong" numberOfLines={1}>
                      {patient.firstName} {patient.lastName}
                    </Txt>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <View
                        style={{
                          backgroundColor: 'rgba(220, 31, 38, 0.12)',
                          paddingHorizontal: 7,
                          paddingVertical: 1.5,
                          borderRadius: radii.pill,
                        }}
                      >
                        <Txt variant="footnote" color="#DC1F26" style={{ fontFamily: fonts.bold, fontSize: 10 }}>
                          Blood {bloodGroupLabel(patient.bloodGroup)}
                        </Txt>
                      </View>
                      {patient.idNumber ? (
                        <Txt variant="footnote" tone="muted" numberOfLines={1} style={{ fontSize: 11 }}>
                          ID ···{patient.idNumber.slice(-4)}
                        </Txt>
                      ) : null}
                    </View>
                  </View>
                </PressableScale>
                <PressableScale
                  accessibilityLabel="Close account menu"
                  onPress={() => setMenu(false)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: t.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={15} color={t.textMuted} />
                </PressableScale>
              </View>

              {/* Quick Navigation Items */}
              <View style={{ gap: 4 }}>
                {items.map((item) => {
                  const IconComp = item.icon;
                  return (
                    <PressableScale
                      key={item.label}
                      accessibilityRole="button"
                      accessibilityLabel={item.label}
                      onPress={item.onPress}
                      scaleTo={0.98}
                      style={{
                        minHeight: 54,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        borderRadius: 16,
                      }}
                    >
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 12,
                          backgroundColor: `${item.tint}16`,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <IconComp size={19} color={item.tint} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Txt variant="callout" style={{ fontFamily: fonts.semibold }}>
                          {item.label}
                        </Txt>
                        <Txt variant="footnote" tone="muted" numberOfLines={1} style={{ fontSize: 11, marginTop: 1 }}>
                          {item.subtitle}
                        </Txt>
                      </View>
                      {item.badge ? (
                        <View
                          style={{
                            backgroundColor: t.surfaceMuted,
                            borderWidth: 1,
                            borderColor: t.border,
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: radii.pill,
                          }}
                        >
                          <Txt variant="footnote" tone="muted" style={{ fontFamily: fonts.semibold, fontSize: 11 }}>
                            {item.badge}
                          </Txt>
                        </View>
                      ) : null}
                      <ChevronRight size={16} color={t.textMuted} />
                    </PressableScale>
                  );
                })}
              </View>

              <View style={{ height: 1, backgroundColor: t.border, marginHorizontal: 6 }} />

              {/* Sign Out Action */}
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Sign out"
                onPress={handleSignOutPress}
                scaleTo={0.98}
                style={{
                  minHeight: 46,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingHorizontal: 14,
                  borderRadius: 14,
                  backgroundColor: 'rgba(220, 31, 38, 0.08)',
                  borderWidth: 1,
                  borderColor: 'rgba(220, 31, 38, 0.2)',
                }}
              >
                <LogOut size={17} color="#DC1F26" />
                <Txt variant="callout" color="#DC1F26" style={{ fontFamily: fonts.semibold }}>
                  Sign out
                </Txt>
              </PressableScale>
            </Animated.View>
          </Animated.View>
        </Modal>
      ) : null}
    </View>
  );
}
