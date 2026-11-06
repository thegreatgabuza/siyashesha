import { useEffect, useState } from 'react';
import { Keyboard, Platform, ScrollView, StyleSheet, type ScrollViewProps } from 'react-native';

import { useTabBarInset } from '@/hooks/useTabBarInset';

/**
 * The scrolling body of a sub-screen. Its content always clears the floating tab bar
 * and automatically expands bottom scroll padding when the soft keyboard is open on Android.
 */
export function ScreenScroll({
  contentContainerStyle,
  extraBottom = 0,
  keyboardShouldPersistTaps = 'handled',
  ...rest
}: ScrollViewProps & { extraBottom?: number }) {
  const bottom = useTabBarInset(extraBottom);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const effectiveBottom = keyboardHeight > 0 ? Math.max(bottom, keyboardHeight + 32) : bottom;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      {...rest}
      contentContainerStyle={[StyleSheet.flatten(contentContainerStyle), { paddingBottom: effectiveBottom }]}
    />
  );
}
