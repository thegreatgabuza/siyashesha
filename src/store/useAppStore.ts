import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { AssistantMessage } from '@/data/assistant';
import { auditSeed, type AuditEvent, type AuditEventType } from '@/data/audit';
import { appointmentsSeed, type Appointment } from '@/data/appointments';
import { diaryNotesSeed, type DiaryNote } from '@/data/diarySeed';
import {
  defaultEmergencyVisibility,
  type EmergencyFieldKey,
} from '@/data/emergencyProfile';
import { activeMedications, medicationsSeed, todaysReminders, type Medication } from '@/data/medications';
import { patient, type EmergencyContact, type PatientProfile } from '@/data/patient';
import { medicalRecords, type MedicalRecord } from '@/data/records';
import { sharingHistorySeed, type SharedLink, type ShareDuration } from '@/data/sharing';
import type { LanguageCode } from '@/i18n/translations';
import { pastDateKeys } from '@/lib/date';
import { clearAllStoredFiles } from '@/lib/documents';
import { verifyActiveStoreKitEntitlements } from '@/lib/iap';
import { clearEnclaveKeys } from '@/lib/security/enclaveSecurity';
import {
  deleteAppointmentFromDatabase,
  deleteDiaryNoteFromDatabase,
  deleteMedicationFromDatabase,
  deleteRecordFromDatabase,
  eraseAllCloudData,
  fetchAppointmentsFromDatabase,
  fetchDiaryNotesFromDatabase,
  fetchMedicationsFromDatabase,
  fetchPatientProfileFromDatabase,
  fetchRecordsFromDatabase,
  fetchSharedLinksFromDatabase,
  fetchSubscriptionFromDatabase,
  isSupabaseConfigured,
  revokeSharedLinkInDatabase,
  setSupabaseAuthContext,
  syncAppointmentToDatabase,
  syncAppointments,
  syncDiaryNoteToDatabase,
  syncDiaryNotes,
  syncMedicationToDatabase,
  syncMedications,
  syncPatientProfile,
  syncRecordToDatabase,
  syncRecords,
  syncSharedLinkToDatabase,
  syncSharedLinks,
  syncSubscriptionToDatabase,
  type CloudSubscriptionEntitlement,
  type SharedLinkSnapshot,
} from '@/lib/supabase';

const DEMO_RECORD_IDS = new Set(medicalRecords.map((r) => r.id));
const DEMO_MED_IDS = new Set(medicationsSeed.map((m) => m.id));
const DEMO_APPT_IDS = new Set(appointmentsSeed.map((a) => a.id));
const DEMO_DIARY_IDS = new Set(diaryNotesSeed.map((n) => n.id));
const DEMO_SHARE_IDS = new Set(sharingHistorySeed.map((l) => l.id));

export function isDemoAccountEmail(email?: string | null): boolean {
  if (!email) return false;
  const lower = email.trim().toLowerCase();
  return (
    lower === 'jessica.tebatso@gmail.com' ||
    lower === 'jessica.tebatso@example.co.za' ||
    lower === 'demo@siyashesha.co.za'
  );
}

function stripDemoSeedProfile(current: PatientProfile): PatientProfile {
  const isUntouchedDemoProfile =
    current.idNumber === patient.idNumber &&
    (current.email === patient.email || !current.email);

  if (!isUntouchedDemoProfile) {
    return current;
  }

  return {
    firstName: current.firstName === patient.firstName ? '' : current.firstName,
    lastName: current.lastName === patient.lastName ? '' : current.lastName,
    preferredName: current.preferredName === patient.preferredName ? '' : current.preferredName,
    avatarUrl: current.avatarUrl,
    dateOfBirth: current.dateOfBirth === patient.dateOfBirth ? '' : current.dateOfBirth,
    idNumber: '',
    gender: '',
    phone: '',
    email: current.email === patient.email ? '' : current.email,
    address: '',
    province: 'Gauteng',
    bloodGroup: current.bloodGroup === patient.bloodGroup ? '' : current.bloodGroup,
    allergies: [],
    chronicConditions: [],
    previousProcedures: [],
    medicalDevices: [],
    emergencyContact: {
      name: '',
      relationship: '',
      phone: '',
    },
    emergencyContacts: [],
    memberSince: new Date().toISOString().slice(0, 10),
  };
}

function buildShareSnapshot(
  profile: PatientProfile,
  records: MedicalRecord[],
  diaryNotes: DiaryNote[],
  link: SharedLink
): SharedLinkSnapshot {
  return {
    patientSummary: {
      fullName: [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Patient',
      dateOfBirth: profile.dateOfBirth || 'Unknown',
      bloodGroup: profile.bloodGroup || 'Unknown',
      allergies: profile.allergies ?? [],
      chronicConditions: profile.chronicConditions ?? [],
      emergencyContact: profile.emergencyContact,
    },
    records: records.filter((r) => link.recordIds.includes(r.id)),
    diaryNotes: diaryNotes.filter((n) => link.diaryNoteIds.includes(n.id)),
  };
}

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

export type StampId = 'profile' | 'emergency' | 'medication' | 'record' | 'biometric';

export type SubscriptionPlanId = 'free' | 'monthly_premium' | 'annual_premium' | 'lifetime_premium';

export type MedicationTimeSlot = 'Morning' | 'Afternoon' | 'Evening' | 'Night';

export interface UserMedication {
  id: string;
  name: string;
  dose: string;
  time: MedicationTimeSlot;
  times?: MedicationTimeSlot[];
}

export interface CustomReminder {
  id: string;
  title: string;
  time: string; // HH:mm
}

export interface OnboardingDraft {
  goal: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  bloodGroup: string;
  allergies: string[];
  conditions: string[];
  contactName: string;
  contactRelationship: string;
  contactPhone: string;
  emergencyContacts: EmergencyContact[];
}

export const emptyOnboardingDraft: OnboardingDraft = {
  goal: null,
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  bloodGroup: '',
  allergies: [],
  conditions: [],
  contactName: '',
  contactRelationship: '',
  contactPhone: '',
  emergencyContacts: [{ name: '', relationship: 'Spouse', phone: '' }],
};

export interface NotificationSettings {
  medicationReminders: boolean;
  educationalTips: boolean;
  wellnessCheckins: boolean;
  missedDoseAlerts: boolean;
  appointmentAlerts: boolean;
}

interface AppState {
  // Auth
  isSignedIn: boolean;
  pendingEmail: string;
  clerkFlow: 'sign_in' | 'sign_up' | 'demo';
  clerkSessionId?: string;
  signInWithEmail: (email: string, flow?: 'sign_in' | 'sign_up' | 'demo') => void;
  setClerkSessionId: (id: string) => void;
  completeSignIn: (options?: { clerkSessionId?: string; email?: string }) => void;
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
  aiConsentGranted: boolean;
  setAiConsentGranted: (v: boolean) => void;
  notifications: NotificationSettings;
  setNotification: (key: keyof NotificationSettings, value: boolean) => void;
  pushToken?: string;
  lastPushSyncAt?: string;
  setPushToken: (token: string) => void;
  setLastPushSyncAt: (timestamp: string) => void;

  // Medication adherence
  takenLog: Record<string, boolean>;
  toggleTaken: (reminderId: string, dateKey: string) => void;
  skippedLog: Record<string, boolean>;
  skipReminder: (reminderId: string, dateKey: string) => void;
  medicationReminderEnabled: Record<string, boolean>;
  setMedicationReminderEnabled: (medicationId: string, value: boolean) => void;
  customReminders: CustomReminder[];
  addCustomReminder: (reminder: Omit<CustomReminder, 'id'>) => void;
  removeCustomReminder: (id: string) => void;

  // Medications (Spec §4.6)
  medications: Medication[];
  addMedication: (med: Omit<Medication, 'id'>) => string;
  updateMedication: (id: string, patch: Partial<Medication>) => void;
  deleteMedication: (id: string) => void;
  toggleMedicationStatus: (id: string) => void;

  // Appointments
  appointments: Appointment[];
  addAppointment: (appt: Omit<Appointment, 'id'>) => string;
  updateAppointment: (id: string, patch: Partial<Appointment>) => void;
  deleteAppointment: (id: string) => void;
  rescheduleAppointment: (id: string, date: string, time: string) => void;

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

  // Assistant: one conversation per day, keyed by YYYY-MM-DD
  assistantThreads: Record<string, AssistantMessage[]>;
  addAssistantMessage: (day: string, message: AssistantMessage) => void;

  // Audit
  auditEvents: AuditEvent[];
  logAudit: (type: AuditEventType, description: string) => void;

  // Onboarding / misc
  hasCompletedOnboarding: boolean;
  completeOnboarding: () => void;
  restartOnboarding: () => void;

  // Patient profile
  patientProfile: PatientProfile;
  updatePatientProfile: (patch: Partial<PatientProfile>) => void;

  // Subscription & Billing
  subscriptionPlan: SubscriptionPlanId;
  subscriptionTrialEndsAt?: string;
  subscriptionExpiresAt?: string;
  subscriptionProductId?: string;
  subscriptionTransactionId?: string;
  subscriptionUpdatedAt?: string;
  setSubscriptionPlan: (
    plan: SubscriptionPlanId,
    options?: {
      startTrial?: boolean;
      expiresAt?: string;
      productId?: string;
      transactionId?: string;
      silentSync?: boolean;
    }
  ) => void;
  verifySubscriptionStatus: () => Promise<{
    plan: SubscriptionPlanId;
    expired: boolean;
    restoredFromStore: boolean;
  }>;

  // Guided onboarding
  onboardingDraft: OnboardingDraft;
  updateOnboardingDraft: (patch: Partial<OnboardingDraft>) => void;
  stamps: StampId[];
  earnStamp: (id: StampId) => boolean;
  userMedications: UserMedication[];
  addUserMedication: (med: Omit<UserMedication, 'id'>) => void;
  removeUserMedication: (id: string) => void;
  biometricLock: boolean;
  setBiometricLock: (v: boolean) => void;
  isAppLocked: boolean;
  setAppLocked: (locked: boolean) => void;
  unlockApp: () => void;
  lockApp: () => void;
  finishOnboarding: (options?: {
    plan?: SubscriptionPlanId;
    startTrial?: boolean;
    expiresAt?: string;
    productId?: string;
    transactionId?: string;
  }) => void;

  // Cloud Hydration & Two-Way Sync
  isSyncingCloud: boolean;
  lastCloudSyncAt?: string;
  hydrateFromCloud: () => Promise<boolean>;

  // POPIA §24 / HIPAA Data Subject Erasure
  eraseAllPatientData: () => Promise<void>;
  resetToDemoPatient: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      isSignedIn: false,
      pendingEmail: '',
      clerkFlow: 'sign_in',
      clerkSessionId: undefined,
      isSyncingCloud: false,
      lastCloudSyncAt: undefined,
      signInWithEmail: (email, flow = 'sign_in') =>
        set({ pendingEmail: email.trim().toLowerCase(), clerkFlow: flow }),
      setClerkSessionId: (id) => set({ clerkSessionId: id }),
      completeSignIn: (options) => {
        set((s) => {
          const isClerk = Boolean(options?.clerkSessionId);
          const email = (options?.email || s.pendingEmail || '').trim().toLowerCase();
          const event: AuditEvent = {
            id: makeId('audit'),
            type: 'login',
            description: isClerk
              ? `Signed in with Clerk email OTP verification${email ? ` (${email})` : ''}`
              : 'Signed in with demo verification',
            timestamp: new Date().toISOString(),
          };
          const isDemo =
            !isClerk &&
            (s.clerkFlow === 'demo' || !email || isDemoAccountEmail(email));

          if (isDemo) {
            const shouldRestoreDemo = s.records.length === 0;
            return {
              isSignedIn: true,
              hasCompletedOnboarding: true,
              clerkFlow: 'demo',
              clerkSessionId: options?.clerkSessionId ?? s.clerkSessionId,
              subscriptionPlan: s.subscriptionPlan === 'free' ? 'monthly_premium' : s.subscriptionPlan,
              sharingRequiresPin: true,
              patientProfile: shouldRestoreDemo
                ? patient
                : email
                ? { ...s.patientProfile, email }
                : s.patientProfile,
              records: shouldRestoreDemo ? medicalRecords : s.records,
              medications: shouldRestoreDemo ? medicationsSeed : s.medications,
              appointments: shouldRestoreDemo ? appointmentsSeed : s.appointments,
              diaryNotes: shouldRestoreDemo ? diaryNotesSeed : s.diaryNotes,
              sharedLinks: shouldRestoreDemo ? sharingHistorySeed : s.sharedLinks,
              auditEvents: [event, ...s.auditEvents],
            };
          }

          // Real authenticated user: strip any untouched Jessica Tebatso demo seed items
          const cleanedBaseProfile = stripDemoSeedProfile(s.patientProfile);
          const nextProfile: PatientProfile = {
            ...cleanedBaseProfile,
            ...(email ? { email } : {}),
          };
          const cleanedRecords = s.records.filter((r) => !DEMO_RECORD_IDS.has(r.id));
          const cleanedMeds = s.medications.filter((m) => !DEMO_MED_IDS.has(m.id));
          const cleanedAppts = s.appointments.filter((a) => !DEMO_APPT_IDS.has(a.id));
          const cleanedNotes = s.diaryNotes.filter((n) => !DEMO_DIARY_IDS.has(n.id));
          const cleanedShares = s.sharedLinks.filter((l) => !DEMO_SHARE_IDS.has(l.id));
          const hadOnlyDemoMeds = cleanedMeds.length === 0 && s.medications.length > 0;

          return {
            isSignedIn: true,
            hasCompletedOnboarding: true,
            clerkSessionId: options?.clerkSessionId ?? s.clerkSessionId,
            patientProfile: nextProfile,
            records: cleanedRecords,
            medications: cleanedMeds,
            appointments: cleanedAppts,
            diaryNotes: cleanedNotes,
            sharedLinks: cleanedShares,
            ...(hadOnlyDemoMeds ? { takenLog: {}, skippedLog: {}, medicationReminderEnabled: {} } : {}),
            auditEvents: [event, ...s.auditEvents],
          };
        });

        // Trigger two-way cloud hydration immediately after sign-in state is committed
        setTimeout(() => {
          void get().hydrateFromCloud();
        }, 150);
      },
      signOut: () => {
        setSupabaseAuthContext({ userId: null, getToken: null });
        set({
          isSignedIn: false,
          pendingEmail: '',
          clerkSessionId: undefined,
          clerkFlow: 'sign_in',
        });
      },

      themePreference: 'light',
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
      aiConsentGranted: false,
      setAiConsentGranted: (v) =>
        set((s) => ({
          aiConsentGranted: v,
          auditEvents: [
            {
              id: makeId('audit'),
              type: 'profile',
              description: v
                ? 'Granted consent for Google Gemini AI clinical assistance & OCR'
                : 'Revoked consent for Google Gemini AI (On-Device mode only)',
              timestamp: new Date().toISOString(),
            },
            ...s.auditEvents,
          ],
        })),
      pushToken: undefined,
      lastPushSyncAt: undefined,
      setPushToken: (token) => set({ pushToken: token }),
      setLastPushSyncAt: (timestamp) => set({ lastPushSyncAt: timestamp }),
      notifications: {
        medicationReminders: true,
        educationalTips: true,
        wellnessCheckins: true,
        missedDoseAlerts: true,
        appointmentAlerts: true,
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
      skippedLog: {},
      skipReminder: (reminderId, dateKey) =>
        set((s) => {
          const logKey = `${reminderId}__${dateKey}`;
          const nowSkipped = !s.skippedLog[logKey];
          return {
            skippedLog: { ...s.skippedLog, [logKey]: nowSkipped },
            // A skipped dose cannot also be marked taken.
            takenLog: nowSkipped ? { ...s.takenLog, [logKey]: false } : s.takenLog,
          };
        }),
      customReminders: [],
      addCustomReminder: (reminder) =>
        set((s) => ({ customReminders: [...s.customReminders, { ...reminder, id: makeId('reminder') }] })),
      removeCustomReminder: (id) => set((s) => ({ customReminders: s.customReminders.filter((r) => r.id !== id) })),
      medicationReminderEnabled: activeMedications.reduce(
        (acc, m) => ({ ...acc, [m.id]: true }),
        {} as Record<string, boolean>
      ),
      setMedicationReminderEnabled: (medicationId, value) =>
        set((s) => ({
          medicationReminderEnabled: { ...s.medicationReminderEnabled, [medicationId]: value },
        })),

      medications: medicationsSeed,
      addMedication: (med) => {
        const id = makeId('med');
        const newMed: Medication = { ...med, id };
        set((s) => ({
          medications: [...s.medications, newMed],
          medicationReminderEnabled: { ...s.medicationReminderEnabled, [id]: true },
          auditEvents: [
            {
              id: makeId('audit'),
              type: 'upload',
              description: `Added prescription: ${newMed.name} ${newMed.strength}`,
              timestamp: new Date().toISOString(),
            },
            ...s.auditEvents,
          ],
        }));
        syncMedicationToDatabase(newMed).catch(() => {});
        return id;
      },
      updateMedication: (id, patch) =>
        set((s) => {
          let updatedMed: Medication | undefined;
          const nextMeds = s.medications.map((m) => {
            if (m.id === id) {
              updatedMed = { ...m, ...patch };
              return updatedMed;
            }
            return m;
          });
          if (updatedMed) {
            syncMedicationToDatabase(updatedMed).catch(() => {});
          }
          return {
            medications: nextMeds,
            auditEvents: [
              {
                id: makeId('audit'),
                type: 'upload',
                description: `Updated prescription: ${patch.name ?? id}`,
                timestamp: new Date().toISOString(),
              },
              ...s.auditEvents,
            ],
          };
        }),
      deleteMedication: (id) =>
        set((s) => {
          const med = s.medications.find((m) => m.id === id);
          const nextReminders = { ...s.medicationReminderEnabled };
          delete nextReminders[id];
          deleteMedicationFromDatabase(id).catch(() => {});
          return {
            medications: s.medications.filter((m) => m.id !== id),
            medicationReminderEnabled: nextReminders,
            auditEvents: [
              {
                id: makeId('audit'),
                type: 'edit',
                description: `Removed prescription: ${med?.name ?? id}`,
                timestamp: new Date().toISOString(),
              },
              ...s.auditEvents,
            ],
          };
        }),
      toggleMedicationStatus: (id) =>
        set((s) => {
          let toggledMed: Medication | undefined;
          const nextMeds = s.medications.map((m) => {
            if (m.id !== id) return m;
            const nextStatus: Medication['status'] = m.status === 'active' ? 'past' : 'active';
            toggledMed = {
              ...m,
              status: nextStatus,
              endDate: nextStatus === 'past' ? new Date().toISOString().slice(0, 10) : undefined,
            };
            return toggledMed;
          });
          if (toggledMed) {
            syncMedicationToDatabase(toggledMed).catch(() => {});
          }
          return { medications: nextMeds };
        }),

      appointments: appointmentsSeed,
      addAppointment: (appt) => {
        const id = makeId('appt');
        const newAppt: Appointment = { ...appt, id };
        set((s) => ({
          appointments: [...s.appointments, newAppt],
          auditEvents: [
            {
              id: makeId('audit'),
              type: 'upload',
              description: `Scheduled ${appt.type.toLowerCase()}: ${appt.title}`,
              timestamp: new Date().toISOString(),
            },
            ...s.auditEvents,
          ],
        }));
        syncAppointmentToDatabase(newAppt).catch(() => {});
        return id;
      },
      updateAppointment: (id, patch) =>
        set((s) => {
          let updatedAppt: Appointment | undefined;
          const nextAppts = s.appointments.map((a) => {
            if (a.id === id) {
              updatedAppt = { ...a, ...patch };
              return updatedAppt;
            }
            return a;
          });
          if (updatedAppt) {
            syncAppointmentToDatabase(updatedAppt).catch(() => {});
          }
          return { appointments: nextAppts };
        }),
      deleteAppointment: (id) =>
        set((s) => {
          deleteAppointmentFromDatabase(id).catch(() => {});
          return {
            appointments: s.appointments.filter((a) => a.id !== id),
          };
        }),
      rescheduleAppointment: (id, date, time) =>
        set((s) => {
          let updatedAppt: Appointment | undefined;
          const nextAppts = s.appointments.map((a) => {
            if (a.id === id) {
              updatedAppt = { ...a, date, time };
              return updatedAppt;
            }
            return a;
          });
          if (updatedAppt) {
            syncAppointmentToDatabase(updatedAppt).catch(() => {});
          }
          return { appointments: nextAppts };
        }),

      records: medicalRecords,
      addRecord: (record) =>
        set((s) => {
          if (s.subscriptionPlan === 'free' && s.records.length >= 10) {
            return {};
          }
          syncRecordToDatabase(record).catch(() => {});
          return {
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
          };
        }),
      updateRecord: (id, patch) =>
        set((s) => {
          let updatedRecord: MedicalRecord | undefined;
          const nextRecords = s.records.map((r) => {
            if (r.id === id) {
              updatedRecord = { ...r, ...patch };
              return updatedRecord;
            }
            return r;
          });
          if (updatedRecord) {
            syncRecordToDatabase(updatedRecord).catch(() => {});
          }
          return { records: nextRecords };
        }),
      deleteRecord: (id) =>
        set((s) => {
          const existing = s.records.find((r) => r.id === id);
          deleteRecordFromDatabase(id, existing?.originalFile?.storagePath).catch(() => {});
          return { records: s.records.filter((r) => r.id !== id) };
        }),

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
        const current = get();
        const snapshot = buildShareSnapshot(
          current.patientProfile,
          current.records,
          current.diaryNotes,
          link
        );
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
        syncSharedLinkToDatabase(link, snapshot).catch(() => {});
        return link;
      },
      revokeShare: (id) =>
        set((s) => {
          const link = s.sharedLinks.find((l) => l.id === id);
          revokeSharedLinkInDatabase(id).catch(() => {});
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
        const newNote: DiaryNote = { ...note, id, pinned: false, createdAt: now, updatedAt: now };
        set((s) => ({
          diaryNotes: [newNote, ...s.diaryNotes],
          diaryDraft: null,
        }));
        syncDiaryNoteToDatabase(newNote).catch(() => {});
        return id;
      },
      updateDiaryNote: (id, patch) =>
        set((s) => {
          let updatedNote: DiaryNote | undefined;
          const nextNotes = s.diaryNotes.map((n) => {
            if (n.id === id) {
              updatedNote = { ...n, ...patch, updatedAt: new Date().toISOString() };
              return updatedNote;
            }
            return n;
          });
          if (updatedNote) {
            syncDiaryNoteToDatabase(updatedNote).catch(() => {});
          }
          return { diaryNotes: nextNotes };
        }),
      deleteDiaryNote: (id) =>
        set((s) => {
          deleteDiaryNoteFromDatabase(id).catch(() => {});
          return { diaryNotes: s.diaryNotes.filter((n) => n.id !== id) };
        }),
      restoreDiaryNote: (note, index) =>
        set((s) => {
          const notes = [...s.diaryNotes];
          const at = Math.min(index ?? 0, notes.length);
          notes.splice(at, 0, note);
          syncDiaryNoteToDatabase(note).catch(() => {});
          return { diaryNotes: notes };
        }),
      toggleDiaryPin: (id) =>
        set((s) => {
          let toggledNote: DiaryNote | undefined;
          const nextNotes = s.diaryNotes.map((n) => {
            if (n.id === id) {
              toggledNote = { ...n, pinned: !n.pinned, updatedAt: new Date().toISOString() };
              return toggledNote;
            }
            return n;
          });
          if (toggledNote) {
            syncDiaryNoteToDatabase(toggledNote).catch(() => {});
          }
          return { diaryNotes: nextNotes };
        }),
      saveDiaryDraft: (draft) => set({ diaryDraft: draft }),

      assistantThreads: {},
      addAssistantMessage: (day, message) =>
        set((s) => ({
          assistantThreads: { ...s.assistantThreads, [day]: [...(s.assistantThreads[day] ?? []), message] },
        })),

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
      restartOnboarding: () =>
        set({
          hasCompletedOnboarding: false,
          isSignedIn: false,
          stamps: [],
          onboardingDraft: emptyOnboardingDraft,
        }),

      subscriptionPlan: 'free',
      subscriptionTrialEndsAt: undefined,
      subscriptionExpiresAt: undefined,
      subscriptionProductId: undefined,
      subscriptionTransactionId: undefined,
      subscriptionUpdatedAt: undefined,
      setSubscriptionPlan: (plan, options) =>
        set((s) => {
          const isFree = plan === 'free';
          const nowIso = new Date().toISOString();
          const trialEnd = options?.startTrial
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            : undefined;
          const expiresAt = isFree
            ? undefined
            : plan === 'lifetime_premium'
            ? undefined
            : options?.expiresAt ??
              (options?.startTrial
                ? undefined
                : new Date(
                    Date.now() +
                      (plan === 'annual_premium' ? 365 : 31) * 24 * 60 * 60 * 1000
                  ).toISOString());
          const productId = isFree ? undefined : options?.productId ?? s.subscriptionProductId;
          const transactionId = isFree
            ? undefined
            : options?.transactionId ?? s.subscriptionTransactionId;

          const event: AuditEvent = {
            id: makeId('audit'),
            type: 'profile',
            description: options?.startTrial
              ? `Started 7-day free trial for ${plan}`
              : `Updated subscription plan to ${plan}`,
            timestamp: nowIso,
          };

          const activeEmail = s.patientProfile.email || s.pendingEmail;
          const isDemo = s.clerkFlow === 'demo' || isDemoAccountEmail(activeEmail);
          if (!options?.silentSync && !isDemo) {
            syncSubscriptionToDatabase({
              plan,
              trialEndsAt: trialEnd,
              expiresAt,
              productId,
              transactionId,
              updatedAt: nowIso,
            }).catch(() => {});
          }

          return {
            subscriptionPlan: plan,
            subscriptionTrialEndsAt: trialEnd,
            subscriptionExpiresAt: expiresAt,
            subscriptionProductId: productId,
            subscriptionTransactionId: transactionId,
            subscriptionUpdatedAt: nowIso,
            ...(isFree
              ? {
                  biometricLock: false,
                  isAppLocked: false,
                  sharingRequiresPin: false,
                  aiConsentGranted: false,
                }
              : {
                  sharingRequiresPin: true,
                }),
            auditEvents: [event, ...s.auditEvents],
          };
        }),

      verifySubscriptionStatus: async () => {
        const s = get();
        const activeEmail = s.patientProfile.email || s.pendingEmail;
        const isDemo = s.clerkFlow === 'demo' || isDemoAccountEmail(activeEmail);
        if (isDemo) {
          return { plan: s.subscriptionPlan, expired: false, restoredFromStore: false };
        }

        // 1. Check native StoreKit 2 / Google Play Billing active entitlements
        const storeEntitlement = await verifyActiveStoreKitEntitlements();
        if (storeEntitlement.activePlan) {
          const prevPlan = s.subscriptionPlan;
          const nowIso = new Date().toISOString();
          const changed =
            prevPlan !== storeEntitlement.activePlan ||
            s.subscriptionTransactionId !== storeEntitlement.transactionId;

          if (changed) {
            set((curr) => ({
              subscriptionPlan: storeEntitlement.activePlan!,
              subscriptionTrialEndsAt: undefined,
              subscriptionExpiresAt: storeEntitlement.expiresAt,
              subscriptionProductId: storeEntitlement.productId,
              subscriptionTransactionId: storeEntitlement.transactionId,
              subscriptionUpdatedAt: nowIso,
              sharingRequiresPin: true,
              auditEvents:
                prevPlan !== storeEntitlement.activePlan
                  ? [
                      {
                        id: makeId('audit'),
                        type: 'profile',
                        description: `Verified active StoreKit / Play Billing entitlement (${storeEntitlement.activePlan})`,
                        timestamp: nowIso,
                      },
                      ...curr.auditEvents,
                    ]
                  : curr.auditEvents,
            }));

            syncSubscriptionToDatabase({
              plan: storeEntitlement.activePlan,
              trialEndsAt: undefined,
              expiresAt: storeEntitlement.expiresAt,
              productId: storeEntitlement.productId,
              transactionId: storeEntitlement.transactionId,
              updatedAt: nowIso,
            }).catch(() => {});
          }

          return {
            plan: storeEntitlement.activePlan,
            expired: false,
            restoredFromStore: prevPlan !== storeEntitlement.activePlan,
          };
        }

        // 2. Check if 7-day free trial or billing period has expired
        const nowMs = Date.now();
        const latest = get();
        const trialExpired = Boolean(
          latest.subscriptionPlan !== 'free' &&
            latest.subscriptionTrialEndsAt &&
            new Date(latest.subscriptionTrialEndsAt).getTime() <= nowMs
        );
        const periodExpired = Boolean(
          latest.subscriptionPlan !== 'free' &&
            latest.subscriptionPlan !== 'lifetime_premium' &&
            latest.subscriptionExpiresAt &&
            new Date(latest.subscriptionExpiresAt).getTime() <= nowMs
        );

        if (trialExpired || periodExpired) {
          const nowIso = new Date().toISOString();
          const reason = trialExpired
            ? '7-day free trial expired — reverted to Free Basic plan'
            : 'Subscription billing period expired — reverted to Free Basic plan';

          set((curr) => ({
            subscriptionPlan: 'free',
            subscriptionTrialEndsAt: undefined,
            subscriptionExpiresAt: undefined,
            subscriptionProductId: undefined,
            subscriptionTransactionId: undefined,
            subscriptionUpdatedAt: nowIso,
            biometricLock: false,
            isAppLocked: false,
            sharingRequiresPin: false,
            aiConsentGranted: false,
            auditEvents: [
              {
                id: makeId('audit'),
                type: 'profile',
                description: reason,
                timestamp: nowIso,
              },
              ...curr.auditEvents,
            ],
          }));

          syncSubscriptionToDatabase({
            plan: 'free',
            updatedAt: nowIso,
          }).catch(() => {});

          return { plan: 'free', expired: true, restoredFromStore: false };
        }

        return { plan: latest.subscriptionPlan, expired: false, restoredFromStore: false };
      },

      onboardingDraft: emptyOnboardingDraft,
      updateOnboardingDraft: (patch) => set((s) => ({ onboardingDraft: { ...s.onboardingDraft, ...patch } })),
      stamps: [],
      earnStamp: (id) => {
        let earned = false;
        set((s) => {
          if (s.stamps.includes(id)) return {};
          earned = true;
          return { stamps: [...s.stamps, id] };
        });
        return earned;
      },
      userMedications: [],
      addUserMedication: (med) =>
        set((s) => ({ userMedications: [...s.userMedications, { ...med, id: makeId('med') }] })),
      removeUserMedication: (id) =>
        set((s) => ({ userMedications: s.userMedications.filter((m) => m.id !== id) })),
      biometricLock: false,
      isAppLocked: false,
      setBiometricLock: (v) =>
        set((s) => ({
          biometricLock: v,
          isAppLocked: false,
          auditEvents: [
            {
              id: makeId('audit'),
              type: 'login',
              description: v
                ? 'Enabled Face ID / Biometric lock with Secure Enclave protection'
                : 'Disabled Biometric authentication lock',
              timestamp: new Date().toISOString(),
            },
            ...s.auditEvents,
          ],
        })),
      setAppLocked: (locked) => set({ isAppLocked: locked }),
      unlockApp: () =>
        set((s) => ({
          isAppLocked: false,
          auditEvents: [
            {
              id: makeId('audit'),
              type: 'login',
              description: 'Health passport unlocked via biometric verification',
              timestamp: new Date().toISOString(),
            },
            ...s.auditEvents,
          ],
        })),
      lockApp: () =>
        set((s) => (s.biometricLock ? { isAppLocked: true } : {})),
      finishOnboarding: (options) => {
        set((s) => {
          const d = s.onboardingDraft;
          const chosenPlan = options?.plan ?? s.subscriptionPlan;
          const trialEnd = options?.startTrial
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            : s.subscriptionTrialEndsAt;
          const event: AuditEvent = {
            id: makeId('audit'),
            type: 'login',
            description: `Passport created during guided setup (${chosenPlan})`,
            timestamp: new Date().toISOString(),
          };
          const validContacts = (d.emergencyContacts ?? [])
            .filter((c) => c.name.trim() || c.phone.trim())
            .map((c) => ({
              name: c.name.trim() || 'Emergency Contact',
              relationship: c.relationship.trim() || 'Emergency contact',
              phone: c.phone.trim(),
            }));
          if (validContacts.length === 0 && (d.contactName.trim() || d.contactPhone.trim())) {
            validContacts.push({
              name: d.contactName.trim() || 'Emergency Contact',
              relationship: d.contactRelationship.trim() || 'Emergency contact',
              phone: d.contactPhone.trim(),
            });
          }

          // Strip untouched Jessica Tebatso seed profile before applying user's onboarding inputs
          const baseProfile = stripDemoSeedProfile(s.patientProfile);

          const patch: Partial<PatientProfile> = {
            firstName: d.firstName || baseProfile.firstName,
            lastName: d.lastName || baseProfile.lastName,
            preferredName: d.firstName || baseProfile.preferredName,
            dateOfBirth: d.dateOfBirth || baseProfile.dateOfBirth,
            bloodGroup: d.bloodGroup || baseProfile.bloodGroup,
            allergies:
              d.allergies.length > 0
                ? d.allergies.map((substance) => ({ substance, reaction: 'Reported during onboarding' }))
                : baseProfile.allergies,
            chronicConditions: d.conditions.length > 0 ? d.conditions : baseProfile.chronicConditions,
            emergencyContact: validContacts[0] ?? baseProfile.emergencyContact,
            emergencyContacts:
              validContacts.length > 0
                ? validContacts
                : baseProfile.emergencyContacts ?? [],
          };

          // Strip demo seed records, meds, appointments, diary notes, and shares for new onboarding passport
          const nonDemoMeds = s.medications.filter((m) => !DEMO_MED_IDS.has(m.id));
          const nonDemoRecords = s.records.filter((r) => !DEMO_RECORD_IDS.has(r.id));
          const nonDemoAppts = s.appointments.filter((a) => !DEMO_APPT_IDS.has(a.id));
          const nonDemoNotes = s.diaryNotes.filter((n) => !DEMO_DIARY_IDS.has(n.id));
          const nonDemoShares = s.sharedLinks.filter((l) => !DEMO_SHARE_IDS.has(l.id));

          const timeMap: Record<MedicationTimeSlot, string> = {
            Morning: '08:00',
            Afternoon: '13:00',
            Evening: '18:00',
            Night: '21:00',
          };
          const onboardingMeds: Medication[] = s.userMedications
            .filter((um) => !nonDemoMeds.some((m) => m.name.toLowerCase() === um.name.toLowerCase()))
            .map((um) => {
              const slots = um.times && um.times.length > 0 ? um.times : [um.time];
              const mappedTimes = slots.map((slot) => timeMap[slot] ?? '08:00');
              const freqLabel =
                slots.length === 1
                  ? `Once daily (${slots[0].toLowerCase()})`
                  : slots.length === 2
                  ? `Twice daily (${slots.join(' & ').toLowerCase()})`
                  : slots.length === 3
                  ? `3 times daily (${slots.join(', ').toLowerCase()})`
                  : `4 times daily (${slots.join(', ').toLowerCase()})`;
              return {
                id: um.id,
                name: um.name,
                strength: um.dose || 'As directed',
                indication: 'Daily medication',
                route: 'Oral',
                frequency: freqLabel,
                directions: `Take in the ${slots.map((sl) => sl.toLowerCase()).join(', ')}`,
                prescriber: 'Self-reported',
                facility: 'Health Passport Setup',
                provenance: 'Patient Onboarding',
                times: mappedTimes,
                status: 'active',
                startDate: new Date().toISOString().slice(0, 10),
              };
            });

          const mergedMeds = [...onboardingMeds, ...nonDemoMeds];
          const nextMedReminders: Record<string, boolean> = {};
          for (const med of mergedMeds) {
            nextMedReminders[med.id] = true;
          }

          const mergedProfile = { ...baseProfile, ...patch };
          const isFree = chosenPlan === 'free';
          const nowIso = new Date().toISOString();
          const finalTrialEnd = isFree ? undefined : trialEnd;
          const finalExpiresAt =
            isFree || chosenPlan === 'lifetime_premium'
              ? undefined
              : options?.expiresAt ??
                (options?.startTrial
                  ? undefined
                  : new Date(
                      Date.now() +
                        (chosenPlan === 'annual_premium' ? 365 : 31) * 24 * 60 * 60 * 1000
                    ).toISOString());

          syncPatientProfile(mergedProfile).catch(() => {});
          syncMedications(mergedMeds).catch(() => {});
          syncRecords(nonDemoRecords).catch(() => {});
          syncSubscriptionToDatabase({
            plan: chosenPlan,
            trialEndsAt: finalTrialEnd,
            expiresAt: finalExpiresAt,
            productId: isFree ? undefined : options?.productId,
            transactionId: isFree ? undefined : options?.transactionId,
            updatedAt: nowIso,
          }).catch(() => {});

          return {
            hasCompletedOnboarding: true,
            isSignedIn: true,
            aiConsentGranted: !isFree,
            biometricLock: isFree ? false : s.biometricLock,
            isAppLocked: false,
            sharingRequiresPin: !isFree,
            subscriptionPlan: chosenPlan,
            subscriptionTrialEndsAt: finalTrialEnd,
            subscriptionExpiresAt: finalExpiresAt,
            subscriptionProductId: isFree ? undefined : options?.productId,
            subscriptionTransactionId: isFree ? undefined : options?.transactionId,
            subscriptionUpdatedAt: nowIso,
            records: nonDemoRecords,
            medications: mergedMeds,
            appointments: nonDemoAppts,
            diaryNotes: nonDemoNotes,
            sharedLinks: nonDemoShares,
            takenLog: {},
            skippedLog: {},
            medicationReminderEnabled: nextMedReminders,
            patientProfile: mergedProfile,
            auditEvents: [event, ...s.auditEvents],
          };
        });

        setTimeout(() => {
          void get().hydrateFromCloud();
        }, 150);
      },

      hydrateFromCloud: async () => {
        if (!isSupabaseConfigured || get().isSyncingCloud) {
          return false;
        }

        set({ isSyncingCloud: true });

        try {
          const [
            remoteProfile,
            remoteRecords,
            remoteMedications,
            remoteAppointments,
            remoteDiaryNotes,
            remoteSharedLinks,
            remoteSubscription,
          ] = await Promise.all([
            fetchPatientProfileFromDatabase(),
            fetchRecordsFromDatabase(),
            fetchMedicationsFromDatabase(),
            fetchAppointmentsFromDatabase(),
            fetchDiaryNotesFromDatabase(),
            fetchSharedLinksFromDatabase(),
            fetchSubscriptionFromDatabase(),
          ]);

          const current = get();
          const activeEmail = current.patientProfile.email || current.pendingEmail;
          const isDemo =
            current.clerkFlow === 'demo' || isDemoAccountEmail(activeEmail);

          // 1. Two-way merge Records
          const localRecords = isDemo
            ? current.records
            : current.records.filter((r) => !DEMO_RECORD_IDS.has(r.id));
          let mergedRecords = localRecords;

          if (remoteRecords !== null) {
            const localById = new Map(localRecords.map((r) => [r.id, r]));
            const remoteById = new Map(remoteRecords.map((r) => [r.id, r]));

            const hydratedRemote = remoteRecords.map((remoteRec) => {
              const localRec = localById.get(remoteRec.id);
              if (
                localRec?.originalFile?.uri &&
                localRec.originalFile.uri.startsWith('file://')
              ) {
                return {
                  ...remoteRec,
                  originalFile: {
                    ...(remoteRec.originalFile ?? localRec.originalFile),
                    uri: localRec.originalFile.uri,
                  },
                };
              }
              return remoteRec;
            });

            const unsyncedLocalRecords = localRecords.filter((r) => !remoteById.has(r.id));
            if (unsyncedLocalRecords.length > 0 && !isDemo) {
              syncRecords(unsyncedLocalRecords).catch(() => {});
            }

            mergedRecords = [...hydratedRemote, ...unsyncedLocalRecords].sort((a, b) =>
              a.eventDate < b.eventDate ? 1 : -1
            );
          } else if (localRecords.length > 0 && !isDemo) {
            syncRecords(localRecords).catch(() => {});
          }

          // 2. Two-way merge Medications
          const localMeds = isDemo
            ? current.medications
            : current.medications.filter((m) => !DEMO_MED_IDS.has(m.id));
          let mergedMeds = localMeds;

          if (remoteMedications !== null) {
            const remoteMedIds = new Set(remoteMedications.map((m) => m.id));
            const unsyncedLocalMeds = localMeds.filter((m) => !remoteMedIds.has(m.id));
            if (unsyncedLocalMeds.length > 0 && !isDemo) {
              syncMedications(unsyncedLocalMeds).catch(() => {});
            }
            mergedMeds = [...remoteMedications, ...unsyncedLocalMeds];
          } else if (localMeds.length > 0 && !isDemo) {
            syncMedications(localMeds).catch(() => {});
          }

          const nextReminderEnabled = { ...current.medicationReminderEnabled };
          for (const med of mergedMeds) {
            if (nextReminderEnabled[med.id] === undefined) {
              nextReminderEnabled[med.id] = med.status === 'active';
            }
          }

          // 3. Two-way merge Appointments
          const localAppts = isDemo
            ? current.appointments
            : current.appointments.filter((a) => !DEMO_APPT_IDS.has(a.id));
          let mergedAppts = localAppts;

          if (remoteAppointments !== null) {
            const remoteApptIds = new Set(remoteAppointments.map((a) => a.id));
            const unsyncedLocalAppts = localAppts.filter((a) => !remoteApptIds.has(a.id));
            if (unsyncedLocalAppts.length > 0 && !isDemo) {
              syncAppointments(unsyncedLocalAppts).catch(() => {});
            }
            mergedAppts = [...remoteAppointments, ...unsyncedLocalAppts];
          } else if (localAppts.length > 0 && !isDemo) {
            syncAppointments(localAppts).catch(() => {});
          }

          // 4. Two-way merge Diary Notes
          const localNotes = isDemo
            ? current.diaryNotes
            : current.diaryNotes.filter((n) => !DEMO_DIARY_IDS.has(n.id));
          let mergedNotes = localNotes;

          if (remoteDiaryNotes !== null) {
            const remoteNoteIds = new Set(remoteDiaryNotes.map((n) => n.id));
            const unsyncedLocalNotes = localNotes.filter((n) => !remoteNoteIds.has(n.id));
            if (unsyncedLocalNotes.length > 0 && !isDemo) {
              syncDiaryNotes(unsyncedLocalNotes).catch(() => {});
            }
            mergedNotes = [...remoteDiaryNotes, ...unsyncedLocalNotes];
          } else if (localNotes.length > 0 && !isDemo) {
            syncDiaryNotes(localNotes).catch(() => {});
          }

          // 5. Two-way merge Shared Links & auto-expire past-due shares
          const nowMs = Date.now();
          const normalizeShareStatus = (l: SharedLink): SharedLink => {
            if (l.status === 'active' && l.expiresAt && new Date(l.expiresAt).getTime() <= nowMs) {
              return { ...l, status: 'expired' };
            }
            return l;
          };

          const localShares = (
            isDemo
              ? current.sharedLinks
              : current.sharedLinks.filter((l) => !DEMO_SHARE_IDS.has(l.id))
          ).map(normalizeShareStatus);
          let mergedShares = localShares;

          if (remoteSharedLinks !== null) {
            const normalizedRemote = remoteSharedLinks.map(normalizeShareStatus);
            const remoteShareIds = new Set(normalizedRemote.map((l) => l.id));
            const unsyncedLocalShares = localShares.filter((l) => !remoteShareIds.has(l.id));
            if (unsyncedLocalShares.length > 0 && !isDemo) {
              syncSharedLinks(unsyncedLocalShares, (link) =>
                buildShareSnapshot(current.patientProfile, mergedRecords, mergedNotes, link)
              ).catch(() => {});
            }
            mergedShares = [...normalizedRemote, ...unsyncedLocalShares];
          } else if (localShares.length > 0 && !isDemo) {
            syncSharedLinks(localShares, (link) =>
              buildShareSnapshot(current.patientProfile, mergedRecords, mergedNotes, link)
            ).catch(() => {});
          }

          // 6. Two-way merge Patient Profile
          const baseLocalProfile = isDemo
            ? current.patientProfile
            : stripDemoSeedProfile(current.patientProfile);
          let mergedProfile = baseLocalProfile;

          const hasRemoteProfile = Boolean(
            remoteProfile &&
              (remoteProfile.firstName ||
                remoteProfile.lastName ||
                remoteProfile.dateOfBirth ||
                remoteProfile.bloodGroup)
          );

          if (hasRemoteProfile && remoteProfile) {
            mergedProfile = {
              ...baseLocalProfile,
              firstName: remoteProfile.firstName || baseLocalProfile.firstName,
              lastName: remoteProfile.lastName || baseLocalProfile.lastName,
              preferredName:
                remoteProfile.preferredName ||
                remoteProfile.firstName ||
                baseLocalProfile.preferredName,
              dateOfBirth: remoteProfile.dateOfBirth || baseLocalProfile.dateOfBirth,
              idNumber: remoteProfile.idNumber || baseLocalProfile.idNumber,
              bloodGroup: remoteProfile.bloodGroup || baseLocalProfile.bloodGroup,
              allergies:
                remoteProfile.allergies && remoteProfile.allergies.length > 0
                  ? remoteProfile.allergies
                  : baseLocalProfile.allergies,
              chronicConditions:
                remoteProfile.chronicConditions && remoteProfile.chronicConditions.length > 0
                  ? remoteProfile.chronicConditions
                  : baseLocalProfile.chronicConditions,
              emergencyContact:
                remoteProfile.emergencyContact?.name || remoteProfile.emergencyContact?.phone
                  ? remoteProfile.emergencyContact
                  : baseLocalProfile.emergencyContact,
              emergencyContacts:
                remoteProfile.emergencyContacts && remoteProfile.emergencyContacts.length > 0
                  ? remoteProfile.emergencyContacts
                  : baseLocalProfile.emergencyContacts,
              gender: remoteProfile.gender || baseLocalProfile.gender,
              phone: remoteProfile.phone || baseLocalProfile.phone,
              email: baseLocalProfile.email || remoteProfile.email || current.pendingEmail || '',
              address: remoteProfile.address || baseLocalProfile.address,
              province: remoteProfile.province || baseLocalProfile.province,
              avatarUrl: baseLocalProfile.avatarUrl || remoteProfile.avatarUrl,
              previousProcedures:
                remoteProfile.previousProcedures && remoteProfile.previousProcedures.length > 0
                  ? remoteProfile.previousProcedures
                  : baseLocalProfile.previousProcedures,
              medicalDevices:
                remoteProfile.medicalDevices && remoteProfile.medicalDevices.length > 0
                  ? remoteProfile.medicalDevices
                  : baseLocalProfile.medicalDevices,
              memberSince: remoteProfile.memberSince || baseLocalProfile.memberSince,
            };

            if (
              !isDemo &&
              ((baseLocalProfile.email && baseLocalProfile.email !== remoteProfile.email) ||
                (baseLocalProfile.avatarUrl && baseLocalProfile.avatarUrl !== remoteProfile.avatarUrl))
            ) {
              syncPatientProfile(mergedProfile).catch(() => {});
            }
          } else if (
            !isDemo &&
            (baseLocalProfile.firstName || baseLocalProfile.email || baseLocalProfile.dateOfBirth)
          ) {
            syncPatientProfile(baseLocalProfile).catch(() => {});
          }

          // 7. Two-way merge & expiry validation of Subscription Entitlement
          let nextSubPlan = current.subscriptionPlan;
          let nextTrialEndsAt = current.subscriptionTrialEndsAt;
          let nextSubExpiresAt = current.subscriptionExpiresAt;
          let nextSubProductId = current.subscriptionProductId;
          let nextSubTxId = current.subscriptionTransactionId;
          let nextSubUpdatedAt = current.subscriptionUpdatedAt;

          if (!isDemo) {
            const normalizeEntitlement = (
              ent: CloudSubscriptionEntitlement
            ): CloudSubscriptionEntitlement => {
              const trialDone = Boolean(
                ent.plan !== 'free' &&
                  ent.trialEndsAt &&
                  new Date(ent.trialEndsAt).getTime() <= nowMs
              );
              const periodDone = Boolean(
                ent.plan !== 'free' &&
                  ent.plan !== 'lifetime_premium' &&
                  ent.expiresAt &&
                  new Date(ent.expiresAt).getTime() <= nowMs
              );
              if (trialDone || periodDone) {
                return {
                  plan: 'free',
                  updatedAt: new Date(nowMs).toISOString(),
                };
              }
              return ent;
            };

            if (remoteSubscription) {
              const validRemote = normalizeEntitlement(remoteSubscription);
              const remoteMs = validRemote.updatedAt
                ? new Date(validRemote.updatedAt).getTime()
                : 0;
              const localMs = nextSubUpdatedAt ? new Date(nextSubUpdatedAt).getTime() : 0;

              if (remoteMs >= localMs) {
                nextSubPlan = validRemote.plan;
                nextTrialEndsAt = validRemote.trialEndsAt;
                nextSubExpiresAt = validRemote.expiresAt;
                nextSubProductId = validRemote.productId;
                nextSubTxId = validRemote.transactionId;
                nextSubUpdatedAt = validRemote.updatedAt;
              } else {
                syncSubscriptionToDatabase({
                  plan: nextSubPlan,
                  trialEndsAt: nextTrialEndsAt,
                  expiresAt: nextSubExpiresAt,
                  productId: nextSubProductId,
                  transactionId: nextSubTxId,
                  updatedAt: nextSubUpdatedAt || new Date(nowMs).toISOString(),
                }).catch(() => {});
              }
            } else if (nextSubPlan !== 'free' || nextSubUpdatedAt) {
              syncSubscriptionToDatabase({
                plan: nextSubPlan,
                trialEndsAt: nextTrialEndsAt,
                expiresAt: nextSubExpiresAt,
                productId: nextSubProductId,
                transactionId: nextSubTxId,
                updatedAt: nextSubUpdatedAt || new Date(nowMs).toISOString(),
              }).catch(() => {});
            }
          }

          const isEffectiveFree = nextSubPlan === 'free';

          set({
            records: mergedRecords,
            medications: mergedMeds,
            medicationReminderEnabled: nextReminderEnabled,
            appointments: mergedAppts,
            diaryNotes: mergedNotes,
            sharedLinks: mergedShares,
            patientProfile: mergedProfile,
            subscriptionPlan: nextSubPlan,
            subscriptionTrialEndsAt: nextTrialEndsAt,
            subscriptionExpiresAt: nextSubExpiresAt,
            subscriptionProductId: nextSubProductId,
            subscriptionTransactionId: nextSubTxId,
            subscriptionUpdatedAt: nextSubUpdatedAt,
            ...(isEffectiveFree
              ? {
                  biometricLock: false,
                  isAppLocked: false,
                  sharingRequiresPin: false,
                  aiConsentGranted: false,
                }
              : {
                  sharingRequiresPin: true,
                }),
            isSyncingCloud: false,
            lastCloudSyncAt: new Date().toISOString(),
          });

          return true;
        } catch (err) {
          console.warn('[Cloud Hydration] Two-way sync error:', err);
          set({ isSyncingCloud: false });
          return false;
        }
      },

      patientProfile: patient,
      updatePatientProfile: (patch) =>
        set((s) => {
          const nextProfile = { ...s.patientProfile, ...patch };
          syncPatientProfile(nextProfile).catch(() => {});
          return { patientProfile: nextProfile };
        }),

      eraseAllPatientData: async () => {
        // 1. Wipe remote Supabase database and storage
        await eraseAllCloudData().catch(() => {});
        setSupabaseAuthContext({ userId: null, getToken: null });

        // 2. Clear local disk files and documents
        await clearAllStoredFiles().catch(() => {});

        // 3. Clear hardware SecureStore cryptographic keys
        await clearEnclaveKeys().catch(() => {});

        // 4. Wipe local AsyncStorage
        await AsyncStorage.clear().catch(() => {});

        // 5. Reset store memory to empty baseline
        set({
          isSignedIn: false,
          hasCompletedOnboarding: false,
          pendingEmail: '',
          clerkSessionId: undefined,
          clerkFlow: 'sign_in',
          biometricLock: false,
          isAppLocked: false,
          aiConsentGranted: false,
          subscriptionPlan: 'free',
          subscriptionTrialEndsAt: undefined,
          subscriptionExpiresAt: undefined,
          subscriptionProductId: undefined,
          subscriptionTransactionId: undefined,
          subscriptionUpdatedAt: undefined,
          records: [],
          medications: [],
          userMedications: [],
          takenLog: {},
          skippedLog: {},
          diaryNotes: [],
          diaryDraft: null,
          appointments: [],
          sharedLinks: [],
          auditEvents: [
            {
              id: makeId('audit'),
              type: 'profile',
              description: 'All personal health data erased under POPIA §24 / HIPAA Right to Erasure',
              timestamp: new Date().toISOString(),
            },
          ],
          patientProfile: {
            firstName: '',
            lastName: '',
            preferredName: '',
            dateOfBirth: '',
            idNumber: '',
            gender: '',
            phone: '',
            email: '',
            address: '',
            province: 'Gauteng',
            bloodGroup: '',
            allergies: [],
            chronicConditions: [],
            previousProcedures: [],
            medicalDevices: [],
            emergencyContact: {
              name: '',
              relationship: '',
              phone: '',
            },
            memberSince: new Date().toISOString(),
          },
          emergencyVisibility: defaultEmergencyVisibility,
        });
      },

      resetToDemoPatient: () => {
        set({
          subscriptionPlan: 'monthly_premium',
          subscriptionTrialEndsAt: undefined,
          subscriptionExpiresAt: undefined,
          sharingRequiresPin: true,
          records: medicalRecords,
          medications: medicationsSeed,
          userMedications: [],
          takenLog: buildSeedAdherenceLog(),
          skippedLog: {},
          diaryNotes: diaryNotesSeed,
          appointments: appointmentsSeed,
          sharedLinks: sharingHistorySeed,
          auditEvents: auditSeed,
          patientProfile: patient,
          emergencyVisibility: defaultEmergencyVisibility,
        });
      },
    }),
    {
      name: 'siyashesha-app-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => {
        const { isAppLocked, isSyncingCloud, ...rest } = state;
        return rest;
      },
    }
  )
);

export function diaryNoteById(id: string | undefined) {
  if (!id) return undefined;
  return useAppStore.getState().diaryNotes.find((n) => n.id === id);
}
