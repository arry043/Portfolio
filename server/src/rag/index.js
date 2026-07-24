import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { loadAllSources } from './loaders/loaders.js';
import {
  buildVectorStore,
  setVectorStore,
  getVectorStoreStatus,
  loadCachedVectorStore,
  saveVectorStoreToCache,
} from './vectorStore/vectorStore.js';
import { retrieveContext } from './retriever/retriever.js';
import { askChatGroq } from './chain/chain.js';
import { classifyQuery, FALLBACK_MESSAGE } from './utils/classifyQuery.js';
import {
  getPortfolioSystemPrompt,
  getGeneralSystemPrompt,
  getGreetingSystemPrompt,
} from './prompts/prompts.js';
import logger from '../utils/logger.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const knowledgePath = path.resolve(dir, 'data/knowledge.md');
const resumePath = path.resolve(dir, '../../../client/public/resume.pdf');
const cacheDir = path.resolve(dir, 'data/cache');

/* ------------------------------------------------------------------ */
/*  RAG Readiness Flag & Singleton                                    */
/* ------------------------------------------------------------------ */
let ragReady = false;
let initialization = null;

export const isRagReady = () => ragReady;

/**
 * Compute SHA256 hash of knowledge.md + resume.pdf contents.
 */
const getSourceHash = async () => {
  const hash = crypto.createHash('sha256');
  try {
    const kBuf = await fs.readFile(knowledgePath);
    hash.update(kBuf);
  } catch {}
  try {
    const rBuf = await fs.readFile(resumePath);
    hash.update(rBuf);
  } catch {}
  return hash.digest('hex');
};

/**
 * (Re)build the FAISS vector store.
 * First checks disk cache; if hash matches, loads from disk without calling Gemini API.
 */
export const rebuildVectorStore = async () => {
  ragReady = false;
  logger.info('[RAG] Rebuilding vector store', { sources: ['knowledge.md', 'resume.pdf'] });

  const currentHash = await getSourceHash();

  // Try loading from disk cache first
  const cachedStore = await loadCachedVectorStore(cacheDir, currentHash);
  if (cachedStore) {
    setVectorStore(cachedStore);
    ragReady = true;
    const chunkCount = getVectorStoreStatus().chunkCount;
    return { chunkCount, updatedAt: new Date() };
  }

  // If cache missed or stale, build new store using Gemini API
  const documents = await loadAllSources();
  const { store, chunkCount } = await buildVectorStore(documents);

  setVectorStore(store);
  ragReady = true;

  // Asynchronously save new store and hash to disk cache
  saveVectorStoreToCache(store, cacheDir, currentHash).catch(() => {});

  logger.info('[RAG] Vector store ready', { chunkCount });
  return { chunkCount, updatedAt: new Date() };
};

/**
 * Lazy singleton initialization — called once in background.
 */
export const initializeRag = async () => {
  if (!initialization) {
    initialization = (async () => {
      try {
        const result = await rebuildVectorStore();
        return result;
      } catch (error) {
        initialization = null;
        ragReady = false;
        logger.error('[RAG] Initial build deferred/failed:', error?.message || error);
        return null;
      }
    })();
  }
  return initialization;
};

/**
 * Fire-and-forget background rebuild.
 */
export const rebuildVectorStoreInBackground = () => {
  rebuildVectorStore().catch((error) =>
    logger.error('[RAG] Background rebuild failed', error)
  );
};

/* ------------------------------------------------------------------ */
/*  Chat answering                                                    */
/* ------------------------------------------------------------------ */

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

export const getRagStatus = () => ({
  ...getVectorStoreStatus(),
  isReady: ragReady,
});
