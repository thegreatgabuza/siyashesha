import { Check } from 'lucide-react-native';
import { Pressable, Text, View } from 'react-native';

import { tapFeedback } from '@/lib/feedback';

/** Large tappable card with an icon, used for single-choice questions. */
export function OptionCard({
  title,
  subtitle,
  icon,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${title}. ${subtitle}`}
      onPress={() => {
        tapFeedback();
        onPress();
      }}
      className={`min-h-[76px] flex-row items-center gap-4 rounded-3xl border-2 bg-white p-4 dark:bg-canvasdark-card ${
        selected ? 'border-ink dark:border-brand-300' : 'border-transparent'
      }`}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}
    >
      <View className={`h-12 w-12 items-center justify-center rounded-2xl ${selected ? 'bg-ink dark:bg-brand-400' : 'bg-brand-100 dark:bg-brand-500/20'}`}>
        {icon}
      </View>
      <View className="flex-1">
        <Text className="font-sans-bold text-[16px] text-ink dark:text-slate-50">{title}</Text>
        <Text className="mt-0.5 font-sans text-[13px] leading-[18px] text-ink-muted dark:text-slate-400">{subtitle}</Text>
      </View>
      <View className={`h-7 w-7 items-center justify-center rounded-full ${selected ? 'bg-success-500' : 'border-2 border-slate-300 dark:border-slate-600'}`}>
        {selected ? <Check size={16} color="#FFFFFF" /> : null}
      </View>
    </Pressable>
  );
}
