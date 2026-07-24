import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/huggingface_transformers';

/**
 * Lazy singleton for HuggingFace embeddings.
 * Uses BAAI/bge-small-en-v1.5 loaded locally via @huggingface/transformers (no API key needed).
 */
let instance = null;

export const getEmbeddings = () => {
  if (!instance) {
    instance = new HuggingFaceTransformersEmbeddings({
      model: 'BAAI/bge-small-en-v1.5',
    });
  }
  return instance;
};
