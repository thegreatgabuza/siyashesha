import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  Archive,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  FileText,
  Pill,
  Share2,
  ShieldCheck,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { useToast } from '@/components/ui/Toast';
import { elevation, fonts, navy, radii } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { exportDsarArchive, type DsarExportResult } from '@/lib/dsarExport';
import { exportMedicalSummaryPdf } from '@/lib/pdf';
import { useAppStore } from '@/store/useAppStore';

interface DsarExportModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DsarExportModal({ visible, onClose }: DsarExportModalProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <DsarExportContent onClose={onClose} />
    </Modal>
  );
}

function DsarExportContent({ onClose }: { onClose: () => void }) {
  const t = useTokens();
  const toast = useToast();
  const insets = useSafeAreaInsets();

  const patient = useAppStore((s) => s.patientProfile);
  const records = useAppStore((s) => s.records);
  const medications = useAppStore((s) => s.medications);
  const diaryNotes = useAppStore((s) => s.diaryNotes);
  const appointments = useAppStore((s) => s.appointments);
  const sharedLinks = useAppStore((s) => s.sharedLinks);
  const auditEvents = useAppStore((s) => s.auditEvents);

  const [exporting, setExporting] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [lastResult, setLastResult] = useState<DsarExportResult | null>(null);

  const handleExportJson = async () => {
    setExporting(true);
    try {
      const result = await exportDsarArchive();
      setLastResult(result);
      if (result.success) {
        toast.show('POPIA / HIPAA Health Archive ready to save', 'success');
      } else {
        toast.show(result.error || 'Export failed. Please try again.', 'warning');
      }
    } catch {
      toast.show('Could not complete export. Please try again.', 'warning');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await exportMedicalSummaryPdf(
        {
          reportType: 'comprehensive',
          patient,
          records,
          medications,
          includeEnclaveVerificationSeal: true,
        },
        `Official_Clinical_Summary_${patient.lastName}`
      );
      toast.show('Certified clinical summary PDF exported', 'success');
    } catch {
      toast.show('Could not generate PDF summary. Please try again.', 'warning');
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <View
        style={{
          backgroundColor: t.surface,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          maxHeight: '92%',
          paddingBottom: insets.bottom + 16,
        }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: t.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: radii.md,
                backgroundColor: 'rgba(13, 124, 102, 0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Archive size={20} color="#0D7C66" />
            </View>
            <View>
              <Txt variant="headline">Health Data Archive (DSAR)</Txt>
              <Txt variant="footnote" tone="muted">
                POPIA §23 & HIPAA Right of Access
              </Txt>
            </View>
          </View>
          <PressableScale
            accessibilityLabel="Close"
            onPress={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: radii.pill,
              backgroundColor: t.surfaceMuted,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} color={t.text} />
          </PressableScale>
        </View>

        <ScrollView
          style={{ paddingHorizontal: 20 }}
          contentContainerStyle={{ paddingVertical: 18, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Legal Compliance Banner */}
          <View
            style={{
              borderRadius: radii.lg,
              backgroundColor: 'rgba(11, 37, 89, 0.05)',
              borderWidth: 1,
              borderColor: 'rgba(11, 37, 89, 0.12)',
              padding: 14,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={18} color="#0B2559" />
              <Txt variant="bodyStrong" color="#0B2559">
                Data Subject Access Request (DSAR)
              </Txt>
            </View>
            <Txt variant="footnote" tone="muted" style={{ lineHeight: 18 }}>
              Under South Africa&apos;s <Text style={{ fontFamily: fonts.semibold }}>POPIA Act No. 4 of 2013 (Section 23)</Text> and{' '}
              <Text style={{ fontFamily: fonts.semibold }}>HIPAA 45 CFR §164.524</Text>, you have the full legal right to download,
              inspect, and transfer every piece of personal health information stored in your Siyashesha Health Passport.
            </Txt>
          </View>

          {/* Export Inventory Grid */}
          <View style={{ gap: 8 }}>
            <Txt variant="label" tone="muted">
              ARCHIVE INVENTORY
            </Txt>

            <View style={{ gap: 8 }}>
              <InventoryRow
                icon={<FileText size={16} color="#0D7C66" />}
                title="Medical Records Vault"
                count={`${records.length} records`}
                detail="Blood tests, radiology, discharge summaries, clinical notes & lab metrics"
              />
              <InventoryRow
                icon={<Pill size={16} color="#0284C7" />}
                title="Prescriptions & Regimens"
                count={`${medications.length} items`}
                detail="Active doses, frequencies, prescriber details & 7-day adherence logs"
              />
              <InventoryRow
                icon={<Calendar size={16} color="#D97706" />}
                title="Appointments & Recalls"
                count={`${appointments.length} visits`}
                detail="Scheduled doctor consultations, clinical reviews & reminders"
              />
              <InventoryRow
                icon={<FileCheck2 size={16} color="#7C3AED" />}
                title="Health Diary & Notes"
                count={`${diaryNotes.length} notes`}
                detail="Private observations, categories, dates & voice note records"
              />
              <InventoryRow
                icon={<Share2 size={16} color="#DC1F26" />}
                title="Doctor Sharing History"
                count={`${sharedLinks.length} shares`}
                detail="Time-bounded access authorizations, recipient facilities & PIN logs"
              />
              <InventoryRow
                icon={<Clock size={16} color="#64748B" />}
                title="Immutable Security Audit"
                count={`${auditEvents.length} events`}
                detail="Timestamped trail of logins, document additions, shares & settings"
              />
            </View>
          </View>

          {/* Last Export Result / Seal */}
          {lastResult?.sha256Seal && (
            <View
              style={{
                borderRadius: radii.md,
                backgroundColor: 'rgba(22, 163, 74, 0.08)',
                borderWidth: 1,
                borderColor: 'rgba(22, 163, 74, 0.25)',
                padding: 12,
                gap: 6,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} color="#16A34A" />
                <Txt variant="footnote" color="#16A34A" style={{ fontFamily: fonts.semibold }}>
                  Certified Archive Generated
                </Txt>
              </View>
              <Txt variant="footnote" tone="muted" style={{ fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }}>
                SHA-256: {lastResult.sha256Seal}
              </Txt>
            </View>
          )}

          {/* Export Action Buttons */}
          <View style={{ gap: 10, marginTop: 4 }}>
            <PressableScale
              disabled={exporting}
              onPress={handleExportJson}
              style={[
                {
                  minHeight: 50,
                  borderRadius: radii.pill,
                  backgroundColor: '#0B2559',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  paddingHorizontal: 18,
                },
                elevation[2],
              ]}
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Download size={18} color="#FFFFFF" />
              )}
              <Txt variant="callout" style={{ color: '#FFFFFF', fontFamily: fonts.semibold }}>
                {exporting ? 'Packaging Health Archive…' : 'Download Complete Archive (JSON)'}
              </Txt>
            </PressableScale>

            <PressableScale
              disabled={exportingPdf}
              onPress={handleExportPdf}
              style={{
                minHeight: 46,
                borderRadius: radii.pill,
                backgroundColor: t.surfaceMuted,
                borderWidth: 1,
                borderColor: t.border,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingHorizontal: 16,
              }}
            >
              {exportingPdf ? (
                <ActivityIndicator size="small" color={t.text} />
              ) : (
                <FileText size={16} color={t.text} />
              )}
              <Txt variant="footnote" style={{ fontFamily: fonts.medium, color: t.text }}>
                {exportingPdf ? 'Compiling Certified PDF…' : 'Export Certified Clinical Summary (PDF)'}
              </Txt>
            </PressableScale>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function InventoryRow({
  icon,
  title,
  count,
  detail,
}: {
  icon: any;
  title: string;
  count: string;
  detail: string;
}) {
  const t = useTokens();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        padding: 12,
        borderRadius: radii.md,
        backgroundColor: t.surfaceMuted,
        borderWidth: 1,
        borderColor: t.border,
      }}
    >
      <View style={{ marginTop: 2 }}>{icon}</View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt variant="bodyStrong">{title}</Txt>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: radii.pill,
              backgroundColor: 'rgba(11, 37, 89, 0.08)',
            }}
          >
            <Txt variant="footnote" style={{ fontSize: 11, fontFamily: fonts.semibold, color: navy[700] }}>
              {count}
            </Txt>
          </View>
        </View>
        <Txt variant="footnote" tone="muted" style={{ fontSize: 12 }}>
          {detail}
        </Txt>
      </View>
    </View>
  );
}
