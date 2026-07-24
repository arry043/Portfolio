import fs from 'node:fs/promises';
import path from 'node:path';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { getEmbeddings } from '../embeddings/embeddings.js';
import logger from '../../utils/logger.js';

/**
 * FAISS Vector Store — lazy singleton with atomic swap for rebuilds & disk caching.
 */
let currentStore = null;
let currentUpdatedAt = null;

/**
 * Try loading FAISS store from disk cache if current source hash matches saved hash.
 */
export const loadCachedVectorStore = async (cacheDir, currentHash) => {
  try {
    const hashFile = path.join(cacheDir, 'hash.txt');
    const savedHash = (await fs.readFile(hashFile, 'utf-8')).trim();

    if (savedHash !== currentHash) {
      logger.info('[RAG:Cache] Source knowledge changed, skipping disk cache.');
      return null;
    }

    const store = await FaissStore.load(cacheDir, getEmbeddings());
    logger.info('[RAG:Cache] Loaded vector store from disk cache.');
    return store;
  } catch {
    return null;
  }
};

/**
 * Save FAISS store and content hash to disk cache.
 */
export const saveVectorStoreToCache = async (store, cacheDir, currentHash) => {
  try {
    await fs.mkdir(cacheDir, { recursive: true });
    await store.save(cacheDir);
    await fs.writeFile(path.join(cacheDir, 'hash.txt'), currentHash, 'utf-8');
    logger.info('[RAG:Cache] Saved vector store index to disk cache.');
  } catch (err) {
    logger.warn('[RAG:Cache] Failed to save vector store cache:', err?.message);
  }
};

/**
 * Build a new FAISS vector store from an array of LangChain Documents.
 */
export const buildVectorStore = async (documents) => {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 900,
    chunkOverlap: 150,
  });

  const chunks = await splitter.splitDocuments(documents);

  if (!chunks.length) {
    throw new Error('RAG sources produced no document chunks');
  }

  logger.info('[RAG:VectorStore] Splitting complete', { chunkCount: chunks.length });

  const store = await FaissStore.fromDocuments(chunks, getEmbeddings());
  return { store, chunkCount: chunks.length };
};

/**
 * Atomically swap the current vector store and immediately drop old references for GC.
 */
export const setVectorStore = (store) => {
  const oldStore = currentStore;
  currentStore = store;
  currentUpdatedAt = new Date();

  // Task 4: drop reference to old store immediately after swap
  if (oldStore) {
    if (oldStore.docstore) {
      oldStore.docstore._docs = null;
      oldStore.docstore = null;
    }
    if (oldStore.args) oldStore.args = null;
  }
};

/**
 * Get the current vector store singleton.
 */
export const getVectorStore = () => currentStore;

/**
 * Get metadata about the current vector store.
 */
export const getVectorStoreStatus = () => ({
  hasKnowledge: Boolean(currentStore),
  sourceName: 'langchain-faiss',
  chunkCount: currentStore?.docstore?._docs
    ? Object.keys(currentStore.docstore._docs).length
    : 0,
  updatedAt: currentUpdatedAt || null,
});
