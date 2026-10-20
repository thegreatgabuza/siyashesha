import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { Gradients } from '@/constants/theme';
import { useEffectiveColorScheme } from '@/hooks/useColorSchemePreference';

type Variant = 'hero' | 'card' | 'emergency' | 'success';

export function GradientBackground({
  variant = 'hero',
  children,
  style,
  ...rest
}: ViewProps & { variant?: Variant }) {
  const scheme = useEffectiveColorScheme();
  const colors =
    variant === 'emergency'
      ? Gradients.emergency
      : variant === 'success'
        ? Gradients.success
        : variant === 'card'
          ? scheme === 'dark'
            ? Gradients.cardDark
            : Gradients.cardLight
          : scheme === 'dark'
            ? Gradients.heroDark
            : Gradients.heroLight;

  return (
    <View style={[StyleSheet.absoluteFill, style]} {...rest}>
      <LinearGradient
        colors={colors as unknown as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}
