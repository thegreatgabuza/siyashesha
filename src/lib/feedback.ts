import * as Haptics from 'expo-haptics';

/** Light tap feedback for selections. */
export function tapFeedback() {
  Haptics.selectionAsync().catch(() => {});
}

/** Stronger feedback for milestones such as earning a stamp. */
export function milestoneFeedback() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
