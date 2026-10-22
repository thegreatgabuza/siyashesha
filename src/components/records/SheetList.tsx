import { Check } from 'lucide-react-native';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Warm } from '@/constants/warm';

export interface SheetOption {
  key: string;
  label: string;
}

/** Bottom sheet with a list of options and a tick on the selected one. Used for sorting and extra categories. */
export function SheetList({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: SheetOption[];
  selected: string | null;
  onSelect: (key: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end" style={{ backgroundColor: 'rgba(31,35,40,0.35)' }} onPress={onClose} accessibilityLabel="Close">
        <Pressable
          onPress={() => {}}
          accessibilityViewIsModal
          className="max-h-[70%] px-5 pt-5"
          style={{ backgroundColor: Warm.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: insets.bottom + 16 }}
        >
          <View className="mb-3 h-1.5 w-12 self-center rounded-full" style={{ backgroundColor: Warm.border }} />
          <Text className="mb-3 font-sans-bold" style={{ color: Warm.text, fontSize: 18 }}>{title}</Text>
          <ScrollView>
            {options.map((option) => {
              const active = option.key === selected;
              return (
                <Pressable
                  key={option.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={option.label}
                  onPress={() => onSelect(option.key)}
                  className="min-h-[52px] flex-row items-center justify-between px-2"
                >
                  <Text className="font-sans-medium" style={{ color: active ? Warm.accent : Warm.text, fontSize: 15 }}>
                    {option.label}
                  </Text>
                  {active ? <Check size={18} color={Warm.accent} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
