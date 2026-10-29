import { Text, View } from 'react-native';

/** Mascot speech bubble. A small tail points up toward the mascot. */
export function SpeechBubble({ children, subtitle }: { children: string; subtitle?: string }) {
  return (
    <View className="w-full items-center">
      <View className="h-2.5 w-6 items-center overflow-hidden">
        <View
          className="h-4 w-4 rotate-45 border-l border-t border-slate-200/80 bg-white dark:border-slate-700 dark:bg-canvasdark-card"
          style={{ marginTop: 5 }}
        />
      </View>
      <View className="w-full rounded-3xl border border-slate-200/80 bg-white px-5 py-4 shadow-sm dark:border-slate-700 dark:bg-canvasdark-card">
        <Text className="text-center font-sans-bold text-[17px] leading-[24px] text-ink dark:text-slate-50">
          {children}
        </Text>
        {subtitle ? (
          <Text className="mt-1 text-center font-sans text-[13px] leading-[19px] text-ink-muted dark:text-slate-400">
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
