import { router } from 'expo-router';
import {
  ChevronLeft,
  HeartHandshake,
  MessageSquare,
  Phone,
  PhoneCall,
  Search,
  ShieldAlert,
  Siren,
  Sparkles,
  X,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen } from '@/components/ui/Screen';
import { useToast } from '@/components/ui/Toast';
import {
  EMERGENCY_CATEGORIES,
  filterEmergencyContacts,
  NATIONAL_SPEED_DIALS,
  type EmergencyServiceContact,
} from '@/data/emergencyContactsDirectory';
import { impactFeedback, tapFeedback } from '@/lib/feedback';

export default function EmergencyServicesScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredContacts = useMemo(() => {
    return filterEmergencyContacts(search, selectedCategory);
  }, [search, selectedCategory]);

  const handleCall = (contact: EmergencyServiceContact) => {
    impactFeedback('medium');
    const telUrl = `tel:${contact.cleanNumber}`;

    if (contact.isPrivate) {
      Alert.alert(
        `Call ${contact.name}`,
        `${contact.purpose}\n\nNote: This is a private service; medical aid or call-out fees may apply. Proceed with call to ${contact.number}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Call Now',
            style: 'destructive',
            onPress: () => {
              Linking.openURL(telUrl).catch(() => {
                toast.show(`Could not initiate call to ${contact.number}`, 'warning');
              });
            },
          },
        ]
      );
      return;
    }

    Linking.openURL(telUrl).catch(() => {
      toast.show(`Could not initiate call to ${contact.number}`, 'warning');
    });
  };

  const handleSendSms = (smsNumber: string, serviceName: string) => {
    tapFeedback();
    Linking.openURL(`sms:${smsNumber}`).catch(() => {
      toast.show(`Could not open SMS to ${serviceName}`, 'warning');
    });
  };

  const handlePleaseCallMe = (code: string) => {
    tapFeedback();
    Linking.openURL(`tel:${encodeURIComponent(code)}`).catch(() => {
      toast.show(`Could not trigger USSD ${code}`, 'warning');
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
              <View className="flex-row items-center gap-1.5">
                <Text className="font-display text-[24px] uppercase text-red-600 dark:text-red-400">
                  Emergency & Helplines
                </Text>
                <View className="rounded-full bg-red-100 px-2 py-0.5 dark:bg-red-950/40">
                  <Text className="font-sans-bold text-[10px] uppercase text-red-700 dark:text-red-400">
                    24/7 National
                  </Text>
                </View>
              </View>
              <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
                South Africa Crisis, Ambulance, Police & Support Lines
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
            placeholder="Search by emergency, poison, suicide, SADAG, child..."
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
          {EMERGENCY_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.key;
            return (
              <Pressable
                key={cat.key}
                onPress={() => {
                  tapFeedback();
                  setSelectedCategory(cat.key);
                }}
                className={`rounded-full px-3.5 py-1.5 border ${
                  isSelected
                    ? 'border-red-500 bg-red-500 text-white shadow-2xs'
                    : 'border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800'
                }`}
              >
                <Text
                  className={`font-sans-semibold text-[12px] ${
                    isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Directory Stream */}
      <ScrollView
        className="flex-1 px-5 pt-4"
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {/* PERSISTENT NATIONAL SPEED DIALS HERO SECTION */}
        <View className="mb-5 rounded-3xl border border-red-200 bg-red-50/90 p-4 shadow-xs dark:border-red-900/60 dark:bg-red-950/30">
          <View className="flex-row items-center gap-2">
            <Siren size={18} color="#DC1F26" />
            <Text className="font-sans-bold text-[14px] uppercase tracking-wider text-red-900 dark:text-red-300">
              Immediate Danger & Emergency Dispatch
            </Text>
          </View>
          <Text className="mt-1 font-sans text-[12px] leading-[17px] text-red-700 dark:text-red-300/90">
            For life-threatening medical emergencies or immediate threats, dial these toll-free
            numbers immediately:
          </Text>

          {/* 3 Large Speed Dial Buttons */}
          <View className="mt-3.5 flex-row gap-2.5">
            {NATIONAL_SPEED_DIALS.map((sd) => (
              <Pressable
                key={sd.id}
                onPress={() => handleCall(sd)}
                className="flex-1 items-center justify-center rounded-2xl bg-red-600 py-3 px-2 shadow-sm active:bg-red-700 dark:bg-red-700 dark:active:bg-red-800"
              >
                <PhoneCall size={18} color="#FFFFFF" />
                <Text className="mt-1 font-display text-[20px] text-white">
                  {sd.number}
                </Text>
                <Text
                  numberOfLines={1}
                  className="font-sans-medium text-[10px] text-red-100"
                >
                  {sd.name.replace(' (Mobile)', '')}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Directory Count Header */}
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-sans-bold text-[13px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {filteredContacts.length} Verified Helplines
          </Text>
          <Pressable
            onPress={() => router.push('/more/emergency')}
            className="flex-row items-center gap-1"
          >
            <ShieldAlert size={13} color="#DC1F26" />
            <Text className="font-sans-semibold text-[12px] text-red-600 dark:text-red-400">
              View Personal ICE Card
            </Text>
          </Pressable>
        </View>

        {filteredContacts.length === 0 ? (
          <View className="items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-14 px-6 dark:border-slate-800 dark:bg-canvasdark-card">
            <HeartHandshake size={44} color="#94A3B8" />
            <Text className="mt-3 font-sans-bold text-[16px] text-slate-800 dark:text-white">
              No Helplines Matching &ldquo;{search}&rdquo;
            </Text>
            <Text className="mt-1 text-center font-sans text-[13px] text-slate-500 dark:text-slate-400">
              Try searching by a broader term like &ldquo;ambulance&rdquo;, &ldquo;crisis&rdquo;, or
              &ldquo;police&rdquo;.
            </Text>
            <Pressable
              onPress={() => {
                setSearch('');
                setSelectedCategory('all');
              }}
              className="mt-4 rounded-full bg-red-600 px-5 py-2 shadow-xs"
            >
              <Text className="font-sans-bold text-[12px] text-white">Clear Filters</Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-3.5">
            {filteredContacts.map((contact) => (
              <View
                key={contact.id}
                className="rounded-3xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-canvasdark-card"
              >
                {/* Header Row */}
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="font-sans-bold text-[16px] text-slate-900 dark:text-white">
                      {contact.name}
                    </Text>
                    <View className="mt-1 flex-row flex-wrap items-center gap-1.5">
                      <View className="rounded-full bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                        <Text className="font-sans-semibold text-[10px] text-slate-600 dark:text-slate-300">
                          {contact.categoryLabel}
                        </Text>
                      </View>
                      {contact.badge ? (
                        <View
                          className={`rounded-full px-2 py-0.5 ${
                            contact.isPrivate
                              ? 'bg-amber-100 dark:bg-amber-950/40'
                              : 'bg-emerald-100 dark:bg-emerald-950/40'
                          }`}
                        >
                          <Text
                            className={`font-sans-bold text-[10px] ${
                              contact.isPrivate
                                ? 'text-amber-800 dark:text-amber-300'
                                : 'text-emerald-800 dark:text-emerald-300'
                            }`}
                          >
                            {contact.badge}
                          </Text>
                        </View>
                      ) : null}
                      {contact.hours ? (
                        <Text className="font-sans text-[11px] text-slate-400">
                          · {contact.hours}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <Text className="font-display text-[20px] text-slate-900 dark:text-white">
                    {contact.number}
                  </Text>
                </View>

                {/* Purpose Description */}
                <Text className="mt-2.5 font-sans text-[13px] leading-[18px] text-slate-600 dark:text-slate-300">
                  {contact.purpose}
                </Text>

                {/* Action Buttons Strip */}
                <View className="mt-3.5 flex-row items-center gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  {/* Primary Call Button */}
                  <Pressable
                    onPress={() => handleCall(contact)}
                    className="flex-1 flex-row items-center justify-center gap-2 rounded-2xl bg-red-600 py-2.5 px-3 shadow-xs active:bg-red-700 dark:bg-red-700"
                  >
                    <Phone size={15} color="#FFFFFF" />
                    <Text className="font-sans-bold text-[13px] text-white">
                      Call {contact.number}
                    </Text>
                  </Pressable>

                  {/* SMS action if available */}
                  {contact.smsNumber ? (
                    <Pressable
                      onPress={() => handleSendSms(contact.smsNumber!, contact.name)}
                      className="flex-row items-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <MessageSquare size={14} color="#0B2559" />
                      <Text className="font-sans-bold text-[11px] text-slate-700 dark:text-slate-200">
                        SMS {contact.smsNumber}
                      </Text>
                    </Pressable>
                  ) : null}

                  {/* Please Call Me action if available */}
                  {contact.pleaseCallMeCode ? (
                    <Pressable
                      onPress={() => handlePleaseCallMe(contact.pleaseCallMeCode!)}
                      className="flex-row items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <Sparkles size={13} color="#D97706" />
                      <Text className="font-sans-bold text-[11px] text-amber-800 dark:text-amber-300">
                        *120*7867#
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
