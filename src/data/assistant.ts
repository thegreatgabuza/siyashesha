export type AssistantAction =
  | { type: 'navigate'; target: string }
  | { type: 'none' };

export interface QuickCommand {
  number: number;
  label: string;
  keywords: string[];
  reply: string;
  action: AssistantAction;
}

/** Rich answers render as cards under the reply text. */
export type AssistantCard = 'medications' | 'hba1c' | 'emergency' | 'records' | 'share';

export interface AssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  card?: AssistantCard;
  timestamp: string;
}

export function assistantGreeting(firstName: string): { title: string; body: string } {
  const name = firstName.trim();
  return {
    title: name ? `Hi ${name}.` : 'Hi there.',
    body: 'I can help with your records, medications, sharing and your emergency card. Tap a number or ask in your own words.',
  };
}

export const assistantEncryptionNotice =
  'This demo assistant answers from sample data on this phone. Nothing you type is sent anywhere.';

export const quickCommands: QuickCommand[] = [
  {
    number: 1,
    label: 'My Medical Records',
    keywords: ['record', 'records', 'document', 'documents'],
    reply: 'You have records stored in your vault across blood tests, prescriptions, specialist letters and more. Opening your Medical Records Vault now.',
    action: { type: 'navigate', target: '/records' },
  },
  {
    number: 2,
    label: 'My Medications',
    keywords: ['medication', 'medicine', 'meds', 'dose', 'next dose', 'pill'],
    reply: 'Here is your current medication schedule. Opening Medications now.',
    action: { type: 'navigate', target: '/more/medications' },
  },
  {
    number: 3,
    label: 'Share My Records',
    keywords: ['share', 'sharing', 'doctor needs', 'send records'],
    reply: "Let's set up a secure, time-bounded share. I'll open the sharing wizard for you.",
    action: { type: 'navigate', target: '/more/sharing' },
  },
  {
    number: 4,
    label: 'Emergency Profile',
    keywords: ['emergency', 'ice', 'blood group', 'allergy', 'allergies'],
    reply: 'Here is your Emergency Profile with your ICE card and QR code. Opening it now.',
    action: { type: 'navigate', target: '/more/emergency' },
  },
  {
    number: 5,
    label: 'Latest HbA1c result',
    keywords: ['hba1c', 'blood sugar', 'glucose', 'latest result', 'lab result'],
    reply: 'Checking your most recent HbA1c result for you.',
    action: { type: 'none' },
  },
];

export const assistantFallback =
  "I'm not sure about that yet, but a healthcare professional can help. You can also reply with a number from the menu, or try asking about your records, medications, sharing or your emergency profile.";
