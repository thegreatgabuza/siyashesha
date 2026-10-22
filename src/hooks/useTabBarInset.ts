import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Height of the floating tab bar itself, without the safe area. */
export const TAB_BAR_HEIGHT = 64;
/** Gap between the bar and the bottom safe area edge. */
export const TAB_BAR_GAP = 10;

/**
 * Bottom padding for any scrolling content under the floating tab bar, so the last item clears
 * the bar on every device. Pass `extra` for a floating button above the bar.
 */
export function useTabBarInset(extra = 0): number {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, 8) + TAB_BAR_GAP + TAB_BAR_HEIGHT + 24 + extra;
}

/** Bottom offset for a floating button or toast that sits just above the tab bar. */
export function useAboveTabBar(gap = 14): number {
  const insets = useSafeAreaInsets();
  return Math.max(insets.bottom, 8) + TAB_BAR_GAP + TAB_BAR_HEIGHT + gap;
}
