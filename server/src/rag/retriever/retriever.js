import { getVectorStore } from '../vectorStore/vectorStore.js';

/**
 * Retriever — wraps the current FAISS vector store as a top-k retriever.
 */

const TOP_K = 5;

/**
 * Get a retriever from the current vector store.
 * Throws if the vector store hasn't been initialized yet.
 */
export const getRetriever = () => {
  const store = getVectorStore();
  if (!store) {
    throw new Error('Vector store is not initialized. Call initializeRag() first.');
  }
  return store.asRetriever(TOP_K);
};

/**
 * Retrieve relevant documents for a query.
 * Returns both the raw docs and a formatted text string.
 */
export const retrieveContext = async (query) => {
  const retriever = getRetriever();
  const docs = await retriever.invoke(query);

  const formattedText = docs
    .map((doc) => doc.pageContent)
    .join('\n\n');

  return { docs, formattedText };
};
