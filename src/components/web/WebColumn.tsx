import { Platform, View, type ViewStyle } from 'react-native';

/** Centers content in a readable column on web; passes straight through on native. */
export function WebColumn({
  children,
  maxWidth = 560,
  style,
}: {
  children: React.ReactNode;
  maxWidth?: number;
  style?: ViewStyle;
}) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return <View style={[{ flex: 1, width: '100%', maxWidth, alignSelf: 'center' }, style]}>{children}</View>;
}
