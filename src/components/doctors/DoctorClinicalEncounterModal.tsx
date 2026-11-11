import {
  CheckCircle2,
  FileText,
  Pill,
  Plus,
  Printer,
  Share2,
  Stethoscope,
  Trash2,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type {
  DoctorBooking,
  DoctorConsultationNotes,
  DoctorPrescriptionItem,
  DoctorProfile,
} from '@/data/doctors';
import { exportDoctorPrescriptionPdf } from '@/lib/clinicalPdf';
import { tapFeedback } from '@/lib/feedback';
import { useToast } from '@/components/ui/Toast';

function makeRxId(): string {
  return `rx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

interface DoctorClinicalEncounterModalProps {
  visible: boolean;
  booking: DoctorBooking | null;
  doctor: DoctorProfile;
  onClose: () => void;
  onSave: (payload: {
    clinicalNotes: DoctorConsultationNotes;
    prescriptions: DoctorPrescriptionItem[];
    markCompleted: boolean;
  }) => void;
}

const COMMON_PRESCRIPTIONS: Omit<DoctorPrescriptionItem, 'id'>[] = [
  {
    medicationName: 'Amoxicillin 500mg Capsules',
    dosage: '1 capsule three times daily (TDS)',
    instructions: 'Take with food every 8 hours. Complete full 5-day course.',
    durationDays: 5,
    repeats: 0,
    quantity: '15 capsules',
  },
  {
    medicationName: 'Paracetamol (Panado) 500mg Tablets',
    dosage: '2 tablets four times daily (QDS) PRN',
    instructions: 'Take 4-6 hourly for fever/pain. Do not exceed 8 tablets in 24 hours.',
    durationDays: 5,
    repeats: 0,
    quantity: '20 tablets',
  },
  {
    medicationName: 'Ibuprofen 400mg Tablets',
    dosage: '1 tablet three times daily (TDS)',
    instructions: 'Take strictly after meals with water for anti-inflammatory relief.',
    durationDays: 5,
    repeats: 0,
    quantity: '15 tablets',
  },
  {
    medicationName: 'Salbutamol Inhaler (100mcg/dose)',
    dosage: '1-2 puffs 4-6 hourly as needed for wheeze/shortness of breath',
    instructions: 'Inhale deeply; use spacer if necessary.',
    durationDays: 30,
    repeats: 1,
    quantity: '1 canister (200 doses)',
  },
  {
    medicationName: 'Cetirizine 10mg Tablets',
    dosage: '1 tablet daily at bedtime',
    instructions: 'Take at night for allergic symptoms.',
    durationDays: 30,
    repeats: 2,
    quantity: '30 tablets',
  },
];

export function DoctorClinicalEncounterModal({
  visible,
  booking,
  doctor,
  onClose,
  onSave,
}: DoctorClinicalEncounterModalProps) {
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'soap' | 'rx'>('soap');

  // SOAP State
  const [subjective, setSubjective] = useState(
    booking?.clinicalNotes?.subjective || booking?.notes || ''
  );
  const [objective, setObjective] = useState(
    booking?.clinicalNotes?.objective || 'Vitals: BP 120/80 mmHg, HR 72 bpm, Temp 36.8°C, SpO2 98% room air.'
  );
  const [assessment, setAssessment] = useState(
    booking?.clinicalNotes?.assessment || ''
  );
  const [plan, setPlan] = useState(
    booking?.clinicalNotes?.plan || 'Prescribed supportive medications. Advised adequate hydration and rest. Review if symptoms worsen.'
  );

  // Prescriptions State
  const [prescriptions, setPrescriptions] = useState<DoctorPrescriptionItem[]>(
    booking?.prescriptions || []
  );

  // New Prescription Entry Form State
  const [showAddRx, setShowAddRx] = useState(false);
  const [rxName, setRxName] = useState('');
  const [rxDosage, setRxDosage] = useState('');
  const [rxInstructions, setRxInstructions] = useState('');
  const [rxQty, setRxQty] = useState('1 box');
  const [rxRepeats, setRxRepeats] = useState<number>(0);

  const [isExporting, setIsExporting] = useState(false);

  if (!booking) return null;

  const handleAddCustomRx = () => {
    if (!rxName.trim()) {
      toast.show('Please enter medication name', 'warning');
      return;
    }
    tapFeedback();
    const newItem: DoctorPrescriptionItem = {
      id: makeRxId(),
      medicationName: rxName.trim(),
      dosage: rxDosage.trim() || 'As directed',
      instructions: rxInstructions.trim() || 'Take as instructed by practitioner',
      durationDays: 7,
      repeats: rxRepeats,
      quantity: rxQty.trim() || '1 original pack',
    };
    setPrescriptions((prev) => [...prev, newItem]);
    setRxName('');
    setRxDosage('');
    setRxInstructions('');
    setShowAddRx(false);
    toast.show('Medication added to prescription', 'success');
  };

  const handleAddPresetRx = (preset: Omit<DoctorPrescriptionItem, 'id'>) => {
    tapFeedback();
    const newItem: DoctorPrescriptionItem = {
      ...preset,
      id: makeRxId(),
    };
    setPrescriptions((prev) => [...prev, newItem]);
    toast.show(`Added ${preset.medicationName}`, 'info');
  };

  const handleDeleteRx = (id: string) => {
    tapFeedback();
    setPrescriptions((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = (markCompleted: boolean) => {
    tapFeedback();
    const notesPayload: DoctorConsultationNotes = {
      subjective: subjective.trim(),
      objective: objective.trim(),
      assessment: assessment.trim() || 'Consultation Completed',
      plan: plan.trim(),
      recordedAt: new Date().toISOString(),
    };

    onSave({
      clinicalNotes: notesPayload,
      prescriptions,
      markCompleted,
    });

    toast.show(
      markCompleted
        ? 'Consultation completed & clinical record saved'
        : 'Consultation notes updated',
      'success'
    );
    onClose();
  };

  const handleExportRxPdf = async (mode: 'share' | 'download') => {
    if (prescriptions.length === 0) {
      toast.show('Please add at least one medication to prescribe', 'warning');
      return;
    }
    tapFeedback();
    setIsExporting(true);
    try {
      const notesPayload: DoctorConsultationNotes = {
        subjective: subjective.trim(),
        objective: objective.trim(),
        assessment: assessment.trim() || 'Consultation Completed',
        plan: plan.trim(),
        recordedAt: new Date().toISOString(),
      };
      await exportDoctorPrescriptionPdf(
        {
          doctor,
          booking,
          prescriptions,
          clinicalNotes: notesPayload,
        },
        mode
      );
      toast.show(
        mode === 'share' ? 'Prescription ready to share' : 'Prescription PDF downloaded',
        'success'
      );
    } catch (err) {
      console.error('[ClinicalEncounterModal] Export error:', err);
      toast.show('Failed to generate prescription PDF', 'warning');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={{ paddingTop: insets.top + 8 }} className="flex-1 bg-slate-50 dark:bg-canvasdark">
        {/* Header Bar */}
        <View className="border-b border-slate-200/80 bg-white px-5 pb-3.5 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <View className="flex-row items-center gap-1.5">
                <Text className="font-display text-[20px] uppercase text-brand-900 dark:text-white">
                  Clinical Consultation
                </Text>
                <View className="rounded-full bg-brand-100 px-2 py-0.5 dark:bg-brand-900/40">
                  <Text className="font-sans-bold text-[10px] uppercase text-brand-700 dark:text-brand-300">
                    Active Encounter
                  </Text>
                </View>
              </View>
              <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
                Patient: {booking.patientName} · {booking.serviceName}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close consultation modal"
              onPress={() => {
                tapFeedback();
                onClose();
              }}
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200 dark:bg-slate-800 dark:active:bg-slate-700"
            >
              <X size={18} color="#64748B" />
            </Pressable>
          </View>

          {/* Sub-Tabs: SOAP Notes vs Prescriptions */}
          <View className="mt-3.5 flex-row rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
            <Pressable
              onPress={() => {
                tapFeedback();
                setActiveTab('soap');
              }}
              className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2 ${
                activeTab === 'soap' ? 'bg-white shadow-2xs dark:bg-slate-700' : ''
              }`}
            >
              <Stethoscope
                size={13}
                color={activeTab === 'soap' ? '#0B2559' : '#64748B'}
              />
              <Text
                className={`font-sans-bold text-[12px] ${
                  activeTab === 'soap'
                    ? 'text-brand-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                SOAP Notes
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                tapFeedback();
                setActiveTab('rx');
              }}
              className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-xl py-2 ${
                activeTab === 'rx' ? 'bg-white shadow-2xs dark:bg-slate-700' : ''
              }`}
            >
              <Pill
                size={13}
                color={activeTab === 'rx' ? '#0B2559' : '#64748B'}
              />
              <Text
                className={`font-sans-bold text-[12px] ${
                  activeTab === 'rx'
                    ? 'text-brand-900 dark:text-white'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Prescription ({prescriptions.length})
              </Text>
            </Pressable>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-5 pt-4"
          contentContainerStyle={{ paddingBottom: insets.bottom + 60 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ======================================================== */}
          {/* TAB 1: SOAP CLINICAL NOTES                               */}
          {/* ======================================================== */}
          {activeTab === 'soap' ? (
            <View className="gap-3.5">
              {/* S: SUBJECTIVE */}
              <View className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
                <View className="flex-row items-center gap-2">
                  <View className="h-6 w-6 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-950/60">
                    <Text className="font-display text-[12px] font-black text-brand-900 dark:text-brand-300">
                      S
                    </Text>
                  </View>
                  <Text className="font-sans-bold text-[12px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Subjective (History & Symptoms)
                  </Text>
                </View>
                <TextInput
                  value={subjective}
                  onChangeText={setSubjective}
                  multiline
                  numberOfLines={3}
                  placeholder="Patient's reported symptoms, duration, aggravators..."
                  placeholderTextColor="#94A3B8"
                  className="mt-2.5 min-h-[60px] rounded-2xl border border-slate-200 bg-slate-50 p-3 font-sans text-[12px] leading-[18px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </View>

              {/* O: OBJECTIVE */}
              <View className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
                <View className="flex-row items-center gap-2">
                  <View className="h-6 w-6 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-950/60">
                    <Text className="font-display text-[12px] font-black text-brand-900 dark:text-brand-300">
                      O
                    </Text>
                  </View>
                  <Text className="font-sans-bold text-[12px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Objective (Vitals & Physical Exam)
                  </Text>
                </View>
                <TextInput
                  value={objective}
                  onChangeText={setObjective}
                  multiline
                  numberOfLines={3}
                  placeholder="Vitals, chest auscultation, ENT exam, heart sounds..."
                  placeholderTextColor="#94A3B8"
                  className="mt-2.5 min-h-[60px] rounded-2xl border border-slate-200 bg-slate-50 p-3 font-sans text-[12px] leading-[18px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </View>

              {/* A: ASSESSMENT */}
              <View className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
                <View className="flex-row items-center gap-2">
                  <View className="h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950/60">
                    <Text className="font-display text-[12px] font-black text-emerald-800 dark:text-emerald-300">
                      A
                    </Text>
                  </View>
                  <Text className="font-sans-bold text-[12px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Assessment (Clinical Diagnosis & ICD-10)
                  </Text>
                </View>
                <TextInput
                  value={assessment}
                  onChangeText={setAssessment}
                  placeholder="e.g. Acute upper respiratory infection (J06.9)"
                  placeholderTextColor="#94A3B8"
                  className="mt-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3 font-sans text-[13px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </View>

              {/* P: PLAN */}
              <View className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
                <View className="flex-row items-center gap-2">
                  <View className="h-6 w-6 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-950/60">
                    <Text className="font-display text-[12px] font-black text-brand-900 dark:text-brand-300">
                      P
                    </Text>
                  </View>
                  <Text className="font-sans-bold text-[12px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Plan (Management & Instructions)
                  </Text>
                </View>
                <TextInput
                  value={plan}
                  onChangeText={setPlan}
                  multiline
                  numberOfLines={3}
                  placeholder="Medication plan, safety netting, red flag warnings, follow-up..."
                  placeholderTextColor="#94A3B8"
                  className="mt-2.5 min-h-[60px] rounded-2xl border border-slate-200 bg-slate-50 p-3 font-sans text-[12px] leading-[18px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </View>
            </View>
          ) : null}

          {/* ======================================================== */}
          {/* TAB 2: ELECTRONIC PRESCRIPTION (E-SCRIPT)                */}
          {/* ======================================================== */}
          {activeTab === 'rx' ? (
            <View>
              <View className="mb-3.5 flex-row items-center justify-between">
                <View>
                  <Text className="font-sans-bold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Prescribed Items ({prescriptions.length})
                  </Text>
                  <Text className="font-sans text-[11px] text-slate-400">
                    Official e-Script for pharmacy dispensing
                  </Text>
                </View>

                <Pressable
                  onPress={() => {
                    tapFeedback();
                    setShowAddRx(!showAddRx);
                  }}
                  className="flex-row items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1.5 active:bg-brand-600"
                >
                  <Plus size={13} color="#FFFFFF" />
                  <Text className="font-sans-bold text-[11px] text-white">
                    {showAddRx ? 'Close Form' : 'Add Medication'}
                  </Text>
                </Pressable>
              </View>

              {/* Add Custom Medication Drawer */}
              {showAddRx ? (
                <View className="mb-4 rounded-3xl border border-brand-200 bg-white p-4 shadow-sm dark:border-brand-900/50 dark:bg-canvasdark-card">
                  <Text className="font-sans-bold text-[13px] text-brand-950 dark:text-white">
                    Prescribe Medication
                  </Text>

                  <TextInput
                    value={rxName}
                    onChangeText={setRxName}
                    placeholder="Medication Name & Strength (e.g. Augmentin 625mg)"
                    placeholderTextColor="#94A3B8"
                    className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-sans text-[12px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                  <TextInput
                    value={rxDosage}
                    onChangeText={setRxDosage}
                    placeholder="Dosage & Frequency (e.g. 1 tablet BD with food)"
                    placeholderTextColor="#94A3B8"
                    className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-sans text-[12px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                  <TextInput
                    value={rxInstructions}
                    onChangeText={setRxInstructions}
                    placeholder="Directions / Warning (e.g. Finish 5-day course)"
                    placeholderTextColor="#94A3B8"
                    className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-sans text-[12px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                  <View className="mt-2 flex-row gap-2">
                    <TextInput
                      value={rxQty}
                      onChangeText={setRxQty}
                      placeholder="Quantity (e.g. 20 tabs)"
                      placeholderTextColor="#94A3B8"
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-sans text-[12px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />

                    {/* Repeats Selector */}
                    <View className="flex-row items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-800">
                      <Text className="font-sans-medium text-[11px] text-slate-500">
                        Repeats:
                      </Text>
                      {[0, 1, 3, 5].map((rep) => (
                        <Pressable
                          key={rep}
                          onPress={() => {
                            tapFeedback();
                            setRxRepeats(rep);
                          }}
                          className={`rounded-md px-2 py-1 ${
                            rxRepeats === rep ? 'bg-brand-500' : 'bg-transparent'
                          }`}
                        >
                          <Text
                            className={`font-sans-bold text-[10px] ${
                              rxRepeats === rep ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {rep}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <Pressable
                    onPress={handleAddCustomRx}
                    className="mt-3.5 items-center justify-center rounded-xl bg-brand-500 py-2.5 active:bg-brand-600"
                  >
                    <Text className="font-sans-bold text-[12px] text-white">
                      Confirm Prescription Item
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {/* Preset Medications Chips */}
              <View className="mb-3.5">
                <Text className="font-sans-bold text-[10px] uppercase text-slate-400">
                  Quick Primary Care Presets
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-1.5 flex-row gap-1.5">
                  {COMMON_PRESCRIPTIONS.map((preset, i) => (
                    <Pressable
                      key={i}
                      onPress={() => handleAddPresetRx(preset)}
                      className="mr-1.5 flex-row items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 active:bg-slate-50 dark:border-slate-700 dark:bg-slate-800"
                    >
                      <Plus size={11} color="#0B2559" />
                      <Text className="font-sans-medium text-[11px] text-slate-800 dark:text-slate-200">
                        {preset.medicationName.split(' ')[0]}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>

              {/* Current Prescriptions List */}
              {prescriptions.length === 0 ? (
                <View className="items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-10 px-4 dark:border-slate-800 dark:bg-canvasdark-card">
                  <Pill size={32} color="#94A3B8" />
                  <Text className="mt-2 font-sans-bold text-[14px] text-slate-700 dark:text-slate-200">
                    No Medications Prescribed Yet
                  </Text>
                  <Text className="mt-0.5 text-center font-sans text-[11px] text-slate-400">
                    Tap a quick preset above or create a custom script item.
                  </Text>
                </View>
              ) : (
                <View className="gap-2.5">
                  {prescriptions.map((rx, idx) => (
                    <View
                      key={rx.id}
                      className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card"
                    >
                      <View className="flex-row items-start justify-between">
                        <View className="flex-1 pr-2">
                          <View className="flex-row items-center gap-1.5">
                            <Text className="font-sans-bold text-[11px] text-slate-400">
                              #{idx + 1}
                            </Text>
                            <Text className="font-sans-bold text-[14px] text-slate-900 dark:text-white">
                              {rx.medicationName}
                            </Text>
                          </View>
                          <Text className="mt-1 font-sans-semibold text-[11px] text-brand-700 dark:text-brand-300">
                            {rx.dosage}
                          </Text>
                          <Text className="mt-0.5 font-sans text-[11px] text-slate-500 dark:text-slate-400">
                            {rx.instructions}
                          </Text>
                        </View>

                        <Pressable
                          onPress={() => handleDeleteRx(rx.id)}
                          className="h-7 w-7 items-center justify-center rounded-full bg-rose-50 active:bg-rose-100 dark:bg-rose-950/40"
                        >
                          <Trash2 size={12} color="#DC2626" />
                        </Pressable>
                      </View>

                      <View className="mt-2.5 flex-row items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                        <Text className="font-sans text-[11px] text-slate-500">
                          Qty: <Text className="font-sans-bold text-slate-900 dark:text-white">{rx.quantity}</Text>
                        </Text>
                        <View className="rounded-full bg-emerald-50 px-2 py-0.5 dark:bg-emerald-950/30">
                          <Text className="font-sans-bold text-[10px] text-emerald-700 dark:text-emerald-300">
                            {rx.repeats > 0 ? `${rx.repeats}x Repeats` : '0 Repeats'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}

                  {/* Export / Share e-Script Buttons */}
                  <View className="mt-3 flex-row gap-2">
                    <Pressable
                      disabled={isExporting}
                      onPress={() => handleExportRxPdf('share')}
                      className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl bg-brand-500 py-3 shadow-2xs active:bg-brand-600"
                    >
                      <Share2 size={14} color="#FFFFFF" />
                      <Text className="font-sans-bold text-[12px] text-white">
                        {isExporting ? 'Generating...' : 'Share e-Script PDF'}
                      </Text>
                    </Pressable>

                    <Pressable
                      disabled={isExporting}
                      onPress={() => handleExportRxPdf('download')}
                      className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-3 active:bg-slate-50 dark:border-slate-700 dark:bg-canvasdark-card"
                    >
                      <Printer size={14} color="#0B2559" />
                      <Text className="font-sans-bold text-[12px] text-brand-900 dark:text-white">
                        Print / Download
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          ) : null}

          {/* MAIN ENCOUNTER ACTIONS */}
          <View className="mt-6 gap-2.5">
            <Pressable
              onPress={() => handleSave(true)}
              className="flex-row items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 shadow-2xs active:bg-emerald-700"
            >
              <CheckCircle2 size={16} color="#FFFFFF" />
              <Text className="font-sans-bold text-[13px] text-white">
                Complete Encounter & Save Records
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handleSave(false)}
              className="flex-row items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-3 active:bg-slate-50 dark:border-slate-700 dark:bg-canvasdark-card"
            >
              <FileText size={15} color="#0B2559" />
              <Text className="font-sans-bold text-[12px] text-brand-900 dark:text-white">
                Save Progress (Keep Confirmed)
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
