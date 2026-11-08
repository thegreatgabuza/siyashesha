import { Platform, useWindowDimensions } from 'react-native';

export const WEB_DESKTOP_MIN_WIDTH = 768;

/** True on web at tablet/desktop widths, where the app uses a sidebar shell instead of the tab bar. */
export function useIsWebDesktop(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= WEB_DESKTOP_MIN_WIDTH;
}
