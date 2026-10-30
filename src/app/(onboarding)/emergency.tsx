import * as Contacts from 'expo-contacts';
import { router } from 'expo-router';
import {
  AlertTriangle,
  BookUser,
  HeartPulse,
  PhoneCall,
  Plus,
  Search,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChipSelector } from '@/components/onboarding/ChipSelector';
import { ChunkyButton } from '@/components/onboarding/ChunkyButton';
import { Mascot } from '@/components/onboarding/Mascot';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { RewardModal } from '@/components/onboarding/RewardModal';
import { SpeechBubble } from '@/components/onboarding/SpeechBubble';
import { useToast } from '@/components/ui/Toast';
import type { EmergencyContact } from '@/data/patient';
import { tapFeedback } from '@/lib/feedback';
import type { StampId } from '@/store/useAppStore';
import { useAppStore } from '@/store/useAppStore';

const allergyOptions = [
  'No known allergies',
  'Penicillin',
  'Aspirin',
  'Latex',
  'Peanuts',
  'Shellfish',
  'Bee stings',
  'Sulfa drugs',
];
const conditionOptions = [
  'None',
  'Type 2 diabetes',
  'High blood pressure',
  'Asthma',
  'Epilepsy',
  'Heart condition',
];
const relationships = ['Spouse', 'Parent', 'Child', 'Sibling', 'Friend', 'Partner', 'Doctor'];

interface DeviceContactItem {
  id: string;
  name: string;
  phone: string;
}

const FALLBACK_DEVICE_CONTACTS: DeviceContactItem[] = [
  { id: 'sim-1', name: 'Sipho Nkosi', phone: '+27 82 555 0149' },
  { id: 'sim-2', name: 'Lerato Dlamini', phone: '+27 71 440 2391' },
  { id: 'sim-3', name: 'Dr N. Mokoena (Family GP)', phone: '+27 11 447 8900' },
  { id: 'sim-4', name: 'Thabo Mbeki-Zulu', phone: '+27 83 910 4421' },
];

export default function EmergencyScreen() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const draft = useAppStore((s) => s.onboardingDraft);
  const updateDraft = useAppStore((s) => s.updateOnboardingDraft);
  const earnStamp = useAppStore((s) => s.earnStamp);

  const [generating, setGenerating] = useState(false);
  const [reward, setReward] = useState<StampId | null>(null);

  // Phone contacts picker state
  const [contactPickerIndex, setContactPickerIndex] = useState<number | null>(null);
  const [deviceContacts, setDeviceContacts] = useState<DeviceContactItem[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [contactSearch, setContactSearch] = useState('');

  // Ensure at least 1 contact slot exists, and initialize from legacy fields if needed
  const contacts: EmergencyContact[] = useMemo(() => {
    if (draft.emergencyContacts && draft.emergencyContacts.length > 0) {
      return draft.emergencyContacts;
    }
    return [
      {
        name: draft.contactName || '',
        relationship: draft.contactRelationship || 'Spouse',
        phone: draft.contactPhone || '',
      },
    ];
  }, [draft.emergencyContacts, draft.contactName, draft.contactRelationship, draft.contactPhone]);

  const setContacts = (next: EmergencyContact[]) => {
    const primary = next[0] ?? { name: '', relationship: '', phone: '' };
    updateDraft({
      emergencyContacts: next,
      contactName: primary.name,
      contactRelationship: primary.relationship,
      contactPhone: primary.phone,
    });
  };

  const updateContactAt = (index: number, patch: Partial<EmergencyContact>) => {
    const next = contacts.map((c, idx) => (idx === index ? { ...c, ...patch } : c));
    setContacts(next);
  };

  const addAnotherContact = () => {
    tapFeedback();
    setContacts([
      ...contacts,
      {
        name: '',
        relationship: contacts.length === 1 ? 'Parent' : 'Sibling',
        phone: '',
      },
    ]);
  };

  const removeContactAt = (index: number) => {
    tapFeedback();
    if (contacts.length <= 1) return;
    setContacts(contacts.filter((_, idx) => idx !== index));
  };

  /**
   * Applies a contact chosen from the phone's address book. A contact with several numbers
   * opens the in-app list so the user can choose which number paramedics should call.
   */
  const applyPickedContact = (index: number, name: string, numbers: string[]) => {
    const displayName = name.trim() || 'Emergency Contact';
    const unique = Array.from(new Set(numbers.map((n) => n.trim()).filter(Boolean)));
    if (unique.length === 0) {
      toast.show(`${displayName} has no phone number saved`, 'warning');
      return;
    }
    if (unique.length === 1) {
      updateContactAt(index, { name: displayName, phone: unique[0] });
      toast.show(`Imported ${displayName} from Contacts`, 'success');
      return;
    }
    setDeviceContacts(unique.map((phone, i) => ({ id: `${displayName}-${i}`, name: displayName, phone })));
    setContactSearch('');
    setContactPickerIndex(index);
  };

  const handlePickFromPhoneContacts = async (index: number) => {
    tapFeedback();
    if (Platform.OS === 'web') {
      setDeviceContacts(FALLBACK_DEVICE_CONTACTS);
      setContactSearch('');
      setContactPickerIndex(index);
      return;
    }

    // 1. The system contact picker. On iOS and Android it returns only the contact the user
    //    taps, so no blanket address-book permission is needed.
    try {
      const picked = await Contacts.Contact.presentPicker();
      if (!picked) return; // user cancelled
      const [fullName, phones] = await Promise.all([
        picked.getFullName().catch(() => ''),
        picked.getPhones().catch(() => []),
      ]);
      applyPickedContact(
        index,
        fullName,
        phones.map((p) => p.number ?? ''),
      );
      return;
    } catch {
      // Picker unavailable or details unreadable without permission: use the searchable list below.
    }

    // 2. Searchable in-app list. Show the Google Play prominent disclosure before the OS prompt.
    try {
      const existing = await Contacts.getPermissionsAsync();
      if (existing.status !== 'granted') {
        const confirmed = await new Promise<boolean>((resolve) => {
          Alert.alert(
            'Contacts Access Disclosure',
            'Siyashesha accesses your phone contacts only so you can select an Emergency Contact (ICE) name and phone number for paramedics. Your full contact list is never uploaded or shared with third parties.',
            [
              { text: 'Not Now', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Continue', onPress: () => resolve(true) },
            ],
          );
        });
        if (!confirmed) return;

        const requested = await Contacts.requestPermissionsAsync();
        if (requested.status !== 'granted') {
          if (requested.canAskAgain === false) {
            Alert.alert(
              'Contacts permission is off',
              'Turn on Contacts for Siyashesha in Settings to import an emergency contact, or type the details in manually.',
              [
                { text: 'Type manually', style: 'cancel' },
                { text: 'Open Settings', onPress: () => Linking.openSettings().catch(() => {}) },
              ],
            );
          } else {
            toast.show('Contacts permission is needed to import from your phonebook', 'warning');
          }
          return;
        }
      }

      setLoadingContacts(true);
      setContactSearch('');
      setContactPickerIndex(index);

      // ContactField is re-exported via `export *`, which eslint-plugin-import cannot follow; TypeScript and the runtime both resolve it.
      /* eslint-disable import/namespace */
      const details = await Contacts.Contact.getAllDetails([
        Contacts.ContactField.FULL_NAME,
        Contacts.ContactField.PHONES,
      ]);
      /* eslint-enable import/namespace */
      const parsed: DeviceContactItem[] = [];
      details.forEach((d, i) => {
        const name = (d.fullName ?? '').trim();
        const phone = d.phones?.[0]?.number?.trim();
        if (name && phone) parsed.push({ id: `${i}-${name}-${phone}`, name, phone });
      });
      parsed.sort((a, b) => a.name.localeCompare(b.name));
      setDeviceContacts(parsed);
    } catch {
      setContactPickerIndex(null);
      toast.show('Could not open your contacts. Please type the details in manually.', 'warning');
    } finally {
      setLoadingContacts(false);
    }
  };

  const filteredDeviceContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    if (!q) return deviceContacts.slice(0, 80);
    return deviceContacts
      .filter((c) => c.name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q))
      .slice(0, 80);
  }, [deviceContacts, contactSearch]);

  const hasValidContact = contacts.some((c) => c.name.trim().length > 0 || c.phone.trim().length > 0);
  const hasSomething =
    draft.allergies.length > 0 || draft.conditions.length > 0 || hasValidContact;

  // Short "building your card" moment before the stamp lands.
  useEffect(() => {
    if (!generating) return;
    const timer = setTimeout(() => {
      setGenerating(false);
      if (earnStamp('emergency')) {
        setReward('emergency');
      } else {
        router.push('/(onboarding)/medication' as any);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [generating, earnStamp]);

  const handleContinue = () => {
    if (hasSomething) {
      setGenerating(true);
    } else {
      router.push('/(onboarding)/medication' as any);
    }
  };

  return (
    <OnboardingShell
      step={3}
      totalSteps={8}
      stepLabel="Emergency ICE Card"
      footer={
        <>
          <ChunkyButton
            label={hasSomething ? 'Build my emergency card' : 'Skip for now'}
            variant={hasSomething ? 'primary' : 'ghost'}
            onPress={handleContinue}
            disabled={generating}
          />
          {!hasSomething ? (
            <Text className="text-center font-sans text-[12px] text-ink-muted dark:text-slate-400">
              Tap any option above or skip to add these later from your profile.
            </Text>
          ) : null}
        </>
      }
    >
      <View className="gap-5 py-2">
        <View className="items-center gap-3">
          <Mascot mood={hasSomething ? 'cheer' : 'calm'} size={80} />
          <SpeechBubble subtitle="Shown on your emergency QR code when paramedics scan your passport.">
            What should emergency responders know immediately?
          </SpeechBubble>
        </View>

        <Section
          icon={<AlertTriangle size={16} color="#DC1F26" />}
          badge="Critical"
          title="Allergies & Reactions"
          why="Medicines, foods, or substances that could cause an allergic reaction."
        >
          <ChipSelector
            options={allergyOptions}
            selected={draft.allergies}
            onChange={(v) => updateDraft({ allergies: v })}
            placeholder="Type an allergy (e.g. Ibuprofen)"
          />
        </Section>

        <Section
          icon={<HeartPulse size={16} color="#0B2559" />}
          title="Chronic or Long-Term Conditions"
          why="Ongoing medical conditions clinicians should take into account."
        >
          <ChipSelector
            options={conditionOptions}
            selected={draft.conditions}
            onChange={(v) => updateDraft({ conditions: v })}
            placeholder="Type a condition"
          />
        </Section>

        <Section
          icon={<PhoneCall size={16} color="#16A34A" />}
          badge={`${contacts.length} ${contacts.length === 1 ? 'Contact' : 'Contacts'}`}
          title="In Case of Emergency (ICE) Contacts"
          why="Add 1, 2, or more people for hospital staff to call, or import directly from your phone contacts."
        >
          <View className="gap-4">
            {contacts.map((contact, index) => (
              <View
                key={index}
                className="gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 dark:border-slate-700 dark:bg-canvasdark"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-ink dark:bg-brand-400">
                      <Text className="font-sans-bold text-[11px] text-white">{index + 1}</Text>
                    </View>
                    <Text className="font-sans-bold text-[14px] text-ink dark:text-slate-100">
                      {index === 0 ? 'Primary Emergency Contact' : `Emergency Contact #${index + 1}`}
                    </Text>
                  </View>

                  {contacts.length > 1 ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove emergency contact ${index + 1}`}
                      onPress={() => removeContactAt(index)}
                      className="flex-row items-center gap-1 rounded-full bg-emergency-50 px-2.5 py-1 dark:bg-emergency-500/20"
                    >
                      <Trash2 size={12} color="#DC1F26" />
                      <Text className="font-sans-semibold text-[11px] text-emergency-600 dark:text-red-300">
                        Remove
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                {/* Import from Phone Contacts Button */}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Import emergency contact ${index + 1} from phone contacts`}
                  onPress={() => handlePickFromPhoneContacts(index)}
                  className="flex-row items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 py-2.5 px-3 dark:border-brand-500/30 dark:bg-brand-500/15"
                >
                  <BookUser size={16} color="#0B2559" />
                  <Text className="font-sans-bold text-[13px] text-brand-700 dark:text-brand-300">
                    Choose from Phone Contacts
                  </Text>
                </Pressable>

                <View className="gap-1.5">
                  <Text className="font-sans-semibold text-[12px] text-ink-muted dark:text-slate-400">
                    Relationship
                  </Text>
                  <ChipSelector
                    options={relationships}
                    selected={contact.relationship ? [contact.relationship] : []}
                    onChange={(v) => updateContactAt(index, { relationship: v[v.length - 1] ?? '' })}
                    singleSelect
                    addLabel="Other"
                    placeholder="Relationship"
                  />
                </View>

                <View className="gap-2">
                  <TextInput
                    value={contact.name}
                    onChangeText={(v) => updateContactAt(index, { name: v })}
                    placeholder="Contact full name (e.g. Sipho Nkosi)"
                    placeholderTextColor="#8C98B8"
                    autoCapitalize="words"
                    returnKeyType="next"
                    className="min-h-[48px] rounded-2xl border-2 border-slate-200 bg-white px-4 font-sans-semibold text-[15px] text-ink dark:border-slate-700 dark:bg-canvasdark-card dark:text-slate-50"
                    accessibilityLabel={`Emergency contact ${index + 1} name`}
                  />
                  <TextInput
                    value={contact.phone}
                    onChangeText={(v) => updateContactAt(index, { phone: v })}
                    placeholder="Phone number (e.g. +27 82 555 0149)"
                    placeholderTextColor="#8C98B8"
                    keyboardType="phone-pad"
                    returnKeyType="done"
                    className="min-h-[48px] rounded-2xl border-2 border-slate-200 bg-white px-4 font-sans-semibold text-[15px] text-ink dark:border-slate-700 dark:bg-canvasdark-card dark:text-slate-50"
                    accessibilityLabel={`Emergency contact ${index + 1} phone number`}
                  />
                </View>
              </View>
            ))}

            {/* Add 2nd / More Emergency Contact Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add another emergency contact"
              onPress={addAnotherContact}
              className="flex-row items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 py-3.5 dark:border-slate-700 dark:bg-canvasdark/50"
            >
              <Plus size={17} color="#0B2559" />
              <Text className="font-sans-bold text-[14px] text-ink dark:text-slate-200">
                {contacts.length === 1
                  ? 'Add a 2nd emergency contact'
                  : `Add another emergency contact (#${contacts.length + 1})`}
              </Text>
            </Pressable>
          </View>
        </Section>

        {generating ? (
          <View
            className="flex-row items-center justify-center gap-3 rounded-3xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-500/30 dark:bg-canvasdark-card"
            accessibilityLiveRegion="polite"
          >
            <ActivityIndicator color="#0B2559" />
            <Text className="font-sans-bold text-[14px] text-ink dark:text-slate-50">
              Encoding your ICE emergency card…
            </Text>
          </View>
        ) : null}
      </View>

      {/* Searchable Phone Contacts Modal */}
      <Modal
        visible={contactPickerIndex !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setContactPickerIndex(null)}
      >
        <View className="flex-1 bg-slate-50 dark:bg-canvasdark" style={{ paddingTop: insets.top + 12 }}>
          <View className="flex-row items-center justify-between border-b border-slate-200 px-5 pb-3 dark:border-slate-800">
            <View className="flex-row items-center gap-2">
              <BookUser size={18} color="#0B2559" />
              <Text className="font-sans-bold text-[17px] text-ink dark:text-slate-50">
                Select Phone Contact
              </Text>
            </View>
            <Pressable
              onPress={() => setContactPickerIndex(null)}
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-200/80 dark:bg-slate-800"
            >
              <X size={18} color="#5B6478" />
            </Pressable>
          </View>

          <View className="px-5 pt-3">
            <View className="flex-row items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 dark:border-slate-700 dark:bg-canvasdark-card">
              <Search size={16} color="#8C98B8" />
              <TextInput
                value={contactSearch}
                onChangeText={setContactSearch}
                placeholder="Search contacts by name or number…"
                placeholderTextColor="#8C98B8"
                className="flex-1 font-sans text-[15px] text-ink dark:text-slate-50"
              />
            </View>
          </View>

          {loadingContacts ? (
            <View className="flex-1 items-center justify-center gap-3">
              <ActivityIndicator size="large" color="#0B2559" />
              <Text className="font-sans text-[14px] text-ink-muted">Loading phone contacts…</Text>
            </View>
          ) : (
            <ScrollView className="mt-3 flex-1 px-5" contentContainerStyle={{ paddingBottom: 40, gap: 8 }}>
              {filteredDeviceContacts.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    if (contactPickerIndex !== null) {
                      updateContactAt(contactPickerIndex, {
                        name: item.name,
                        phone: item.phone,
                      });
                      toast.show(`Added ${item.name}`, 'success');
                    }
                    setContactPickerIndex(null);
                  }}
                  className="flex-row items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-3.5 dark:border-slate-800 dark:bg-canvasdark-card"
                >
                  <View className="flex-1">
                    <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">{item.name}</Text>
                    <Text className="mt-0.5 font-sans text-[13px] text-ink-muted dark:text-slate-400">
                      {item.phone}
                    </Text>
                  </View>
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/20">
                    <UserCheck size={16} color="#0B2559" />
                  </View>
                </Pressable>
              ))}
              {filteredDeviceContacts.length === 0 ? (
                <Text className="mt-8 text-center font-sans text-[14px] text-ink-muted">
                  No matching phone contacts found.
                </Text>
              ) : null}
            </ScrollView>
          )}
        </View>
      </Modal>

      <RewardModal
        stampId={reward}
        onDone={() => {
          setReward(null);
          router.push('/(onboarding)/medication' as any);
        }}
      />
    </OnboardingShell>
  );
}

function Section({
  icon,
  badge,
  title,
  why,
  children,
}: {
  icon: React.ReactNode;
  badge?: string;
  title: string;
  why: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-3 rounded-3xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-canvasdark-card">
      <View className="gap-1">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            {icon}
            <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">{title}</Text>
          </View>
          {badge ? (
            <View className="rounded-full bg-emergency-50 px-2.5 py-0.5 dark:bg-emergency-500/20">
              <Text className="font-sans-bold text-[10px] uppercase text-emergency-600 dark:text-red-300">{badge}</Text>
            </View>
          ) : null}
        </View>
        <Text className="font-sans text-[12px] leading-[17px] text-ink-muted dark:text-slate-400">{why}</Text>
      </View>
      {children}
    </View>
  );
}
