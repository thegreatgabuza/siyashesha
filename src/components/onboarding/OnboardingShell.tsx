import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProgressBar } from './ProgressBar';
import { completionPercent } from '@/lib/passport';
import { useAppStore } from '@/store/useAppStore';

/**
 * Shared frame for every onboarding step: passport progress at the top, a back button,
 * scrollable content, and primary actions pinned to the bottom third.
 */
export function OnboardingShell({
  children,
  footer,
  showBack = true,
  onBack,
}: {
  children: ReactNode;
  footer: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const stamps = useAppStore((s) => s.stamps);
  const percent = completionPercent(stamps);

  return (
    <View className="flex-1 bg-slate-50 dark:bg-canvasdark" style={{ paddingTop: insets.top + 8 }}>
      <View className="flex-row items-center gap-3 px-5 pb-3">
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={onBack ?? (() => router.back())}
            className="h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-canvasdark-card"
          >
            <ChevronLeft size={22} color="#0B2559" />
          </Pressable>
        ) : (
          <View className="h-11 w-11" />
        )}
        <ProgressBar percent={percent} />
        <View className="h-11 w-11" />
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 24, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>

      <View className="gap-3 px-5 pt-3" style={{ paddingBottom: insets.bottom + 16 }}>
        {footer}
      </View>
    </View>
  );
}
