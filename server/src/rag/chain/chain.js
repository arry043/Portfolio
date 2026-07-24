import { Groq } from 'groq-sdk';
import { FALLBACK_MESSAGE } from '../utils/classifyQuery.js';

/**
 * Chain — Groq LLM calls with system prompt injection and conversation history.
 */

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const DEFAULT_TEMPERATURE = 0.3;
const MAX_HISTORY_MESSAGES = 20;

/**
 * Send a question to ChatGroq with conversation history for context.
 *
 * @param {string}   question     - The current user question
 * @param {string}   systemPrompt - The system prompt (persona + context)
 * @param {Array}    history      - Previous messages [{role: 'user'|'assistant', content}]
 */
export const askChatGroq = async (question, systemPrompt, history = []) => {
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // Build message array: system → history → current question
  const messages = [
    { role: 'system', content: systemPrompt },
  ];

  // Append conversation history (capped to avoid token overflow)
  const recentHistory = Array.isArray(history)
    ? history.slice(-MAX_HISTORY_MESSAGES)
    : [];

  for (const msg of recentHistory) {
    if (msg?.role && msg?.content) {
      messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: String(msg.content).slice(0, 2000),
      });
    }
  }

  // Current question as the final user message
  messages.push({ role: 'user', content: question });

  const completion = await client.chat.completions.create({
    model: process.env.GROQ_MODEL || DEFAULT_MODEL,
    temperature: DEFAULT_TEMPERATURE,
    messages,
  });

  return completion.choices?.[0]?.message?.content?.trim() || FALLBACK_MESSAGE;
};
