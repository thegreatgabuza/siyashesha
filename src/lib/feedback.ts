import * as Haptics from 'expo-haptics';

/** Light tap feedback for selections. */
export function tapFeedback() {
  Haptics.selectionAsync().catch(() => {});
}

/** A soft physical bump for presses on primary surfaces and card flips. */
export function impactFeedback(style: 'light' | 'medium' = 'light') {
  Haptics.impactAsync(style === 'light' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** Stronger feedback for milestones such as a dose taken or a step completed. */
export function milestoneFeedback() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
