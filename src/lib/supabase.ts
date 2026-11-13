import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type {
  Appointment,
  AppointmentReminderOption,
  AppointmentStatus,
  AppointmentType,
} from '@/data/appointments';
import type { DiaryAttachment, DiaryCategory, DiaryNote } from '@/data/diarySeed';
import type {
  DoctorAvailability,
  DoctorBooking,
  DoctorConsultationNotes,
  DoctorPrescriptionItem,
  DoctorProfile,
  DoctorService,
  DoctorSickCertificate,
  PatientClinicalSummary,
} from '@/data/doctors';
import type { Medication } from '@/data/medications';
import type { EmergencyContact, PatientProfile } from '@/data/patient';
import type { MedicalRecord } from '@/data/records';
import type { ShareDuration, SharedLink } from '@/data/sharing';
import type { Database, Json } from '@/types/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const BUCKET_NAME = process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET || 'medical-records';

const DEVICE_USER_ID_KEY = 'siyashesha_tenant_user_id_v1';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  supabaseUrl.startsWith('http')
);

const isServer = Platform.OS === 'web' && typeof window === 'undefined';

const ssrSafeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isServer) return null;
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (isServer) return;
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },
  removeItem: async (key: string): Promise<void> => {
    if (isServer) return;
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

/**
 * Active authenticated user context (Clerk user ID + session token provider).
 * Falls back to a unique cryptographic per-install tenant UUID stored in SecureStore
 * when the user is in offline/guided mode without an active Clerk session, ensuring
 * two devices or users never share a global 'default_patient' ID.
 */
let activeAuthUserId: string | null = null;
let activeTokenGetter: (() => Promise<string | null>) | null = null;
let cachedDeviceUserId: string | null = null;

export function setSupabaseAuthContext(params: {
  userId?: string | null;
  getToken?: (() => Promise<string | null>) | null;
}): void {
  activeAuthUserId = params.userId?.trim() || null;
  activeTokenGetter = params.getToken ?? null;
}

/**
 * Resolves the current isolated user ID for row-level security (`user_id`) and
 * private storage folder paths (`<user_id>/records/...`).
 */
export async function getCurrentUserId(): Promise<string> {
  if (activeAuthUserId) {
    return activeAuthUserId;
  }

  if (cachedDeviceUserId) {
    return cachedDeviceUserId;
  }

  if (isServer) {
    return 'ssr-unauthenticated';
  }

  try {
    if (Platform.OS !== 'web') {
      const existing = await SecureStore.getItemAsync(DEVICE_USER_ID_KEY);
      if (existing) {
        cachedDeviceUserId = existing;
        return existing;
      }
      const generated = `usr_${Crypto.randomUUID()}`;
      await SecureStore.setItemAsync(DEVICE_USER_ID_KEY, generated);
      cachedDeviceUserId = generated;
      return generated;
    } else {
      const existing = await AsyncStorage.getItem(DEVICE_USER_ID_KEY);
      if (existing) {
        cachedDeviceUserId = existing;
        return existing;
      }
      const generated = `usr_${Crypto.randomUUID()}`;
      await AsyncStorage.setItem(DEVICE_USER_ID_KEY, generated);
      cachedDeviceUserId = generated;
      return generated;
    }
  } catch {
    const fallback = `usr_${Crypto.randomUUID()}`;
    cachedDeviceUserId = fallback;
    return fallback;
  }
}

/**
 * Custom fetch wrapper that injects the active Clerk session JWT (when signed in)
 * for cryptographically verified Row-Level Security in Supabase.
 */
const authenticatedSupabaseFetch: typeof fetch = async (input, init) => {
  const headers = new Headers(init?.headers);

  if (activeTokenGetter) {
    try {
      const token = await activeTokenGetter();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } catch {
      // Keep default anon key Authorization if Clerk token retrieval fails
    }
  }

  return fetch(input, {
    ...init,
    headers,
  });
};

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      storage: ssrSafeStorage,
      autoRefreshToken: !isServer,
      persistSession: !isServer,
      detectSessionInUrl: false,
    },
    global: {
      fetch: authenticatedSupabaseFetch,
    },
  }
);

export interface StorageUploadResult {
  remoteUrl: string;
  storagePath: string;
}

export interface ConnectionStatus {
  configured: boolean;
  connected: boolean;
  storageReady: boolean;
  dbReady: boolean;
  message: string;
}

/** Decode base64 to an ArrayBuffer for binary uploads across iOS, Android and Web */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Checks connection to Supabase storage and database.
 */
export async function checkSupabaseConnection(): Promise<ConnectionStatus> {
  if (!isSupabaseConfigured) {
    return {
      configured: false,
      connected: false,
      storageReady: false,
      dbReady: false,
      message: 'Supabase URL or Anon Key is not configured in environment.',
    };
  }

  let storageReady = false;
  let dbReady = false;

  try {
    const { data: buckets, error: bucketErr } = await supabase.storage.listBuckets();
    if (!bucketErr && buckets) {
      storageReady = buckets.some((b) => b.name === BUCKET_NAME);
    }
  } catch {
    storageReady = false;
  }

  try {
    const userId = await getCurrentUserId();
    const { error: tableErr } = await supabase
      .from('medical_records')
      .select('id')
      .eq('user_id', userId)
      .limit(1);
    dbReady = !tableErr;
  } catch {
    dbReady = false;
  }

  const connected = storageReady || dbReady;
  const message = connected
    ? 'Connected to Supabase Cloud Backend'
    : 'Reached Supabase; waiting for schema tables or RLS initialization.';

  return {
    configured: true,
    connected,
    storageReady,
    dbReady,
    message,
  };
}

/**
 * Uploads a medical record file (PDF, image, scan) to the private Supabase Storage bucket
 * 'medical-records' inside the current user's isolated folder (`<userId>/records/...`).
 * Returns a time-limited signed URL and storage path on success, or null on failure.
 */
export async function uploadRecordFile(
  localUri: string,
  fileName: string,
  mimeType: string = 'application/octet-stream'
): Promise<StorageUploadResult | null> {
  if (!isSupabaseConfigured) {
    return null;
  }

  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const storagePath = `${userId}/records/${timestamp}_${sanitizedName}`;

    let bodyData: ArrayBuffer | Blob;

    if (Platform.OS === 'web') {
      const response = await fetch(localUri);
      bodyData = await response.blob();
    } else {
      const base64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      bodyData = base64ToArrayBuffer(base64);
    }

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, bodyData, {
        contentType: mimeType,
        upsert: true,
      });

    if (error || !data) {
      console.warn('[Supabase Storage] Upload error:', error?.message);
      return null;
    }

    // Create a signed URL since the medical-records bucket is private
    const { data: signedData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

    return {
      remoteUrl: signedData?.signedUrl ?? '',
      storagePath,
    };
  } catch (err) {
    console.warn('[Supabase Storage] Unexpected error during upload:', err);
    return null;
  }
}

/**
 * Creates a fresh 7-day signed URL for a file stored in the private 'medical-records' bucket.
 */
export async function getSignedRecordUrl(storagePath: string): Promise<string | null> {
  if (!isSupabaseConfigured || !storagePath) return null;
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

function toScopedRowId(userId: string, rawId: string): string {
  return rawId.startsWith(`${userId}_`) ? rawId : `${userId}_${rawId}`;
}

function fromScopedRowId(userId: string, rowId: string): string {
  const prefix = `${userId}_`;
  return rowId.startsWith(prefix) ? rowId.slice(prefix.length) : rowId;
}

/**
 * Syncs a single medical record's metadata (and uploads its local binary file if not yet in cloud storage)
 * to the 'medical_records' table, strictly scoped to the current authenticated user's `user_id`.
 */
export async function syncRecordToDatabase(record: MedicalRecord): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    let remoteUrl = record.originalFile?.remoteUrl ?? null;
    let storagePath = record.originalFile?.storagePath ?? null;

    // Ensure local file is uploaded to Supabase Storage if not yet uploaded
    if (
      record.originalFile?.uri &&
      !storagePath &&
      (record.originalFile.uri.startsWith('file://') || Platform.OS === 'web')
    ) {
      const uploaded = await uploadRecordFile(
        record.originalFile.uri,
        record.originalFile.name || `${record.id}.bin`,
        record.originalFile.mimeType || 'application/octet-stream'
      );
      if (uploaded) {
        remoteUrl = uploaded.remoteUrl;
        storagePath = uploaded.storagePath;
      }
    }

    const row = {
      id: toScopedRowId(userId, record.id),
      user_id: userId,
      category: record.category,
      title: record.title,
      facility: record.facility,
      doctor: record.doctor ?? null,
      diagnosis: record.diagnosis ?? null,
      follow_up: record.followUp ?? null,
      event_date: record.eventDate,
      uploaded_at: record.uploadedAt,
      source_type: record.sourceType,
      document_type: record.documentType,
      status: record.status,
      clinical_notes: record.clinicalNotes,
      fields: (record.fields ?? []) as unknown as Json,
      original_file_uri: record.originalFile?.uri ?? null,
      original_file_name: record.originalFile?.name ?? null,
      original_file_mime: record.originalFile?.mimeType ?? null,
      remote_url: remoteUrl,
      storage_path: storagePath,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('medical_records').upsert(row);
    if (error) {
      console.warn('[Supabase DB] Error syncing record:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase DB] Unexpected error syncing record:', err);
    return false;
  }
}

/**
 * Syncs multiple medical records to Supabase.
 */
export async function syncRecords(records: MedicalRecord[]): Promise<boolean> {
  if (!isSupabaseConfigured || records.length === 0) return true;
  let allOk = true;
  for (const record of records) {
    const ok = await syncRecordToDatabase(record);
    if (!ok) allOk = false;
  }
  return allOk;
}

/**
 * Removes a single record and its private cloud storage file if owned by the current user.
 */
export async function deleteRecordFromDatabase(id: string, storagePath?: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    if (storagePath && storagePath.startsWith(`${userId}/`)) {
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]).catch(() => {});
    }
    if (!id) return true;

    const candidateIds = [id, toScopedRowId(userId, id)];
    const { error } = await supabase
      .from('medical_records')
      .delete()
      .in('id', candidateIds)
      .eq('user_id', userId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Fetches medical records belonging strictly to the current user,
 * refreshing private storage signed URLs when `storage_path` is present.
 */
export async function fetchRecordsFromDatabase(): Promise<MedicalRecord[] | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('user_id', userId)
      .order('event_date', { ascending: false });

    if (error || !data) {
      return null;
    }

    const mapped = await Promise.all(
      data.map(async (row: any): Promise<MedicalRecord> => {
        const hasFile = Boolean(row.original_file_uri || row.storage_path || row.remote_url);
        let freshRemoteUrl: string | undefined = row.remote_url || undefined;

        if (row.storage_path) {
          const signed = await getSignedRecordUrl(row.storage_path);
          if (signed) {
            freshRemoteUrl = signed;
          }
        }

        return {
          id: fromScopedRowId(userId, row.id),
          category: row.category,
          title: row.title,
          facility: row.facility,
          doctor: row.doctor || undefined,
          diagnosis: row.diagnosis || undefined,
          followUp: row.follow_up || undefined,
          eventDate: row.event_date,
          uploadedAt: row.uploaded_at,
          sourceType: row.source_type,
          documentType: row.document_type,
          status: row.status,
          clinicalNotes: row.clinical_notes || '',
          fields: Array.isArray(row.fields) ? row.fields : [],
          originalFile: hasFile
            ? {
                uri: row.original_file_uri || freshRemoteUrl || '',
                name: row.original_file_name || 'Document',
                mimeType: row.original_file_mime || 'application/octet-stream',
                remoteUrl: freshRemoteUrl,
                storagePath: row.storage_path || undefined,
              }
            : undefined,
        };
      })
    );

    return mapped;
  } catch {
    return null;
  }
}

interface ExtendedProfileMeta {
  facility?: string;
  gender?: string;
  phone?: string;
  email?: string;
  address?: string;
  province?: string;
  avatarUrl?: string;
  previousProcedures?: string[];
  medicalDevices?: string[];
  memberSince?: string;
}

/**
 * Syncs the active patient profile to Supabase scoped to the current user's `user_id`.
 */
export async function syncPatientProfile(profile: PatientProfile): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const contacts =
      profile.emergencyContacts && profile.emergencyContacts.length > 0
        ? profile.emergencyContacts
        : profile.emergencyContact && (profile.emergencyContact.name || profile.emergencyContact.phone)
        ? [profile.emergencyContact]
        : [];

    const meta: ExtendedProfileMeta = {
      facility: 'Rosebank Family Practice',
      gender: profile.gender || undefined,
      phone: profile.phone || undefined,
      email: profile.email || undefined,
      address: profile.address || undefined,
      province: profile.province || undefined,
      avatarUrl: profile.avatarUrl || undefined,
      previousProcedures: profile.previousProcedures ?? [],
      medicalDevices: profile.medicalDevices ?? [],
      memberSince: profile.memberSince || undefined,
    };

    const row = {
      id: userId,
      user_id: userId,
      first_name: profile.firstName || '',
      last_name: profile.lastName || '',
      preferred_name: profile.preferredName ?? null,
      date_of_birth: profile.dateOfBirth || '',
      national_id: profile.idNumber ?? null,
      blood_group: profile.bloodGroup ?? null,
      allergies: (profile.allergies ?? []) as unknown as Json,
      conditions: (profile.chronicConditions ?? []) as unknown as Json,
      emergency_contacts: contacts as unknown as Json,
      primary_facility: JSON.stringify(meta),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('patient_profiles').upsert(row);
    return !error;
  } catch {
    return false;
  }
}

export { syncPatientProfile as syncPatientProfileToDatabase };

/**
 * Fetches the authenticated user's patient profile from Supabase.
 */
export async function fetchPatientProfileFromDatabase(): Promise<Partial<PatientProfile> | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('patient_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    let meta: ExtendedProfileMeta = {};
    if (typeof data.primary_facility === 'string' && data.primary_facility.trim().startsWith('{')) {
      try {
        meta = JSON.parse(data.primary_facility) as ExtendedProfileMeta;
      } catch {
        meta = {};
      }
    }

    const rawContacts = Array.isArray(data.emergency_contacts)
      ? (data.emergency_contacts as unknown as EmergencyContact[])
      : [];
    const primaryContact: EmergencyContact = rawContacts[0] ?? {
      name: '',
      relationship: '',
      phone: '',
    };

    const rawAllergies = Array.isArray(data.allergies)
      ? (data.allergies as unknown as { substance: string; reaction: string }[])
      : [];
    const rawConditions = Array.isArray(data.conditions)
      ? (data.conditions as unknown as string[])
      : [];

    return {
      firstName: data.first_name || '',
      lastName: data.last_name || '',
      preferredName: data.preferred_name || data.first_name || '',
      dateOfBirth: data.date_of_birth || '',
      idNumber: data.national_id || '',
      bloodGroup: data.blood_group || '',
      allergies: rawAllergies,
      chronicConditions: rawConditions,
      emergencyContact: primaryContact,
      emergencyContacts: rawContacts,
      ...(meta.gender !== undefined ? { gender: meta.gender } : {}),
      ...(meta.phone !== undefined ? { phone: meta.phone } : {}),
      ...(meta.email !== undefined ? { email: meta.email } : {}),
      ...(meta.address !== undefined ? { address: meta.address } : {}),
      ...(meta.province !== undefined ? { province: meta.province } : {}),
      ...(meta.avatarUrl !== undefined ? { avatarUrl: meta.avatarUrl } : {}),
      ...(Array.isArray(meta.previousProcedures)
        ? { previousProcedures: meta.previousProcedures }
        : {}),
      ...(Array.isArray(meta.medicalDevices) ? { medicalDevices: meta.medicalDevices } : {}),
      memberSince:
        meta.memberSince ||
        (typeof data.created_at === 'string' ? data.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10)),
    };
  } catch {
    return null;
  }
}

function buildMedicationRow(userId: string, m: Medication) {
  const timesPayload = {
    schedule: m.times ?? [],
    route: m.route ?? 'Oral',
    facility: m.facility ?? '',
    provenance: m.provenance ?? 'Patient Vault',
    startDate: m.startDate ?? new Date().toISOString().slice(0, 10),
    endDate: m.endDate ?? null,
    note: m.note ?? null,
  };
  return {
    id: toScopedRowId(userId, m.id),
    user_id: userId,
    name: m.name,
    dose: m.strength,
    frequency: m.frequency,
    times: timesPayload as unknown as Json,
    instructions: m.directions ?? null,
    purpose: m.indication ?? null,
    prescribed_by: m.prescriber ?? null,
    status: m.status ?? 'active',
  };
}

/**
 * Syncs a single medication to Supabase scoped to the current user's `user_id`.
 */
export async function syncMedicationToDatabase(medication: Medication): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;
    const { error } = await supabase
      .from('medications')
      .upsert(buildMedicationRow(userId, medication));
    return !error;
  } catch {
    return false;
  }
}

/**
 * Syncs medications to Supabase scoped to the current user's `user_id`.
 */
export async function syncMedications(medications: Medication[]): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  if (medications.length === 0) return true;

  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const rows = medications.map((m) => buildMedicationRow(userId, m));
    const { error } = await supabase.from('medications').upsert(rows);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Deletes a single medication from Supabase scoped to the current user's `user_id`.
 */
export async function deleteMedicationFromDatabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;
    const candidateIds = [id, toScopedRowId(userId, id)];
    const { error } = await supabase
      .from('medications')
      .delete()
      .in('id', candidateIds)
      .eq('user_id', userId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Fetches medications belonging strictly to the current user from Supabase.
 */
export async function fetchMedicationsFromDatabase(): Promise<Medication[] | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error || !data) return null;

    return data.map((row: any): Medication => {
      const rawTimes = row.times;
      const isEnvelope =
        rawTimes && typeof rawTimes === 'object' && !Array.isArray(rawTimes) && Array.isArray(rawTimes.schedule);

      const times: string[] = isEnvelope
        ? rawTimes.schedule
        : Array.isArray(rawTimes)
        ? rawTimes
        : ['08:00'];

      return {
        id: fromScopedRowId(userId, row.id),
        name: row.name,
        strength: row.dose || 'As directed',
        indication: row.purpose || 'Daily medication',
        route: isEnvelope && rawTimes.route ? rawTimes.route : 'Oral',
        frequency: row.frequency || 'Daily',
        directions: row.instructions || 'Take as directed',
        prescriber: row.prescribed_by || 'Healthcare Provider',
        facility: isEnvelope && rawTimes.facility ? rawTimes.facility : 'Health Passport',
        provenance: isEnvelope && rawTimes.provenance ? rawTimes.provenance : 'Cloud Synced',
        times,
        status: row.status === 'past' ? 'past' : 'active',
        startDate:
          isEnvelope && rawTimes.startDate
            ? rawTimes.startDate
            : typeof row.created_at === 'string'
            ? row.created_at.slice(0, 10)
            : new Date().toISOString().slice(0, 10),
        endDate: isEnvelope && rawTimes.endDate ? rawTimes.endDate : undefined,
        note: isEnvelope && rawTimes.note ? rawTimes.note : undefined,
      };
    });
  } catch {
    return null;
  }
}

function buildAppointmentRow(userId: string, appt: Appointment) {
  const categoryEncoded = [
    appt.type || 'Appointment',
    appt.reminderOption || '',
    appt.linkedRecordId || '',
  ].join('::');

  return {
    id: toScopedRowId(userId, appt.id),
    user_id: userId,
    title: appt.title,
    category: categoryEncoded,
    facility: appt.facility || 'Not recorded',
    provider: appt.provider ?? null,
    date: appt.date,
    time: appt.time || '09:00',
    status: appt.status ?? 'confirmed',
    notes: appt.notes ?? null,
  };
}

/**
 * Syncs a single appointment to Supabase scoped to the current user's `user_id`.
 */
export async function syncAppointmentToDatabase(appointment: Appointment): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;
    const { error } = await supabase
      .from('appointments')
      .upsert(buildAppointmentRow(userId, appointment));
    return !error;
  } catch {
    return false;
  }
}

/**
 * Syncs multiple appointments to Supabase scoped to the current user's `user_id`.
 */
export async function syncAppointments(appointments: Appointment[]): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  if (appointments.length === 0) return true;
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;
    const rows = appointments.map((a) => buildAppointmentRow(userId, a));
    const { error } = await supabase.from('appointments').upsert(rows);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Deletes an appointment from Supabase scoped to the current user's `user_id`.
 */
export async function deleteAppointmentFromDatabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;
    const candidateIds = [id, toScopedRowId(userId, id)];
    const { error } = await supabase
      .from('appointments')
      .delete()
      .in('id', candidateIds)
      .eq('user_id', userId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Fetches appointments belonging strictly to the current user from Supabase.
 */
export async function fetchAppointmentsFromDatabase(): Promise<Appointment[] | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error || !data) return null;

    return data.map((row: any): Appointment => {
      const parts = typeof row.category === 'string' ? row.category.split('::') : ['Appointment'];
      const rawType = parts[0] === 'Medication Refill' ? 'Medication Refill' : 'Appointment';
      const rawReminder = parts[1] as AppointmentReminderOption | undefined;
      const rawLinkedRecordId = parts[2] || undefined;

      return {
        id: fromScopedRowId(userId, row.id),
        title: row.title,
        facility: row.facility,
        provider: row.provider || undefined,
        date: row.date,
        time: row.time || '09:00',
        type: rawType as AppointmentType,
        notes: row.notes || undefined,
        status: (row.status as AppointmentStatus) || 'confirmed',
        reminderOption: rawReminder || undefined,
        linkedRecordId: rawLinkedRecordId,
      };
    });
  } catch {
    return null;
  }
}

function buildDiaryNoteRow(userId: string, note: DiaryNote) {
  const voiceAttachment = note.attachments?.find((a) => a.kind === 'voice');
  const tagsEnvelope = {
    category: note.category ?? 'Personal',
    pinned: Boolean(note.pinned),
    attachments: note.attachments ?? [],
    reminderAt: note.reminderAt ?? null,
    linkedAppointmentId: note.linkedAppointmentId ?? null,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };

  return {
    id: toScopedRowId(userId, note.id),
    user_id: userId,
    date: note.entryDate,
    title: note.title,
    body: note.body,
    mood: note.category ?? 'Personal',
    tags: tagsEnvelope as unknown as Json,
    audio_uri: voiceAttachment?.uri ?? null,
    audio_duration_seconds: null,
  };
}

/**
 * Syncs a single diary note to Supabase scoped to the current user's `user_id`.
 */
export async function syncDiaryNoteToDatabase(note: DiaryNote): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;
    const { error } = await supabase
      .from('diary_notes')
      .upsert(buildDiaryNoteRow(userId, note));
    return !error;
  } catch {
    return false;
  }
}

/**
 * Syncs multiple diary notes to Supabase scoped to the current user's `user_id`.
 */
export async function syncDiaryNotes(notes: DiaryNote[]): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  if (notes.length === 0) return true;
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;
    const rows = notes.map((n) => buildDiaryNoteRow(userId, n));
    const { error } = await supabase.from('diary_notes').upsert(rows);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Deletes a diary note from Supabase scoped to the current user's `user_id`.
 */
export async function deleteDiaryNoteFromDatabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;
    const candidateIds = [id, toScopedRowId(userId, id)];
    const { error } = await supabase
      .from('diary_notes')
      .delete()
      .in('id', candidateIds)
      .eq('user_id', userId);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Fetches diary notes belonging strictly to the current user from Supabase.
 */
export async function fetchDiaryNotesFromDatabase(): Promise<DiaryNote[] | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('diary_notes')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error || !data) return null;

    return data.map((row: any): DiaryNote => {
      const rawTags = row.tags;
      const isEnvelope =
        rawTags && typeof rawTags === 'object' && !Array.isArray(rawTags);

      const category = (
        isEnvelope && rawTags.category
          ? rawTags.category
          : row.mood || 'Personal'
      ) as DiaryCategory;

      const attachments: DiaryAttachment[] =
        isEnvelope && Array.isArray(rawTags.attachments) ? rawTags.attachments : [];

      const createdAt =
        isEnvelope && typeof rawTags.createdAt === 'string'
          ? rawTags.createdAt
          : row.created_at || new Date().toISOString();

      const updatedAt =
        isEnvelope && typeof rawTags.updatedAt === 'string'
          ? rawTags.updatedAt
          : createdAt;

      return {
        id: fromScopedRowId(userId, row.id),
        title: row.title,
        body: row.body,
        entryDate: row.date,
        createdAt,
        updatedAt,
        category,
        pinned: isEnvelope ? Boolean(rawTags.pinned) : false,
        attachments,
        reminderAt: isEnvelope && rawTags.reminderAt ? rawTags.reminderAt : undefined,
        linkedAppointmentId:
          isEnvelope && rawTags.linkedAppointmentId ? rawTags.linkedAppointmentId : undefined,
      };
    });
  } catch {
    return null;
  }
}

export interface SharedLinkSnapshot {
  patientSummary: {
    fullName: string;
    dateOfBirth: string;
    bloodGroup: string;
    allergies: { substance: string; reaction: string }[];
    chronicConditions: string[];
    emergencyContact?: EmergencyContact;
  };
  records: MedicalRecord[];
  diaryNotes: DiaryNote[];
}

export interface VerifySharedLinkResult {
  ok: boolean;
  error?: string;
  link?: SharedLink;
  snapshot?: SharedLinkSnapshot;
}

function resolveShareStatus(
  rawStatus: string | undefined | null,
  expiresAt: string
): SharedLink['status'] {
  if (rawStatus === 'revoked') return 'revoked';
  if (rawStatus === 'expired') return 'expired';
  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
    return 'expired';
  }
  return 'active';
}

function buildSharedLinkRow(userId: string, link: SharedLink, snapshot?: SharedLinkSnapshot) {
  const status = resolveShareStatus(link.status, link.expiresAt);
  return {
    id: toScopedRowId(userId, link.id),
    user_id: userId,
    share_code: link.id,
    recipient_name: link.recipientName,
    recipient_facility: link.recipientFacility,
    record_ids: (link.recordIds ?? []) as unknown as Json,
    diary_note_ids: (link.diaryNoteIds ?? []) as unknown as Json,
    duration_id: link.durationId,
    pin: link.pin,
    status,
    payload: (snapshot ?? {}) as unknown as Json,
    created_at: link.createdAt,
    expires_at: link.expiresAt,
    updated_at: new Date().toISOString(),
  };
}

function buildFallbackReminderShareRow(
  userId: string,
  link: SharedLink,
  snapshot?: SharedLinkSnapshot
) {
  const status = resolveShareStatus(link.status, link.expiresAt);
  return {
    id: toScopedRowId(userId, `sharelink_${link.id}`),
    user_id: userId,
    patient_id: userId,
    reminder_type: 'shared_link',
    title: `${link.recipientName} (${link.recipientFacility})`,
    body: link.id,
    scheduled_time: link.expiresAt,
    recurrence: link.durationId,
    status,
    metadata: {
      link: { ...link, status },
      snapshot: snapshot ?? null,
    } as unknown as Json,
    synced_at: new Date().toISOString(),
  };
}

/**
 * Syncs a clinician/doctor share link (plus authorized record snapshot) to Supabase.
 * Writes to `shared_links` and mirrors to `scheduled_reminders_sync` for backwards compatibility.
 */
export async function syncSharedLinkToDatabase(
  link: SharedLink,
  snapshot?: SharedLinkSnapshot
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { error } = await supabase
      .from('shared_links')
      .upsert(buildSharedLinkRow(userId, link, snapshot));

    // Also mirror into scheduled_reminders_sync if shared_links table hasn't been migrated yet
    const { error: fbErr } = await supabase
      .from('scheduled_reminders_sync')
      .upsert(buildFallbackReminderShareRow(userId, link, snapshot));

    return !error || !fbErr;
  } catch {
    return false;
  }
}

/**
 * Syncs multiple shared links to Supabase.
 */
export async function syncSharedLinks(
  links: SharedLink[],
  snapshotBuilder?: (link: SharedLink) => SharedLinkSnapshot
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  if (links.length === 0) return true;
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const rows = links.map((l) =>
      buildSharedLinkRow(userId, l, snapshotBuilder ? snapshotBuilder(l) : undefined)
    );
    const fallbackRows = links.map((l) =>
      buildFallbackReminderShareRow(userId, l, snapshotBuilder ? snapshotBuilder(l) : undefined)
    );

    const { error } = await supabase.from('shared_links').upsert(rows);
    const { error: fbErr } = await supabase.from('scheduled_reminders_sync').upsert(fallbackRows);
    return !error || !fbErr;
  } catch {
    return false;
  }
}

/**
 * Immediately marks a clinician share link as revoked in Supabase so the PIN and QR stop working.
 */
export async function revokeSharedLinkInDatabase(id: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;
  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const scopedId = toScopedRowId(userId, id);
    const { error } = await supabase
      .from('shared_links')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .in('id', [id, scopedId])
      .eq('user_id', userId);

    const fallbackId = toScopedRowId(userId, `sharelink_${id}`);
    const { data: existingFallback } = await supabase
      .from('scheduled_reminders_sync')
      .select('metadata')
      .eq('id', fallbackId)
      .eq('user_id', userId)
      .maybeSingle();

    const updatedMeta =
      existingFallback?.metadata && typeof existingFallback.metadata === 'object'
        ? {
            ...(existingFallback.metadata as Record<string, any>),
            link: {
              ...((existingFallback.metadata as Record<string, any>).link ?? {}),
              status: 'revoked',
            },
          }
        : undefined;

    const { error: fbErr } = await supabase
      .from('scheduled_reminders_sync')
      .update({
        status: 'revoked',
        ...(updatedMeta ? { metadata: updatedMeta as unknown as Json } : {}),
        synced_at: new Date().toISOString(),
      })
      .eq('id', fallbackId)
      .eq('user_id', userId);

    return !error || !fbErr;
  } catch {
    return false;
  }
}

/**
 * Fetches all clinician share links belonging to the current user from Supabase,
 * automatically transitioning any past-due active links to `'expired'`.
 */
export async function fetchSharedLinksFromDatabase(): Promise<SharedLink[] | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    const { data, error } = await supabase
      .from('shared_links')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((row: any): SharedLink => {
        const expiresAt = row.expires_at;
        const status = resolveShareStatus(row.status, expiresAt);
        return {
          id: row.share_code || fromScopedRowId(userId, row.id),
          recipientName: row.recipient_name,
          recipientFacility: row.recipient_facility,
          recordIds: Array.isArray(row.record_ids) ? row.record_ids : [],
          diaryNoteIds: Array.isArray(row.diary_note_ids) ? row.diary_note_ids : [],
          durationId: (row.duration_id as ShareDuration['id']) || '7d',
          pin: row.pin,
          createdAt: row.created_at,
          expiresAt,
          status,
        };
      });
    }

    // Fallback check in scheduled_reminders_sync if shared_links table is empty or not yet migrated
    const { data: fallbackData, error: fallbackErr } = await supabase
      .from('scheduled_reminders_sync')
      .select('*')
      .eq('user_id', userId)
      .eq('reminder_type', 'shared_link')
      .order('synced_at', { ascending: false });

    if (fallbackErr || !fallbackData) {
      return !error && data ? [] : null;
    }

    return fallbackData
      .map((row: any): SharedLink | null => {
        const meta = row.metadata as { link?: SharedLink } | null;
        if (!meta?.link) return null;
        const link = meta.link;
        const status = resolveShareStatus(row.status || link.status, link.expiresAt);
        return {
          ...link,
          status,
        };
      })
      .filter((l): l is SharedLink => Boolean(l));
  } catch {
    return null;
  }
}

/**
 * Verifies a clinician share ID + 4-digit PIN against Supabase (`verify_shared_link` RPC or owner tables)
 * and returns the authorized clinical snapshot if active and not expired.
 */
export async function verifySharedLinkWithPin(
  shareId: string,
  enteredPin: string
): Promise<VerifySharedLinkResult> {
  const cleanPin = enteredPin.trim();
  const cleanId = shareId.trim();

  if (!cleanId || cleanPin.length !== 4) {
    return { ok: false, error: 'Please enter the 4-digit access PIN.' };
  }

  if (isSupabaseConfigured) {
    try {
      // 1. Try Security Definer RPC (`verify_shared_link`) first
      const { data: rpcData, error: rpcErr } = await supabase.rpc('verify_shared_link', {
        p_share_code: cleanId,
        p_pin: cleanPin,
      });

      if (!rpcErr && rpcData && typeof rpcData === 'object' && !Array.isArray(rpcData)) {
        const result = rpcData as Record<string, any>;
        if (result.ok === false) {
          return { ok: false, error: String(result.error || 'Access denied.') };
        }
        if (result.ok === true) {
          const expiresAt = String(result.expiresAt || '');
          const status = resolveShareStatus(String(result.status || 'active'), expiresAt);
          if (status !== 'active') {
            return {
              ok: false,
              error:
                status === 'revoked'
                  ? 'This share link has been revoked by the patient.'
                  : 'This share link has expired.',
            };
          }
          const link: SharedLink = {
            id: String(result.id || cleanId),
            recipientName: String(result.recipientName || 'Clinician'),
            recipientFacility: String(result.recipientFacility || 'Healthcare Facility'),
            recordIds: Array.isArray(result.recordIds) ? result.recordIds : [],
            diaryNoteIds: Array.isArray(result.diaryNoteIds) ? result.diaryNoteIds : [],
            durationId: (result.durationId as ShareDuration['id']) || '7d',
            pin: cleanPin,
            createdAt: String(result.createdAt || new Date().toISOString()),
            expiresAt,
            status,
          };
          const snapshot =
            result.payload && typeof result.payload === 'object'
              ? (result.payload as SharedLinkSnapshot)
              : undefined;
          return { ok: true, link, snapshot };
        }
      }

      // 2. Fallback: query shared_links or scheduled_reminders_sync for current user
      const userId = await getCurrentUserId();
      if (userId) {
        const fallbackId = toScopedRowId(userId, `sharelink_${cleanId}`);
        const { data: fbRow } = await supabase
          .from('scheduled_reminders_sync')
          .select('*')
          .eq('id', fallbackId)
          .eq('user_id', userId)
          .maybeSingle();

        if (fbRow && fbRow.metadata && typeof fbRow.metadata === 'object') {
          const meta = fbRow.metadata as { link?: SharedLink; snapshot?: SharedLinkSnapshot };
          if (meta.link) {
            const status = resolveShareStatus(fbRow.status || meta.link.status, meta.link.expiresAt);
            if (status === 'revoked') {
              return { ok: false, error: 'This share link has been revoked by the patient.' };
            }
            if (status === 'expired') {
              return { ok: false, error: 'This share link has expired.' };
            }
            if (meta.link.pin.trim() !== cleanPin) {
              return { ok: false, error: 'Incorrect 4-digit access PIN.' };
            }
            return {
              ok: true,
              link: { ...meta.link, status },
              snapshot: meta.snapshot ?? undefined,
            };
          }
        }
      }
    } catch {
      // Fall through to caller / local verification
    }
  }

  return { ok: false, error: 'Unable to verify share link in cloud.' };
}

export interface CloudSubscriptionEntitlement {
  plan: 'free' | 'monthly_premium' | 'annual_premium' | 'lifetime_premium';
  trialEndsAt?: string;
  expiresAt?: string;
  productId?: string;
  transactionId?: string;
  updatedAt: string;
}

/**
 * Syncs the current user's subscription entitlement and StoreKit / Google Play receipt metadata
 * to Supabase so subscription status, trial expiry, and Founder Pass badges persist across devices.
 */
export async function syncSubscriptionToDatabase(
  entitlement: CloudSubscriptionEntitlement
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const row = {
      id: toScopedRowId(userId, 'sub_entitlement'),
      user_id: userId,
      patient_id: userId,
      reminder_type: 'subscription_entitlement',
      title: entitlement.plan,
      body: entitlement.productId ?? entitlement.plan,
      scheduled_time: entitlement.expiresAt || entitlement.trialEndsAt || '9999-12-31T23:59:59Z',
      recurrence: entitlement.trialEndsAt ? 'trial' : 'subscription',
      status: entitlement.plan === 'free' ? 'free' : 'active',
      metadata: {
        plan: entitlement.plan,
        trialEndsAt: entitlement.trialEndsAt ?? null,
        expiresAt: entitlement.expiresAt ?? null,
        productId: entitlement.productId ?? null,
        transactionId: entitlement.transactionId ?? null,
        updatedAt: entitlement.updatedAt,
      } as unknown as Json,
      synced_at: entitlement.updatedAt,
    };

    const { error } = await supabase.from('scheduled_reminders_sync').upsert(row);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Fetches the authenticated user's persisted subscription entitlement from Supabase.
 */
export async function fetchSubscriptionFromDatabase(): Promise<CloudSubscriptionEntitlement | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const userId = await getCurrentUserId();
    if (!userId) return null;

    // 1. Prefer server-verified `public.subscriptions` table
    const { data: subRow, error: subErr } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!subErr && subRow) {
      const validPlans = ['free', 'monthly_premium', 'annual_premium', 'lifetime_premium'];
      const isTrusted =
        subRow.verification_status === 'verified' || subRow.verification_status === 'trial';
      const resolvedPlan = (
        isTrusted && validPlans.includes(subRow.plan) ? subRow.plan : 'free'
      ) as CloudSubscriptionEntitlement['plan'];

      return {
        plan: resolvedPlan,
        trialEndsAt: subRow.trial_ends_at ?? undefined,
        expiresAt: subRow.expires_at ?? undefined,
        productId: subRow.product_id ?? undefined,
        transactionId: subRow.transaction_id ?? undefined,
        updatedAt: subRow.updated_at || new Date().toISOString(),
      };
    }

    // 2. Legacy fallback for pre-migration rows in scheduled_reminders_sync
    const { data, error } = await supabase
      .from('scheduled_reminders_sync')
      .select('*')
      .eq('user_id', userId)
      .eq('reminder_type', 'subscription_entitlement')
      .order('synced_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    const meta =
      data.metadata && typeof data.metadata === 'object' && !Array.isArray(data.metadata)
        ? (data.metadata as Record<string, any>)
        : {};

    const rawPlan = meta.plan || data.title;
    const validPlans = ['free', 'monthly_premium', 'annual_premium', 'lifetime_premium'];
    const plan = (validPlans.includes(rawPlan) ? rawPlan : 'free') as CloudSubscriptionEntitlement['plan'];

    return {
      plan,
      trialEndsAt: typeof meta.trialEndsAt === 'string' ? meta.trialEndsAt : undefined,
      expiresAt: typeof meta.expiresAt === 'string' ? meta.expiresAt : undefined,
      productId: typeof meta.productId === 'string' ? meta.productId : undefined,
      transactionId: typeof meta.transactionId === 'string' ? meta.transactionId : undefined,
      updatedAt:
        typeof meta.updatedAt === 'string'
          ? meta.updatedAt
          : data.synced_at || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Registers / syncs the device Expo push token to Supabase for native background alerts (Spec §4.6 & §8.2).
 */
export async function syncPushTokenToBackend(params: {
  patientId: string;
  token: string;
  deviceOs?: string;
  deviceName?: string;
  appVersion?: string;
}): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const row = {
      id: `${userId}_${params.token.slice(-12).replace(/[^a-zA-Z0-9]/g, '')}`,
      user_id: userId,
      patient_id: userId,
      expo_push_token: params.token,
      device_os: params.deviceOs ?? Platform.OS,
      device_name: params.deviceName ?? null,
      app_version: params.appVersion ?? null,
      is_active: true,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('push_notification_tokens').upsert(row);
    if (error) {
      console.warn('[Supabase DB] Error syncing push token:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase DB] Unexpected error syncing push token:', err);
    return false;
  }
}

export interface SyncReminderItem {
  id: string;
  reminderType:
    | 'medication'
    | 'missed_dose'
    | 'appointment'
    | 'health_day'
    | 'checkin'
    | 'diary_reminder'
    | 'custom';
  title: string;
  body: string;
  scheduledTime: string;
  recurrence?: string;
  status?: string;
  metadata?: Record<string, any>;
}

/**
 * Synchronizes scheduled reminders with Supabase cloud backend (Spec §4.6 & §8.2).
 */
export async function syncRemindersToBackend(
  patientId: string,
  reminders: SyncReminderItem[]
): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    if (reminders.length === 0) return true;
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const rows = reminders.map((r) => ({
      id: `${userId}_${r.id}`,
      user_id: userId,
      patient_id: userId,
      reminder_type: r.reminderType,
      title: r.title,
      body: r.body,
      scheduled_time: r.scheduledTime,
      recurrence: r.recurrence ?? 'daily',
      status: r.status ?? 'active',
      metadata: (r.metadata ?? {}) as unknown as Json,
      synced_at: new Date().toISOString(),
    }));

    const { error } = await supabase.from('scheduled_reminders_sync').upsert(rows);
    if (error) {
      console.warn('[Supabase DB] Error syncing scheduled reminders:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase DB] Unexpected error syncing reminders:', err);
    return false;
  }
}

/**
 * Permanently removes ONLY the current authenticated user's records, files, reminders,
 * and profile data from Supabase in compliance with POPIA Section 24 and HIPAA Right to Erasure.
 */
export async function eraseAllCloudData(): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };

  try {
    const userId = await getCurrentUserId();
    if (!userId || userId === 'ssr-unauthenticated') {
      return { success: false, error: 'Cannot erase cloud data without an authenticated user ID.' };
    }

    // 1. Delete only this user's files in the private storage bucket
    const { data: records } = await supabase
      .from('medical_records')
      .select('storage_path')
      .eq('user_id', userId);

    if (records && records.length > 0) {
      const paths = records
        .map((r: any) => r.storage_path as string | undefined)
        .filter((p): p is string => Boolean(p && p.startsWith(`${userId}/`)));
      if (paths.length > 0) {
        await supabase.storage.from(BUCKET_NAME).remove(paths).catch(() => {});
      }
    }

    // 2. Delete only this user's rows across all tables (scoped by user_id + RLS)
    await supabase.from('medical_records').delete().eq('user_id', userId);
    await supabase.from('medications').delete().eq('user_id', userId);
    await supabase.from('appointments').delete().eq('user_id', userId);
    await supabase.from('diary_notes').delete().eq('user_id', userId);
    await supabase.from('shared_links').delete().eq('user_id', userId);
    await supabase.from('scheduled_reminders_sync').delete().eq('user_id', userId);
    await supabase.from('push_notification_tokens').delete().eq('user_id', userId);
    await supabase.from('doctor_bookings').delete().eq('patient_user_id', userId);
    await supabase.from('doctors').delete().eq('user_id', userId);
    await supabase.from('patient_profiles').delete().eq('user_id', userId);

    // Clear cached device tenant ID so a fresh identity is generated if they re-onboard
    cachedDeviceUserId = null;

    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase DB] Failed to erase user cloud data:', err);
    return { success: false, error: err?.message };
  }
}

/**
 * Fetches registered healthcare practitioners from Supabase `doctors` table.
 */
export async function fetchDoctorsFromDatabase(): Promise<DoctorProfile[] | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('doctors')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return null;
    }

    return data.map((row: any): DoctorProfile => ({
      id: row.id,
      userId: row.user_id,
      title: row.title || 'Dr.',
      fullName: row.full_name || '',
      specialty: row.specialty || 'General Practitioner',
      hpcsaNumber: row.hpcsa_number || '',
      verificationStatus:
        row.verification_status === 'verified' || row.verification_status === 'rejected'
          ? row.verification_status
          : 'pending',
      practiceName: row.practice_name || '',
      practiceAddress: row.practice_address || '',
      city: row.city || '',
      province: row.province || 'Gauteng',
      phone: row.phone || '',
      email: (row.email || '').toLowerCase(),
      bio: row.bio || '',
      qualifications: Array.isArray(row.qualifications) ? row.qualifications : [],
      avatarUrl: row.avatar_url ?? undefined,
      rating: typeof row.rating === 'number' ? row.rating : Number(row.rating || 5.0),
      reviewsCount: typeof row.reviews_count === 'number' ? row.reviews_count : 0,
      consultationModes: Array.isArray(row.consultation_modes)
        ? row.consultation_modes
        : ['in_person', 'video'],
      availability: (row.availability && typeof row.availability === 'object'
        ? row.availability
        : {
            days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
            startTime: '08:30',
            endTime: '17:00',
            slotDurationMinutes: 30,
          }) as DoctorAvailability,
      services: Array.isArray(row.services) ? (row.services as DoctorService[]) : [],
      medicalAids: Array.isArray(row.medical_aids) ? row.medical_aids : [],
      patientHighlight: row.patient_highlight ?? undefined,
      createdAt: row.created_at || new Date().toISOString(),
    }));
  } catch {
    return null;
  }
}

/**
 * Persists a practitioner profile & service catalog to Supabase `doctors`.
 */
export async function syncDoctorProfileToDatabase(doctor: DoctorProfile): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const userId = await getCurrentUserId();
    if (!userId || userId === 'ssr-unauthenticated') return false;

    const { error } = await supabase.from('doctors').upsert({
      id: doctor.id,
      user_id: userId,
      title: doctor.title,
      full_name: doctor.fullName,
      specialty: doctor.specialty,
      hpcsa_number: doctor.hpcsaNumber,
      practice_name: doctor.practiceName,
      practice_address: doctor.practiceAddress,
      city: doctor.city,
      province: doctor.province,
      phone: doctor.phone,
      email: doctor.email.trim().toLowerCase(),
      bio: doctor.bio,
      qualifications: (doctor.qualifications ?? []) as unknown as Json,
      avatar_url: doctor.avatarUrl ?? null,
      rating: doctor.rating ?? 5.0,
      reviews_count: doctor.reviewsCount ?? 0,
      consultation_modes: (doctor.consultationModes ?? ['in_person', 'video']) as unknown as Json,
      availability: (doctor.availability ?? {}) as unknown as Json,
      services: (doctor.services ?? []) as unknown as Json,
      medical_aids: (doctor.medicalAids ?? []) as unknown as Json,
      patient_highlight: doctor.patientHighlight ?? null,
      created_at: doctor.createdAt || new Date().toISOString(),
    });

    if (error) {
      console.warn('[Supabase DB] Error syncing doctor profile:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Supabase DB] Unexpected error syncing doctor profile:', err);
    return false;
  }
}

/**
 * Fetches bookings relevant to the signed-in user (as patient or owning doctor) from `doctor_bookings`.
 */
export async function fetchDoctorBookingsFromDatabase(): Promise<DoctorBooking[] | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const userId = await getCurrentUserId();
    if (!userId || userId === 'ssr-unauthenticated') return null;

    const { data, error } = await supabase
      .from('doctor_bookings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return null;
    }

    return data.map((row: any): DoctorBooking => ({
      id: row.id,
      doctorId: row.doctor_id,
      doctorName: row.doctor_name,
      doctorSpecialty: row.doctor_specialty,
      practiceName: row.practice_name,
      practiceAddress: row.practice_address,
      patientId: row.patient_id,
      patientName: row.patient_name,
      patientPhone: row.patient_phone,
      patientEmail: row.patient_email,
      serviceId: row.service_id,
      serviceName: row.service_name,
      durationMinutes: Number(row.duration_minutes || 30),
      priceZar: Number(row.price_zar || 0),
      date: row.booking_date,
      time: row.booking_time,
      mode: row.mode === 'video' ? 'video' : 'in_person',
      notes: row.notes ?? undefined,
      status:
        row.status === 'completed' || row.status === 'cancelled' ? row.status : 'confirmed',
      linkedAppointmentId: row.linked_appointment_id ?? undefined,
      telehealthRoomToken: row.telehealth_room_token ?? undefined,
      patientSummary: (row.patient_summary ?? undefined) as PatientClinicalSummary | undefined,
      clinicalNotes: (row.consultation_notes ?? undefined) as DoctorConsultationNotes | undefined,
      prescriptions: Array.isArray(row.prescriptions)
        ? (row.prescriptions as DoctorPrescriptionItem[])
        : undefined,
      sickNote: (row.sick_certificate ?? undefined) as DoctorSickCertificate | undefined,
      createdAt: row.created_at || new Date().toISOString(),
    }));
  } catch {
    return null;
  }
}

/**
 * Upserts a doctor booking row in `doctor_bookings` and reports atomic slot conflicts across devices.
 */
export async function syncDoctorBookingToDatabase(
  booking: DoctorBooking
): Promise<{ ok: boolean; conflict?: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { ok: false };

  try {
    const userId = await getCurrentUserId();
    if (!userId || userId === 'ssr-unauthenticated') return { ok: false };

    const { error } = await supabase.from('doctor_bookings').upsert({
      id: booking.id,
      doctor_id: booking.doctorId,
      doctor_name: booking.doctorName,
      doctor_specialty: booking.doctorSpecialty,
      practice_name: booking.practiceName,
      practice_address: booking.practiceAddress,
      patient_id: booking.patientId,
      patient_name: booking.patientName,
      patient_phone: booking.patientPhone,
      patient_email: booking.patientEmail,
      service_id: booking.serviceId,
      service_name: booking.serviceName,
      duration_minutes: booking.durationMinutes,
      price_zar: booking.priceZar,
      booking_date: booking.date,
      booking_time: booking.time,
      mode: booking.mode,
      notes: booking.notes ?? null,
      patient_summary: (booking.patientSummary ?? {}) as unknown as Json,
      consultation_notes: (booking.clinicalNotes ?? null) as unknown as Json,
      prescriptions: (booking.prescriptions ?? []) as unknown as Json,
      sick_certificate: (booking.sickNote ?? null) as unknown as Json,
      status: booking.status,
      linked_appointment_id: booking.linkedAppointmentId ?? null,
      telehealth_room_token: booking.telehealthRoomToken ?? null,
      created_at: booking.createdAt || new Date().toISOString(),
    });

    if (error) {
      const isConflict =
        error.code === '23505' ||
        error.message?.toLowerCase().includes('idx_doctor_bookings_active_slot');
      return {
        ok: false,
        conflict: isConflict,
        error: isConflict
          ? 'This appointment time slot was just booked by another patient.'
          : error.message,
      };
    }

    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to sync booking.' };
  }
}

/**
 * Fetches anonymized booked HH:mm slots for a practitioner on a given date across all devices.
 */
export async function fetchBookedSlotsFromDatabase(
  doctorId: string,
  dateStr: string
): Promise<string[]> {
  if (!isSupabaseConfigured || !doctorId || !dateStr) return [];

  try {
    const { data, error } = await supabase.rpc('get_doctor_booked_slots', {
      p_doctor_id: doctorId,
      p_date: dateStr,
    });
    if (error || !Array.isArray(data)) return [];
    return data
      .map((r: any) => (typeof r?.booking_time === 'string' ? r.booking_time : ''))
      .filter(Boolean);
  } catch {
    return [];
  }
}
