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
  badge,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  selected: boolean;
  onPress: () => void;
  badge?: string;
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
      className={`min-h-[76px] flex-row items-center gap-3.5 rounded-3xl border-2 p-4 ${
        selected
          ? 'border-ink bg-brand-50/70 dark:border-brand-300 dark:bg-brand-500/15'
          : 'border-slate-200/90 bg-white dark:border-slate-800 dark:bg-canvasdark-card'
      }`}
      style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.985 : 1 }] })}
    >
      <View
        className={`h-12 w-12 items-center justify-center rounded-2xl ${
          selected ? 'bg-ink dark:bg-brand-400' : 'bg-brand-100/80 dark:bg-brand-500/20'
        }`}
      >
        {icon}
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">{title}</Text>
          {badge ? (
            <View className="rounded-full bg-brand-100 px-2 py-0.5 dark:bg-brand-500/25">
              <Text className="font-sans-bold text-[10px] uppercase text-brand-700 dark:text-brand-300">{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text className="mt-0.5 font-sans text-[13px] leading-[18px] text-ink-muted dark:text-slate-400">
          {subtitle}
        </Text>
      </View>
      <View
        className={`h-6 w-6 items-center justify-center rounded-full ${
          selected ? 'bg-success-500' : 'border-2 border-slate-300 dark:border-slate-600'
        }`}
      >
        {selected ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}
