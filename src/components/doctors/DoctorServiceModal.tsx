import { X } from 'lucide-react-native';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChunkyButton } from '@/components/onboarding/ChunkyButton';
import { useToast } from '@/components/ui/Toast';
import {
  type DoctorService,
  SERVICE_CATEGORIES,
} from '@/data/doctors';
import { tapFeedback } from '@/lib/feedback';

interface DoctorServiceModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (service: Omit<DoctorService, 'id' | 'doctorId'>, editingId?: string) => void;
  editingService?: DoctorService | null;
}

export function DoctorServiceModal({
  visible,
  onClose,
  onSave,
  editingService,
}: DoctorServiceModalProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <ServiceModalContent
        key={editingService ? `edit-${editingService.id}` : 'new-service'}
        onClose={onClose}
        onSave={onSave}
        editingService={editingService}
      />
    </Modal>
  );
}

function ServiceModalContent({
  onClose,
  onSave,
  editingService,
}: {
  onClose: () => void;
  onSave: (service: Omit<DoctorService, 'id' | 'doctorId'>, editingId?: string) => void;
  editingService?: DoctorService | null;
}) {
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [name, setName] = useState(editingService?.name ?? '');
  const [description, setDescription] = useState(editingService?.description ?? '');
  const [durationMinutes, setDurationMinutes] = useState(editingService?.durationMinutes ?? 30);
  const [priceZar, setPriceZar] = useState(editingService ? String(editingService.priceZar) : '500');
  const [category, setCategory] = useState<DoctorService['category']>(
    editingService?.category ?? 'Consultation'
  );
  const [mode, setMode] = useState<DoctorService['mode']>(editingService?.mode ?? 'both');
  const [isActive] = useState(editingService?.isActive ?? true);

  const handleSave = () => {
    if (!name.trim()) {
      toast.show('Please enter a service name', 'warning');
      return;
    }
    const parsedPrice = parseInt(priceZar.replace(/[^0-9]/g, ''), 10);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast.show('Please enter a valid consultation price in ZAR', 'warning');
      return;
    }

    tapFeedback();
    onSave(
      {
        name: name.trim(),
        description: description.trim(),
        durationMinutes,
        priceZar: parsedPrice,
        category,
        mode,
        isActive,
      },
      editingService?.id
    );
    toast.show(
      editingService ? 'Service updated successfully' : 'New service published to your practice',
      'success'
    );
    onClose();
  };

  const durations = [15, 30, 45, 60, 90];

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 justify-end bg-black/60"
    >
      <View
        style={{ maxHeight: '90%', paddingBottom: Math.max(insets.bottom, 16) }}
        className="rounded-t-3xl border-t border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-canvasdark-card"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-slate-100 px-6 py-4 dark:border-slate-800">
          <View>
            <Text className="font-display text-[24px] uppercase text-brand-900 dark:text-white">
              {editingService ? 'Edit Practice Service' : 'Add New Service'}
            </Text>
            <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
              Configure your pricing, consultation length, and format
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"
          >
            <X size={18} color="#0B2559" />
          </Pressable>
        </View>

        <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>
          {/* Service Name */}
          <View className="mb-4">
            <Text className="mb-1.5 font-sans-semibold text-[13px] text-slate-700 dark:text-slate-300">
              Service Title *
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. General Medical Consultation, Pap Smear, Dental Clean"
              placeholderTextColor="#94A3B8"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-sans text-[15px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </View>

          {/* Category */}
          <View className="mb-4">
            <Text className="mb-1.5 font-sans-semibold text-[13px] text-slate-700 dark:text-slate-300">
              Service Category
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
              {SERVICE_CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => {
                      tapFeedback();
                      setCategory(cat);
                    }}
                    className={`rounded-full px-3.5 py-1.5 border ${
                      isSelected
                        ? 'border-brand-500 bg-brand-500'
                        : 'border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800'
                    }`}
                  >
                    <Text
                      className={`font-sans-semibold text-[12px] ${
                        isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Price & Duration Row */}
          <View className="mb-4 flex-row gap-4">
            <View className="flex-1">
              <Text className="mb-1.5 font-sans-semibold text-[13px] text-slate-700 dark:text-slate-300">
                Fee (ZAR R) *
              </Text>
              <View className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800">
                <Text className="font-sans-bold text-[15px] text-brand-700 dark:text-brand-300 mr-1.5">
                  R
                </Text>
                <TextInput
                  value={priceZar}
                  onChangeText={setPriceZar}
                  keyboardType="numeric"
                  placeholder="500"
                  placeholderTextColor="#94A3B8"
                  className="flex-1 py-1.5 font-sans text-[15px] text-slate-900 dark:text-white"
                />
              </View>
            </View>

            <View className="flex-1">
              <Text className="mb-1.5 font-sans-semibold text-[13px] text-slate-700 dark:text-slate-300">
                Duration (Mins)
              </Text>
              <View className="flex-row gap-1">
                {durations.map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => {
                      tapFeedback();
                      setDurationMinutes(d);
                    }}
                    className={`flex-1 items-center justify-center rounded-xl py-2.5 border ${
                      durationMinutes === d
                        ? 'border-brand-500 bg-brand-500'
                        : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                    }`}
                  >
                    <Text
                      className={`font-sans-semibold text-[12px] ${
                        durationMinutes === d ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {d}m
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>

          {/* Consultation Format (In-person / Video / Both) */}
          <View className="mb-4">
            <Text className="mb-1.5 font-sans-semibold text-[13px] text-slate-700 dark:text-slate-300">
              Consultation Format
            </Text>
            <View className="flex-row gap-2">
              {[
                { id: 'both', label: 'In-person & Video' },
                { id: 'in_person', label: 'In-Person Only' },
                { id: 'video', label: 'Video Call Only' },
              ].map((item) => {
                const isSelected = mode === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      tapFeedback();
                      setMode(item.id as DoctorService['mode']);
                    }}
                    className={`flex-1 items-center justify-center rounded-xl border p-2.5 ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50 dark:border-brand-400 dark:bg-brand-500/20'
                        : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                    }`}
                  >
                    <Text
                      className={`text-center font-sans-semibold text-[12px] ${
                        isSelected
                          ? 'text-brand-700 dark:text-brand-300'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="mb-1.5 font-sans-semibold text-[13px] text-slate-700 dark:text-slate-300">
              What’s Included & Patient Instructions
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Explain what the patient should expect or bring (e.g. Please bring previous blood tests or medication lists)..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              style={{ textAlignVertical: 'top' }}
              className="min-h-[80px] rounded-xl border border-slate-200 bg-slate-50 p-3 font-sans text-[14px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </View>

          {/* Submit Button */}
          <View className="mb-8">
            <ChunkyButton
              label={editingService ? 'Save Changes' : `Publish Service (R${priceZar})`}
              onPress={handleSave}
            />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
