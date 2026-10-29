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
import { clearEnclaveKeys } from '@/lib/security/enclaveSecurity';
import { eraseAllCloudData, setSupabaseAuthContext } from '@/lib/supabase';

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
  setSubscriptionPlan: (plan: SubscriptionPlanId, options?: { startTrial?: boolean }) => void;

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
  finishOnboarding: (options?: { plan?: SubscriptionPlanId; startTrial?: boolean }) => void;

  // POPIA §24 / HIPAA Data Subject Erasure
  eraseAllPatientData: () => Promise<void>;
  resetToDemoPatient: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isSignedIn: false,
      pendingEmail: '',
      clerkFlow: 'sign_in',
      clerkSessionId: undefined,
      signInWithEmail: (email, flow = 'sign_in') =>
        set({ pendingEmail: email.trim().toLowerCase(), clerkFlow: flow }),
      setClerkSessionId: (id) => set({ clerkSessionId: id }),
      completeSignIn: (options) =>
        set((s) => {
          const isClerk = Boolean(options?.clerkSessionId);
          const email = options?.email || s.pendingEmail;
          const event: AuditEvent = {
            id: makeId('audit'),
            type: 'login',
            description: isClerk
              ? `Signed in with Clerk email OTP verification${email ? ` (${email})` : ''}`
              : 'Signed in with demo verification',
            timestamp: new Date().toISOString(),
          };
          // Returning users with an account skip the guided setup.
          const isDemo = !isClerk && (!email || email.includes('jessica') || email.includes('example'));
          const shouldRestoreDemo = isDemo && s.records.length === 0;
          return {
            isSignedIn: true,
            hasCompletedOnboarding: true,
            clerkSessionId: options?.clerkSessionId ?? s.clerkSessionId,
            patientProfile: email
              ? { ...s.patientProfile, email }
              : shouldRestoreDemo
              ? patient
              : s.patientProfile,
            records: shouldRestoreDemo ? medicalRecords : s.records,
            medications: shouldRestoreDemo ? medicationsSeed : s.medications,
            appointments: shouldRestoreDemo ? appointmentsSeed : s.appointments,
            diaryNotes: shouldRestoreDemo ? diaryNotesSeed : s.diaryNotes,
            sharedLinks: shouldRestoreDemo ? sharingHistorySeed : s.sharedLinks,
            auditEvents: [event, ...s.auditEvents],
          };
        }),
      signOut: () => {
        setSupabaseAuthContext({ userId: null, getToken: null });
        set({
          isSignedIn: false,
          pendingEmail: '',
          clerkSessionId: undefined,
          clerkFlow: 'sign_in',
        });
      },

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
        return id;
      },
      updateMedication: (id, patch) =>
        set((s) => ({
          medications: s.medications.map((m) => (m.id === id ? { ...m, ...patch } : m)),
          auditEvents: [
            {
              id: makeId('audit'),
              type: 'upload',
              description: `Updated prescription: ${patch.name ?? id}`,
              timestamp: new Date().toISOString(),
            },
            ...s.auditEvents,
          ],
        })),
      deleteMedication: (id) =>
        set((s) => {
          const med = s.medications.find((m) => m.id === id);
          const nextReminders = { ...s.medicationReminderEnabled };
          delete nextReminders[id];
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
        set((s) => ({
          medications: s.medications.map((m) => {
            if (m.id !== id) return m;
            const nextStatus = m.status === 'active' ? 'past' : 'active';
            return {
              ...m,
              status: nextStatus,
              endDate: nextStatus === 'past' ? new Date().toISOString().slice(0, 10) : undefined,
            };
          }),
        })),

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
        return id;
      },
      updateAppointment: (id, patch) =>
        set((s) => ({
          appointments: s.appointments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        })),
      deleteAppointment: (id) =>
        set((s) => ({
          appointments: s.appointments.filter((a) => a.id !== id),
        })),
      rescheduleAppointment: (id, date, time) =>
        set((s) => ({
          appointments: s.appointments.map((a) => (a.id === id ? { ...a, date, time } : a)),
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

      subscriptionPlan: 'monthly_premium',
      subscriptionTrialEndsAt: undefined,
      setSubscriptionPlan: (plan, options) =>
        set((s) => {
          const trialEnd = options?.startTrial
            ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            : undefined;
          const event: AuditEvent = {
            id: makeId('audit'),
            type: 'profile',
            description: options?.startTrial
              ? `Started 7-day free trial for ${plan}`
              : `Updated subscription plan to ${plan}`,
            timestamp: new Date().toISOString(),
          };
          return {
            subscriptionPlan: plan,
            subscriptionTrialEndsAt: trialEnd,
            auditEvents: [event, ...s.auditEvents],
          };
        }),

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
      finishOnboarding: (options) =>
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

          const patch: Partial<PatientProfile> = {
            firstName: d.firstName || s.patientProfile.firstName,
            lastName: d.lastName || s.patientProfile.lastName,
            preferredName: d.firstName || s.patientProfile.preferredName,
            dateOfBirth: d.dateOfBirth || s.patientProfile.dateOfBirth,
            bloodGroup: d.bloodGroup || s.patientProfile.bloodGroup,
            allergies:
              d.allergies.length > 0
                ? d.allergies.map((substance) => ({ substance, reaction: 'Reported during onboarding' }))
                : s.patientProfile.allergies,
            chronicConditions: d.conditions.length > 0 ? d.conditions : s.patientProfile.chronicConditions,
            emergencyContact: validContacts[0] ?? s.patientProfile.emergencyContact,
            emergencyContacts:
              validContacts.length > 0
                ? validContacts
                : s.patientProfile.emergencyContacts ?? [s.patientProfile.emergencyContact],
          };

          const timeMap: Record<MedicationTimeSlot, string> = {
            Morning: '08:00',
            Afternoon: '13:00',
            Evening: '18:00',
            Night: '21:00',
          };
          const onboardingMeds: Medication[] = s.userMedications
            .filter((um) => !s.medications.some((m) => m.name.toLowerCase() === um.name.toLowerCase()))
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

          const nextMedReminders = { ...s.medicationReminderEnabled };
          for (const med of onboardingMeds) {
            nextMedReminders[med.id] = true;
          }

          return {
            hasCompletedOnboarding: true,
            isSignedIn: true,
            subscriptionPlan: chosenPlan,
            subscriptionTrialEndsAt: trialEnd,
            medications: onboardingMeds.length > 0 ? [...onboardingMeds, ...s.medications] : s.medications,
            medicationReminderEnabled: nextMedReminders,
            patientProfile: { ...s.patientProfile, ...patch },
            auditEvents: [event, ...s.auditEvents],
          };
        }),

      patientProfile: patient,
      updatePatientProfile: (patch) =>
        set((s) => ({ patientProfile: { ...s.patientProfile, ...patch } })),

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
        const { isAppLocked, ...rest } = state;
        return rest;
      },
    }
  )
);

export function diaryNoteById(id: string | undefined) {
  if (!id) return undefined;
  return useAppStore.getState().diaryNotes.find((n) => n.id === id);
}
