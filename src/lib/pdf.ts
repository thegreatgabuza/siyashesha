import dayjs from 'dayjs';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import type { PatientProfile } from '@/data/patient';
import type { MedicalRecord } from '@/data/records';
import {
  generateMedicalSummaryHtml,
  generateRecordsCsv,
  generateRecordsJson,
  generateSingleRecordHtml,
  type MedicalSummaryExportOptions,
  type ReportType,
} from './medicalSummaryPdf';

export {
  generateMedicalSummaryHtml,
  generateRecordsCsv,
  generateRecordsJson,
  generateSingleRecordHtml,
  type MedicalSummaryExportOptions,
  type ReportType,
};

export type ExportDeliveryMode = 'download' | 'share';
export type ExportFileFormat = 'pdf' | 'csv' | 'json';

function sanitizeFileName(raw: string, ext: string): string {
  const cleaned = raw
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 64);
  const base = cleaned || `Siyashesha_Records_${dayjs().format('YYYY-MM-DD')}`;
  return base.toLowerCase().endsWith(`.${ext}`) ? base : `${base}.${ext}`;
}

function triggerWebDownload(content: string, fileName: string, mimeType: string) {
  if (typeof document === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function openWebPrintDocument(html: string, fallbackFileName: string) {
  if (typeof window === 'undefined') return;
  const printWindow = window.open('', '_blank');
  if (printWindow && printWindow.document) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      try {
        printWindow.print();
      } catch {
        // Ignore
      }
    }, 350);
  } else {
    // Popup blocked: download the self-contained printable report directly
    triggerWebDownload(html, fallbackFileName.replace(/\.pdf$/i, '.html'), 'text/html;charset=utf-8');
  }
}

async function saveFileToAndroidStorage(
  localUri: string,
  fileName: string,
  mimeType: string,
  isBase64Source = false
): Promise<boolean> {
  try {
    const saf = FileSystem.StorageAccessFramework;
    if (!saf) return false;

    const permissions = await saf.requestDirectoryPermissionsAsync();
    if (!permissions.granted) return false;

    const destUri = await saf.createFileAsync(permissions.directoryUri, fileName, mimeType);
    const encoding = isBase64Source ? FileSystem.EncodingType.Base64 : FileSystem.EncodingType.UTF8;
    const content = await FileSystem.readAsStringAsync(localUri, { encoding });
    await FileSystem.writeAsStringAsync(destUri, content, { encoding });
    return true;
  } catch (err) {
    console.warn('[PDF/Export] Android SAF save fallback to share:', err);
    return false;
  }
}

/**
 * Renders HTML into a high-resolution PDF file with a clean filename and either
 * saves it to device storage ('download') or opens the system share sheet ('share').
 */
export async function printAndShareHtml(
  html: string,
  dialogTitle = 'Share document',
  mode: ExportDeliveryMode = 'share',
  preferredFileName?: string
): Promise<string> {
  const fileName = sanitizeFileName(preferredFileName || dialogTitle, 'pdf');

  if (Platform.OS === 'web') {
    openWebPrintDocument(html, fileName);
    return 'web-printed';
  }

  const { uri: tempUri } = await Print.printToFileAsync({ html });
  let finalUri = tempUri;

  if (FileSystem.cacheDirectory) {
    const namedUri = `${FileSystem.cacheDirectory}${fileName}`;
    try {
      await FileSystem.deleteAsync(namedUri, { idempotent: true });
      await FileSystem.copyAsync({ from: tempUri, to: namedUri });
      finalUri = namedUri;
    } catch {
      finalUri = tempUri;
    }
  }

  if (mode === 'download' && Platform.OS === 'android') {
    const saved = await saveFileToAndroidStorage(finalUri, fileName, 'application/pdf', true);
    if (saved) return finalUri;
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(finalUri, {
      dialogTitle,
      mimeType: 'application/pdf',
      UTI: 'com.adobe.pdf',
    });
  }
  return finalUri;
}

/**
 * High-level helper to generate and download/share a customized clinical summary PDF.
 */
export async function exportMedicalSummaryPdf(
  options: MedicalSummaryExportOptions,
  dialogTitle = 'Share Medical Summary PDF',
  mode: ExportDeliveryMode = 'share',
  fileName?: string
): Promise<string> {
  const html = await generateMedicalSummaryHtml(options);
  const defaultName =
    fileName ||
    `Siyashesha_${options.reportType}_Records_${dayjs().format('YYYY-MM-DD')}.pdf`;
  return await printAndShareHtml(html, dialogTitle, mode, defaultName);
}

/**
 * Generates and downloads/shares a certified single-record PDF with all lab/test fields and clinical notes.
 */
export async function exportSingleRecordPdf(
  record: MedicalRecord,
  patient: PatientProfile,
  mode: ExportDeliveryMode = 'download'
): Promise<string> {
  const html = await generateSingleRecordHtml(record, patient);
  const fileName = sanitizeFileName(
    `Siyashesha_Record_${record.title}_${record.eventDate || dayjs().format('YYYY-MM-DD')}`,
    'pdf'
  );
  return await printAndShareHtml(html, `Download ${record.title}`, mode, fileName);
}

/**
 * Exports the given records as a CSV spreadsheet (.csv) and downloads or shares it.
 */
export async function exportRecordsCsvFile(
  records: MedicalRecord[],
  patient: PatientProfile,
  mode: ExportDeliveryMode = 'download',
  preferredFileName?: string
): Promise<string> {
  const csv = generateRecordsCsv(records, patient);
  const fileName = sanitizeFileName(
    preferredFileName || `Siyashesha_Medical_Records_${dayjs().format('YYYY-MM-DD')}`,
    'csv'
  );

  if (Platform.OS === 'web') {
    triggerWebDownload(csv, fileName, 'text/csv;charset=utf-8');
    return 'web-downloaded';
  }

  const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
  const fileUri = `${baseDir}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (mode === 'download' && Platform.OS === 'android') {
    const saved = await saveFileToAndroidStorage(fileUri, fileName, 'text/csv', false);
    if (saved) return fileUri;
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      dialogTitle: 'Export Medical Records (CSV)',
      mimeType: 'text/csv',
      UTI: 'public.comma-separated-values-text',
    });
  }
  return fileUri;
}

/**
 * Exports the given records as a portable JSON archive (.json) and downloads or shares it.
 */
export async function exportRecordsJsonFile(
  records: MedicalRecord[],
  patient: PatientProfile,
  mode: ExportDeliveryMode = 'download',
  preferredFileName?: string
): Promise<string> {
  const json = generateRecordsJson(records, patient);
  const fileName = sanitizeFileName(
    preferredFileName || `Siyashesha_Medical_Records_${dayjs().format('YYYY-MM-DD')}`,
    'json'
  );

  if (Platform.OS === 'web') {
    triggerWebDownload(json, fileName, 'application/json;charset=utf-8');
    return 'web-downloaded';
  }

  const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory || '';
  const fileUri = `${baseDir}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  if (mode === 'download' && Platform.OS === 'android') {
    const saved = await saveFileToAndroidStorage(fileUri, fileName, 'application/json', false);
    if (saved) return fileUri;
  }

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      dialogTitle: 'Export Medical Records (JSON)',
      mimeType: 'application/json',
      UTI: 'public.json',
    });
  }
  return fileUri;
}

export function baseDocumentStyles() {
  return `
    <style>
      body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #0B2559; padding: 32px; }
      h1 { font-size: 20px; margin-bottom: 4px; }
      .muted { color: #5B6478; font-size: 12px; margin-bottom: 20px; }
      .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #5B6478; margin-top: 18px; margin-bottom: 6px; }
      .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #E3E8F0; font-size: 13px; }
      .notice { background: #F4F6FB; border-radius: 12px; padding: 12px 14px; font-size: 11px; color: #2A3B5C; margin-top: 18px; }
      .badge { display: inline-block; background: #DC1F26; color: #fff; font-size: 11px; padding: 4px 10px; border-radius: 999px; margin-bottom: 10px; }
    </style>
  `;
}
