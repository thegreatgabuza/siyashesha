import { Image } from 'expo-image';
import { Text, View } from 'react-native';

/** Passport-and-stopwatch mark with the condensed SIYASHESHA wordmark. */
export function BrandLockup({ markSize = 36 }: { markSize?: number }) {
  return (
    <View className="flex-row items-center gap-2.5">
      <Image
        source={require('../../../assets/images/splash-icon.png')}
        style={{ width: markSize, height: markSize }}
        contentFit="contain"
        accessibilityLabel="Siyashesha logo"
      />
      <View>
        <Text className="font-display text-[24px] leading-[26px] text-emergency-500">SIYASHESHA</Text>
        <Text
          className="font-sans-semibold text-[9px] uppercase text-ink"
          style={{ letterSpacing: 2.7 }}
        >
          Health Passport
        </Text>
      </View>
    </View>
  );
}
