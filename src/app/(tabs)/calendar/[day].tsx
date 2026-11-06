import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { safeBack } from '@/lib/navigation';
import { BookHeart } from 'lucide-react-native';
import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';

import { ClinicalCitationsModal } from '@/components/security/ClinicalCitationsModal';
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
  const [citationsOpen, setCitationsOpen] = useState(false);
  const card = healthDays.find((d) => d.id === day);

  if (!card) {
    return (
      <Screen headerOwnsTopInset contentClassName="pb-10">
        <ScreenHeader title="Health Awareness Day" onBack={() => safeBack('/(tabs)/calendar')} />
        <Text className="px-5 font-sans text-ink-muted dark:text-slate-400">This health day could not be found.</Text>
      </Screen>
    );
  }

  return (
    <Screen headerOwnsTopInset contentClassName="pb-10">
      <ScreenHeader title="Health Awareness Day" onBack={() => safeBack('/(tabs)/calendar')} />
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

        <View className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
          <Text className="font-sans-bold text-[12px] text-ink dark:text-slate-100">
            Clinical Reference & Medical Disclaimer (Guideline 1.4.1)
          </Text>
          <Text className="mt-1 font-sans text-[12px] leading-[17px] text-ink-muted dark:text-slate-400">
            Source: World Health Organization (WHO) & South African National Department of Health (NDoH). This page is for patient education and does not replace advice from a qualified physician or healthcare professional.
          </Text>
          <View className="mt-2 flex-row flex-wrap items-center gap-x-4 gap-y-1">
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Open World Health Organization official health campaigns website"
              onPress={() => Linking.openURL('https://www.who.int/campaigns').catch(() => {})}
              className="py-1"
            >
              <Text className="font-sans-semibold text-[12px] underline text-brand-500 dark:text-brand-300">
                Official WHO Campaigns (who.int) →
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View all clinical guidelines and citations"
              onPress={() => setCitationsOpen(true)}
              className="py-1"
            >
              <Text className="font-sans-semibold text-[12px] underline text-brand-500 dark:text-brand-300">
                SA NDoH & SAHPRA Sources →
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <ClinicalCitationsModal visible={citationsOpen} onClose={() => setCitationsOpen(false)} />
    </Screen>
  );
}
