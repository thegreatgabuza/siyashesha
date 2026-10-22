import {
  Activity,
  FileText,
  FlaskConical,
  HeartPulse,
  Mail,
  Pill,
  Scan,
  Scissors,
  Stethoscope,
  Syringe,
} from 'lucide-react-native';

import type { RecordCategory } from '@/data/records';

export interface CategoryStyle {
  icon: any;
  /** Icon colour, from the brand palette. Icons also differ in shape, so colour is not the only cue. */
  colour: string;
  /** Tile background. */
  tint: string;
  /** Short label used on the category chips. */
  short: string;
}

/** One tinted icon per category, so records can be recognised at a glance. */
export const categoryStyle: Record<RecordCategory, CategoryStyle> = {
  Prescriptions: { icon: Pill, colour: '#0B2559', tint: '#E6EBF4', short: 'Prescriptions' },
  'Blood Tests': { icon: FlaskConical, colour: '#3F5A8A', tint: '#E9EEF6', short: 'Blood tests' },
  Radiology: { icon: Scan, colour: '#2A3B5C', tint: '#E6E9F0', short: 'Radiology' },
  'Clinic Visits': { icon: Stethoscope, colour: '#16A34A', tint: '#E9F7EE', short: 'Clinic' },
  'Hospital Visits': { icon: HeartPulse, colour: '#DC1F26', tint: '#FDECEC', short: 'Hospital' },
  'Discharge Summaries': { icon: FileText, colour: '#2A3B5C', tint: '#EEF1F6', short: 'Discharge' },
  Operations: { icon: Scissors, colour: '#3F5A8A', tint: '#E6EBF4', short: 'Operations' },
  'Specialist Letters': { icon: Mail, colour: '#5B6478', tint: '#EEF1F6', short: 'Letters' },
  Vaccinations: { icon: Syringe, colour: '#15803D', tint: '#E9F7EE', short: 'Vaccines' },
  'Chronic Care': { icon: Activity, colour: '#0B2559', tint: '#E6EBF4', short: 'Chronic care' },
  Other: { icon: FileText, colour: '#5B6478', tint: '#EEF1F6', short: 'Other' },
};
