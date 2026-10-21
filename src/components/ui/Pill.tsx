import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

export function Pill({
  label,
  selected,
  onPress,
  tone = 'default',
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: 'default' | 'emergency';
}) {
  const bg = selected
    ? tone === 'emergency'
      ? 'bg-emergency-500'
      : 'bg-ink dark:bg-brand-400'
    : 'bg-slate-100 dark:bg-canvasdark-card';
  const textClass = selected
    ? 'font-sans-semibold text-[13px] text-white'
    : 'font-sans-medium text-[13px] text-ink-soft dark:text-slate-100';

  const content = <Text className={textClass}>{label}</Text>;

  if (!onPress) {
    return <View className={`rounded-full px-4 py-2 ${bg}`}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      className={`min-h-[44px] flex-row items-center justify-center rounded-full px-4 py-2 ${bg}`}
    >
      {content}
    </Pressable>
  );
}
