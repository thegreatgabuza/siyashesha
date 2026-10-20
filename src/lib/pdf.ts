import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export async function printAndShareHtml(html: string, dialogTitle = 'Share document') {
  const { uri } = await Print.printToFileAsync({ html });
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, { dialogTitle, mimeType: 'application/pdf' });
  }
  return uri;
}

export function baseDocumentStyles() {
  return `
    <style>
      body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #0B1E40; padding: 32px; }
      h1 { font-size: 20px; margin-bottom: 4px; }
      .muted { color: #5B6B8A; font-size: 12px; margin-bottom: 20px; }
      .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #5B6B8A; margin-top: 18px; margin-bottom: 6px; }
      .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #E3E8F0; font-size: 13px; }
      .notice { background: #F6F4FD; border-radius: 12px; padding: 12px 14px; font-size: 11px; color: #2A3B5C; margin-top: 18px; }
      .badge { display: inline-block; background: #DC2626; color: #fff; font-size: 11px; padding: 4px 10px; border-radius: 999px; margin-bottom: 10px; }
    </style>
  `;
}
