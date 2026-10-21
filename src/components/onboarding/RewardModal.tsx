import { Modal, Text, View } from 'react-native';

import { stampDefs } from '@/lib/passport';
import type { StampId } from '@/store/useAppStore';
import { ChunkyButton } from './ChunkyButton';
import { Confetti } from './Confetti';
import { StampBadge } from './StampBadge';

/**
 * Reward moment shown when a milestone stamp is earned.
 * Calm and encouraging: it celebrates what was added, never what is missing.
 */
export function RewardModal({ stampId, onDone }: { stampId: StampId | null; onDone: () => void }) {
  const def = stampDefs.find((d) => d.id === stampId);

  return (
    <Modal visible={!!def} transparent animationType="fade" onRequestClose={onDone}>
      <View className="flex-1 items-center justify-center bg-ink/60 px-6">
        <Confetti active={!!def} />
        {def ? (
          <View className="w-full rounded-[32px] bg-white p-6 dark:bg-canvasdark-card" accessibilityViewIsModal>
            <Text className="text-center font-sans-semibold text-[13px] uppercase tracking-[1.5px] text-success-600">
              Stamp earned
            </Text>
            <View className="my-5 items-center">
              <StampBadge earned label={def.label} size={120} />
            </View>
            <Text className="text-center font-sans-bold text-[22px] text-ink dark:text-slate-50">{def.label}</Text>
            <Text className="mt-2 text-center font-sans text-[14px] leading-[20px] text-ink-muted dark:text-slate-400">
              {def.hint}. Your passport is one step further along.
            </Text>
            <View className="mt-6">
              <ChunkyButton variant="success" label="Keep going" onPress={onDone} />
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
