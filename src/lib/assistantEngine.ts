import dayjs from 'dayjs';

import { assistantFallback, quickCommands, type AssistantCard } from '@/data/assistant';
import { hba1cSeries } from '@/data/timeline';

/**
 * The on-device demo assistant. Matches a numbered shortcut or keywords to an intent and returns
 * a short reply plus, where it helps, a rich card. Nothing leaves the phone.
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
      const latest = hba1cSeries[hba1cSeries.length - 1];
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
