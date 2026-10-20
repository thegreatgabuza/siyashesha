import { Pressable, Text, View } from 'react-native';

export function SectionHeader({
  title,
  action,
  onActionPress,
}: {
  title: string;
  action?: string;
  onActionPress?: () => void;
}) {
  return (
    <View className="mb-3 flex-row items-center justify-between">
      <Text className="font-sans-bold text-[18px] text-ink dark:text-slate-50">{title}</Text>
      {action ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action}
          onPress={onActionPress}
          className="min-h-[36px] justify-center"
        >
          <Text className="font-sans-semibold text-[13px] text-brand-500">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
