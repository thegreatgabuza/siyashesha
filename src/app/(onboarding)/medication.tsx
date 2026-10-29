import { router } from 'expo-router';
import { Bell, Check, Clock, Pill, Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { ChunkyButton } from '@/components/onboarding/ChunkyButton';
import { Mascot } from '@/components/onboarding/Mascot';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { RewardModal } from '@/components/onboarding/RewardModal';
import { SpeechBubble } from '@/components/onboarding/SpeechBubble';
import { useToast } from '@/components/ui/Toast';
import { tapFeedback } from '@/lib/feedback';
import type { MedicationTimeSlot, StampId } from '@/store/useAppStore';
import { useAppStore } from '@/store/useAppStore';

const timeSlots: { id: MedicationTimeSlot; label: string; clock: string }[] = [
  { id: 'Morning', label: 'Morning', clock: '08:00' },
  { id: 'Afternoon', label: 'Afternoon', clock: '13:00' },
  { id: 'Evening', label: 'Evening', clock: '18:00' },
  { id: 'Night', label: 'Night', clock: '21:00' },
];

const frequencyPresets: { label: string; slots: MedicationTimeSlot[] }[] = [
  { label: 'Once daily (1x)', slots: ['Morning'] },
  { label: 'Twice daily (2x)', slots: ['Morning', 'Evening'] },
  { label: '3 times a day (3x)', slots: ['Morning', 'Afternoon', 'Evening'] },
  { label: 'Select all (4x)', slots: ['Morning', 'Afternoon', 'Evening', 'Night'] },
];

const quickMeds = [
  'Metformin',
  'Amlodipine',
  'Atorvastatin',
  'Levothyroxine',
  'Asthma Inhaler',
  'Vitamin D3',
  'Omega-3',
  'Multivitamin',
  'Iron',
  'Magnesium',
];

export default function MedicationScreen() {
  const toast = useToast();
  const userMedications = useAppStore((s) => s.userMedications);
  const addUserMedication = useAppStore((s) => s.addUserMedication);
  const removeUserMedication = useAppStore((s) => s.removeUserMedication);
  const earnStamp = useAppStore((s) => s.earnStamp);

  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [selectedTimes, setSelectedTimes] = useState<MedicationTimeSlot[]>(['Morning']);
  const [reward, setReward] = useState<StampId | null>(null);

  const formReady = name.trim().length > 0 && selectedTimes.length > 0;
  const totalCount = userMedications.length + (formReady ? 1 : 0);
  const canContinue = userMedications.length > 0 || formReady;

  const next = () => router.push('/(onboarding)/records' as any);

  const toggleTimeSlot = (slot: MedicationTimeSlot) => {
    tapFeedback();
    setSelectedTimes((prev) => {
      if (prev.includes(slot)) {
        return prev.filter((s) => s !== slot);
      }
      const ordered = timeSlots.map((t) => t.id).filter((id) => prev.includes(id) || id === slot);
      return ordered;
    });
  };

  const applyPreset = (slots: MedicationTimeSlot[]) => {
    tapFeedback();
    setSelectedTimes(slots);
  };

  const isPresetActive = (slots: MedicationTimeSlot[]) =>
    selectedTimes.length === slots.length && slots.every((s) => selectedTimes.includes(s));

  const handleAddAnother = () => {
    if (!formReady) return;
    tapFeedback();
    const trimmedName = name.trim();
    addUserMedication({
      name: trimmedName,
      dose: dose.trim(),
      time: selectedTimes[0],
      times: selectedTimes,
    });
    setName('');
    setDose('');
    setSelectedTimes(['Morning']);
    toast.show(`Added ${trimmedName} to your list`, 'success');
  };

  const handleSaveAndContinue = () => {
    if (formReady) {
      addUserMedication({
        name: name.trim(),
        dose: dose.trim(),
        time: selectedTimes[0],
        times: selectedTimes,
      });
      setName('');
      setDose('');
    }
    if (earnStamp('medication')) {
      setReward('medication');
    } else {
      next();
    }
  };

  const previewName =
    name.trim() ||
    userMedications[userMedications.length - 1]?.name ||
    'Your medicine';
  const previewDose =
    name.trim()
      ? dose.trim()
      : userMedications[userMedications.length - 1]?.dose || '';
  const previewTimes =
    name.trim()
      ? selectedTimes
      : userMedications[userMedications.length - 1]?.times ??
        (userMedications[userMedications.length - 1]?.time
          ? [userMedications[userMedications.length - 1].time]
          : selectedTimes);

  const scheduleSummary =
    previewTimes.length === 0
      ? 'Select one or more times above to preview your schedule.'
      : `${previewTimes.length}x daily (${previewTimes.join(', ')}) · ${previewTimes
          .map((s) => timeSlots.find((t) => t.id === s)?.clock)
          .filter(Boolean)
          .join(', ')}`;

  const primaryButtonLabel =
    totalCount > 1
      ? `Save & Continue (${totalCount} items)`
      : 'Save medicine & continue';

  return (
    <OnboardingShell
      step={4}
      totalSteps={8}
      stepLabel="Medications & Supplements"
      footer={
        <>
          <ChunkyButton
            label={primaryButtonLabel}
            disabled={!canContinue}
            onPress={handleSaveAndContinue}
          />
          <ChunkyButton
            variant="ghost"
            label={userMedications.length > 0 ? 'Continue to next step' : "Skip — I don't take daily medication"}
            onPress={userMedications.length > 0 ? handleSaveAndContinue : next}
          />
        </>
      }
    >
      <View className="gap-5 py-2">
        <View className="items-center gap-3">
          <Mascot mood={userMedications.length > 0 ? 'cheer' : 'calm'} size={80} />
          <SpeechBubble subtitle="Add as many chronic prescriptions, vitamins, or daily supplements as you take.">
            {userMedications.length > 0
              ? `Great! You've added ${userMedications.length} ${
                  userMedications.length === 1 ? 'item' : 'items'
                }. Add another below or continue.`
              : 'Taking medications or supplements? Add as many as you take.'}
          </SpeechBubble>
        </View>

        {/* Saved Medications & Supplements List */}
        {userMedications.length > 0 ? (
          <View className="gap-2.5 rounded-3xl border border-emerald-500/30 bg-emerald-50/60 p-4 dark:border-emerald-500/25 dark:bg-emerald-950/20">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Pill size={16} color="#16A34A" />
                <Text className="font-sans-bold text-[13px] uppercase tracking-[0.8px] text-emerald-800 dark:text-emerald-300">
                  Your Medications & Supplements ({userMedications.length})
                </Text>
              </View>
            </View>

            <View className="gap-2">
              {userMedications.map((med, idx) => {
                const slots = med.times && med.times.length > 0 ? med.times : [med.time];
                return (
                  <View
                    key={med.id}
                    className="flex-row items-center justify-between rounded-2xl border border-slate-200/90 bg-white px-3.5 py-3 dark:border-slate-800 dark:bg-canvasdark-card"
                  >
                    <View className="flex-1 flex-row items-center gap-3">
                      <View className="h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                        <Text className="font-sans-bold text-[12px] text-emerald-700 dark:text-emerald-300">
                          {idx + 1}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">
                          {med.name}
                          {med.dose ? (
                            <Text className="font-sans-semibold text-[13px] text-ink-muted dark:text-slate-400">
                              {` · ${med.dose}`}
                            </Text>
                          ) : null}
                        </Text>
                        <Text className="mt-0.5 font-sans text-[12px] text-brand-700 dark:text-brand-300">
                          {slots.length}x daily · {slots.join(', ')}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${med.name}`}
                      onPress={() => {
                        tapFeedback();
                        removeUserMedication(med.id);
                      }}
                      className="h-8 w-8 items-center justify-center rounded-full bg-emergency-50 dark:bg-emergency-500/20"
                    >
                      <Trash2 size={14} color="#DC1F26" />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* Form to Add a Medication or Supplement */}
        <View className="gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-canvasdark-card">
          <View className="flex-row items-center justify-between">
            <Text className="font-sans-bold text-[13px] uppercase tracking-[0.8px] text-brand-700 dark:text-brand-300">
              {userMedications.length === 0
                ? 'Add First Medicine or Supplement'
                : `Add Medicine or Supplement #${userMedications.length + 1}`}
            </Text>
          </View>

          <View className="gap-2">
            <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">
              Medicine or supplement name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Metformin, Vitamin D3, Omega-3"
              placeholderTextColor="#8C98B8"
              autoCapitalize="words"
              returnKeyType="next"
              className="min-h-[52px] rounded-2xl border-2 border-slate-200 bg-slate-50/70 px-4 font-sans-semibold text-[16px] text-ink dark:border-slate-700 dark:bg-canvasdark dark:text-slate-50"
              accessibilityLabel="Medicine or supplement name"
            />
            <View className="mt-1 flex-row flex-wrap gap-1.5">
              {quickMeds.map((med) => {
                const active = name.toLowerCase() === med.toLowerCase();
                const alreadyAdded = userMedications.some((m) => m.name.toLowerCase() === med.toLowerCase());
                return (
                  <Pressable
                    key={med}
                    onPress={() => setName(med)}
                    className={`rounded-full border px-3 py-1.5 ${
                      active
                        ? 'border-ink bg-ink dark:border-brand-300 dark:bg-brand-400'
                        : alreadyAdded
                        ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-500/40 dark:bg-emerald-500/15'
                        : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-canvasdark'
                    }`}
                  >
                    <Text
                      className={`font-sans-semibold text-[12px] ${
                        active
                          ? 'text-white'
                          : alreadyAdded
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-ink-muted dark:text-slate-300'
                      }`}
                    >
                      {alreadyAdded ? `✓ ${med}` : `+ ${med}`}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="gap-2">
            <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">Strength / Dose (Optional)</Text>
            <TextInput
              value={dose}
              onChangeText={setDose}
              placeholder="e.g. 500 mg · 1 tablet or capsule"
              placeholderTextColor="#8C98B8"
              returnKeyType="done"
              className="min-h-[52px] rounded-2xl border-2 border-slate-200 bg-slate-50/70 px-4 font-sans-semibold text-[16px] text-ink dark:border-slate-700 dark:bg-canvasdark dark:text-slate-50"
              accessibilityLabel="Dose"
            />
          </View>

          {/* Multi-select Preferred Reminder Times (1x, 2x, 3x, or all 4x daily) */}
          <View className="gap-2.5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Clock size={15} color="#0B2559" />
                <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">
                  Preferred Reminder Times
                </Text>
              </View>
              <View className="rounded-full bg-brand-100 px-2.5 py-0.5 dark:bg-brand-500/20">
                <Text className="font-sans-bold text-[11px] text-brand-700 dark:text-brand-300">
                  {selectedTimes.length} selected
                </Text>
              </View>
            </View>

            <Text className="font-sans text-[12px] leading-[17px] text-ink-muted dark:text-slate-400">
              Select all times of day you take this medicine (once, twice, 3 times a day, or all 4).
            </Text>

            {/* Quick Frequency Presets */}
            <View className="flex-row flex-wrap gap-1.5">
              {frequencyPresets.map((preset) => {
                const active = isPresetActive(preset.slots);
                return (
                  <Pressable
                    key={preset.label}
                    accessibilityRole="button"
                    accessibilityLabel={preset.label}
                    onPress={() => applyPreset(preset.slots)}
                    className={`rounded-full border px-3 py-1.5 ${
                      active
                        ? 'border-brand-600 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/20'
                        : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-canvasdark'
                    }`}
                  >
                    <Text
                      className={`font-sans-bold text-[11px] ${
                        active ? 'text-brand-700 dark:text-brand-300' : 'text-ink-muted dark:text-slate-400'
                      }`}
                    >
                      {preset.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Multi-Select Time Slot Grid */}
            <View className="mt-1 flex-row flex-wrap justify-between gap-y-2.5">
              {timeSlots.map((slot) => {
                const selected = selectedTimes.includes(slot.id);
                return (
                  <Pressable
                    key={slot.id}
                    style={{ width: '48.5%' }}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={`${slot.label} (${slot.clock})`}
                    onPress={() => toggleTimeSlot(slot.id)}
                    className={`flex-row items-center justify-between rounded-2xl border-2 px-3.5 py-3 ${
                      selected
                        ? 'border-ink bg-ink dark:border-brand-300 dark:bg-brand-400'
                        : 'border-slate-200 bg-slate-50/70 dark:border-slate-700 dark:bg-canvasdark'
                    }`}
                  >
                    <View>
                      <Text
                        className={`font-sans-bold text-[14px] ${
                          selected ? 'text-white' : 'text-ink dark:text-slate-100'
                        }`}
                      >
                        {slot.label}
                      </Text>
                      <Text
                        className={`font-sans text-[11px] ${
                          selected ? 'text-white/80' : 'text-ink-muted dark:text-slate-400'
                        }`}
                      >
                        {slot.clock}
                      </Text>
                    </View>
                    <View
                      className={`h-6 w-6 items-center justify-center rounded-full ${
                        selected ? 'bg-success-500' : 'border-2 border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {selected ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Add to List & Add Another Button */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add this medication and add another"
            disabled={!formReady}
            onPress={handleAddAnother}
            style={{ opacity: formReady ? 1 : 0.45 }}
            className="flex-row items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/70 py-3.5 dark:border-brand-500/40 dark:bg-brand-500/15"
          >
            <Plus size={17} color="#0B2559" />
            <Text className="font-sans-bold text-[14px] text-brand-700 dark:text-brand-300">
              Add to list & add another medicine / supplement
            </Text>
          </Pressable>
        </View>

        {/* Live Lock-Screen Reminder Preview */}
        <View className="gap-2">
          <Text className="font-sans-bold text-[11px] uppercase tracking-[0.8px] text-ink-muted dark:text-slate-400">
            Interactive Notification Preview
          </Text>
          <View
            className="flex-row items-center gap-3.5 rounded-3xl border border-slate-200/80 bg-white p-4 dark:border-slate-800 dark:bg-canvasdark-card"
            accessibilityLabel={`Preview: reminder for ${previewName}`}
          >
            <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-500/20">
              <Bell size={18} color="#0B2559" />
            </View>
            <View className="flex-1">
              <Text className="font-sans-bold text-[14px] text-ink dark:text-slate-50">
                Time for {previewName}
                {previewDose ? ` · ${previewDose}` : ''}
              </Text>
              <Text className="mt-0.5 font-sans text-[12px] text-ink-muted dark:text-slate-400">
                {scheduleSummary}
              </Text>
            </View>
            <View className="h-8 w-8 items-center justify-center rounded-full bg-success-50 dark:bg-success-500/20">
              <Pill size={15} color="#16A34A" />
            </View>
          </View>
        </View>
      </View>

      <RewardModal
        stampId={reward}
        onDone={() => {
          setReward(null);
          next();
        }}
      />
    </OnboardingShell>
  );
}
