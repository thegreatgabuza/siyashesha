import { Text, View } from 'react-native';

export function Avatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="items-center justify-center bg-brand-500"
    >
      <Text className="font-sans-bold text-white" style={{ fontSize: size * 0.36 }}>
        {initials}
      </Text>
    </View>
  );
}
