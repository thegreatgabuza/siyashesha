import * as Haptics from 'expo-haptics';
import {
  CheckCircle2,
  FileCheck,
  FileDown,
  FileSpreadsheet,
  FileText,
  HeartPulse,
  Lock,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useToast } from '@/components/ui/Toast';
import { useAccent } from '@/hooks/useAccent';
import {
  exportMedicalSummaryPdf,
  type ReportType,
} from '@/lib/pdf';
import { useAppStore } from '@/store/useAppStore';

interface ExportSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  defaultReportType?: ReportType;
}

export function ExportSummaryModal({
  visible,
  onClose,
  defaultReportType = 'comprehensive',
}: ExportSummaryModalProps) {
  const insets = useSafeAreaInsets();
  const { accent } = useAccent();
  const toast = useToast();

  const patient = useAppStore((s) => s.patientProfile);
  const records = useAppStore((s) => s.records);
  const medications = useAppStore((s) => s.medications);
  const diaryNotes = useAppStore((s) => s.diaryNotes);
  const logAudit = useAppStore((s) => s.logAudit);

  const [reportType, setReportType] = useState<ReportType>(defaultReportType);
  const [includeDiary, setIncludeDiary] = useState(false);
  const [includeEnclaveSeal, setIncludeEnclaveSeal] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const activeMeds = medications.filter((m) => m.status === 'active');

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const dialogTitle =
        reportType === 'emergency'
          ? 'Share Emergency ICE Medical Summary'
          : reportType === 'discharge'
          ? 'Share Clinical Discharge Summary'
          : 'Share Siyashesha Health Passport Summary';

      await exportMedicalSummaryPdf(
        {
          reportType,
          patient,
          records,
          medications,
          diaryNotes: includeDiary ? diaryNotes : [],
          includeDiaryNotes: includeDiary,
          includeEnclaveVerificationSeal: includeEnclaveSeal,
        },
        dialogTitle
      );

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }

      logAudit(
        'export',
        `Exported ${reportType} medical summary PDF (${records.length} records, ${activeMeds.length} active meds)`
      );

      toast.show('Medical summary PDF generated', 'success');
      onClose();
    } catch (err: any) {
      console.error('[ExportSummaryModal] Error generating PDF:', err);
      toast.show('Could not generate PDF. Please try again.', 'warning');
    } finally {
      setIsExporting(false);
    }
  };

  const reportTypes: {
    id: ReportType;
    title: string;
    description: string;
    icon: any;
    color: string;
  }[] = [
    {
      id: 'comprehensive',
      title: 'Comprehensive Passport',
      description: 'Complete health record: all encounters, active prescriptions, chronic conditions & allergies.',
      icon: FileSpreadsheet,
      color: '#0B2559',
    },
    {
      id: 'emergency',
      title: 'Emergency First-Responder ICE',
      description: 'Fast-action summary: blood group, critical allergies, next of kin contacts & active regimens.',
      icon: HeartPulse,
      color: '#DC1F26',
    },
    {
      id: 'discharge',
      title: 'Hospital Discharge Handover',
      description: 'Clinical handover: focuses on inpatient hospital visits, surgery records & discharge instructions.',
      icon: FileText,
      color: '#0D7C66',
    },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/60">
        <View
          className="rounded-t-[32px] bg-white p-6 shadow-xl dark:bg-canvasdark-card"
          style={{ paddingBottom: insets.bottom + 20, maxHeight: '90%' }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <View className="flex-row items-center gap-2.5">
              <View className="h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-500/20">
                <FileDown size={22} color={accent} />
              </View>
              <View>
                <Text className="font-sans-bold text-[18px] text-ink dark:text-white">Export Medical Summary</Text>
                <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">Print-ready certified PDF</Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close export modal"
              className="h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-canvasdark"
            >
              <X size={18} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="pt-4">
            {/* Report Type Selector */}
            <Text className="font-sans-bold text-[13px] uppercase tracking-wider text-ink-muted dark:text-slate-400">
              Select Document Format
            </Text>

            <View className="mt-2.5 gap-2.5">
              {reportTypes.map((type) => {
                const selected = reportType === type.id;
                const IconComponent = type.icon;
                return (
                  <Pressable
                    key={type.id}
                    onPress={() => setReportType(type.id)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={type.title}
                    className={`rounded-2xl border p-3.5 transition-all ${
                      selected
                        ? 'border-brand-600 bg-brand-50/50 dark:border-brand-400 dark:bg-brand-500/10'
                        : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-canvasdark'
                    }`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2.5 flex-1 pr-2">
                        <View
                          className="h-9 w-9 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${type.color}15` }}
                        >
                          <IconComponent size={18} color={type.color} />
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`font-sans-semibold text-[14px] ${
                              selected ? 'text-brand-700 dark:text-brand-300' : 'text-ink dark:text-white'
                            }`}
                          >
                            {type.title}
                          </Text>
                          <Text className="mt-0.5 font-sans text-[11px] leading-[15px] text-ink-muted dark:text-slate-400">
                            {type.description}
                          </Text>
                        </View>
                      </View>
                      <View
                        className={`h-5 w-5 items-center justify-center rounded-full border ${
                          selected
                            ? 'border-brand-600 bg-brand-600 dark:border-brand-400 dark:bg-brand-400'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}
                      >
                        {selected ? <CheckCircle2 size={12} color="#FFFFFF" /> : null}
                      </View>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* Inclusions & Security Toggles */}
            <Text className="mt-5 font-sans-bold text-[13px] uppercase tracking-wider text-ink-muted dark:text-slate-400">
              Security & Inclusions
            </Text>

            <View className="mt-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-canvasdark">
              {/* Enclave Verification Seal */}
              <View className="flex-row items-center justify-between py-1">
                <View className="flex-row items-center gap-2.5 flex-1 pr-3">
                  <ShieldCheck size={18} color="#059669" />
                  <View className="flex-1">
                    <Text className="font-sans-semibold text-[13px] text-ink dark:text-white">
                      Cryptographic Enclave Seal
                    </Text>
                    <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">
                      Embeds SHA-256 verification hash & portal QR code
                    </Text>
                  </View>
                </View>
                <Switch
                  value={includeEnclaveSeal}
                  onValueChange={setIncludeEnclaveSeal}
                  thumbColor="#FFFFFF"
                  trackColor={{ true: accent, false: '#CBD5E1' }}
                />
              </View>

              <View className="my-2 h-[1px] bg-slate-200 dark:bg-slate-800" />

              {/* Diary notes toggle */}
              <View className="flex-row items-center justify-between py-1">
                <View className="flex-row items-center gap-2.5 flex-1 pr-3">
                  <FileCheck size={18} color="#6366F1" />
                  <View className="flex-1">
                    <Text className="font-sans-semibold text-[13px] text-ink dark:text-white">
                      Include Health Journal Entries
                    </Text>
                    <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">
                      Appends recent consultation notes & symptom logs
                    </Text>
                  </View>
                </View>
                <Switch
                  value={includeDiary}
                  onValueChange={setIncludeDiary}
                  thumbColor="#FFFFFF"
                  trackColor={{ true: accent, false: '#CBD5E1' }}
                />
              </View>
            </View>

            {/* Patient Data Preview Chips */}
            <View className="mt-4 flex-row flex-wrap gap-2">
              <View className="rounded-xl bg-slate-100 px-3 py-1.5 dark:bg-canvasdark">
                <Text className="font-sans text-[11px] text-ink dark:text-white">
                  Patient: <Text className="font-sans-semibold">{patient.firstName} {patient.lastName}</Text>
                </Text>
              </View>
              <View className="rounded-xl bg-emergency-50 px-3 py-1.5 dark:bg-emergency-500/20">
                <Text className="font-sans text-[11px] text-emergency-600 dark:text-emergency-400">
                  Blood: <Text className="font-sans-bold">{patient.bloodGroup}</Text>
                </Text>
              </View>
              <View className="rounded-xl bg-brand-50 px-3 py-1.5 dark:bg-brand-500/20">
                <Text className="font-sans text-[11px] text-brand-700 dark:text-brand-300">
                  {activeMeds.length} Active Prescriptions
                </Text>
              </View>
              <View className="rounded-xl bg-slate-100 px-3 py-1.5 dark:bg-canvasdark">
                <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">
                  {records.length} Clinical Encounters
                </Text>
              </View>
            </View>

            {/* Legal / POPIA Safeguard note */}
            <View className="mt-4 flex-row items-center gap-2 rounded-xl bg-blue-50/70 p-3 dark:bg-blue-950/20">
              <Lock size={15} color="#2563EB" />
              <Text className="flex-1 font-sans text-[11px] leading-[16px] text-blue-900 dark:text-blue-300">
                POPIA-compliant export. The recipient receives a certified patient-held clinical summary.
              </Text>
            </View>

            {/* Action Buttons */}
            <View className="mt-6 mb-2">
              <PrimaryButton
                label={isExporting ? 'Generating PDF...' : 'Generate & Share PDF'}
                onPress={handleExport}
                disabled={isExporting}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
