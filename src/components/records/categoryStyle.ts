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
  /** Icon colour. Chosen to keep at least 3:1 against its tile. */
  colour: string;
  /** Tile background. */
  tint: string;
  /** Short label used on the category chips. */
  short: string;
}

/** One tinted icon per category, so records can be recognised at a glance. */
export const categoryStyle: Record<RecordCategory, CategoryStyle> = {
  Prescriptions: { icon: Pill, colour: '#C2410C', tint: '#FDEBDD', short: 'Prescriptions' },
  'Blood Tests': { icon: FlaskConical, colour: '#1D4ED8', tint: '#E4ECFD', short: 'Blood tests' },
  Radiology: { icon: Scan, colour: '#7C3AED', tint: '#EFE7FD', short: 'Radiology' },
  'Clinic Visits': { icon: Stethoscope, colour: '#15803D', tint: '#E4F4EA', short: 'Clinic' },
  'Hospital Visits': { icon: HeartPulse, colour: '#B91C1C', tint: '#FBE5E5', short: 'Hospital' },
  'Discharge Summaries': { icon: FileText, colour: '#0F766E', tint: '#DDF3F0', short: 'Discharge' },
  Operations: { icon: Scissors, colour: '#4338CA', tint: '#E6E7FA', short: 'Operations' },
  'Specialist Letters': { icon: Mail, colour: '#475569', tint: '#E7EBF0', short: 'Letters' },
  Vaccinations: { icon: Syringe, colour: '#A16207', tint: '#FBF0D9', short: 'Vaccines' },
  'Chronic Care': { icon: Activity, colour: '#BE185D', tint: '#FCE7F1', short: 'Chronic care' },
  Other: { icon: FileText, colour: '#4B5563', tint: '#EEF0F3', short: 'Other' },
};
