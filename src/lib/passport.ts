import type { StampId } from '@/store/useAppStore';

export interface StampDef {
  id: StampId;
  label: string;
  hint: string;
  nextStep: string;
  nextRoute: string;
}

/** The five milestones that make up a complete passport, in the order the setup asks for them. */
export const stampDefs: StampDef[] = [
  {
    id: 'profile',
    label: 'Passport started',
    hint: 'Your name and basics',
    nextStep: 'Add your name and blood type',
    nextRoute: '/more/profile',
  },
  {
    id: 'emergency',
    label: 'Emergency profile ready',
    hint: 'Allergies and an emergency contact',
    nextStep: 'Add allergies or an emergency contact',
    nextRoute: '/more/profile',
  },
  {
    id: 'medication',
    label: 'First medication added',
    hint: 'Your daily medicine',
    nextStep: 'Add your first medication',
    nextRoute: '/more/medications',
  },
  {
    id: 'record',
    label: 'First record uploaded',
    hint: 'A document in your vault',
    nextStep: 'Upload a first record',
    nextRoute: '/records/upload',
  },
  {
    id: 'biometric',
    label: 'Biometric lock on',
    hint: 'Face ID or fingerprint',
    nextStep: 'Turn on biometric lock',
    nextRoute: '/more/settings',
  },
];

export function completionPercent(stamps: StampId[]): number {
  const earned = stampDefs.filter((d) => stamps.includes(d.id)).length;
  return Math.round((earned / stampDefs.length) * 100);
}

/** The first milestone not yet earned, used for the "next best step" prompt. */
export function nextBestStep(stamps: StampId[]): StampDef | null {
  return stampDefs.find((d) => !stamps.includes(d.id)) ?? null;
}
