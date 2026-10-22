import { ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';

import { useTabBarInset } from '@/hooks/useTabBarInset';

/** The scrolling body of a sub-screen. Its content always clears the floating tab bar. */
export function ScreenScroll({ contentContainerStyle, extraBottom = 0, ...rest }: ScrollViewProps & { extraBottom?: number }) {
  const bottom = useTabBarInset(extraBottom);
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      {...rest}
      contentContainerStyle={[StyleSheet.flatten(contentContainerStyle), { paddingBottom: bottom }]}
    />
  );
}
