import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { auditSeed, type AuditEvent, type AuditEventType } from '@/data/audit';
import { diaryNotesSeed, type DiaryNote } from '@/data/diarySeed';
import {
  defaultEmergencyVisibility,
  type EmergencyFieldKey,
} from '@/data/emergencyProfile';
import { activeMedications, todaysReminders } from '@/data/medications';
import { patient, type PatientProfile } from '@/data/patient';
import { medicalRecords, type MedicalRecord } from '@/data/records';
import { sharingHistorySeed, type SharedLink, type ShareDuration } from '@/data/sharing';
import type { LanguageCode } from '@/i18n/translations';
import { pastDateKeys } from '@/lib/date';

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function buildSeedAdherenceLog(): Record<string, boolean> {
  const reminders = todaysReminders();
  const days = pastDateKeys(6);
  const log: Record<string, boolean> = {};
  days.forEach((day, dayIndex) => {
    reminders.forEach((reminder) => {
      // Last 5 completed days fully adherent, the 6th (oldest) day missed —
      // gives a clean 5-day streak and a realistic ~83% seven-day adherence rate.
      log[`${reminder.id}__${day}`] = dayIndex < 5;
    });
  });
  return log;
}

export type ThemePreference = 'system' | 'light' | 'dark';

export interface NotificationSettings {
  medicationReminders: boolean;
  educationalTips: boolean;
  wellnessCheckins: boolean;
  healthDayReminders: boolean;
}

interface AppState {
  // Auth
  isSignedIn: boolean;
  pendingPhone: string;
  signIn: (phone: string) => void;
  completeSignIn: () => void;
  signOut: () => void;

  // Settings
  themePreference: ThemePreference;
  setThemePreference: (t: ThemePreference) => void;
  language: LanguageCode;
  setLanguage: (l: LanguageCode) => void;
  mfaEnabled: boolean;
  setMfaEnabled: (v: boolean) => void;
  sharingRequiresPin: boolean;
  setSharingRequiresPin: (v: boolean) => void;
  notifications: NotificationSettings;
  setNotification: (key: keyof NotificationSettings, value: boolean) => void;

  // Medication adherence
  takenLog: Record<string, boolean>;
  toggleTaken: (reminderId: string, dateKey: string) => void;
  medicationReminderEnabled: Record<string, boolean>;
  setMedicationReminderEnabled: (medicationId: string, value: boolean) => void;

  // Records
  records: MedicalRecord[];
  addRecord: (record: MedicalRecord) => void;
  updateRecord: (id: string, patch: Partial<MedicalRecord>) => void;
  deleteRecord: (id: string) => void;

  // Emergency profile
  emergencyVisibility: Record<EmergencyFieldKey, boolean>;
  setEmergencyVisible: (key: EmergencyFieldKey, value: boolean) => void;

  // Sharing
  sharedLinks: SharedLink[];
  createShare: (args: {
    recipientName: string;
    recipientFacility: string;
    recordIds: string[];
    diaryNoteIds: string[];
    duration: ShareDuration;
    pin: string;
  }) => SharedLink;
  revokeShare: (id: string) => void;

  // Diary
  diaryNotes: DiaryNote[];
  diaryDraft: Partial<DiaryNote> | null;
  addDiaryNote: (note: Omit<DiaryNote, 'id' | 'createdAt' | 'updatedAt' | 'pinned'>) => string;
  updateDiaryNote: (id: string, patch: Partial<DiaryNote>) => void;
  deleteDiaryNote: (id: string) => void;
  restoreDiaryNote: (note: DiaryNote, index?: number) => void;
  toggleDiaryPin: (id: string) => void;
  saveDiaryDraft: (draft: Partial<DiaryNote> | null) => void;

  // Audit
  auditEvents: AuditEvent[];
  logAudit: (type: AuditEventType, description: string) => void;

  // Onboarding / misc
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;

  // Patient profile
  patientProfile: PatientProfile;
  updatePatientProfile: (patch: Partial<PatientProfile>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isSignedIn: false,
      pendingPhone: '',
      signIn: (phone) => set({ pendingPhone: phone }),
      completeSignIn: () =>
        set((s) => {
          const event: AuditEvent = {
            id: makeId('audit'),
            type: 'login',
            description: 'Signed in with 2FA verification',
            timestamp: new Date().toISOString(),
          };
          return { isSignedIn: true, auditEvents: [event, ...s.auditEvents] };
        }),
      signOut: () => set({ isSignedIn: false, pendingPhone: '' }),

      themePreference: 'system',
      setThemePreference: (t) => set({ themePreference: t }),
      language: 'en',
      setLanguage: (l) =>
        set((s) => ({
          language: l,
          auditEvents: [
            {
              id: makeId('audit'),
              type: 'language',
              description: `Changed app language to ${l}`,
              timestamp: new Date().toISOString(),
            },
            ...s.auditEvents,
          ],
        })),
      mfaEnabled: true,
      setMfaEnabled: (v) => set({ mfaEnabled: v }),
      sharingRequiresPin: true,
      setSharingRequiresPin: (v) => set({ sharingRequiresPin: v }),
      notifications: {
        medicationReminders: true,
        educationalTips: true,
        wellnessCheckins: true,
        healthDayReminders: true,
      },
      setNotification: (key, value) =>
        set((s) => ({ notifications: { ...s.notifications, [key]: value } })),

      takenLog: buildSeedAdherenceLog(),
      toggleTaken: (reminderId, dateKey) =>
        set((s) => {
          const logKey = `${reminderId}__${dateKey}`;
          const nowTaken = !s.takenLog[logKey];
          const reminder = todaysReminders().find((r) => r.id === reminderId);
          const auditEntry: AuditEvent | null =
            nowTaken && reminder
              ? {
                  id: makeId('audit'),
                  type: 'reminder',
                  description: `Marked ${reminder.label} as taken`,
                  timestamp: new Date().toISOString(),
                }
              : null;
          return {
            takenLog: { ...s.takenLog, [logKey]: nowTaken },
            auditEvents: auditEntry ? [auditEntry, ...s.auditEvents] : s.auditEvents,
          };
        }),
      medicationReminderEnabled: activeMedications.reduce(
        (acc, m) => ({ ...acc, [m.id]: true }),
        {} as Record<string, boolean>
      ),
      setMedicationReminderEnabled: (medicationId, value) =>
        set((s) => ({
          medicationReminderEnabled: { ...s.medicationReminderEnabled, [medicationId]: value },
        })),

      records: medicalRecords,
      addRecord: (record) =>
        set((s) => ({
          records: [record, ...s.records],
          auditEvents: [
            {
              id: makeId('audit'),
              type: 'upload',
              description: `Uploaded ${record.title}`,
              timestamp: new Date().toISOString(),
            },
            ...s.auditEvents,
          ],
        })),
      updateRecord: (id, patch) =>
        set((s) => ({
          records: s.records.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        })),
      deleteRecord: (id) => set((s) => ({ records: s.records.filter((r) => r.id !== id) })),

      emergencyVisibility: defaultEmergencyVisibility,
      setEmergencyVisible: (key, value) =>
        set((s) => ({ emergencyVisibility: { ...s.emergencyVisibility, [key]: value } })),

      sharedLinks: sharingHistorySeed,
      createShare: ({ recipientName, recipientFacility, recordIds, diaryNoteIds, duration, pin }) => {
        const now = new Date();
        const expires = new Date(now.getTime() + duration.hours * 60 * 60 * 1000);
        const link: SharedLink = {
          id: makeId('share'),
          recipientName,
          recipientFacility,
          recordIds,
          diaryNoteIds,
          durationId: duration.id,
          pin,
          createdAt: now.toISOString(),
          expiresAt: expires.toISOString(),
          status: 'active',
        };
        set((s) => ({
          sharedLinks: [link, ...s.sharedLinks],
          auditEvents: [
            {
              id: makeId('audit'),
              type: 'share',
              description: `Shared ${recordIds.length} record(s) with ${recipientName} for ${duration.label}`,
              timestamp: now.toISOString(),
            },
            ...s.auditEvents,
          ],
        }));
        return link;
      },
      revokeShare: (id) =>
        set((s) => {
          const link = s.sharedLinks.find((l) => l.id === id);
          return {
            sharedLinks: s.sharedLinks.map((l) => (l.id === id ? { ...l, status: 'revoked' } : l)),
            auditEvents: link
              ? [
                  {
                    id: makeId('audit'),
                    type: 'revoke',
                    description: `Revoked sharing link for ${link.recipientName}`,
                    timestamp: new Date().toISOString(),
                  },
                  ...s.auditEvents,
                ]
              : s.auditEvents,
          };
        }),

      diaryNotes: diaryNotesSeed,
      diaryDraft: null,
      addDiaryNote: (note) => {
        const id = makeId('diary');
        const now = new Date().toISOString();
        set((s) => ({
          diaryNotes: [{ ...note, id, pinned: false, createdAt: now, updatedAt: now }, ...s.diaryNotes],
          diaryDraft: null,
        }));
        return id;
      },
      updateDiaryNote: (id, patch) =>
        set((s) => ({
          diaryNotes: s.diaryNotes.map((n) =>
            n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n
          ),
        })),
      deleteDiaryNote: (id) => set((s) => ({ diaryNotes: s.diaryNotes.filter((n) => n.id !== id) })),
      restoreDiaryNote: (note, index) =>
        set((s) => {
          const notes = [...s.diaryNotes];
          const at = Math.min(index ?? 0, notes.length);
          notes.splice(at, 0, note);
          return { diaryNotes: notes };
        }),
      toggleDiaryPin: (id) =>
        set((s) => ({
          diaryNotes: s.diaryNotes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
        })),
      saveDiaryDraft: (draft) => set({ diaryDraft: draft }),

      auditEvents: auditSeed,
      logAudit: (type, description) =>
        set((s) => ({
          auditEvents: [
            { id: makeId('audit'), type, description, timestamp: new Date().toISOString() },
            ...s.auditEvents,
          ],
        })),

      hasCompletedOnboarding: false,
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      patientProfile: patient,
      updatePatientProfile: (patch) =>
        set((s) => ({ patientProfile: { ...s.patientProfile, ...patch } })),
    }),
    {
      name: 'siyashesha-app-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export function diaryNoteById(id: string | undefined) {
  if (!id) return undefined;
  return useAppStore.getState().diaryNotes.find((n) => n.id === id);
}
