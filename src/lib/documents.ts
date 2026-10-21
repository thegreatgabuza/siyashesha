import * as FileSystem from 'expo-file-system/legacy';

import type { OriginalFile } from '@/data/records';

const folder = () => `${FileSystem.documentDirectory}records/`;

/** Copies a picked or scanned file into the app's own storage so it survives the picker's temporary copy. */
export async function saveOriginal(sourceUri: string, recordId: string, name: string, mimeType: string): Promise<OriginalFile> {
  await FileSystem.makeDirectoryAsync(folder(), { intermediates: true });
  const dot = name.lastIndexOf('.');
  const extension = dot > 0 ? name.slice(dot) : '';
  const uri = `${folder()}${recordId}${extension}`;
  await FileSystem.copyAsync({ from: sourceUri, to: uri });
  return { uri, name, mimeType };
}

/** Deletes the stored copy of a record's original file, if it has one. */
export async function removeOriginal(file?: OriginalFile): Promise<void> {
  if (!file) return;
  await FileSystem.deleteAsync(file.uri, { idempotent: true }).catch(() => {});
}
