import { Text, View } from 'react-native';

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <View className="items-center justify-center gap-3 px-8 py-16">
      {icon}
      <Text className="text-center font-sans-semibold text-[16px] text-ink dark:text-slate-50">
        {title}
      </Text>
      {subtitle ? (
        <Text className="text-center font-sans text-[14px] text-ink-muted dark:text-slate-400">
          {subtitle}
        </Text>
      ) : null}
      {action}
    </View>
  );
}
