import { ChevronLeft } from 'lucide-react-native';
import { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ProgressBar } from './ProgressBar';
import { safeBack } from '@/lib/navigation';
import { completionPercent } from '@/lib/passport';
import { useAppStore } from '@/store/useAppStore';

/**
 * Shared frame for every onboarding step: passport progress at the top, a back button,
 * keyboard-aware scrollable content, and primary actions pinned cleanly at the bottom.
 */
export function OnboardingShell({
  children,
  footer,
  showBack = true,
  onBack,
  step,
  totalSteps = 8,
  stepLabel,
  hideProgress = false,
}: {
  children: ReactNode;
  footer: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  step?: number;
  totalSteps?: number;
  stepLabel?: string;
  hideProgress?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const stamps = useAppStore((s) => s.stamps);
  const percent = completionPercent(stamps);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 bg-slate-50 dark:bg-canvasdark" style={{ paddingTop: insets.top + 8 }}>
        {!hideProgress || showBack ? (
          <View className="flex-row items-center gap-3 px-5 pb-3">
            {showBack ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Go back"
                onPress={onBack ?? (() => safeBack('/(onboarding)'))}
                className="h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-canvasdark-card"
              >
                <ChevronLeft size={20} color="#0B2559" />
              </Pressable>
            ) : (
              <View className="h-10 w-10" />
            )}
            {!hideProgress ? (
              <ProgressBar percent={percent} step={step} totalSteps={totalSteps} stepLabel={stepLabel} />
            ) : (
              <View className="flex-1" />
            )}
          </View>
        ) : null}

        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 28, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>

        <View
          className="gap-2.5 border-t border-slate-200/70 bg-slate-50/95 px-5 pt-3 dark:border-slate-800 dark:bg-canvasdark"
          style={{ paddingBottom: Math.max(insets.bottom, 12) + 8 }}
        >
          {footer}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
