import { useState } from 'react';
import { RefreshControl, ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function Screen({
  children,
  scroll = true,
  onRefresh,
  contentClassName,
  bottomInset = 120,
  ...rest
}: {
  children: React.ReactNode;
  scroll?: boolean;
  onRefresh?: () => Promise<void> | void;
  contentClassName?: string;
  bottomInset?: number;
} & ScrollViewProps) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = onRefresh
    ? async () => {
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
      }
    : undefined;

  if (!scroll) {
    return (
      <View className="flex-1 bg-slate-50 dark:bg-canvasdark" style={{ paddingTop: insets.top }}>
        {children}
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50 dark:bg-canvasdark" style={{ paddingTop: insets.top }}>
      <ScrollView
        className={contentClassName}
        contentContainerStyle={{ paddingBottom: bottomInset }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          handleRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6D5BD0" />
          ) : undefined
        }
        {...rest}
      >
        {children}
      </ScrollView>
    </View>
  );
}
