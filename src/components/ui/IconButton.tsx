import * as Haptics from 'expo-haptics';
import { Pressable } from 'react-native';

export function IconButton({
  children,
  onPress,
  accessibilityLabel,
  variant = 'default',
}: {
  children: React.ReactNode;
  onPress: () => void;
  accessibilityLabel: string;
  variant?: 'default' | 'ghost' | 'danger';
}) {
  const bg =
    variant === 'danger'
      ? 'bg-emergency-50 dark:bg-emergency-500/15'
      : variant === 'ghost'
        ? 'bg-transparent'
        : 'bg-slate-100 dark:bg-canvasdark-card';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      className={`h-11 w-11 items-center justify-center rounded-full ${bg}`}
    >
      {children}
    </Pressable>
  );
}
