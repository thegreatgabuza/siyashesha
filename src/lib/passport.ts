import type { PatientProfile } from '@/data/patient';
import type { StampId } from '@/store/useAppStore';
import { isKnownBloodGroup } from './bloodGroup';

export interface StampDef {
  id: StampId;
  label: string;
  /** One or two words, for the stepper. */
  short: string;
  hint: string;
  nextStep: string;
  nextRoute: string;
}

/** The five milestones that make up a complete passport, in the order the setup asks for them. */
export const stampDefs: StampDef[] = [
  {
    id: 'profile',
    label: 'Passport started',
    short: 'Started',
    hint: 'Your name and basics',
    nextStep: 'Add your name and blood type',
    nextRoute: '/more/profile',
  },
  {
    id: 'emergency',
    label: 'Emergency profile ready',
    short: 'Emergency',
    hint: 'Blood group, allergies and an emergency contact',
    nextStep: 'Finish your emergency profile',
    nextRoute: '/more/profile',
  },
  {
    id: 'medication',
    label: 'First medication added',
    short: 'Medication',
    hint: 'Your daily medicine',
    nextStep: 'Add your first medication',
    nextRoute: '/more/medications',
  },
  {
    id: 'record',
    label: 'First record uploaded',
    short: 'Record',
    hint: 'A document in your vault',
    nextStep: 'Upload a first record',
    nextRoute: '/records/upload',
  },
  {
    id: 'biometric',
    label: 'Biometric lock on',
    short: 'Biometrics',
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

// ---------------------------------------------------------------------------------------------
// Live readiness. Everything below is derived from the data on the phone, never from stored
// flags, so the progress shown can't contradict what the rest of the screen shows.
// ---------------------------------------------------------------------------------------------

export interface EmergencyGap {
  key: 'bloodGroup' | 'allergies' | 'contact';
  label: string;
}

export interface EmergencyReadiness {
  ready: boolean;
  gaps: EmergencyGap[];
}

/**
 * Ready means a first responder would have the three things they ask for first: blood group,
 * allergy status and someone to call. Allergies count as stated once any are listed.
 */
export function emergencyReadiness(p: PatientProfile): EmergencyReadiness {
  const gaps: EmergencyGap[] = [];
  if (!isKnownBloodGroup(p.bloodGroup)) gaps.push({ key: 'bloodGroup', label: 'Blood group' });
  if (p.allergies.length === 0) gaps.push({ key: 'allergies', label: 'Allergies' });
  if (!p.emergencyContact?.phone?.trim()) gaps.push({ key: 'contact', label: 'Emergency contact' });
  return { ready: gaps.length === 0, gaps };
}

export interface PassportProgress {
  steps: (StampDef & { done: boolean })[];
  done: number;
  total: number;
  /** 0 to 1. */
  progress: number;
  next: StampDef | null;
}

export function derivePassportProgress(input: {
  patient: PatientProfile;
  medicationCount: number;
  recordCount: number;
  biometricLock: boolean;
}): PassportProgress {
  const doneById: Record<StampId, boolean> = {
    profile: !!input.patient.firstName.trim(),
    emergency: emergencyReadiness(input.patient).ready,
    medication: input.medicationCount > 0,
    record: input.recordCount > 0,
    biometric: input.biometricLock,
  };
  const steps = stampDefs.map((d) => ({ ...d, done: doneById[d.id] }));
  const done = steps.filter((s) => s.done).length;
  return {
    steps,
    done,
    total: steps.length,
    progress: done / steps.length,
    next: steps.find((s) => !s.done) ?? null,
  };
}
