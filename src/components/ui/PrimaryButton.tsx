import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type Tone = 'ink' | 'emergency' | 'success' | 'white';

const toneClasses: Record<Tone, { bg: string; text: string }> = {
  ink: { bg: 'bg-ink dark:bg-brand-400', text: 'text-white' },
  emergency: { bg: 'bg-emergency-500', text: 'text-white' },
  success: { bg: 'bg-success-500', text: 'text-white' },
  white: { bg: 'bg-white', text: 'text-ink' },
};

export function PrimaryButton({
  label,
  onPress,
  tone = 'ink',
  icon,
  disabled,
  loading,
  fullWidth = true,
}: {
  label: string;
  onPress: () => void;
  tone?: Tone;
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}) {
  const { bg, text } = toneClasses[tone];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled || loading}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      className={`min-h-[52px] flex-row items-center justify-center gap-2 rounded-full px-6 py-3.5 ${bg} ${
        fullWidth ? 'w-full' : ''
      } ${disabled ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={tone === 'white' ? '#0B2559' : '#FFFFFF'} />
      ) : (
        <>
          {icon ? <View>{icon}</View> : null}
          <Text className={`font-sans-semibold text-[16px] ${text}`}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}
