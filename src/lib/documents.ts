import * as FileSystem from 'expo-file-system/legacy';

import type { OriginalFile } from '@/data/records';
import { uploadRecordFile, deleteRecordFromDatabase } from '@/lib/supabase';

const folder = () => `${FileSystem.documentDirectory}records/`;

/**
 * Copies a picked or scanned file into the app's own storage so it survives the picker's temporary copy.
 * Also uploads to Supabase cloud storage bucket 'medical-records' if configured.
 */
export async function saveOriginal(
  sourceUri: string,
  recordId: string,
  name: string,
  mimeType: string
): Promise<OriginalFile> {
  await FileSystem.makeDirectoryAsync(folder(), { intermediates: true });
  const dot = name.lastIndexOf('.');
  const extension = dot > 0 ? name.slice(dot) : '';
  const uri = `${folder()}${recordId}${extension}`;
  await FileSystem.copyAsync({ from: sourceUri, to: uri });

  let remoteUrl: string | undefined;
  let storagePath: string | undefined;

  try {
    const cloudResult = await uploadRecordFile(uri, `${recordId}${extension}`, mimeType);
    if (cloudResult) {
      remoteUrl = cloudResult.remoteUrl;
      storagePath = cloudResult.storagePath;
    }
  } catch (err) {
    console.warn('[Storage] Cloud sync skipped, keeping local copy only:', err);
  }

  return { uri, name, mimeType, remoteUrl, storagePath };
}

/** Deletes the stored copy of a record's original file, and cleans up remote storage if present. */
export async function removeOriginal(file?: OriginalFile): Promise<void> {
  if (!file) return;
  await FileSystem.deleteAsync(file.uri, { idempotent: true }).catch(() => {});
  if (file.storagePath) {
    await deleteRecordFromDatabase('', file.storagePath).catch(() => {});
  }
}

/**
 * Permanently removes all locally stored medical documents and scans
 * (invoked during POPIA §24 account erasure / reset).
 */
export async function clearAllStoredFiles(): Promise<void> {
  try {
    const dir = folder();
    const info = await FileSystem.getInfoAsync(dir).catch(() => null);
    if (info && info.exists) {
      await FileSystem.deleteAsync(dir, { idempotent: true }).catch(() => {});
    }
  } catch (err) {
    console.warn('[Documents] Failed to clear document folder:', err);
  }
}
