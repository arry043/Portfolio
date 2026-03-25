import {
  answerResumeQuestion,
  getResumeKnowledgeStatus,
  indexResumeFromFile,
} from '../services/resumeKnowledge.service.js';

const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 20;
const NO_DATA_MESSAGE = "I haven't added that yet, but working on it.";
const FRIENDLY_ERROR_MESSAGE =
  "I'm having a small issue right now. Please try again in a moment.";
const requestWindow = new Map();

const getRateLimitState = (key) => {
  const now = Date.now();
  const existing = requestWindow.get(key);

  if (!existing || now - existing.windowStart > RATE_WINDOW_MS) {
    const freshState = { count: 0, windowStart: now };
    requestWindow.set(key, freshState);
    return freshState;
  }

  return existing;
};

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
    const requesterKey = req.ip || req.headers['x-forwarded-for'] || 'anonymous';
    const rateState = getRateLimitState(requesterKey);

    if (rateState.count >= RATE_LIMIT) {
      const retryAfter = Math.ceil(
        (RATE_WINDOW_MS - (Date.now() - rateState.windowStart)) / 1000
      );

      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded. Please retry shortly.',
        retryAfter,
      });
    }

    rateState.count += 1;

    const { query } = req.validated.body;
    const response = await answerResumeQuestion(query);

    return res.json({
      success: true,
      item: response,
      message:
        response.answer === NO_DATA_MESSAGE
          ? 'No direct context found'
          : 'Answer generated successfully',
    });
  } catch (error) {
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
