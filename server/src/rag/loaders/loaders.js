import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TextLoader } from '@langchain/classic/document_loaders/fs/text';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import logger from '../../utils/logger.js';

const dir = path.dirname(fileURLToPath(import.meta.url));
const knowledgePath = path.resolve(dir, '../data/knowledge.md');
const resumePath = path.resolve(dir, '../../../../client/public/resume.pdf');

/**
 * Load knowledge.md as LangChain Documents.
 */
export const loadKnowledgeMd = async () => {
  try {
    const docs = await new TextLoader(knowledgePath).load();
    logger.info('[RAG:Loaders] Loaded knowledge.md', { docCount: docs.length });
    return docs;
  } catch (error) {
    logger.error('[RAG:Loaders] Failed to load knowledge.md', error);
    return [];
  }
};

/**
 * Load resume.pdf as LangChain Documents.
 */
export const loadResumePdf = async () => {
  try {
    const docs = await new PDFLoader(resumePath).load();
    logger.info('[RAG:Loaders] Loaded resume.pdf', { docCount: docs.length });
    return docs;
  } catch (error) {
    logger.error('[RAG:Loaders] Failed to load resume.pdf', error);
    return [];
  }
};

/**
 * Load all RAG sources (knowledge.md + resume.pdf).
 * Returns a flat array of LangChain Document objects.
 */
export const loadAllSources = async () => {
  const [knowledgeDocs, resumeDocs] = await Promise.all([
    loadKnowledgeMd(),
    loadResumePdf(),
  ]);
  const allDocs = [...knowledgeDocs, ...resumeDocs];
  logger.info('[RAG:Loaders] All sources loaded', { totalDocs: allDocs.length });
  return allDocs;
};
