import { Pressable, Text, View } from 'react-native';

import { tapFeedback } from '@/lib/feedback';

/**
 * Chunky button with a solid base that sinks on press, like a physical key.
 * Primary is the navy brand colour; success marks a completed milestone; ghost is for secondary actions.
 */
export function ChunkyButton({
  label,
  onPress,
  variant = 'primary',
  disabled,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'success' | 'ghost';
  disabled?: boolean;
  accessibilityHint?: string;
}) {
  const face =
    variant === 'primary'
      ? 'bg-ink dark:bg-brand-400'
      : variant === 'success'
        ? 'bg-success-500'
        : 'bg-white dark:bg-canvasdark-card border-2 border-slate-200 dark:border-canvasdark-card';
  const base = variant === 'ghost' ? 'bg-slate-200 dark:bg-canvasdark' : variant === 'success' ? 'bg-success-600' : 'bg-brand-700 dark:bg-brand-600';
  const text = variant === 'ghost' ? 'text-ink dark:text-slate-50' : 'text-white';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      style={({ pressed }) => ({ opacity: disabled ? 0.4 : 1, transform: [{ translateY: pressed && !disabled ? 3 : 0 }] })}
    >
      <View className={`rounded-2xl ${base} pb-1.5`}>
        <View className={`min-h-[56px] items-center justify-center rounded-2xl px-6 py-4 ${face}`}>
          <Text className={`font-sans-bold text-[17px] ${text}`}>{label}</Text>
        </View>
      </View>
    </Pressable>
  );
}
