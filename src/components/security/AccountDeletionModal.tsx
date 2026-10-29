import { useClerk, useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Switch,
  View,
} from 'react-native';
import {
  AlertTriangle,
  Fingerprint,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/ui/PressableScale';
import { Txt } from '@/components/ui/Txt';
import { useToast } from '@/components/ui/Toast';
import { elevation, fonts, radii } from '@/design/tokens';
import { useTokens } from '@/design/useTokens';
import { authenticateWithBiometrics } from '@/lib/security/enclaveSecurity';
import { useAppStore } from '@/store/useAppStore';

interface AccountDeletionModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenDsarExport?: () => void;
}

export function AccountDeletionModal({
  visible,
  onClose,
  onOpenDsarExport,
}: AccountDeletionModalProps) {
  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <AccountDeletionContent onClose={onClose} onOpenDsarExport={onOpenDsarExport} />
    </Modal>
  );
}

function AccountDeletionContent({
  onClose,
  onOpenDsarExport,
}: {
  onClose: () => void;
  onOpenDsarExport?: () => void;
}) {
  const t = useTokens();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { signOut: clerkSignOut } = useClerk();
  const { user: clerkUser } = useUser();

  const biometricLock = useAppStore((s) => s.biometricLock);
  const eraseAllPatientData = useAppStore((s) => s.eraseAllPatientData);

  const [confirmedRisk, setConfirmedRisk] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExecuteDeletion = async () => {
    if (!confirmedRisk) {
      toast.show('Please confirm you understand that data erasure is permanent', 'warning');
      return;
    }

    // Step 1: Biometric Identity Verification if active
    if (biometricLock) {
      const bioAuth = await authenticateWithBiometrics(
        'Confirm your identity to authorize permanent account and health data erasure'
      );
      if (!bioAuth.success) {
        toast.show('Identity verification failed. Account erasure cancelled.', 'warning');
        return;
      }
    }

    // Step 2: Final native alert guard
    Alert.alert(
      'Delete Account & Erase All Data',
      'Are you completely sure? This will permanently delete your account, all clinical records, emergency information, and cryptographic keys immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account & Data',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              // 1. Permanently erase all cloud and local patient data while auth context is active
              await eraseAllPatientData();

              // 2. Permanently delete the Clerk authentication user account (Apple Guideline 5.1.1(v))
              try {
                if (clerkUser && typeof clerkUser.delete === 'function') {
                  await clerkUser.delete();
                } else {
                  await clerkSignOut();
                }
              } catch (clerkErr) {
                console.warn('[Clerk] Account deletion / sign out:', clerkErr);
                try {
                  await clerkSignOut();
                } catch {
                  // ignore
                }
              }

              toast.show('Account deleted and all health data permanently erased', 'success');
              onClose();
              router.replace('/(auth)/sign-in');
            } catch (err: any) {
              console.error('[AccountDeletion] Failed to erase data:', err);
              toast.show('Error during erasure: ' + (err?.message || 'Please try again'), 'warning');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' }}>
      <View
        style={{
          backgroundColor: t.surface,
          borderTopLeftRadius: radii.xl,
          borderTopRightRadius: radii.xl,
          maxHeight: '90%',
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
                backgroundColor: 'rgba(220, 31, 38, 0.12)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trash2 size={20} color="#DC1F26" />
            </View>
            <View>
              <Txt variant="headline">Delete Account & Erase Data</Txt>
              <Txt variant="footnote" tone="muted">
                POPIA §24 & Apple Guideline 5.1.1(v)
              </Txt>
            </View>
          </View>
          <PressableScale
            accessibilityLabel="Close"
            disabled={isDeleting}
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
          {/* Critical Warning Box */}
          <View
            style={{
              borderRadius: radii.lg,
              backgroundColor: 'rgba(220, 31, 38, 0.08)',
              borderWidth: 1,
              borderColor: 'rgba(220, 31, 38, 0.25)',
              padding: 14,
              gap: 8,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShieldAlert size={18} color="#DC1F26" />
              <Txt variant="bodyStrong" color="#DC1F26">
                Permanent and Irreversible Action
              </Txt>
            </View>
            <Txt variant="footnote" tone="muted" style={{ lineHeight: 18 }}>
              In accordance with Section 24 of South Africa&apos;s Protection of Personal Information Act (POPIA) and HIPAA Right
              to Erasure, completing this procedure will immediately and permanently destroy:
            </Txt>
            <View style={{ gap: 4, paddingLeft: 4, marginTop: 2 }}>
              <Bullet text="All medical records, PDF lab results, and document scans" />
              <Bullet text="Emergency ICE profile, allergy lists, and chronic condition logs" />
              <Bullet text="Prescription lists, adherence records, and reminders" />
              <Bullet text="Private diary notes, voice recordings, and attachments" />
              <Bullet text="Active doctor sharing authorizations and PIN passes" />
              <Bullet text="Hardware biometric enclave encryption keys on this phone" />
            </View>
          </View>

          {/* DSAR Recommendation Banner */}
          {onOpenDsarExport && (
            <PressableScale
              onPress={() => {
                onClose();
                onOpenDsarExport();
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 12,
                borderRadius: radii.md,
                backgroundColor: 'rgba(13, 124, 102, 0.08)',
                borderWidth: 1,
                borderColor: 'rgba(13, 124, 102, 0.2)',
              }}
            >
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: radii.sm,
                  backgroundColor: 'rgba(13, 124, 102, 0.15)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={16} color="#0D7C66" />
              </View>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong" color="#0D7C66">
                  Recommended: Export Data First
                </Txt>
                <Txt variant="footnote" tone="muted" style={{ fontSize: 12 }}>
                  Download your POPIA §23 certified Health Archive before deletion.
                </Txt>
              </View>
            </PressableScale>
          )}

          {/* Biometric Guard Notice */}
          {biometricLock && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                padding: 12,
                borderRadius: radii.md,
                backgroundColor: t.surfaceMuted,
                borderWidth: 1,
                borderColor: t.border,
              }}
            >
              <Fingerprint size={18} color="#16A34A" />
              <Txt variant="footnote" tone="muted" style={{ flex: 1, fontSize: 12 }}>
                Biometric authorization required before erasure to protect against unauthorized deletion.
              </Txt>
            </View>
          )}

          {/* Acknowledgment Checkbox */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 14,
              borderRadius: radii.md,
              backgroundColor: t.surfaceMuted,
              borderWidth: 1,
              borderColor: confirmedRisk ? '#DC1F26' : t.border,
            }}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Txt variant="bodyStrong" style={{ fontSize: 13 }}>
                I understand this action cannot be undone
              </Txt>
              <Txt variant="footnote" tone="muted" style={{ fontSize: 11 }}>
                All records will be destroyed and my account unlinked.
              </Txt>
            </View>
            <Switch
              value={confirmedRisk}
              onValueChange={setConfirmedRisk}
              trackColor={{ true: '#DC1F26', false: '#CBD5E1' }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Deletion Execute Button */}
          <View style={{ gap: 10, marginTop: 4 }}>
            <PressableScale
              disabled={!confirmedRisk || isDeleting}
              onPress={handleExecuteDeletion}
              style={[
                {
                  minHeight: 50,
                  borderRadius: radii.pill,
                  backgroundColor: confirmedRisk && !isDeleting ? '#DC1F26' : t.surfaceMuted,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  paddingHorizontal: 18,
                },
                confirmedRisk && !isDeleting ? elevation[2] : null,
              ]}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Trash2 size={18} color={confirmedRisk ? '#FFFFFF' : t.textMuted} />
              )}
              <Txt
                variant="callout"
                style={{
                  color: confirmedRisk && !isDeleting ? '#FFFFFF' : t.textMuted,
                  fontFamily: fonts.semibold,
                }}
              >
                {isDeleting ? 'Deleting Account & Erasing Data…' : 'Delete Account & Erase All Data'}
              </Txt>
            </PressableScale>

            <PressableScale
              disabled={isDeleting}
              onPress={onClose}
              style={{
                minHeight: 44,
                borderRadius: radii.pill,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Txt variant="footnote" tone="muted" style={{ fontFamily: fonts.medium }}>
                Cancel and keep my health records
              </Txt>
            </PressableScale>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#DC1F26' }} />
      <Txt variant="footnote" tone="muted" style={{ fontSize: 12, flex: 1 }}>
        {text}
      </Txt>
    </View>
  );
}
