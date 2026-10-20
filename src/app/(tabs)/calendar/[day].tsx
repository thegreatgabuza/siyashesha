import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { BookHeart } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { healthDayIcons } from '@/lib/healthDayIcons';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { healthDays } from '@/data/healthDays';
import { passportTargetRoutes } from '@/lib/routes';

export default function HealthDayDetailScreen() {
  const { day } = useLocalSearchParams<{ day: string }>();
  const card = healthDays.find((d) => d.id === day);

  if (!card) {
    return (
      <Screen>
        <ScreenHeader title="Health Awareness Day" />
        <Text className="px-5 font-sans text-ink-muted">This health day could not be found.</Text>
      </Screen>
    );
  }

  return (
    <Screen bottomInset={60}>
      <View className="overflow-hidden rounded-b-[32px]">
        <GradientBackground variant="hero">
          <ScreenHeader title="" onBack={() => router.back()} />
          <View className="items-center gap-3 px-6 pb-8 pt-2">
            <View className="h-24 w-24 items-center justify-center rounded-3xl bg-white/60">
              <Image source={healthDayIcons[card.icon]} style={{ width: 68, height: 68 }} contentFit="contain" />
            </View>
            <Text className="font-sans-semibold text-[13px] text-ink-muted">{card.dateLabel}</Text>
            <Text className="text-center font-serif text-[26px] leading-[30px] text-ink">{card.title}</Text>
          </View>
        </GradientBackground>
      </View>

      <View className="gap-5 px-5 pt-6">
        {card.sections.map((section) => (
          <View key={section.heading}>
            <Text className="mb-1.5 font-sans-bold text-[15px] text-ink dark:text-slate-50">
              {section.heading}
            </Text>
            <Text className="font-sans text-[14px] leading-[21px] text-ink-soft dark:text-slate-300">
              {section.body}
            </Text>
          </View>
        ))}

        <View className="rounded-3xl border border-lavender-200 bg-lavender-50 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
          <View className="mb-2 flex-row items-center gap-2">
            <BookHeart size={18} color="#6D5BD0" />
            <Text className="font-sans-bold text-[14px] text-ink dark:text-slate-50">
              Your Health Passport
            </Text>
          </View>
          <Text className="mb-4 font-sans text-[14px] leading-[21px] text-ink-soft dark:text-slate-300">
            {card.passport.text}
          </Text>
          <PrimaryButton
            label="Open in my Health Passport"
            onPress={() => router.push(passportTargetRoutes[card.passport.target] as any)}
          />
        </View>

        <Text className="px-1 pb-4 text-center font-sans text-[11px] text-ink-muted dark:text-slate-500">
          Source: World Health Organization (who.int and regional WHO sites), as cited by the client.
          {'\n'}This page is for patient education and does not replace advice from a healthcare
          professional.
        </Text>
      </View>
    </Screen>
  );
}
