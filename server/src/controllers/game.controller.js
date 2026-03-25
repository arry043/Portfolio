import { resumeData } from '../data/resume.data.js';

export const listGames = async (req, res, next) => {
  try {
    const items = Array.isArray(resumeData.games) ? resumeData.games : [];

    return res.json({
      success: true,
      items,
      fallbackMessage: items.length === 0 ? 'No Games Found!' : null,
    });
  } catch (error) {
    return next(error);
  }
};
