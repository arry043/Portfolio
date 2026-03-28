import Analytics from '../models/Analytics.js';
import Project from '../models/Project.js';
import Message from '../models/Message.js';

const normalizePage = (value = '') => {
  const trimmed = String(value || '').trim();
  if (!trimmed) {
    return '/';
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

const getTodayBucket = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const resolveIncrement = ({ type, delta = 1 }) => {
  switch (type) {
    case 'view':
    case 'visit':
      return { views: delta };
    case 'chatbot':
      return { chatbotUsage: delta };
    case 'project':
      return { projectViews: delta };
    case 'game':
      return { gameUsage: delta };
    case 'click':
    default:
      return { clicks: delta };
  }
};

const trackEvent = async ({
  page,
  type,
  delta = 1,
  metadata = {},
}) => {
  const normalizedPage = normalizePage(page);
  const increment = resolveIncrement({ type, delta });
  const now = new Date();

  return Analytics.findOneAndUpdate(
    { page: normalizedPage, date: getTodayBucket() },
    {
      $inc: increment,
      $set: {
        lastEventAt: now,
        lastEventMeta: {
          route: normalizePage(metadata?.route || normalizedPage),
          timestamp: metadata?.timestamp || now.toISOString(),
          userId: metadata?.userId || null,
        },
      },
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
};

const getFallbackPageFromMeta = (metadata, fallbackPage) =>
  normalizePage(metadata?.route || fallbackPage);

export const trackAnalyticsEvent = async (req, res, next) => {
  try {
    const { page, type, delta, metadata } = req.validated.body;
    const item = await trackEvent({ page, type, delta, metadata });
    return res.status(201).json({ success: true, item });
  } catch (error) {
    return next(error);
  }
};

export const trackPageVisit = async (req, res, next) => {
  try {
    const { page = '/', delta, metadata } = req.validated.body;
    const item = await trackEvent({
      page: getFallbackPageFromMeta(metadata, page),
      type: 'visit',
      delta,
      metadata,
    });

    return res.status(201).json({ success: true, item });
  } catch (error) {
    return next(error);
  }
};

export const trackChatbotUsage = async (req, res, next) => {
  try {
    const { page = '/ai-chatbot', delta, metadata } = req.validated.body;
    const item = await trackEvent({
      page: getFallbackPageFromMeta(metadata, page),
      type: 'chatbot',
      delta,
      metadata,
    });

    return res.status(201).json({ success: true, item });
  } catch (error) {
    return next(error);
  }
};

export const trackProjectView = async (req, res, next) => {
  try {
    const { page = '/projects', delta, metadata } = req.validated.body;
    const item = await trackEvent({
      page: getFallbackPageFromMeta(metadata, page),
      type: 'project',
      delta,
      metadata,
    });

    return res.status(201).json({ success: true, item });
  } catch (error) {
    return next(error);
  }
};

export const getAnalyticsForPage = async (req, res, next) => {
  try {
    const normalized = normalizePage(req.params.page);
    const legacy = String(req.params.page || '').trim();

    const stats = await Analytics.aggregate([
      { $match: { page: { $in: [normalized, legacy] } } },
      {
        $group: {
          _id: null,
          views: { $sum: '$views' },
          clicks: { $sum: '$clicks' },
          chatbotUsage: { $sum: '$chatbotUsage' },
          projectViews: { $sum: '$projectViews' },
          gameUsage: { $sum: '$gameUsage' },
        },
      },
    ]);

    return res.json({
      success: true,
      item:
        stats[0] || {
          page: normalized,
          views: 0,
          clicks: 0,
          chatbotUsage: 0,
          projectViews: 0,
          gameUsage: 0,
        },
    });
  } catch (error) {
    return next(error);
  }
};

export const getAnalyticsSummary = async (req, res, next) => {
  try {
    const [analyticsDocs, projectViewAggregate, messageCount, recentActivity] =
      await Promise.all([
        Analytics.aggregate([
          {
            $group: {
              _id: '$page',
              views: { $sum: '$views' },
              clicks: { $sum: '$clicks' },
              chatbotUsage: { $sum: '$chatbotUsage' },
              projectViews: { $sum: '$projectViews' },
              gameUsage: { $sum: '$gameUsage' },
            },
          },
        ]),
        Project.aggregate([
          { $group: { _id: null, totalViews: { $sum: '$views' } } },
        ]),
        Message.countDocuments(),
        Analytics.aggregate([
          {
            $group: {
              _id: '$page',
              views: { $sum: '$views' },
              clicks: { $sum: '$clicks' },
              chatbotUsage: { $sum: '$chatbotUsage' },
              projectViews: { $sum: '$projectViews' },
              gameUsage: { $sum: '$gameUsage' },
              updatedAt: { $max: '$updatedAt' },
            },
          },
          { $sort: { updatedAt: -1 } },
          { $limit: 8 },
        ]),
      ]);

    const totals = analyticsDocs.reduce(
      (acc, item) => {
        const pageName = String(item._id || '').toLowerCase();

        acc.totalVisitors += item.views || 0;
        acc.chatbotUsage += item.chatbotUsage || 0;
        acc.projectViews += item.projectViews || 0;
        acc.gamesUsage += item.gameUsage || 0;

        // Backward compatibility for older event data without dedicated counters.
        if ((item.chatbotUsage || 0) === 0 && (pageName.includes('ai') || pageName.includes('chat'))) {
          acc.chatbotUsage += (item.views || 0) + (item.clicks || 0);
        }

        if ((item.projectViews || 0) === 0 && pageName.includes('project')) {
          acc.projectViewsFallback += (item.views || 0) + (item.clicks || 0);
        }

        if ((item.gameUsage || 0) === 0 && pageName.includes('game')) {
          acc.gamesUsage += (item.views || 0) + (item.clicks || 0);
        }

        return acc;
      },
      {
        totalVisitors: 0,
        chatbotUsage: 0,
        projectViews: 0,
        projectViewsFallback: 0,
        gamesUsage: 0,
      }
    );

    const legacyProjectViews = projectViewAggregate[0]?.totalViews || 0;
    const resolvedProjectViews =
      totals.projectViews > 0
        ? totals.projectViews
        : totals.projectViewsFallback > 0
          ? totals.projectViewsFallback
          : legacyProjectViews;

    return res.json({
      success: true,
      item: {
        totalVisitors: totals.totalVisitors,
        chatbotUsage: totals.chatbotUsage,
        projectViews: resolvedProjectViews,
        gamesUsage: totals.gamesUsage,
        routeStats: analyticsDocs.map((entry) => ({
          route: entry._id,
          hits: (entry.views || 0) + (entry.clicks || 0),
          chatbotUsage: entry.chatbotUsage || 0,
          projectViews: entry.projectViews || 0,
          gameUsage: entry.gameUsage || 0,
        })),
        messageCount,
        recentActivity: recentActivity.map((entry) => ({
          page: entry._id,
          views: entry.views || 0,
          clicks: entry.clicks || 0,
          chatbotUsage: entry.chatbotUsage || 0,
          projectViews: entry.projectViews || 0,
          gameUsage: entry.gameUsage || 0,
          updatedAt: entry.updatedAt,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getAnalyticsDaily = async (req, res, next) => {
  try {
    const days = Number.parseInt(req.query.days, 10) || 30;
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - days);

    const data = await Analytics.aggregate([
      { $match: { date: { $gte: pastDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          totalViews: { $sum: '$views' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json({ success: true, items: data });
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsMonthly = async (req, res, next) => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setMonth(oneYearAgo.getMonth() - 12);

    const data = await Analytics.aggregate([
      { $match: { date: { $gte: oneYearAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$date' } },
          totalViews: { $sum: '$views' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json({ success: true, items: data });
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsYearly = async (req, res, next) => {
  try {
    const data = await Analytics.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y', date: '$date' } },
          totalViews: { $sum: '$views' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    res.json({ success: true, items: data });
  } catch (error) {
    next(error);
  }
};
