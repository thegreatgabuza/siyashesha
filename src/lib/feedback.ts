import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const native = Platform.OS !== 'web';

/** Light tap feedback for selections. */
export function tapFeedback() {
  if (native) Haptics.selectionAsync().catch(() => {});
}

/** A soft physical bump for presses on primary surfaces and card flips. */
export function impactFeedback(style: 'light' | 'medium' = 'light') {
  if (!native) return;
  Haptics.impactAsync(style === 'light' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** Stronger feedback for milestones such as a dose taken or a step completed. */
export function milestoneFeedback() {
  if (native) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
