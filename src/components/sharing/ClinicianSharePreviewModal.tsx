import dayjs from 'dayjs';
import * as Sharing from 'expo-sharing';
import {
  AlertTriangle,
  BookHeart,
  Clock,
  FileText,
  Lock,
  ShieldCheck,
  Stethoscope,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useToast } from '@/components/ui/Toast';
import type { DiaryNote } from '@/data/diarySeed';
import type { MedicalRecord } from '@/data/records';
import type { SharedLink } from '@/data/sharing';
import { ensureLocalOriginalFile } from '@/lib/documents';
import { verifySharedLinkWithPin, type SharedLinkSnapshot } from '@/lib/supabase';
import { useAppStore } from '@/store/useAppStore';

interface ClinicianSharePreviewModalProps {
  visible: boolean;
  shareId: string | null;
  onClose: () => void;
}

export function ClinicianSharePreviewModal({
  visible,
  shareId,
  onClose,
}: ClinicianSharePreviewModalProps) {
  const toast = useToast();
  const sharedLinks = useAppStore((s) => s.sharedLinks);
  const allRecords = useAppStore((s) => s.records);
  const allDiaryNotes = useAppStore((s) => s.diaryNotes);
  const patientProfile = useAppStore((s) => s.patientProfile);
  const logAudit = useAppStore((s) => s.logAudit);

  const [pinInput, setPinInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unlockedLink, setUnlockedLink] = useState<SharedLink | null>(null);
  const [unlockedSnapshot, setUnlockedSnapshot] = useState<SharedLinkSnapshot | null>(null);

  const handleClose = () => {
    setPinInput('');
    setErrorMsg(null);
    setUnlockedLink(null);
    setUnlockedSnapshot(null);
    onClose();
  };

  const localLink = sharedLinks.find((l) => l.id === shareId);

  const handleVerifyPin = async () => {
    if (!shareId) return;
    const cleanPin = pinInput.trim();
    if (cleanPin.length !== 4) {
      setErrorMsg('Enter the 4-digit clinician access PIN.');
      return;
    }

    setVerifying(true);
    setErrorMsg(null);

    try {
      // 1. Verify against Supabase Cloud Backend (`verify_shared_link` RPC / `shared_links` table)
      const cloudRes = await verifySharedLinkWithPin(shareId, cleanPin);

      if (cloudRes.ok && cloudRes.link) {
        const resolvedSnapshot: SharedLinkSnapshot = cloudRes.snapshot?.records
          ? cloudRes.snapshot
          : {
              patientSummary: {
                fullName:
                  [patientProfile.firstName, patientProfile.lastName].filter(Boolean).join(' ') ||
                  'Patient',
                dateOfBirth: patientProfile.dateOfBirth || 'Unknown',
                bloodGroup: patientProfile.bloodGroup || 'Unknown',
                allergies: patientProfile.allergies ?? [],
                chronicConditions: patientProfile.chronicConditions ?? [],
                emergencyContact: patientProfile.emergencyContact,
              },
              records: allRecords.filter((r) => cloudRes.link!.recordIds.includes(r.id)),
              diaryNotes: allDiaryNotes.filter((n) => cloudRes.link!.diaryNoteIds.includes(n.id)),
            };

        setUnlockedLink(cloudRes.link);
        setUnlockedSnapshot(resolvedSnapshot);
        logAudit(
          'share',
          `Verified clinician PIN access for ${cloudRes.link.recipientName} (${cloudRes.link.recipientFacility})`
        );
        return;
      }

      // 2. If cloud returned an explicit denial (wrong PIN / expired / revoked), respect it
      if (
        cloudRes.error &&
        cloudRes.error !== 'Unable to verify share link in cloud.' &&
        cloudRes.error !== 'Share link not found.'
      ) {
        setErrorMsg(cloudRes.error);
        return;
      }

      // 3. Offline / local fallback verification
      if (!localLink) {
        setErrorMsg(cloudRes.error || 'Share link not found.');
        return;
      }

      if (localLink.status === 'revoked') {
        setErrorMsg('This share link has been revoked by the patient.');
        return;
      }

      if (
        localLink.status === 'expired' ||
        (localLink.expiresAt && new Date(localLink.expiresAt).getTime() <= Date.now())
      ) {
        setErrorMsg('This share link has expired.');
        return;
      }

      if (localLink.pin.trim() !== cleanPin) {
        setErrorMsg('Incorrect 4-digit access PIN.');
        return;
      }

      const fallbackSnapshot: SharedLinkSnapshot = {
        patientSummary: {
          fullName:
            [patientProfile.firstName, patientProfile.lastName].filter(Boolean).join(' ') ||
            'Patient',
          dateOfBirth: patientProfile.dateOfBirth || 'Unknown',
          bloodGroup: patientProfile.bloodGroup || 'Unknown',
          allergies: patientProfile.allergies ?? [],
          chronicConditions: patientProfile.chronicConditions ?? [],
          emergencyContact: patientProfile.emergencyContact,
        },
        records: allRecords.filter((r) => localLink.recordIds.includes(r.id)),
        diaryNotes: allDiaryNotes.filter((n) => localLink.diaryNoteIds.includes(n.id)),
      };

      setUnlockedLink(localLink);
      setUnlockedSnapshot(fallbackSnapshot);
      logAudit(
        'share',
        `Verified clinician PIN access for ${localLink.recipientName} (${localLink.recipientFacility})`
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleOpenAttachment = async (record: MedicalRecord) => {
    if (!record.originalFile) return;
    try {
      const localUri = await ensureLocalOriginalFile(record.originalFile, record.id);
      await Sharing.shareAsync(localUri, {
        mimeType: record.originalFile.mimeType,
        dialogTitle: record.originalFile.name,
      });
    } catch {
      toast.show('Could not open attached document file.', 'warning');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View className="flex-1 bg-slate-50 dark:bg-canvasdark">
        {/* Top Header */}
        <View className="flex-row items-center justify-between border-b border-slate-200 bg-white px-5 py-4 dark:border-canvasdark-card dark:bg-canvasdark-card">
          <View className="flex-row items-center gap-2.5">
            <View className="h-9 w-9 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-500/20">
              <Stethoscope size={18} color="#0B2559" />
            </View>
            <View>
              <Text className="font-sans-bold text-[15px] text-ink dark:text-slate-50">
                Clinician Share Portal
              </Text>
              <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">
                Time-limited PIN-protected clinical access
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close clinician portal"
            onPress={handleClose}
            className="h-9 w-9 items-center justify-center rounded-full bg-slate-100 dark:bg-canvasdark"
          >
            <X size={18} color="#5B6478" />
          </Pressable>
        </View>

        {!unlockedLink || !unlockedSnapshot ? (
          /* PIN Gate Screen */
          <ScrollView className="flex-1 px-6 pt-8" keyboardShouldPersistTaps="handled">
            <View className="items-center rounded-3xl border border-slate-200 bg-white p-6 dark:border-canvasdark-card dark:bg-canvasdark-card">
              <View className="mb-4 h-14 w-14 items-center justify-center rounded-2xl bg-ink dark:bg-brand-500">
                <Lock size={24} color="#FFFFFF" />
              </View>
              <Text className="text-center font-sans-bold text-[18px] text-ink dark:text-slate-50">
                Enter Clinician Access PIN
              </Text>
              {localLink ? (
                <Text className="mt-1 text-center font-sans text-[13px] text-ink-muted dark:text-slate-400">
                  Prepared for{' '}
                  <Text className="font-sans-semibold text-ink dark:text-slate-200">
                    {localLink.recipientName}
                  </Text>{' '}
                  ({localLink.recipientFacility})
                </Text>
              ) : null}
              <Text className="mt-1 text-center font-sans text-[11px] text-ink-muted dark:text-slate-500">
                Share ID: {shareId}
              </Text>

              <TextInput
                value={pinInput}
                onChangeText={(v) => {
                  setErrorMsg(null);
                  setPinInput(v.replace(/[^0-9]/g, '').slice(0, 4));
                }}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="••••"
                placeholderTextColor="#94A3B8"
                accessibilityLabel="4-digit clinician PIN"
                className="mt-5 min-h-[54px] w-48 rounded-2xl border border-slate-300 bg-slate-50 text-center font-sans-bold text-[24px] tracking-[10px] text-ink dark:border-slate-700 dark:bg-canvasdark dark:text-slate-50"
              />

              {errorMsg ? (
                <View className="mt-4 flex-row items-center gap-2 rounded-2xl bg-emergency-50 px-4 py-2.5 dark:bg-emergency-500/15">
                  <AlertTriangle size={15} color="#DC1F26" />
                  <Text className="flex-1 font-sans-medium text-[12px] text-emergency-600 dark:text-emergency-400">
                    {errorMsg}
                  </Text>
                </View>
              ) : null}

              <View className="mt-6 w-full">
                <PrimaryButton
                  label={verifying ? 'Verifying with Cloud Vault…' : 'Unlock Shared Records'}
                  onPress={handleVerifyPin}
                  disabled={pinInput.length !== 4 || verifying}
                />
              </View>

              {verifying ? (
                <View className="mt-3 flex-row items-center gap-2">
                  <ActivityIndicator size="small" color="#0B2559" />
                  <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">
                    Verifying PIN & expiration in Supabase…
                  </Text>
                </View>
              ) : null}
            </View>
          </ScrollView>
        ) : (
          /* Unlocked Clinician View */
          <ScrollView className="flex-1 px-5 py-4" contentContainerStyle={{ gap: 14, paddingBottom: 40 }}>
            {/* Verification Banner */}
            <View className="rounded-3xl bg-ink p-5 dark:bg-canvasdark-card">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1">
                  <ShieldCheck size={14} color="#34D399" />
                  <Text className="font-sans-bold text-[11px] text-emerald-300">
                    PIN VERIFIED · READ-ONLY
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Clock size={12} color="#94A3B8" />
                  <Text className="font-sans text-[11px] text-white/70">
                    Expires {dayjs(unlockedLink.expiresAt).format('D MMM, h:mm A')}
                  </Text>
                </View>
              </View>
              <Text className="mt-3 font-sans-bold text-[18px] text-white">
                {unlockedSnapshot.patientSummary.fullName}
              </Text>
              <Text className="mt-0.5 font-sans text-[12px] text-white/70">
                DOB: {unlockedSnapshot.patientSummary.dateOfBirth} · Blood Group:{' '}
                {unlockedSnapshot.patientSummary.bloodGroup}
              </Text>
              <Text className="mt-2 font-sans text-[11px] text-sky-300">
                Authorized for {unlockedLink.recipientName} ({unlockedLink.recipientFacility})
              </Text>
            </View>

            {/* Allergies & Chronic Conditions Strip */}
            <View className="flex-row gap-2.5">
              <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-canvasdark-card dark:bg-canvasdark-card">
                <Text className="font-sans-semibold text-[11px] uppercase text-ink-muted dark:text-slate-400">
                  Allergies
                </Text>
                <Text className="mt-1 font-sans-bold text-[13px] text-emergency-600 dark:text-emergency-400">
                  {unlockedSnapshot.patientSummary.allergies.length > 0
                    ? unlockedSnapshot.patientSummary.allergies
                        .map((a) => `${a.substance} (${a.reaction})`)
                        .join('; ')
                    : 'No allergies recorded'}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-canvasdark-card dark:bg-canvasdark-card">
                <Text className="font-sans-semibold text-[11px] uppercase text-ink-muted dark:text-slate-400">
                  Chronic Conditions
                </Text>
                <Text className="mt-1 font-sans-semibold text-[13px] text-ink dark:text-slate-100">
                  {unlockedSnapshot.patientSummary.chronicConditions.length > 0
                    ? unlockedSnapshot.patientSummary.chronicConditions.join(', ')
                    : 'None recorded'}
                </Text>
              </View>
            </View>

            {/* Authorized Medical Records */}
            <Text className="mt-2 font-sans-bold text-[14px] text-ink dark:text-slate-50">
              Shared Medical Records ({unlockedSnapshot.records.length})
            </Text>
            {unlockedSnapshot.records.map((rec) => (
              <View
                key={rec.id}
                className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card"
              >
                <View className="flex-row items-center justify-between">
                  <View className="rounded-full bg-brand-50 px-2.5 py-0.5 dark:bg-brand-500/20">
                    <Text className="font-sans-semibold text-[11px] text-brand-700 dark:text-brand-300">
                      {rec.category}
                    </Text>
                  </View>
                  <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">
                    {dayjs(rec.eventDate).format('D MMM YYYY')}
                  </Text>
                </View>

                <Text className="mt-2 font-sans-bold text-[15px] text-ink dark:text-slate-50">
                  {rec.title}
                </Text>
                <Text className="mt-0.5 font-sans text-[12px] text-ink-muted dark:text-slate-400">
                  {[rec.doctor, rec.facility].filter(Boolean).join(' · ')}
                </Text>

                {rec.diagnosis ? (
                  <Text className="mt-2 font-sans-medium text-[12px] text-ink dark:text-slate-200">
                    Diagnosis: {rec.diagnosis}
                  </Text>
                ) : null}

                {rec.fields && rec.fields.length > 0 ? (
                  <View className="mt-3 rounded-2xl bg-slate-50 p-3 dark:bg-canvasdark">
                    {rec.fields.map((f: { label: string; value: string }) => (
                      <View
                        key={f.label}
                        className="flex-row justify-between py-1"
                      >
                        <Text className="font-sans text-[12px] text-ink-muted dark:text-slate-400">
                          {f.label}
                        </Text>
                        <Text className="font-sans-semibold text-[12px] text-ink dark:text-slate-100">
                          {f.value}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <Text className="mt-2.5 font-sans text-[13px] leading-[19px] text-ink-soft dark:text-slate-300">
                  {rec.clinicalNotes}
                </Text>

                {rec.originalFile ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Open original file ${rec.originalFile.name}`}
                    onPress={() => handleOpenAttachment(rec)}
                    className="mt-3 flex-row items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 dark:border-slate-700 dark:bg-canvasdark"
                  >
                    <FileText size={15} color="#0B2559" />
                    <Text
                      className="flex-1 font-sans-medium text-[12px] text-ink dark:text-slate-100"
                      numberOfLines={1}
                    >
                      {rec.originalFile.name}
                    </Text>
                    <Text className="font-sans-semibold text-[11px] text-brand-600 dark:text-brand-300">
                      Open File
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ))}

            {/* Authorized Diary Notes */}
            {unlockedSnapshot.diaryNotes.length > 0 ? (
              <>
                <Text className="mt-2 font-sans-bold text-[14px] text-ink dark:text-slate-50">
                  Patient-Written Diary Notes ({unlockedSnapshot.diaryNotes.length})
                </Text>
                {unlockedSnapshot.diaryNotes.map((note: DiaryNote) => (
                  <View
                    key={note.id}
                    className="rounded-3xl border border-slate-200 bg-white p-4 dark:border-canvasdark-card dark:bg-canvasdark-card"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5">
                        <BookHeart size={14} color="#0D7C66" />
                        <Text className="font-sans-semibold text-[11px] text-brand-700 dark:text-brand-300">
                          Patient-written · {note.category || 'Personal'}
                        </Text>
                      </View>
                      <Text className="font-sans text-[11px] text-ink-muted dark:text-slate-400">
                        {dayjs(note.entryDate).format('D MMM YYYY')}
                      </Text>
                    </View>
                    <Text className="mt-2 font-sans-bold text-[14px] text-ink dark:text-slate-50">
                      {note.title}
                    </Text>
                    <Text className="mt-1 font-sans text-[13px] leading-[19px] text-ink-soft dark:text-slate-300">
                      {note.body}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
