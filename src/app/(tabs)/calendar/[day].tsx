import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { BookHeart } from 'lucide-react-native';
import { Text, View } from 'react-native';

import { healthDayIcons } from '@/lib/healthDayIcons';
import { heroShadow } from '@/components/ui/HeroAction';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { healthDays } from '@/data/healthDays';
import { passportTargetRoutes } from '@/lib/routes';
import { useAccent } from '@/hooks/useAccent';

export default function HealthDayDetailScreen() {
  const { accent } = useAccent();
  const { day } = useLocalSearchParams<{ day: string }>();
  const card = healthDays.find((d) => d.id === day);

  if (!card) {
    return (
      <Screen>
        <ScreenHeader title="Health Awareness Day" onBack={() => router.back()} />
        <Text className="px-5 font-sans text-ink-muted dark:text-slate-400">This health day could not be found.</Text>
      </Screen>
    );
  }

  return (
    <Screen bottomInset={120}>
      <ScreenHeader title="Health Awareness Day" onBack={() => router.back()} />
      <View className="px-5">
        <View className="rounded-[32px] bg-ink p-5 dark:bg-canvasdark-card" style={heroShadow}>
          <View className="flex-row items-center justify-between">
            <View className="rounded-full bg-white/15 px-3 py-1">
              <Text className="font-sans-semibold text-[11px] text-white">WHO awareness day</Text>
            </View>
            <Text className="font-sans-semibold text-[12px] text-white/70">{card.dateLabel}</Text>
          </View>
          <View className="flex-row items-center gap-4 pt-5">
            <View className="h-20 w-20 items-center justify-center rounded-3xl bg-white">
              <Image source={healthDayIcons[card.icon]} style={{ width: 56, height: 56 }} contentFit="contain" />
            </View>
            <Text className="flex-1 font-sans-bold text-[22px] leading-[28px] text-white">{card.title}</Text>
          </View>
        </View>
      </View>

      <View className="gap-6 px-5 pt-6">
        {card.sections.map((section) => (
          <View key={section.heading}>
            <SectionHeader title={section.heading} />
            <View className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
              <Text className="font-sans text-[14px] leading-[21px] text-ink-soft dark:text-slate-300">{section.body}</Text>
            </View>
          </View>
        ))}

        <View>
          <SectionHeader title="Your Health Passport" />
          <View className="rounded-3xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/30 dark:bg-brand-500/10">
            <View className="mb-2 flex-row items-center gap-2">
              <BookHeart size={18} color={accent} />
              <Text className="font-sans-bold text-[14px] text-ink dark:text-slate-50">Where this fits in your passport</Text>
            </View>
            <Text className="mb-4 font-sans text-[14px] leading-[21px] text-ink-soft dark:text-slate-300">
              {card.passport.text}
            </Text>
            <PrimaryButton
              label="Open in my Health Passport"
              onPress={() => router.push(passportTargetRoutes[card.passport.target] as any)}
            />
          </View>
        </View>

        <Text className="px-1 pb-4 text-center font-sans text-[11px] leading-[16px] text-ink-muted dark:text-slate-500">
          Source: World Health Organization (who.int and regional WHO sites).
          {'\n'}This page is for patient education and does not replace advice from a healthcare professional.
        </Text>
      </View>
    </Screen>
  );
}
