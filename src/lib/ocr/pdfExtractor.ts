/**
 * Extracts plain text from uncompressed text-based PDF stream buffers.
 * Acts as an on-device local heuristic extractor for digitally generated clinical PDFs.
 */
export function extractTextFromPdfBuffer(pdfTextOrRaw: string): string {
  if (!pdfTextOrRaw || typeof pdfTextOrRaw !== 'string') return '';

  const chunks: string[] = [];

  // Match text within BT ... ET text blocks
  const btEtBlocks = pdfTextOrRaw.match(/BT[\s\S]*?ET/g);
  if (btEtBlocks && btEtBlocks.length > 0) {
    for (const block of btEtBlocks) {
      // 1. Matches individual string operators: (Text) Tj or (Text) ' or (Text) "
      const tjMatches = block.match(/\(([^()]*)\)\s*(?:Tj|'|")/g);
      if (tjMatches) {
        for (const match of tjMatches) {
          const content = match.replace(/^[(\s]+|[)\s\w'"]+$/g, '');
          if (content.trim()) chunks.push(unescapePdfString(content));
        }
      }

      // 2. Matches array string operators: [ (Text1) -20 (Text2) ] TJ
      const arrayMatches = block.match(/\[([^\]]*)\]\s*TJ/g);
      if (arrayMatches) {
        for (const arr of arrayMatches) {
          const innerStrings = arr.match(/\(([^()]*)\)/g);
          if (innerStrings) {
            const assembled = innerStrings
              .map((s) => s.slice(1, -1))
              .join(' ')
              .trim();
            if (assembled) chunks.push(unescapePdfString(assembled));
          }
        }
      }
    }
  }

  // If BT/ET parsing didn't find enough, search for parenthesized text sequences
  if (chunks.length < 3) {
    const rawMatches = pdfTextOrRaw.match(/\(([A-Za-z0-9\s.,;:%/+\-—]{3,100})\)\s*Tj/g);
    if (rawMatches) {
      for (const m of rawMatches) {
        const text = m.replace(/^[(\s]+|\)\s*Tj$/g, '');
        if (text.trim()) chunks.push(unescapePdfString(text));
      }
    }
  }

  return chunks.join('\n').replace(/\n\s*\n+/g, '\n').trim();
}

function unescapePdfString(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .trim();
}

export function isPdfDocument(fileName?: string, mimeType?: string): boolean {
  const name = (fileName || '').toLowerCase();
  const mime = (mimeType || '').toLowerCase();
  return name.endsWith('.pdf') || mime === 'application/pdf';
}
