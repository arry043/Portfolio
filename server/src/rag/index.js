/**
 * RAG Module — Thin orchestrator.
 *
 * Imports all submodules and exposes the same public API that
 * the rest of the application depends on:
 *
 *   initializeRag()
 *   rebuildVectorStore()
 *   rebuildVectorStoreInBackground()
 *   answerWithRag(query)
 *   getRagStatus()
 */

import { loadAllSources } from './loaders/loaders.js';
import { buildVectorStore, setVectorStore, getVectorStoreStatus } from './vectorStore/vectorStore.js';
import { retrieveContext } from './retriever/retriever.js';
import { askChatGroq } from './chain/chain.js';
import { classifyQuery, FALLBACK_MESSAGE } from './utils/classifyQuery.js';
import {
  getPortfolioSystemPrompt,
  getGeneralSystemPrompt,
  getGreetingSystemPrompt,
} from './prompts/prompts.js';
import logger from '../utils/logger.js';

/* ------------------------------------------------------------------ */
/*  Singleton guard for initial build                                 */
/* ------------------------------------------------------------------ */
let initialization = null;

/* ------------------------------------------------------------------ */
/*  Vector Store lifecycle                                            */
/* ------------------------------------------------------------------ */

/**
 * (Re)build the FAISS vector store from the latest knowledge.md + resume.pdf.
 * Can be called at any time; atomically swaps the store so in-flight
 * requests keep using the old store until the new one is ready.
 */
export const rebuildVectorStore = async () => {
  logger.info('[RAG] Rebuilding vector store', { sources: ['knowledge.md', 'resume.pdf'] });

  const documents = await loadAllSources();
  const { store, chunkCount } = await buildVectorStore(documents);

  // Atomic swap — old store is garbage-collected
  setVectorStore(store);

  logger.info('[RAG] Vector store ready', { chunkCount });
  return { chunkCount, updatedAt: new Date() };
};

/**
 * Lazy singleton initialization — called once on first need.
 * If the initial build fails, clears the guard so it can be retried.
 */
export const initializeRag = async () => {
  if (!initialization) {
    initialization = rebuildVectorStore().catch((error) => {
      initialization = null;
      logger.error('[RAG] Initial build failed', error);
      throw error;
    });
  }
  return initialization;
};

/**
 * Fire-and-forget rebuild — used after resume uploads / GitHub publishes.
 * Never throws; logs errors instead.
 */
export const rebuildVectorStoreInBackground = () => {
  rebuildVectorStore().catch((error) =>
    logger.error('[RAG] Background rebuild failed', error)
  );
};

/* ------------------------------------------------------------------ */
/*  Chat answering                                                    */
/* ------------------------------------------------------------------ */

/**
 * Answer a user query using the appropriate strategy:
 * - greeting   → friendly response, no retrieval
 * - general    → direct LLM answer, no retrieval
 * - portfolio  → full RAG pipeline (retrieve → prompt → LLM)
 *
 * @param {string} query   - The current user question
 * @param {Array}  history - Previous messages [{role: 'user'|'assistant', content}]
 */
export const answerWithRag = async (query, history = []) => {
  const question = String(query || '').trim();
  const category = classifyQuery(question);

  // ── Greeting ────────────────────────────────────────────────────
  if (category === 'greeting') {
    const answer = await askChatGroq(question, getGreetingSystemPrompt(), history);
    return { answer, chunks: [] };
  }

  // ── General programming / educational ───────────────────────────
  if (category === 'general') {
    const answer = await askChatGroq(question, getGeneralSystemPrompt(), history);
    return { answer, chunks: [] };
  }

  // ── Portfolio / Resume (RAG) ────────────────────────────────────
  await initializeRag();

  const { docs, formattedText } = await retrieveContext(question);

  if (!docs.length) {
    return { answer: FALLBACK_MESSAGE, chunks: [] };
  }

  const systemPrompt = getPortfolioSystemPrompt(formattedText);
  const answer = await askChatGroq(question, systemPrompt, history);

  return {
    answer: String(answer || FALLBACK_MESSAGE).trim(),
    chunks: docs.map((doc, index) => ({ index, text: doc.pageContent })),
  };
};

/* ------------------------------------------------------------------ */
/*  Status                                                            */
/* ------------------------------------------------------------------ */

export const getRagStatus = () => getVectorStoreStatus();
