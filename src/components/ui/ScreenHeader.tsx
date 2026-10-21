import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from './IconButton';

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-row items-center gap-3 px-4 pb-3"
      style={{ paddingTop: insets.top + 8 }}
    >
      <IconButton
        accessibilityLabel="Go back"
        onPress={onBack ?? (() => router.back())}
      >
        <ChevronLeft size={22} color="#0B2559" />
      </IconButton>
      <View className="flex-1">
        <Text className="font-sans-bold text-[18px] text-ink dark:text-slate-50" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}
