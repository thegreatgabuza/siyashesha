import {
  AlertTriangle,
  CheckCircle2,
  Droplet,
  Heart,
  Mail,
  Phone,
  Pill,
  ShieldAlert,
  Stethoscope,
  User,
  X,
} from 'lucide-react-native';
import { Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { DoctorBooking } from '@/data/doctors';
import { tapFeedback } from '@/lib/feedback';

interface PatientClinicalSummaryModalProps {
  visible: boolean;
  booking: DoctorBooking | null;
  onClose: () => void;
}

export function PatientClinicalSummaryModal({
  visible,
  booking,
  onClose,
}: PatientClinicalSummaryModalProps) {
  const insets = useSafeAreaInsets();

  if (!booking) return null;

  const summary = booking.patientSummary;
  const allergies = summary?.allergies || [];
  const chronic = summary?.chronicConditions || [];
  const meds = summary?.activeMedications || [];
  const ice = summary?.emergencyContact;

  const handleCall = (phoneNum?: string) => {
    if (!phoneNum) return;
    tapFeedback();
    Linking.openURL(`tel:${phoneNum}`).catch(() => {});
  };

  const handleEmail = (emailAddr?: string) => {
    if (!emailAddr) return;
    tapFeedback();
    Linking.openURL(`mailto:${emailAddr}`).catch(() => {});
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
        <View className="flex-row items-center justify-between border-b border-slate-200/80 bg-white px-5 pb-3.5 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
          <View className="flex-1 pr-3">
            <View className="flex-row items-center gap-1.5">
              <Text className="font-display text-[20px] uppercase text-brand-900 dark:text-white">
                Patient Info
              </Text>
              <View className="rounded-full bg-brand-100 px-2 py-0.5 dark:bg-brand-900/40">
                <Text className="font-sans-bold text-[10px] uppercase text-brand-700 dark:text-brand-300">
                  Medical Passport
                </Text>
              </View>
            </View>
            <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
              Health details for {booking.patientName}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close patient info modal"
            onPress={() => {
              tapFeedback();
              onClose();
            }}
            className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200 dark:bg-slate-800 dark:active:bg-slate-700"
          >
            <X size={18} color="#64748B" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-5 pt-4"
          contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Identity & Contact Card */}
          <View className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
            <View className="flex-row items-start justify-between">
              <View className="flex-row items-center gap-3">
                <View className="h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-950/60">
                  <User size={24} color="#0B2559" />
                </View>
                <View>
                  <Text className="font-sans-bold text-[17px] text-slate-900 dark:text-white">
                    {booking.patientName}
                  </Text>
                  <Text className="font-sans text-[11px] text-slate-500 dark:text-slate-400">
                    {summary?.gender ? `${summary.gender} · ` : ''}
                    {summary?.dateOfBirth ? `DOB: ${summary.dateOfBirth}` : 'Patient ID Registered'}
                  </Text>
                </View>
              </View>

              {summary?.bloodGroup ? (
                <View className="items-center rounded-2xl bg-rose-50 px-3 py-1.5 border border-rose-200 dark:bg-rose-950/30 dark:border-rose-900/40">
                  <View className="flex-row items-center gap-1">
                    <Droplet size={12} color="#DC2626" />
                    <Text className="font-display text-[15px] font-black text-rose-700 dark:text-rose-400">
                      {summary.bloodGroup}
                    </Text>
                  </View>
                  <Text className="font-sans-bold text-[9px] uppercase tracking-wider text-rose-600 dark:text-rose-400">
                    Blood Group
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Quick Action Dial / Email Buttons */}
            <View className="mt-3.5 flex-row gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              {booking.patientPhone ? (
                <Pressable
                  onPress={() => handleCall(booking.patientPhone)}
                  className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:active:bg-slate-700"
                >
                  <Phone size={13} color="#16A34A" />
                  <Text className="font-sans-bold text-[11px] text-slate-700 dark:text-slate-200">
                    {booking.patientPhone}
                  </Text>
                </Pressable>
              ) : null}

              {booking.patientEmail ? (
                <Pressable
                  onPress={() => handleEmail(booking.patientEmail)}
                  className="flex-1 flex-row items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 py-2 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:active:bg-slate-700"
                >
                  <Mail size={13} color="#2563EB" />
                  <Text
                    numberOfLines={1}
                    className="font-sans-bold text-[11px] text-slate-700 dark:text-slate-200"
                  >
                    Email Patient
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {/* Booked Service & Consultation Reason */}
          <View className="mt-3.5 rounded-3xl border border-brand-200 bg-brand-50/70 p-4 dark:border-brand-900/50 dark:bg-brand-950/20">
            <View className="flex-row items-center gap-1.5">
              <Stethoscope size={15} color="#0B2559" />
              <Text className="font-sans-bold text-[12px] uppercase tracking-wider text-brand-900 dark:text-brand-300">
                Booked Service & Patient Notes
              </Text>
            </View>
            <Text className="mt-1 font-sans-bold text-[14px] text-slate-900 dark:text-white">
              {booking.serviceName} ({booking.durationMinutes} mins)
            </Text>
            <Text className="mt-1 font-sans text-[12px] leading-[18px] text-slate-700 dark:text-slate-300">
              {booking.notes ? `“${booking.notes}”` : 'Routine check-up / consultation request.'}
            </Text>
          </View>

          {/* DRUG ALLERGIES (SAFETY CRITICAL) */}
          <View className="mt-3.5 rounded-3xl border border-rose-200 bg-white p-4 shadow-2xs dark:border-rose-900/50 dark:bg-canvasdark-card">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <ShieldAlert size={16} color="#DC2626" />
                <Text className="font-sans-bold text-[12px] uppercase tracking-wider text-rose-700 dark:text-rose-400">
                  Known Drug Allergies & Sensitivities
                </Text>
              </View>
              <Text className="font-sans-bold text-[11px] text-rose-600 dark:text-rose-400">
                {allergies.length} Recorded
              </Text>
            </View>

            {allergies.length === 0 ? (
              <View className="mt-2.5 flex-row items-center gap-1.5 rounded-xl bg-emerald-50 p-2.5 dark:bg-emerald-950/30">
                <CheckCircle2 size={14} color="#16A34A" />
                <Text className="font-sans text-[12px] text-emerald-800 dark:text-emerald-300">
                  No adverse drug allergies on file. Verify with patient verbally.
                </Text>
              </View>
            ) : (
              <View className="mt-2.5 gap-2">
                {allergies.map((alg, i) => (
                  <View
                    key={i}
                    className="flex-row items-start justify-between rounded-xl border border-rose-100 bg-rose-50/80 p-2.5 dark:border-rose-950 dark:bg-rose-950/40"
                  >
                    <View className="flex-1 pr-2">
                      <Text className="font-sans-bold text-[13px] text-rose-950 dark:text-rose-200">
                        {alg.substance}
                      </Text>
                      <Text className="mt-0.5 font-sans text-[11px] text-rose-700 dark:text-rose-300">
                        Reaction: {alg.reaction}
                      </Text>
                    </View>
                    <View className="rounded-md bg-rose-200 px-2 py-0.5 dark:bg-rose-900/60">
                      <Text className="font-sans-bold text-[9px] uppercase tracking-wider text-rose-900 dark:text-rose-200">
                        Contraindicated
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* CHRONIC CONDITIONS & ACTIVE MEDICATIONS */}
          <View className="mt-3.5 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
            <View className="flex-row items-center gap-1.5">
              <Heart size={15} color="#0B2559" />
              <Text className="font-sans-bold text-[12px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Chronic Medical Conditions
              </Text>
            </View>

            {chronic.length === 0 ? (
              <Text className="mt-2 font-sans text-[12px] text-slate-500">
                No active chronic diagnoses recorded.
              </Text>
            ) : (
              <View className="mt-2.5 flex-row flex-wrap gap-1.5">
                {chronic.map((cond, i) => (
                  <View
                    key={i}
                    className="rounded-full bg-slate-100 px-3 py-1 border border-slate-200 dark:bg-slate-800 dark:border-slate-700"
                  >
                    <Text className="font-sans-semibold text-[11px] text-slate-800 dark:text-slate-200">
                      {cond}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
              <View className="flex-row items-center gap-1.5">
                <Pill size={15} color="#2563EB" />
                <Text className="font-sans-bold text-[12px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Current Active Medications
                </Text>
              </View>

              {meds.length === 0 ? (
                <Text className="mt-2 font-sans text-[12px] text-slate-500">
                  No active long-term prescription medications on record.
                </Text>
              ) : (
                <View className="mt-2.5 gap-1.5">
                  {meds.map((med, i) => (
                    <View
                      key={i}
                      className="flex-row items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60"
                    >
                      <View className="h-2 w-2 rounded-full bg-brand-500" />
                      <Text className="font-sans-medium text-[12px] text-slate-800 dark:text-slate-200">
                        {med}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>

          {/* EMERGENCY CONTACT (ICE) */}
          {ice?.name ? (
            <View className="mt-3.5 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
              <View className="flex-row items-center gap-1.5">
                <AlertTriangle size={15} color="#F59E0B" />
                <Text className="font-sans-bold text-[12px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Emergency Next-of-Kin (ICE)
                </Text>
              </View>

              <View className="mt-2.5 flex-row items-center justify-between rounded-2xl bg-amber-50/70 p-3 border border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-900/30">
                <View>
                  <Text className="font-sans-bold text-[13px] text-amber-950 dark:text-amber-200">
                    {ice.name}
                  </Text>
                  <Text className="font-sans text-[11px] text-amber-700 dark:text-amber-300">
                    Relationship: {ice.relationship || 'Next of Kin'}
                  </Text>
                </View>

                {ice.phone ? (
                  <Pressable
                    onPress={() => handleCall(ice.phone)}
                    className="flex-row items-center gap-1 rounded-full bg-amber-600 px-3 py-1.5 active:bg-amber-700"
                  >
                    <Phone size={11} color="#FFFFFF" />
                    <Text className="font-sans-bold text-[11px] text-white">Call ICE</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ) : null}

          {/* CLOSE ACTION BUTTON */}
          <View className="mt-5">
            <Pressable
              onPress={() => {
                tapFeedback();
                onClose();
              }}
              className="flex-row items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3.5 shadow-2xs active:bg-brand-600"
            >
              <Text className="font-sans-bold text-[13px] text-white">
                Done Viewing Patient Info
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
