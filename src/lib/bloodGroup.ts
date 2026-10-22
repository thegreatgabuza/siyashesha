/**
 * Blood group is safety-critical, so anything that is not a recognised ABO/Rh group reads
 * "Unknown". Vague input such as "Not sure" or an empty string is never shown as if it were data.
 */
const pattern = /^\s*(AB|A|B|O)\s*(\+|-|−|pos(itive)?|neg(ative)?)\s*$/i;

export function parseBloodGroup(raw: string | undefined | null): string | null {
  const m = (raw ?? '').match(pattern);
  if (!m) return null;
  const sign = /^(\+|pos)/i.test(m[2]) ? '+' : '−';
  return `${m[1].toUpperCase()}${sign}`;
}

export function isKnownBloodGroup(raw: string | undefined | null): boolean {
  return parseBloodGroup(raw) !== null;
}

/** The short display form, e.g. "O+", or "Unknown". */
export function bloodGroupLabel(raw: string | undefined | null): string {
  return parseBloodGroup(raw) ?? 'Unknown';
}
