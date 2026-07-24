/**
 * Query classifier — determines routing for the RAG pipeline.
 * Returns 'portfolio', 'general', or 'greeting'.
 */

export const FALLBACK_MESSAGE = "I don't have that information available in the portfolio yet.";

const GREETING_PATTERN = /^(hi|hello|hey|hola|namaste|yo|sup|good\s*(morning|afternoon|evening|night)|how\s+are\s+you|what'?s\s+up|howdy|greetings)\b/i;

const PORTFOLIO_PATTERN = /\b(arry|arif|portfolio|resum|cv|project|skill|experienc|educat|certif|achiev|contact|biograph|internship|work\s*histor|employ|hir|job|qualif|degree|universit|college|hobbi|interest|github|linkedin|social|about\s+(me|him|you|yourself))/i;

const GENERAL_PATTERN = /\b(javascript|typescript|react|angular|vue|svelte|next\.?js|node\.?js|express|html|css|sass|scss|tailwind|bootstrap|dsa|data\s+structure|algorithm|python|java|ruby|go|rust|swift|kotlin|php|sql|nosql|database|mongo|postgres|mysql|redis|docker|kubernetes|devops|ci\/cd|git|api|rest|graphql|websocket|aws|azure|gcp|cloud|ai|ml|machine\s+learning|deep\s+learning|nlp|neural|tensor|pytorch|linux|webpack|vite|npm|yarn|testing|jest|deployment|microservice|oauth|jwt|security)\b/i;

/**
 * Classify a user query into one of three categories:
 * - 'greeting'  → casual hellos, small talk
 * - 'portfolio' → anything about Arry, resume, projects, skills, experience, etc.
 * - 'general'   → programming / educational questions
 *
 * If none match, defaults to 'greeting' (safe fallback for conversational queries).
 */
export const classifyQuery = (question) => {
  const trimmed = String(question || '').trim();

  if (GREETING_PATTERN.test(trimmed)) return 'greeting';
  if (PORTFOLIO_PATTERN.test(trimmed)) return 'portfolio';
  if (GENERAL_PATTERN.test(trimmed)) return 'general';

  // Default: treat as greeting/conversational so the bot responds naturally
  return 'greeting';
};
