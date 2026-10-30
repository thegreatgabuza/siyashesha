import * as FileSystem from 'expo-file-system/legacy';
import JSZip from 'jszip';
import { Platform } from 'react-native';

/**
 * Strips OpenXML tags while preserving line breaks, table rows, and column boundaries.
 */
function openXmlToPlainText(xml: string): string {
  if (!xml || typeof xml !== 'string') return '';

  return xml
    // Paragraph boundaries to newlines
    .replace(/<\/w:p>/gi, '\n')
    // Table rows to newlines
    .replace(/<\/w:tr>/gi, '\n')
    // Table cells and tabs to tab characters
    .replace(/<\/w:tc>/gi, '\t')
    .replace(/<w:tab[^>]*\/>/gi, '\t')
    // Line breaks and carriage returns to newlines
    .replace(/<w:br[^>]*\/>/gi, '\n')
    .replace(/<w:cr[^>]*\/>/gi, '\n')
    // Strip all remaining XML tags
    .replace(/<[^>]+>/g, '')
    // Decode common XML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    // Decode numeric entities (e.g. &#160; for non-breaking space)
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    // Normalize newlines and whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\t+/g, '  ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

/**
 * Unpacks and extracts clinical text from a Word (.docx) document.
 * Reads word/document.xml as well as headers, footers, and footnotes.
 */
export async function extractTextFromDocx(fileUri: string): Promise<string> {
  let zipData: string | ArrayBuffer;

  if (Platform.OS === 'web') {
    const res = await fetch(fileUri);
    zipData = await res.arrayBuffer();
  } else {
    zipData = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  const zip = new JSZip();
  if (typeof zipData === 'string') {
    await zip.loadAsync(zipData, { base64: true });
  } else {
    await zip.loadAsync(zipData);
  }

  const mainDoc = zip.file('word/document.xml');
  if (!mainDoc) {
    throw new Error('Unsupported or corrupted Word document (word/document.xml missing).');
  }

  const mainXml = await mainDoc.async('text');
  let fullText = openXmlToPlainText(mainXml);

  // Extract from headers, footers, and footnotes (often contains hospital letterheads, dates, doctors)
  const supplementalFiles = zip.file(/^word\/(header|footer|footnotes|endnotes)\d*\.xml$/i);
  for (const file of supplementalFiles) {
    try {
      const extraXml = await file.async('text');
      const extraText = openXmlToPlainText(extraXml);
      if (extraText && !fullText.includes(extraText)) {
        fullText += `\n${extraText}`;
      }
    } catch {
      // Continue even if an auxiliary xml fails to parse
    }
  }

  return fullText.trim();
}

/**
 * Checks if a given filename or MIME type represents a Word (.docx/.doc) document.
 */
export function isWordDocument(fileName?: string, mimeType?: string): boolean {
  const name = (fileName || '').toLowerCase();
  const mime = (mimeType || '').toLowerCase();

  return (
    name.endsWith('.docx') ||
    name.endsWith('.doc') ||
    mime.includes('wordprocessingml') ||
    mime.includes('msword') ||
    mime.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
  );
}
