/**
 * Query classifier — determines routing for the RAG pipeline.
 * Returns 'portfolio', 'general', or 'greeting'.
 */

export const FALLBACK_MESSAGE = "I don't have that information available in the portfolio yet.";

// Pure greetings / small talk — only matches when the message STARTS with these
const GREETING_PATTERN = /^(hi|hello|hey|hola|namaste|yo|sup|good\s*(morning|afternoon|evening|night)|how\s+are\s+you|what'?s\s+up|howdy|greetings)\b/i;

// Anything about Arry himself — identity, bio, career, location, preferences, etc.
// Includes English + common Hindi/Hinglish phrasing so RAG context gets injected
// no matter which language the visitor asks in.
const PORTFOLIO_PATTERN = /\b(arry|arif|portfolio|resum|cv|project|skill|experienc|educat|certif|achiev|contact|biograph|internship|work\s*histor|employ|hir|job|qualif|degree|universit|college|school|hobbi|interest|github|linkedin|social|about\s+(me|him|you|yourself)|who\s+(are|is)|what\s+(do|are)\s+you|where\s+(do|are)\s+you|location|city|live\s+in|based\s+in|home\s*town|role|salary|expect|notice\s*period|relocat|available|joining|learn|currently|weakness|strength|personality|goal|leetcode|geeksforgeeks|gfg|dsa|leadership|hackathon|sih|gate|diploma|b\.?tech|intermediate|highschool|high\s+school|team\s*head|club|kaun\s*ho|kaun\s*hai|kaha[n]?\s*(rehte|rahte|ho|se|se\s+ho)|kya\s+karte|kaise\s+ho|tum(hara|ne)?|apna|apne|khud\s+(ke|k[ei])?\s*(baare|bare)|batao|bata\s*do|naam\s*kya|umar|age|padhai|naukri)/i;

// Generic programming / tech-education questions (not about Arry specifically)
const GENERAL_PATTERN = /\b(javascript|typescript|react|angular|vue|svelte|next\.?js|node\.?js|express|html|css|sass|scss|tailwind|bootstrap|dsa|data\s+structure|algorithm|python|java|ruby|go|rust|swift|kotlin|php|sql|nosql|database|mongo|postgres|mysql|redis|docker|kubernetes|devops|ci\/cd|git|api|rest|graphql|websocket|aws|azure|gcp|cloud|ai|ml|machine\s+learning|deep\s+learning|nlp|neural|tensor|pytorch|linux|webpack|vite|npm|yarn|testing|jest|deployment|microservice|oauth|jwt|security)\b/i;

// Common Hindi/Hinglish function words — if a query is in Hindi/Hinglish and isn't
// a pure greeting or a tech question, it's almost always a personal question about
// Arry, so route it to portfolio (with context) rather than losing it to the
// context-less greeting fallback.
const HINGLISH_PATTERN = /\b(kaun|kaha|kahan|kya|kaise|kyu|kyun|tum|tumhara|tumhe|apna|apne|kro|karo|karte|karta|rehte|rehta|batao|bata|dedo|de\s*do|hai|ho|acha|accha)\b/i;

/**
 * Classify a user query into one of three categories:
 * - 'portfolio' → anything about Arry, resume, projects, skills, experience, etc.
 * - 'general'   → programming / educational questions
 * - 'greeting'  → casual hellos, small talk
 *
 * Portfolio is checked first so identity/bio questions always get RAG context,
 * even if they also contain a greeting-like word (e.g. "hey, who are you").
 * If nothing matches but the message looks like Hindi/Hinglish, we still route
 * to portfolio rather than silently falling back to a context-less greeting —
 * that's what was causing hallucinated answers (e.g. made-up location) for
 * Hindi queries like "kaha rehte ho".
 */
export const classifyQuery = (question) => {
  const trimmed = String(question || '').trim();

  if (PORTFOLIO_PATTERN.test(trimmed)) return 'portfolio';
  if (GENERAL_PATTERN.test(trimmed)) return 'general';
  if (GREETING_PATTERN.test(trimmed)) return 'greeting';
  if (HINGLISH_PATTERN.test(trimmed)) return 'portfolio';

  // Default: treat as greeting/conversational so the bot responds naturally
  return 'greeting';
};