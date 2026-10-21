import { Pressable, Text } from 'react-native';

/** Outlined pill button used inside the navy hero cards. */
export function HeroAction({
  label,
  icon,
  onPress,
  filled,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  filled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`min-h-[44px] flex-1 flex-row items-center justify-center gap-1.5 rounded-full px-3 py-3 ${
        filled ? 'bg-emergency-500' : 'border border-white/30 bg-white/5'
      }`}
    >
      {icon}
      <Text className="font-sans-semibold text-[13px] text-white">{label}</Text>
    </Pressable>
  );
}

export const heroShadow = {
  shadowColor: '#0B2559',
  shadowOpacity: 0.25,
  shadowRadius: 24,
  shadowOffset: { width: 0, height: 12 },
  elevation: 8,
};
