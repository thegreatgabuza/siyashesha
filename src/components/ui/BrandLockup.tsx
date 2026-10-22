import { Image } from 'expo-image';
import { Text, View } from 'react-native';

/** Passport-and-stopwatch mark with the condensed SIYASHESHA wordmark. */
export function BrandLockup({ markSize = 36, compact = false }: { markSize?: number; compact?: boolean }) {
  const size = compact ? 30 : markSize;
  return (
    <View className="flex-row items-center gap-2.5">
      <Image
        source={require('../../../assets/images/splash-icon.png')}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityLabel="Siyashesha logo"
      />
      <View>
        <Text className={`font-display text-emergency-500 ${compact ? 'text-[20px] leading-[22px]' : 'text-[24px] leading-[26px]'}`}>SIYASHESHA</Text>
        <Text
          className="font-sans-semibold text-[9px] uppercase text-ink"
          style={{ letterSpacing: compact ? 1.6 : 2.7 }}
        >
          Health Passport
        </Text>
      </View>
    </View>
  );
}
