import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { getEmbeddings } from '../embeddings/embeddings.js';
import logger from '../../utils/logger.js';

/**
 * FAISS Vector Store — lazy singleton with atomic swap for rebuilds.
 */
let currentStore = null;
let currentUpdatedAt = null;

/**
 * Build a new FAISS vector store from an array of LangChain Documents.
 * Splits documents into chunks before indexing.
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
 * Atomically swap the current vector store (safe for concurrent reads).
 */
export const setVectorStore = (store) => {
  currentStore = store;
  currentUpdatedAt = new Date();
};

/**
 * Get the current vector store singleton (may be null before first build).
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
