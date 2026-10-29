import dayjs from 'dayjs';

import type { AssistantCard, AssistantMessage } from '@/data/assistant';
import { deriveHba1cSeries } from '@/data/timeline';
import { useAppStore } from '@/store/useAppStore';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';
const PRIMARY_MODEL = process.env.EXPO_PUBLIC_GEMINI_MODEL || 'gemini-3.8-flash';
const FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash'];

export interface GeminiResponse {
  text: string;
  card?: AssistantCard;
  modelUsed: string;
}

/**
 * Builds minimized clinical context for the active patient session (never includes
 * National ID numbers, residential addresses, or emergency contact phone numbers).
 */
function buildClinicalContext(): string {
  const state = useAppStore.getState();
  const profile = state.patientProfile;
  const records = state.records;
  const medications = state.medications;

  const allergyList = profile.allergies?.length
    ? profile.allergies.map((a) => `${a.substance} (${a.reaction})`).join(', ')
    : 'None documented';

  const conditionList = profile.chronicConditions?.length
    ? profile.chronicConditions.join(', ')
    : 'Type 2 Diabetes Mellitus, Hypertension';

  const medList = medications?.length
    ? medications.map((m) => `${m.name} ${m.strength} (${m.frequency})`).join(', ')
    : 'Metformin 850mg (twice daily), Amlodipine 5mg (daily morning), Atorvastatin 20mg (nightly)';

  const hba1cPoints = deriveHba1cSeries(records);
  const latestHba1c = hba1cPoints[hba1cPoints.length - 1];
  const hba1cContext = latestHba1c
    ? `Latest HbA1c is ${latestHba1c.value}% on ${dayjs(latestHba1c.date).format('D MMM YYYY')}. Previous values: ${hba1cPoints
        .slice(0, -1)
        .map((p) => `${p.value}% (${dayjs(p.date).format('MMM YYYY')})`)
        .join(' -> ')}.`
    : 'No HbA1c records.';

  return `
PATIENT CLINICAL CONTEXT:
- Name: ${profile.preferredName || profile.firstName || 'Patient'}
- Blood Group: ${profile.bloodGroup || 'O positive'}
- Allergies: ${allergyList}
- Chronic Conditions: ${conditionList}
- Active Prescriptions: ${medList}
- HbA1c Trends: ${hba1cContext}
- Medical Vault: ${records.length} records securely stored
`;
}

const SYSTEM_INSTRUCTIONS = `
You are the Siyashesha Clinical AI Assistant, embedded inside the patient's personal South African digital health passport.

YOUR ROLE & TONE:
- Be empathetic, medically sound, empowering, calm, and concise (1 to 3 short paragraphs maximum).
- Speak directly to the patient by their preferred name.
- South African Healthcare Context: Recognize local healthcare pathways (clinic clubs, community health centres / CHCs, repeat scripts, primary health care sister / doctor, emergency dispatch 112 from mobile or 10177 for ambulances).

CLINICAL SAFETY GUARDRAILS & APPLE GUIDELINE 1.4.1 CITATIONS (STRICT):
1. TRIAGE EMERGENCIES IMMEDIATELY: If symptoms suggest acute emergency (e.g. crushing chest pain, pain radiating to left arm/jaw, acute severe shortness of breath, sudden facial droop/arm weakness/slurred speech, or anaphylactic lip/throat swelling), urge them to immediately call 112 (mobile) or 10177, or go to the nearest emergency department / casualty.
2. NON-PRESCRIPTIVE & PHYSICIAN CONSULTATION REMINDER: You are an educational digital passport assistant, not a medical device. Never prescribe new medications or change prescription doses. Always remind the patient to seek a doctor's or clinic sister's advice in addition to using this app and before making any medical decisions.
3. EDUCATIONAL & VERIFIABLE SOURCES: When explaining test results (e.g., HbA1c targets) or medications, reference authoritative clinical guidelines such as the South African National Department of Health Standard Treatment Guidelines & Essential Medicines List (SA NDoH STG/EML), SAHPRA, or World Health Organization (WHO) guidelines.

INTERACTIVE CARD TAGS:
At the very end of your response, on a dedicated line, append one matching card tag if the topic relates to:
- Medications, dosages, prescription refills, or timing -> [CARD:medications]
- HbA1c, blood glucose, lab results, diabetes monitoring -> [CARD:hba1c]
- Emergency info, allergies, blood group, emergency contact -> [CARD:emergency]
- Stored medical vault records, discharge summaries, test reports -> [CARD:records]
- Sharing records, doctor access PIN, temporary access -> [CARD:share]
`;

/**
 * Extracts and removes [CARD:type] from the AI reply.
 */
function parseCardTag(replyText: string): { text: string; card?: AssistantCard } {
  const cardRegex = /\[CARD:(medications|hba1c|emergency|records|share)\]/gi;
  const matches = Array.from(replyText.matchAll(cardRegex));
  const card = matches.length > 0 ? (matches[0][1].toLowerCase() as AssistantCard) : undefined;
  const cleanText = replyText.replace(cardRegex, '').trim();
  return { text: cleanText, card };
}

/**
 * Sends conversation to Google Gemini API with clinical context, multi-turn history, and fallback chain.
 * Strictly requires explicit user AI consent (`aiConsentGranted`) per Apple Guideline 5.1.2(i).
 */
export async function askGeminiAssistant(
  prompt: string,
  history: AssistantMessage[] = []
): Promise<GeminiResponse> {
  if (!useAppStore.getState().aiConsentGranted) {
    throw new Error('Cloud AI consent not granted; using on-device offline assistant.');
  }

  const patientContext = buildClinicalContext();
  const systemPrompt = `${SYSTEM_INSTRUCTIONS}\n\n${patientContext}`;

  // Build multi-turn context (last 6 messages)
  const recentHistory = history.slice(-6);
  const contents: { role: string; parts: { text: string }[] }[] = [];

  // First prompt includes system instruction & patient profile
  let isFirst = true;
  for (const msg of recentHistory) {
    if (msg.sender === 'user') {
      const text = isFirst ? `${systemPrompt}\n\nPatient: ${msg.text}` : `Patient: ${msg.text}`;
      contents.push({ role: 'user', parts: [{ text }] });
      isFirst = false;
    } else {
      contents.push({ role: 'model', parts: [{ text: msg.text }] });
    }
  }

  // Append current prompt
  const currentText = isFirst ? `${systemPrompt}\n\nPatient: ${prompt}` : `Patient: ${prompt}`;
  contents.push({ role: 'user', parts: [{ text: currentText }] });

  const payload = {
    contents,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 500,
    },
  };

  const modelsToTry = [PRIMARY_MODEL, ...FALLBACK_MODELS];

  for (const model of modelsToTry) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7500);

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (res.status === 200) {
        const json = await res.json();
        const rawReply = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawReply && typeof rawReply === 'string' && rawReply.trim().length > 0) {
          const { text, card } = parseCardTag(rawReply);
          return {
            text,
            card,
            modelUsed: model,
          };
        }
      }
      console.warn(`[Gemini API] Model ${model} returned status ${res.status}`);
    } catch (err) {
      console.warn(`[Gemini API] Failed request to model ${model}:`, err);
    }
  }

  throw new Error('All Gemini model endpoints unavailable or timed out.');
}
