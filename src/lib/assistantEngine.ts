import dayjs from 'dayjs';

import { assistantFallback, quickCommands, type AssistantCard, type AssistantMessage } from '@/data/assistant';
import { deriveHba1cSeries } from '@/data/timeline';
import { useAppStore } from '@/store/useAppStore';
import { askGeminiAssistant } from '@/lib/geminiAssistant';

/**
 * The on-device rule-based assistant fallback. Matches numbered shortcuts or keywords
 * to provide instant, zero-latency replies even when completely offline.
 */
export function answer(input: string, ctx: { recordCount: number }): { text: string; card?: AssistantCard } {
  const text = input.trim().toLowerCase();
  const command = /^[1-5]$/.test(text)
    ? quickCommands.find((c) => c.number === Number(text))
    : quickCommands.find((c) => c.keywords.some((k) => text.includes(k)));

  switch (command?.number) {
    case 1:
      return {
        text: `You have ${ctx.recordCount} ${ctx.recordCount === 1 ? 'record' : 'records'} in your vault. Here is how they break down.`,
        card: 'records',
      };
    case 2:
      return { text: "Here are today's doses. Tap one when you take it.", card: 'medications' };
    case 3:
      return { text: 'You can share chosen records for a set time, protected by a PIN, and revoke access at any time.', card: 'share' };
    case 4:
      return { text: 'This is what a first responder would see on your emergency card.', card: 'emergency' };
    case 5: {
      const records = useAppStore.getState().records;
      const pts = deriveHba1cSeries(records);
      const latest = pts[pts.length - 1];
      return {
        text: latest
          ? `Your latest HbA1c was ${latest.value}% on ${dayjs(latest.date).format('D MMMM YYYY')}. Your clinician can tell you what this means for you.`
          : 'I could not find an HbA1c result in your records yet.',
        card: latest ? 'hba1c' : undefined,
      };
    }
    default:
      return { text: assistantFallback };
  }
}

/**
 * Intelligent Conversational Assistant: Calls Google Gemini with full patient clinical context
 * and clinical safety guardrails, falling back seamlessly to the on-device rule engine if offline.
 */
export async function askAssistant(
  input: string,
  ctx: { recordCount: number; history?: AssistantMessage[] }
): Promise<{ text: string; card?: AssistantCard; modelUsed: string }> {
  const trimmed = input.trim();

  // If user enters a simple number "1"-"5", match the quick command directly for instant response
  if (/^[1-5]$/.test(trimmed)) {
    const local = answer(trimmed, ctx);
    return { ...local, modelUsed: 'quick-action' };
  }

  try {
    const geminiReply = await askGeminiAssistant(trimmed, ctx.history ?? []);
    return geminiReply;
  } catch (err) {
    console.warn('[AssistantEngine] Gemini request failed, using on-device fallback:', err);
    const fallback = answer(trimmed, ctx);
    return {
      text: fallback.text,
      card: fallback.card,
      modelUsed: 'offline-vault',
    };
  }
}
