import {
  getResumeKnowledgeStatus,
  indexResumeFromFile,
} from '../services/resumeKnowledge.service.js';
import { answerWithRag, getRagStatus, rebuildVectorStoreInBackground } from '../rag/index.js';
import logger from '../utils/logger.js';

const FRIENDLY_ERROR_MESSAGE =
  "I'm having a small issue right now. Please try again in a moment.";

export const getResumeStatus = async (req, res, next) => {
  try {
    const status = { ...(await getResumeKnowledgeStatus()), ...(await getRagStatus()) };
    return res.json({ success: true, item: status });
  } catch (error) {
    return next(error);
  }
};

export const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Resume file is required' });
    }

    const item = await indexResumeFromFile(req.file);
    rebuildVectorStoreInBackground();

    return res.status(201).json({
      success: true,
      item,
      message: 'Resume indexed successfully',
    });
  } catch (error) {
    return next(error);
  }
};

export const askResume = async (req, res, next) => {
  try {
    const { query, history } = req.validated?.body || req.body || {};

    if (!query || String(query).trim().length < 2) {
      return res.status(200).json({
        success: true,
        item: {
          answer: "Could you please clarify your question? It's a bit too short for me to understand.",
          chunks: [],
        },
        message: 'Query too short',
      });
    }

    const response = await answerWithRag(query, history);

    return res.json({
      success: true,
      item: response,
      message:
        response.chunks.length === 0
          ? 'No direct context found'
          : 'Answer generated successfully',
    });
  } catch (error) {
    logger.error('Chatbot API Error:', error);
    return res.status(200).json({
      success: true,
      item: {
        answer: FRIENDLY_ERROR_MESSAGE,
        chunks: [],
      },
      message: 'Fallback response returned',
    });
  }
};
