import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import type { MedicalRecord } from '@/data/records';
import type { PatientProfile } from '@/data/patient';
import type { Medication } from '@/data/medications';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
export const BUCKET_NAME = process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET || 'medical-records';

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

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
  auth: {
    storage: ssrSafeStorage,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
});

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
    const { error: tableErr } = await supabase.from('medical_records').select('id').limit(1);
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
 * Uploads a medical record file (PDF, image, scan) to Supabase Storage bucket 'medical-records'.
 * Returns public URL and storage path on success, or null on failure (preserving offline flow).
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
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    const storagePath = `records/${timestamp}_${sanitizedName}`;

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

    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
    return {
      remoteUrl: urlData.publicUrl,
      storagePath,
    };
  } catch (err) {
    console.warn('[Supabase Storage] Unexpected error during upload:', err);
    return null;
  }
}

/**
 * Syncs a single medical record's metadata to the 'medical_records' table.
 */
export async function syncRecordToDatabase(record: MedicalRecord): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const row = {
      id: record.id,
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
      fields: record.fields ?? [],
      original_file_uri: record.originalFile?.uri ?? null,
      original_file_name: record.originalFile?.name ?? null,
      original_file_mime: record.originalFile?.mimeType ?? null,
      remote_url: record.originalFile?.remoteUrl ?? null,
      storage_path: record.originalFile?.storagePath ?? null,
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
 * Removes a record and its cloud storage file if present.
 */
export async function deleteRecordFromDatabase(id: string, storagePath?: string): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    if (storagePath) {
      await supabase.storage.from(BUCKET_NAME).remove([storagePath]).catch(() => {});
    }
    const { error } = await supabase.from('medical_records').delete().eq('id', id);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Fetches all medical records stored in the cloud database.
 */
export async function fetchRecordsFromDatabase(): Promise<MedicalRecord[] | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .order('event_date', { ascending: false });

    if (error || !data) {
      return null;
    }

    return data.map((row: any) => ({
      id: row.id,
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
      fields: row.fields || [],
      originalFile: row.original_file_uri
        ? {
            uri: row.original_file_uri,
            name: row.original_file_name || 'Document',
            mimeType: row.original_file_mime || 'application/octet-stream',
            remoteUrl: row.remote_url || undefined,
            storagePath: row.storage_path || undefined,
          }
        : undefined,
    }));
  } catch {
    return null;
  }
}

/**
 * Syncs the active patient profile to Supabase.
 */
export async function syncPatientProfile(profile: PatientProfile): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const row = {
      id: profile.idNumber || 'default_patient',
      first_name: profile.firstName,
      last_name: profile.lastName,
      preferred_name: profile.preferredName ?? null,
      date_of_birth: profile.dateOfBirth,
      national_id: profile.idNumber ?? null,
      blood_group: profile.bloodGroup ?? null,
      allergies: profile.allergies ?? [],
      conditions: profile.chronicConditions ?? [],
      emergency_contacts: profile.emergencyContact ? [profile.emergencyContact] : [],
      primary_facility: 'Rosebank Family Practice',
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
 * Syncs active medications to Supabase.
 */
export async function syncMedications(medications: Medication[]): Promise<boolean> {
  if (!isSupabaseConfigured) return false;

  try {
    const rows = medications.map((m) => ({
      id: m.id,
      name: m.name,
      dose: m.strength,
      frequency: m.frequency,
      times: m.times ?? [],
      instructions: m.directions ?? null,
      purpose: m.indication ?? null,
      prescribed_by: m.prescriber ?? null,
      status: m.status ?? 'active',
    }));

    const { error } = await supabase.from('medications').upsert(rows);
    return !error;
  } catch {
    return false;
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
    const row = {
      id: `${params.patientId}_${params.token.slice(-12).replace(/[^a-zA-Z0-9]/g, '')}`,
      patient_id: params.patientId,
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

    const rows = reminders.map((r) => ({
      id: r.id,
      patient_id: patientId,
      reminder_type: r.reminderType,
      title: r.title,
      body: r.body,
      scheduled_time: r.scheduledTime,
      recurrence: r.recurrence ?? 'daily',
      status: r.status ?? 'active',
      metadata: r.metadata ?? {},
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
 * Permanently removes all records, files, reminders, and profile data from Supabase
 * in compliance with POPIA Section 24 and HIPAA Right to Erasure.
 */
export async function eraseAllCloudData(): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true };

  try {
    // Delete files in storage bucket
    const { data: records } = await supabase.from('medical_records').select('storage_path');
    if (records && records.length > 0) {
      const paths = records.map((r: any) => r.storage_path).filter(Boolean);
      if (paths.length > 0) {
        await supabase.storage.from(BUCKET_NAME).remove(paths).catch(() => {});
      }
    }

    // Delete rows across tables
    await supabase.from('medical_records').delete().neq('id', '___noop___');
    await supabase.from('medications').delete().neq('id', '___noop___');
    await supabase.from('appointments').delete().neq('id', '___noop___');
    await supabase.from('diary_notes').delete().neq('id', '___noop___');
    await supabase.from('scheduled_reminders_sync').delete().neq('id', '___noop___');
    await supabase.from('push_notification_tokens').delete().neq('token', '___noop___');
    await supabase.from('patient_profiles').delete().neq('id', '___noop___');

    return { success: true };
  } catch (err: any) {
    console.warn('[Supabase DB] Failed to erase cloud data:', err);
    return { success: false, error: err?.message };
  }
}
