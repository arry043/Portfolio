import {
  askLLM,
  formatLLMAnswer,
  getResumeContext,
  getResumeKnowledgeStatus,
  indexResumeFromFile,
  STRICT_FALLBACK_MESSAGE,
} from '../services/resumeKnowledge.service.js';
import { getWebsiteContext, mergeContext } from '../services/contextAggregator.service.js';
import logger from '../utils/logger.js';

const NO_DATA_MESSAGE = STRICT_FALLBACK_MESSAGE;
const FRIENDLY_ERROR_MESSAGE =
  "I'm having a small issue right now. Please try again in a moment.";

export const getResumeStatus = async (req, res, next) => {
  try {
    const status = await getResumeKnowledgeStatus();
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
    const { query } = req.validated?.body || req.body || {};

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

    const [resumeData, websiteContext] = await Promise.all([
      getResumeContext(query),
      getWebsiteContext(query),
    ]).catch((err) => {
      logger.error('Context Retrieval Error:', err);
      throw err;
    });

    const { chunks } = resumeData;
    const mergedContext = mergeContext(
      chunks.map((chunk) => chunk.text),
      websiteContext
    );

    let response;

    if (!mergedContext) {
      response = { answer: NO_DATA_MESSAGE, chunks: [] };
    } else {
      const modelAnswer = await askLLM(query, mergedContext);
      response = formatLLMAnswer(modelAnswer, query, chunks, mergedContext);
    }

    return res.json({
      success: true,
      item: response,
      message:
        response.answer === NO_DATA_MESSAGE
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
