import { Image } from 'expo-image';
import { router } from 'expo-router';
import {
  Check,
  ChevronLeft,
  ExternalLink,
  Globe,
  Info,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import {
  filterMedicalAidProviders,
  type MedicalAidProvider,
} from '@/data/medicalAidDirectory';
import { tapFeedback } from '@/lib/feedback';
import { useAppStore } from '@/store/useAppStore';

const CATEGORY_TABS = [
  { key: 'all', label: 'All Schemes (16)' },
  { key: 'medical_aid', label: 'Medical Aid (13)' },
  { key: 'health_insurance', label: 'Health Insurance (2)' },
  { key: 'gap_cover', label: 'Gap Cover (1)' },
] as const;

export default function MedicalAidDirectoryScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const patientProfile = useAppStore((s) => s.patientProfile);
  const updatePatientProfile = useAppStore((s) => s.updatePatientProfile);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  const filteredProviders = useMemo(() => {
    return filterMedicalAidProviders(search, selectedCategory);
  }, [search, selectedCategory]);

  const handleSelectScheme = (provider: MedicalAidProvider) => {
    tapFeedback();
    setSelectedProviderId(provider.id);
    updatePatientProfile({
      // We store the selected medical aid name
      medicalAid: provider.name,
    } as any);
    toast.show(`${provider.name} set as your primary scheme`, 'success');
  };

  const handleOpenWebsite = (url: string, name: string) => {
    tapFeedback();
    Linking.openURL(url).catch(() => {
      toast.show(`Could not open ${name} website`, 'warning');
    });
  };

  return (
    <Screen scroll={false}>
      {/* Top Navigation Bar */}
      <View
        style={{ paddingTop: insets.top + 6 }}
        className="border-b border-slate-200/80 bg-white px-5 pb-3 shadow-xs dark:border-slate-800 dark:bg-canvasdark-card"
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full border border-slate-200/80 bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
            >
              <ChevronLeft size={20} color="#0B2559" />
            </Pressable>
            <View>
              <Text className="font-display text-[24px] uppercase text-brand-900 dark:text-white">
                Medical Aid & Insurance
              </Text>
              <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
                16 Verified South African Schemes & Cover Providers
              </Text>
            </View>
          </View>
        </View>

        {/* Search Bar */}
        <View className="mt-3.5 flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-700 dark:bg-slate-800">
          <Search size={18} color="#94A3B8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search Discovery, Bonitas, GEMS, open schemes..."
            placeholderTextColor="#94A3B8"
            className="ml-2 flex-1 font-sans text-[14px] text-slate-900 dark:text-white"
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch('')} className="p-1">
              <X size={16} color="#94A3B8" />
            </Pressable>
          ) : null}
        </View>

        {/* Category Filter Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 flex-row gap-2"
        >
          {CATEGORY_TABS.map((tab) => {
            const isSelected = selectedCategory === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => {
                  tapFeedback();
                  setSelectedCategory(tab.key);
                }}
                className={`rounded-full px-3.5 py-1.5 border ${
                  isSelected
                    ? 'border-brand-500 bg-brand-500 text-white shadow-2xs'
                    : 'border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800'
                }`}
              >
                <Text
                  className={`font-sans-semibold text-[12px] ${
                    isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Directory List */}
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Info Header Banner */}
        <View className="mb-4 flex-row items-start gap-3 rounded-2xl border border-blue-200/80 bg-blue-50/70 p-3.5 dark:border-blue-900/40 dark:bg-blue-950/20">
          <Info size={18} color="#2563EB" style={{ marginTop: 2 }} />
          <View className="flex-1">
            <Text className="font-sans-bold text-[13px] text-blue-900 dark:text-blue-200">
              Direct Claims & Healthcare Provider Networks
            </Text>
            <Text className="mt-0.5 font-sans text-[12px] leading-[17px] text-blue-700 dark:text-blue-300">
              Use this directory to verify your medical scheme status, access official member
              portals, and book verified practitioners on Siyashesha.
            </Text>
          </View>
        </View>

        {/* Results Header */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-sans-bold text-[13px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {filteredProviders.length}{' '}
            {filteredProviders.length === 1 ? 'Provider' : 'Providers'} Found
          </Text>
          <Pressable
            onPress={() => router.push('/more/doctors')}
            className="flex-row items-center gap-1"
          >
            <ShieldCheck size={13} color="#16A34A" />
            <Text className="font-sans-semibold text-[12px] text-brand-600 dark:text-brand-300">
              Book Doctor by Medical Aid
            </Text>
          </Pressable>
        </View>

        {filteredProviders.length === 0 ? (
          <View className="items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-14 px-6 dark:border-slate-800 dark:bg-canvasdark-card">
            <Globe size={40} color="#94A3B8" />
            <Text className="mt-3 font-sans-bold text-[16px] text-slate-800 dark:text-white">
              No Medical Schemes Found
            </Text>
            <Text className="mt-1 text-center font-sans text-[13px] text-slate-500 dark:text-slate-400">
              No providers match &ldquo;{search}&rdquo;. Try another scheme name or reset your
              filters.
            </Text>
            <Pressable
              onPress={() => {
                setSearch('');
                setSelectedCategory('all');
              }}
              className="mt-4 rounded-full bg-brand-500 px-5 py-2 shadow-xs"
            >
              <Text className="font-sans-bold text-[12px] text-white">Reset Search</Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-3.5">
            {filteredProviders.map((item) => {
              const isSelectedScheme =
                selectedProviderId === item.id ||
                (patientProfile as any).medicalAid === item.name;

              return (
                <View
                  key={item.id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-canvasdark-card"
                >
                  {/* Brand Row */}
                  <View className="flex-row items-start gap-3.5">
                    {/* Brand Logo Box */}
                    <View className="h-16 w-24 items-center justify-center rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xs dark:border-slate-700 dark:bg-white">
                      <Image
                        source={{ uri: item.logoBase64 }}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="contain"
                      />
                    </View>

                    {/* Details */}
                    <View className="flex-1">
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-2">
                          <Text className="font-sans-bold text-[17px] text-slate-900 dark:text-white">
                            {item.name}
                          </Text>
                          <Text className="font-sans-medium text-[12px] text-brand-700 dark:text-brand-300">
                            {item.schemeType}
                          </Text>
                        </View>

                        <View className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                          <Text className="font-sans-semibold text-[10px] text-slate-600 dark:text-slate-300">
                            {item.categoryLabel}
                          </Text>
                        </View>
                      </View>

                      {/* Official Website Link */}
                      <Pressable
                        onPress={() => handleOpenWebsite(item.websiteUrl, item.name)}
                        className="mt-2 flex-row items-center gap-1.5"
                      >
                        <ExternalLink size={12} color="#0284C7" />
                        <Text
                          className="font-sans-medium text-[12px] text-sky-600 dark:text-sky-400"
                          numberOfLines={1}
                        >
                          {item.websiteUrl.replace(/^https?:\/\//, '')}
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {/* Bottom Action Strip */}
                  <View className="mt-3.5 flex-row items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                    <Pressable
                      onPress={() => handleSelectScheme(item)}
                      className={`flex-row items-center gap-1.5 rounded-xl px-3 py-1.5 border ${
                        isSelectedScheme
                          ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30'
                          : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                      }`}
                    >
                      {isSelectedScheme ? (
                        <>
                          <Check size={13} color="#16A34A" strokeWidth={3} />
                          <Text className="font-sans-bold text-[11px] text-emerald-700 dark:text-emerald-300">
                            Selected as Primary Scheme
                          </Text>
                        </>
                      ) : (
                        <Text className="font-sans-medium text-[11px] text-slate-700 dark:text-slate-300">
                          Set as My Medical Aid
                        </Text>
                      )}
                    </Pressable>

                    <Pressable
                      onPress={() => handleOpenWebsite(item.websiteUrl, item.name)}
                      className="flex-row items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 dark:bg-slate-800"
                    >
                      <Text className="font-sans-bold text-[11px] text-slate-700 dark:text-slate-200">
                        Visit Portal
                      </Text>
                      <ExternalLink size={11} color="#64748B" />
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
