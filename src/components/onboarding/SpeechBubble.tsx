import { Text, View } from 'react-native';

/** Mascot speech bubble. A small tail points up toward the mascot. */
export function SpeechBubble({ children }: { children: string }) {
  return (
    <View className="items-center">
      <View className="h-3 w-6 items-center overflow-hidden">
        <View className="h-4 w-4 rotate-45 bg-white dark:bg-canvasdark-card" style={{ marginTop: 6 }} />
      </View>
      <View className="rounded-3xl bg-white px-5 py-4 dark:bg-canvasdark-card">
        <Text className="text-center font-sans-semibold text-[17px] leading-[24px] text-ink dark:text-slate-50">
          {children}
        </Text>
      </View>
    </View>
  );
}
