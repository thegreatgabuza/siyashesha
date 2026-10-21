import { Plus } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { tapFeedback } from '@/lib/feedback';

/** Tappable chips with an "Add your own" option. Multi-select by default. */
export function ChipSelector({
  options,
  selected,
  onChange,
  addLabel = 'Add your own',
  placeholder = 'Type it here',
  singleSelect = false,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  addLabel?: string;
  placeholder?: string;
  singleSelect?: boolean;
}) {
  const [adding, setAdding] = useState(false);
  const [custom, setCustom] = useState('');

  const toggle = (value: string) => {
    tapFeedback();
    if (singleSelect) {
      onChange(selected.includes(value) ? [] : [value]);
      return;
    }
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  };

  const commitCustom = () => {
    const value = custom.trim();
    if (value && !selected.includes(value)) {
      tapFeedback();
      onChange(singleSelect ? [value] : [...selected, value]);
    }
    setCustom('');
    setAdding(false);
  };

  // Custom entries sit alongside the presets so they can be toggled off like any other chip.
  const allOptions = [...options, ...selected.filter((s) => !options.includes(s))];

  return (
    <View className="flex-row flex-wrap gap-2.5">
      {allOptions.map((option) => {
        const on = selected.includes(option);
        return (
          <Pressable
            key={option}
            accessibilityRole={singleSelect ? 'radio' : 'checkbox'}
            accessibilityState={{ selected: on, checked: on }}
            accessibilityLabel={option}
            onPress={() => toggle(option)}
            className={`min-h-[44px] justify-center rounded-full border-2 px-4 py-2.5 ${
              on
                ? 'border-ink bg-ink dark:border-brand-300 dark:bg-brand-400'
                : 'border-slate-200 bg-white dark:border-canvasdark-card dark:bg-canvasdark-card'
            }`}
            style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.94 : 1 }] })}
          >
            <Text className={`font-sans-semibold text-[15px] ${on ? 'text-white' : 'text-ink dark:text-slate-50'}`}>
              {option}
            </Text>
          </Pressable>
        );
      })}

      {adding ? (
        <View className="w-full flex-row items-center gap-2">
          <TextInput
            value={custom}
            onChangeText={setCustom}
            onSubmitEditing={commitCustom}
            placeholder={placeholder}
            placeholderTextColor="#8C98B8"
            autoFocus
            returnKeyType="done"
            className="min-h-[44px] flex-1 rounded-full border-2 border-ink bg-white px-4 font-sans-semibold text-[15px] text-ink dark:border-brand-300 dark:bg-canvasdark-card dark:text-slate-50"
            accessibilityLabel={placeholder}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add this item"
            onPress={commitCustom}
            className="min-h-[44px] justify-center rounded-full bg-success-500 px-5"
          >
            <Text className="font-sans-bold text-[15px] text-white">Add</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={addLabel}
          onPress={() => setAdding(true)}
          className="min-h-[44px] flex-row items-center gap-1.5 rounded-full border-2 border-dashed border-slate-300 px-4 py-2.5 dark:border-slate-600"
        >
          <Plus size={16} color="#5B6478" />
          <Text className="font-sans-semibold text-[15px] text-ink-muted dark:text-slate-400">{addLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}
