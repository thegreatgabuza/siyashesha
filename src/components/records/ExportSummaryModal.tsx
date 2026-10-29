import dayjs from 'dayjs';
import * as Haptics from 'expo-haptics';
import {
  Check,
  CheckCircle2,
  Download,
  FileCheck,
  FileCode,
  FileDown,
  FileSpreadsheet,
  FileText,
  HeartPulse,
  Lock,
  Share2,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/PressableScale';
import { useToast } from '@/components/ui/Toast';
import type { MedicalRecord } from '@/data/records';
import { fonts, radii } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { useAccent } from '@/hooks/useAccent';
import { tapFeedback } from '@/lib/feedback';
import {
  exportMedicalSummaryPdf,
  exportRecordsCsvFile,
  exportRecordsJsonFile,
  type ExportDeliveryMode,
  type ExportFileFormat,
  type ReportType,
} from '@/lib/pdf';
import { useAppStore } from '@/store/useAppStore';

type RecordScope = 'all' | 'filtered' | 'selected';

interface ExportSummaryModalProps {
  visible: boolean;
  onClose: () => void;
  defaultReportType?: ReportType;
  filteredRecords?: MedicalRecord[];
  activeFilterLabel?: string;
}

export function ExportSummaryModal({
  visible,
  onClose,
  defaultReportType = 'comprehensive',
  filteredRecords,
  activeFilterLabel,
}: ExportSummaryModalProps) {
  const insets = useSafeAreaInsets();
  const t = useTokens();
  const { accent } = useAccent();
  const toast = useToast();

  const patient = useAppStore((s) => s.patientProfile);
  const records = useAppStore((s) => s.records);
  const medications = useAppStore((s) => s.medications);
  const diaryNotes = useAppStore((s) => s.diaryNotes);
  const logAudit = useAppStore((s) => s.logAudit);

  const hasFilterSubset =
    !!filteredRecords &&
    filteredRecords.length > 0 &&
    filteredRecords.length < records.length;

  const [format, setFormat] = useState<ExportFileFormat>('pdf');
  const [scope, setScope] = useState<RecordScope>(() => (hasFilterSubset ? 'filtered' : 'all'));
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const r of filteredRecords ?? records) {
      initial[r.id] = true;
    }
    return initial;
  });
  const [reportType, setReportType] = useState<ReportType>(defaultReportType);
  const [includeDiary, setIncludeDiary] = useState(false);
  const [includeEnclaveSeal, setIncludeEnclaveSeal] = useState(true);
  const [activeAction, setActiveAction] = useState<ExportDeliveryMode | null>(null);

  const targetRecords = useMemo(() => {
    if (scope === 'filtered' && filteredRecords) {
      return filteredRecords;
    }
    if (scope === 'selected') {
      return records.filter((r) => selectedIds[r.id]);
    }
    return records;
  }, [scope, filteredRecords, records, selectedIds]);

  const activeMeds = medications.filter((m) => m.status === 'active');

  if (!visible) return null;

  const toggleRecordSelection = (id: string) => {
    tapFeedback();
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectAllRecords = (selectAll: boolean) => {
    tapFeedback();
    const next: Record<string, boolean> = {};
    if (selectAll) {
      for (const r of records) next[r.id] = true;
    }
    setSelectedIds(next);
  };

  const handleRunExport = async (mode: ExportDeliveryMode) => {
    if (targetRecords.length === 0 && format !== 'pdf') {
      toast.show('Select at least one medical record to export.', 'warning');
      return;
    }

    setActiveAction(mode);
    try {
      const dateStamp = dayjs().format('YYYY-MM-DD');

      if (format === 'csv') {
        await exportRecordsCsvFile(
          targetRecords,
          patient,
          mode,
          `Siyashesha_Records_${targetRecords.length}_${dateStamp}`
        );
        logAudit(
          'export',
          `${mode === 'download' ? 'Downloaded' : 'Shared'} CSV export (${targetRecords.length} records)`
        );
        toast.show(
          mode === 'download'
            ? `Downloaded ${targetRecords.length} records as CSV`
            : `Exported ${targetRecords.length} records as CSV`,
          'success'
        );
      } else if (format === 'json') {
        await exportRecordsJsonFile(
          targetRecords,
          patient,
          mode,
          `Siyashesha_Records_${targetRecords.length}_${dateStamp}`
        );
        logAudit(
          'export',
          `${mode === 'download' ? 'Downloaded' : 'Shared'} JSON archive (${targetRecords.length} records)`
        );
        toast.show(
          mode === 'download'
            ? `Downloaded ${targetRecords.length} records as JSON`
            : `Exported ${targetRecords.length} records as JSON`,
          'success'
        );
      } else {
        const dialogTitle =
          reportType === 'emergency'
            ? 'Emergency ICE Medical Summary'
            : reportType === 'discharge'
            ? 'Clinical Discharge Summary'
            : 'Siyashesha Health Passport Summary';

        await exportMedicalSummaryPdf(
          {
            reportType,
            patient,
            records: targetRecords,
            medications,
            diaryNotes: includeDiary ? diaryNotes : [],
            includeDiaryNotes: includeDiary,
            includeEnclaveVerificationSeal: includeEnclaveSeal,
          },
          dialogTitle,
          mode,
          `Siyashesha_${reportType}_Summary_${dateStamp}.pdf`
        );

        logAudit(
          'export',
          `${mode === 'download' ? 'Downloaded' : 'Shared'} ${reportType} medical summary PDF (${targetRecords.length} records, ${activeMeds.length} active meds)`
        );
        toast.show(
          mode === 'download'
            ? 'Medical summary PDF ready to save'
            : 'Medical summary PDF generated',
          'success'
        );
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      onClose();
    } catch (err: any) {
      console.error('[ExportSummaryModal] Export error:', err);
      toast.show('Could not complete export. Please try again.', 'warning');
    } finally {
      setActiveAction(null);
    }
  };

  const formatOptions: {
    id: ExportFileFormat;
    label: string;
    subtitle: string;
    icon: any;
  }[] = [
    {
      id: 'pdf',
      label: 'PDF Report',
      subtitle: 'Print-ready clinical summary',
      icon: FileText,
    },
    {
      id: 'csv',
      label: 'CSV Table',
      subtitle: 'Excel & Sheets spreadsheet',
      icon: FileSpreadsheet,
    },
    {
      id: 'json',
      label: 'JSON Backup',
      subtitle: 'Portable data archive',
      icon: FileCode,
    },
  ];

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
      description: 'Complete health record: selected encounters, active prescriptions, chronic conditions & allergies.',
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

  const isBusy = activeAction !== null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.55)' }}>
        <Pressable
          accessibilityLabel="Close export modal"
          onPress={onClose}
          style={{ flex: 1 }}
        />

        <View
          style={{
            backgroundColor: t.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            maxHeight: '90%',
            paddingBottom: Math.max(insets.bottom, 16),
            borderTopWidth: 1,
            borderColor: t.border,
          }}
        >
          {/* Drag Handle */}
          <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 4 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: t.border }} />
          </View>

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 6,
              paddingBottom: 14,
              borderBottomWidth: 1,
              borderBottomColor: t.border,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: radii.md,
                  backgroundColor: `${accent}18`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FileDown size={22} color={accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: t.text }}>
                  Download & Export Records
                </Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.textMuted }}>
                  {targetRecords.length} of {records.length} {records.length === 1 ? 'record' : 'records'} selected · {format.toUpperCase()}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close export modal"
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: t.surfaceMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} color={t.text} />
            </Pressable>
          </View>

          <ScrollView
            style={{ flexShrink: 1, paddingHorizontal: 20 }}
            contentContainerStyle={{ paddingVertical: 16, gap: 18 }}
            showsVerticalScrollIndicator={false}
          >
            {/* 1. Export File Format */}
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 12,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  color: t.textMuted,
                }}
              >
                1. Choose File Format
              </Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {formatOptions.map((opt) => {
                  const isSelected = format === opt.id;
                  const IconComp = opt.icon;
                  return (
                    <PressableScale
                      key={opt.id}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={`${opt.label} (${opt.subtitle})`}
                      onPress={() => {
                        tapFeedback();
                        setFormat(opt.id);
                      }}
                      style={{
                        flex: 1,
                        paddingVertical: 12,
                        paddingHorizontal: 10,
                        borderRadius: radii.md,
                        backgroundColor: isSelected ? `${accent}14` : t.surfaceMuted,
                        borderWidth: 1.5,
                        borderColor: isSelected ? accent : t.border,
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <IconComp size={20} color={isSelected ? accent : t.textMuted} />
                      <Text
                        style={{
                          fontFamily: fonts.bold,
                          fontSize: 13,
                          color: isSelected ? accent : t.text,
                        }}
                      >
                        {opt.label}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: fonts.regular,
                          fontSize: 10,
                          color: t.textMuted,
                          textAlign: 'center',
                        }}
                      >
                        {opt.subtitle}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>

            {/* 2. Record Scope Selector */}
            <View style={{ gap: 8 }}>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 12,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  color: t.textMuted,
                }}
              >
                2. Records to Include
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <PressableScale
                  onPress={() => {
                    tapFeedback();
                    setScope('all');
                  }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: radii.pill,
                    backgroundColor: scope === 'all' ? accent : t.surfaceMuted,
                    borderWidth: 1,
                    borderColor: scope === 'all' ? accent : t.border,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.semibold,
                      fontSize: 12,
                      color: scope === 'all' ? '#FFFFFF' : t.text,
                    }}
                  >
                    All Records ({records.length})
                  </Text>
                </PressableScale>

                {hasFilterSubset && (
                  <PressableScale
                    onPress={() => {
                      tapFeedback();
                      setScope('filtered');
                    }}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: radii.pill,
                      backgroundColor: scope === 'filtered' ? accent : t.surfaceMuted,
                      borderWidth: 1,
                      borderColor: scope === 'filtered' ? accent : t.border,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.semibold,
                        fontSize: 12,
                        color: scope === 'filtered' ? '#FFFFFF' : t.text,
                      }}
                    >
                      {activeFilterLabel || 'Current Filter'} ({filteredRecords?.length ?? 0})
                    </Text>
                  </PressableScale>
                )}

                <PressableScale
                  onPress={() => {
                    tapFeedback();
                    setScope('selected');
                  }}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: radii.pill,
                    backgroundColor: scope === 'selected' ? accent : t.surfaceMuted,
                    borderWidth: 1,
                    borderColor: scope === 'selected' ? accent : t.border,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.semibold,
                      fontSize: 12,
                      color: scope === 'selected' ? '#FFFFFF' : t.text,
                    }}
                  >
                    Select Records ({Object.values(selectedIds).filter(Boolean).length})
                  </Text>
                </PressableScale>
              </View>

              {/* Interactive checklist when 'selected' is active */}
              {scope === 'selected' && (
                <View
                  style={{
                    marginTop: 4,
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: t.border,
                    backgroundColor: t.surfaceMuted,
                    padding: 10,
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingHorizontal: 4,
                      paddingBottom: 4,
                    }}
                  >
                    <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: t.textMuted }}>
                      Tap records to include
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <Pressable onPress={() => selectAllRecords(true)}>
                        <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: accent }}>
                          Select all
                        </Text>
                      </Pressable>
                      <Pressable onPress={() => selectAllRecords(false)}>
                        <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: t.textMuted }}>
                          Clear
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {records.map((rec) => {
                    const checked = !!selectedIds[rec.id];
                    return (
                      <Pressable
                        key={rec.id}
                        onPress={() => toggleRecordSelection(rec.id)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 10,
                          paddingVertical: 8,
                          paddingHorizontal: 10,
                          borderRadius: radii.sm,
                          backgroundColor: checked ? t.surface : 'transparent',
                          borderWidth: 1,
                          borderColor: checked ? accent : t.border,
                        }}
                      >
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 6,
                            backgroundColor: checked ? accent : 'transparent',
                            borderWidth: 1.5,
                            borderColor: checked ? accent : t.textMuted,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {checked ? <Check size={13} color="#FFFFFF" /> : null}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            numberOfLines={1}
                            style={{ fontFamily: fonts.semibold, fontSize: 13, color: t.text }}
                          >
                            {rec.title}
                          </Text>
                          <Text
                            numberOfLines={1}
                            style={{ fontFamily: fonts.regular, fontSize: 11, color: t.textMuted }}
                          >
                            {rec.category} · {dayjs(rec.eventDate).format('D MMM YYYY')} · {rec.facility}
                          </Text>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            {/* 3. PDF Template & Options (only when PDF format is chosen) */}
            {format === 'pdf' && (
              <>
                <View style={{ gap: 8 }}>
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 12,
                      letterSpacing: 0.6,
                      textTransform: 'uppercase',
                      color: t.textMuted,
                    }}
                  >
                    3. PDF Report Template
                  </Text>
                  <View style={{ gap: 8 }}>
                    {reportTypes.map((type) => {
                      const selected = reportType === type.id;
                      const IconComponent = type.icon;
                      return (
                        <Pressable
                          key={type.id}
                          onPress={() => {
                            tapFeedback();
                            setReportType(type.id);
                          }}
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          accessibilityLabel={type.title}
                          style={{
                            borderRadius: radii.md,
                            borderWidth: 1.5,
                            borderColor: selected ? accent : t.border,
                            backgroundColor: selected ? `${accent}10` : t.surfaceMuted,
                            padding: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                          }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                            <View
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 10,
                                backgroundColor: `${type.color}18`,
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <IconComponent size={18} color={type.color} />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  fontFamily: fonts.semibold,
                                  fontSize: 14,
                                  color: selected ? accent : t.text,
                                }}
                              >
                                {type.title}
                              </Text>
                              <Text
                                style={{
                                  fontFamily: fonts.regular,
                                  fontSize: 11,
                                  lineHeight: 15,
                                  color: t.textMuted,
                                  marginTop: 2,
                                }}
                              >
                                {type.description}
                              </Text>
                            </View>
                          </View>
                          <View
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 10,
                              borderWidth: 1.5,
                              borderColor: selected ? accent : t.textMuted,
                              backgroundColor: selected ? accent : 'transparent',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {selected ? <CheckCircle2 size={12} color="#FFFFFF" /> : null}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Security & Inclusions */}
                <View
                  style={{
                    borderRadius: radii.md,
                    borderWidth: 1,
                    borderColor: t.border,
                    backgroundColor: t.surfaceMuted,
                    padding: 12,
                    gap: 10,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 10 }}>
                      <ShieldCheck size={18} color="#059669" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: t.text }}>
                          Cryptographic Verification Seal
                        </Text>
                        <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: t.textMuted }}>
                          Embeds SHA-256 integrity hash & verification QR code
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

                  <View style={{ height: 1, backgroundColor: t.border }} />

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 10 }}>
                      <FileCheck size={18} color="#6366F1" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: t.text }}>
                          Include Diary Notes
                        </Text>
                        <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: t.textMuted }}>
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
              </>
            )}

            {/* Legal / POPIA Safeguard note */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                borderRadius: radii.md,
                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                padding: 12,
              }}
            >
              <Lock size={15} color="#2563EB" />
              <Text
                style={{
                  flex: 1,
                  fontFamily: fonts.regular,
                  fontSize: 11,
                  lineHeight: 16,
                  color: t.text,
                }}
              >
                POPIA-compliant patient export ({patient.firstName} {patient.lastName} · {targetRecords.length} records).
              </Text>
            </View>
          </ScrollView>

          {/* Pinned Bottom Action Bar: Download & Share */}
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: t.border,
              flexDirection: 'row',
              gap: 10,
            }}
          >
            <PressableScale
              accessibilityLabel={`Download ${format.toUpperCase()} to device`}
              disabled={isBusy}
              onPress={() => {
                void handleRunExport('download');
              }}
              style={{
                flex: 1,
                height: 48,
                borderRadius: radii.pill,
                backgroundColor: accent,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: isBusy ? 0.65 : 1,
              }}
            >
              {activeAction === 'download' ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Download size={18} color="#FFFFFF" />
              )}
              <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: '#FFFFFF' }}>
                {activeAction === 'download' ? 'Preparing…' : `Download ${format.toUpperCase()}`}
              </Text>
            </PressableScale>

            <PressableScale
              accessibilityLabel={`Share ${format.toUpperCase()}`}
              disabled={isBusy}
              onPress={() => {
                void handleRunExport('share');
              }}
              style={{
                flex: 1,
                height: 48,
                borderRadius: radii.pill,
                backgroundColor: t.surfaceMuted,
                borderWidth: 1.5,
                borderColor: t.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                opacity: isBusy ? 0.65 : 1,
              }}
            >
              {activeAction === 'share' ? (
                <ActivityIndicator size="small" color={t.text} />
              ) : (
                <Share2 size={17} color={t.text} />
              )}
              <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.text }}>
                {activeAction === 'share' ? 'Sharing…' : 'Share'}
              </Text>
            </PressableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
}
