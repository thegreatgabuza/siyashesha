import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import {
  generateMedicalSummaryHtml,
  type MedicalSummaryExportOptions,
  type ReportType,
} from './medicalSummaryPdf';

export { generateMedicalSummaryHtml, type MedicalSummaryExportOptions, type ReportType };

/**
 * Renders HTML into a high-resolution PDF file and opens the system share sheet
 * (or browser print dialog on web).
 */
export async function printAndShareHtml(html: string, dialogTitle = 'Share document'): Promise<string> {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return 'web-printed';
  }

  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { dialogTitle, mimeType: 'application/pdf', UTI: '.pdf' });
  }
  return uri;
}

/**
 * High-level helper to generate and share a customized clinical summary PDF.
 */
export async function exportMedicalSummaryPdf(
  options: MedicalSummaryExportOptions,
  dialogTitle = 'Share Medical Summary PDF'
): Promise<string> {
  const html = await generateMedicalSummaryHtml(options);
  return await printAndShareHtml(html, dialogTitle);
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
