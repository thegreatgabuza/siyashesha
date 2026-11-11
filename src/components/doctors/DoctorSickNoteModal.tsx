import dayjs from 'dayjs';
import {
  CheckCircle2,
  FileText,
  Lock,
  Printer,
  Share2,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { DoctorBooking, DoctorProfile, DoctorSickCertificate } from '@/data/doctors';
import { exportDoctorSickNotePdf } from '@/lib/clinicalPdf';
import { tapFeedback } from '@/lib/feedback';
import { useToast } from '@/components/ui/Toast';

interface DoctorSickNoteModalProps {
  visible: boolean;
  booking: DoctorBooking | null;
  doctor: DoctorProfile;
  existingSickNote?: DoctorSickCertificate;
  onClose: () => void;
  onSave: (sickNote: DoctorSickCertificate) => void;
}

const COMMON_DIAGNOSES = [
  'Acute upper respiratory tract infection (J06.9)',
  'Acute gastroenteritis with mild dehydration (A09)',
  'Severe migraine episode with aura (G43.1)',
  'Acute lumbar musculoligamentous strain (M54.5)',
  'Acute viral pharyngitis & fever (J02.9)',
  'Bilateral conjunctivitis (H10.9)',
];

function generateSickCertificate(params: {
  existingSickNote?: DoctorSickCertificate;
  doctor: DoctorProfile;
  booking: DoctorBooking;
  patientIdNumber: string;
  todayStr: string;
  startDate: string;
  endDate: string;
  resumeDate: string;
  isConfidential: boolean;
  diagnosis: string;
  recommendation: string;
}): DoctorSickCertificate {
  const certNumber =
    params.existingSickNote?.certificateNumber ||
    `MC-${dayjs().format('YYYY')}-${params.doctor.hpcsaNumber.replace(/[^0-9]/g, '').slice(-4)}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

  return {
    id: params.existingSickNote?.id || `sn-${Date.now()}`,
    certificateNumber: certNumber,
    patientName: params.booking.patientName,
    patientIdNumber: params.patientIdNumber.trim() || undefined,
    dateOfExamination: params.booking.date || params.todayStr,
    incapacityStartDate: params.startDate,
    incapacityEndDate: params.endDate,
    resumeDutyDate: params.resumeDate,
    natureOfIncapacity: params.isConfidential ? 'confidential' : 'specified',
    diagnosisStatement: params.isConfidential ? undefined : params.diagnosis.trim(),
    recommendation: params.recommendation.trim(),
    doctorName: `${params.doctor.title} ${params.doctor.fullName}`,
    doctorHpcsaNumber: params.doctor.hpcsaNumber,
    doctorPracticeNumber: '0542318',
    issuedAt: new Date().toISOString(),
  };
}

export function DoctorSickNoteModal({
  visible,
  booking,
  doctor,
  existingSickNote,
  onClose,
  onSave,
}: DoctorSickNoteModalProps) {
  const insets = useSafeAreaInsets();
  const toast = useToast();

  const todayStr = dayjs().format('YYYY-MM-DD');

  // Form State
  const startDate = existingSickNote?.incapacityStartDate || booking?.date || todayStr;
  const [daysCount, setDaysCount] = useState<number>(() => {
    if (existingSickNote) {
      return Math.max(
        1,
        dayjs(existingSickNote.incapacityEndDate).diff(
          dayjs(existingSickNote.incapacityStartDate),
          'day'
        ) + 1
      );
    }
    return 2;
  });

  const [isConfidential, setIsConfidential] = useState(
    existingSickNote?.natureOfIncapacity !== 'specified'
  );
  const [diagnosis, setDiagnosis] = useState(
    existingSickNote?.diagnosisStatement || COMMON_DIAGNOSES[0]
  );
  const [recommendation, setRecommendation] = useState(
    existingSickNote?.recommendation ||
      'Unfit for workplace duties. Recommended complete bed rest and adherence to prescribed treatment.'
  );
  const [patientIdNumber, setPatientIdNumber] = useState(
    existingSickNote?.patientIdNumber || ''
  );
  const [isExporting, setIsExporting] = useState(false);

  if (!booking) return null;

  const endDate = dayjs(startDate).add(daysCount - 1, 'day').format('YYYY-MM-DD');
  const resumeDate = dayjs(startDate).add(daysCount, 'day').format('YYYY-MM-DD');

  const createCertificate = () =>
    generateSickCertificate({
      existingSickNote,
      doctor,
      booking,
      patientIdNumber,
      todayStr,
      startDate,
      endDate,
      resumeDate,
      isConfidential,
      diagnosis,
      recommendation,
    });

  const handleSaveOnly = () => {
    tapFeedback();
    const cert = createCertificate();
    onSave(cert);
    toast.show('Medical Sick Certificate issued and saved', 'success');
    onClose();
  };

  const handleExportPdf = async (mode: 'share' | 'download') => {
    tapFeedback();
    setIsExporting(true);
    try {
      const cert = createCertificate();
      onSave(cert);
      await exportDoctorSickNotePdf(cert, doctor, mode);
      toast.show(
        mode === 'share' ? 'Sick Note ready to share' : 'Sick Note PDF downloaded',
        'success'
      );
    } catch (err) {
      console.error('[SickNoteModal] Export error:', err);
      toast.show('Failed to generate PDF. Please try again.', 'warning');
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
        <View className="flex-row items-center justify-between border-b border-slate-200/80 bg-white px-5 pb-3.5 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
          <View className="flex-1 pr-3">
            <View className="flex-row items-center gap-1.5">
              <Text className="font-display text-[20px] uppercase text-brand-900 dark:text-white">
                Medical Certificate
              </Text>
              <View className="rounded-full bg-emerald-100 px-2 py-0.5 dark:bg-emerald-950/40">
                <Text className="font-sans-bold text-[10px] uppercase text-emerald-700 dark:text-emerald-400">
                  HPCSA Rule 16
                </Text>
              </View>
            </View>
            <Text className="font-sans text-[12px] text-slate-500 dark:text-slate-400">
              For {booking.patientName} · {doctor.practiceName}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close medical certificate modal"
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
          {/* Practice & Legal Compliance Banner */}
          <View className="rounded-2xl border border-brand-200 bg-brand-50/70 p-3.5 dark:border-brand-900/40 dark:bg-brand-950/20">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <ShieldCheck size={16} color="#0B2559" />
                <Text className="font-sans-bold text-[12px] text-brand-950 dark:text-white">
                  {doctor.title} {doctor.fullName} (HPCSA {doctor.hpcsaNumber})
                </Text>
              </View>
              <Text className="font-sans text-[11px] text-brand-700 dark:text-brand-300">
                Exam: {dayjs(booking.date).format('D MMM YYYY')}
              </Text>
            </View>
          </View>

          {/* DURATION OF INCAPACITY */}
          <View className="mt-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
            <Text className="font-sans-bold text-[12px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Period of Recommended Medical Leave
            </Text>

            {/* Quick Days Selector */}
            <View className="mt-2.5 flex-row gap-2">
              {[1, 2, 3, 5, 7].map((num) => (
                <Pressable
                  key={num}
                  onPress={() => {
                    tapFeedback();
                    setDaysCount(num);
                  }}
                  className={`flex-1 items-center justify-center rounded-xl py-2 border ${
                    daysCount === num
                      ? 'border-brand-500 bg-brand-500'
                      : 'border-slate-200 bg-slate-50 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-800'
                  }`}
                >
                  <Text
                    className={`font-sans-bold text-[12px] ${
                      daysCount === num ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {num} {num === 1 ? 'Day' : 'Days'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Dates Calculation Grid */}
            <View className="mt-3.5 grid grid-cols-3 flex-row gap-2">
              <View className="flex-1 rounded-2xl bg-slate-50 p-2.5 text-center dark:bg-slate-800/60">
                <Text className="font-sans text-[10px] uppercase text-slate-400">
                  From Date
                </Text>
                <Text className="mt-1 font-sans-bold text-[12px] text-slate-900 dark:text-white">
                  {dayjs(startDate).format('D MMM YYYY')}
                </Text>
              </View>

              <View className="flex-1 rounded-2xl bg-slate-50 p-2.5 text-center dark:bg-slate-800/60">
                <Text className="font-sans text-[10px] uppercase text-slate-400">
                  Up to & Incl.
                </Text>
                <Text className="mt-1 font-sans-bold text-[12px] text-slate-900 dark:text-white">
                  {dayjs(endDate).format('D MMM YYYY')}
                </Text>
              </View>

              <View className="flex-1 rounded-2xl bg-emerald-50 p-2.5 text-center dark:bg-emerald-950/30">
                <Text className="font-sans-bold text-[10px] uppercase text-emerald-700 dark:text-emerald-400">
                  Resume Work
                </Text>
                <Text className="mt-1 font-sans-bold text-[12px] text-emerald-700 dark:text-emerald-300">
                  {dayjs(resumeDate).format('D MMM YYYY')}
                </Text>
              </View>
            </View>
          </View>

          {/* DIAGNOSIS & CONFIDENTIALITY (HPCSA RULE 16) */}
          <View className="mt-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
            <View className="flex-row items-center justify-between">
              <Text className="font-sans-bold text-[12px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Medical Reason / Statement
              </Text>

              {/* Confidentiality Toggle */}
              <Pressable
                onPress={() => {
                  tapFeedback();
                  setIsConfidential(!isConfidential);
                }}
                className={`flex-row items-center gap-1.5 rounded-full px-3 py-1 ${
                  isConfidential
                    ? 'bg-emerald-100 dark:bg-emerald-950/40'
                    : 'bg-brand-100 dark:bg-brand-900/40'
                }`}
              >
                {isConfidential ? (
                  <Lock size={11} color="#16A34A" />
                ) : (
                  <FileText size={11} color="#0B2559" />
                )}
                <Text
                  className={`font-sans-bold text-[10px] uppercase ${
                    isConfidential
                      ? 'text-emerald-800 dark:text-emerald-300'
                      : 'text-brand-800 dark:text-brand-300'
                  }`}
                >
                  {isConfidential ? 'Confidential' : 'Disclose Reason'}
                </Text>
              </Pressable>
            </View>

            {isConfidential ? (
              <View className="mt-2.5 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <Text className="font-sans-medium text-[12px] italic text-slate-600 dark:text-slate-300">
                  &ldquo;Nature of incapacity: Medical condition as diagnosed by me (diagnosis withheld in accordance with patient privacy rights under HPCSA Rule 16(1)(g)).&rdquo;
                </Text>
              </View>
            ) : (
              <View className="mt-2.5">
                <TextInput
                  value={diagnosis}
                  onChangeText={setDiagnosis}
                  placeholder="Enter medical diagnosis or ICD-10 description..."
                  placeholderTextColor="#94A3B8"
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3 font-sans text-[13px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />

                {/* Common Diagnostic Presets */}
                <Text className="mt-2.5 font-sans-bold text-[10px] uppercase text-slate-400">
                  Quick Primary Care Diagnoses
                </Text>
                <View className="mt-1.5 flex-row flex-wrap gap-1.5">
                  {COMMON_DIAGNOSES.map((d, i) => (
                    <Pressable
                      key={i}
                      onPress={() => {
                        tapFeedback();
                        setDiagnosis(d);
                      }}
                      className="rounded-full bg-slate-100 px-3 py-1 border border-slate-200 active:bg-slate-200 dark:bg-slate-800 dark:border-slate-700"
                    >
                      <Text className="font-sans text-[11px] text-slate-700 dark:text-slate-300">
                        {d.split(' (')[0]}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* WORKPLACE RECOMMENDATIONS */}
          <View className="mt-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
            <Text className="font-sans-bold text-[12px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Workplace Adjustments / Instructions
            </Text>
            <TextInput
              value={recommendation}
              onChangeText={setRecommendation}
              multiline
              numberOfLines={3}
              placeholder="e.g. Unfit for manual handling, avoid driving, complete bed rest..."
              placeholderTextColor="#94A3B8"
              className="mt-2 min-h-[60px] rounded-2xl border border-slate-200 bg-slate-50 p-3 font-sans text-[12px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </View>

          {/* OPTIONAL PATIENT ID */}
          <View className="mt-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-canvasdark-card">
            <Text className="font-sans-bold text-[12px] uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Patient SA ID / Passport Number (Optional)
            </Text>
            <TextInput
              value={patientIdNumber}
              onChangeText={setPatientIdNumber}
              placeholder="e.g. 8806145800082"
              placeholderTextColor="#94A3B8"
              keyboardType="number-pad"
              className="mt-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 font-sans text-[13px] text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </View>

          {/* ACTION BUTTONS */}
          <View className="mt-6 gap-2.5">
            <Pressable
              disabled={isExporting}
              onPress={() => handleExportPdf('share')}
              className="flex-row items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3.5 shadow-2xs active:bg-brand-600"
            >
              <Share2 size={16} color="#FFFFFF" />
              <Text className="font-sans-bold text-[13px] text-white">
                {isExporting ? 'Generating Official Certificate...' : 'Save & Share Certificate PDF'}
              </Text>
            </Pressable>

            <View className="flex-row gap-2">
              <Pressable
                disabled={isExporting}
                onPress={() => handleExportPdf('download')}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white py-3 active:bg-slate-50 dark:border-slate-700 dark:bg-canvasdark-card"
              >
                <Printer size={15} color="#0B2559" />
                <Text className="font-sans-bold text-[12px] text-brand-900 dark:text-white">
                  Print / Save
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSaveOnly}
                className="flex-1 flex-row items-center justify-center gap-1.5 rounded-2xl border border-emerald-300 bg-emerald-50 py-3 active:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40"
              >
                <CheckCircle2 size={15} color="#16A34A" />
                <Text className="font-sans-bold text-[12px] text-emerald-800 dark:text-emerald-300">
                  Save to Record
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
