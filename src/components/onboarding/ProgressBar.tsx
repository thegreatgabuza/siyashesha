import { Award } from 'lucide-react-native';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

/** Passport completion bar with optional step indicator and stamp counter. */
export function ProgressBar({
  percent,
  step,
  totalSteps = 8,
  stepLabel,
}: {
  percent: number;
  step?: number;
  totalSteps?: number;
  stepLabel?: string;
}) {
  const reduced = useReducedMotion();
  const displayPercent = step && totalSteps ? Math.max(percent, Math.round((step / totalSteps) * 100)) : percent;
  const width = useSharedValue(displayPercent);

  useEffect(() => {
    width.value = reduced ? displayPercent : withTiming(displayPercent, { duration: 500 });
  }, [displayPercent, reduced, width]);

  const fill = useAnimatedStyle(() => ({ width: `${width.value}%` }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: displayPercent }}
      accessibilityLabel={`Passport setup ${displayPercent} percent complete`}
      className="flex-1"
    >
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="font-sans-bold text-[11px] uppercase tracking-[0.8px] text-brand-600 dark:text-brand-300">
          {step ? `Step ${step} of ${totalSteps}${stepLabel ? ` · ${stepLabel}` : ''}` : 'Passport Readiness'}
        </Text>
        <View className="flex-row items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 dark:bg-success-500/15">
          <Award size={11} color="#16A34A" />
          <Text className="font-sans-bold text-[10px] text-success-600 dark:text-emerald-400">
            {percent}% Stamped
          </Text>
        </View>
      </View>
      <View className="h-2.5 overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-800">
        <Animated.View style={fill} className="h-2.5 rounded-full bg-brand-600 dark:bg-brand-400" />
      </View>
    </View>
  );
}
