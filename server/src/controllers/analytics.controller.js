import Analytics from '../models/Analytics.js';
import Project from '../models/Project.js';
import Message from '../models/Message.js';

export const trackAnalyticsEvent = async (req, res, next) => {
  try {
    const { page, type, delta } = req.validated.body;

    const increment =
      type === 'view' ? { views: delta || 1 } : { clicks: delta || 1 };

    const item = await Analytics.findOneAndUpdate(
      { page },
      { $inc: increment },
      { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    return res.status(201).json({ success: true, item });
  } catch (error) {
    return next(error);
  }
};

export const getAnalyticsForPage = async (req, res, next) => {
  try {
    const item = await Analytics.findOne({ page: req.params.page });

    return res.json({
      success: true,
      item: item || {
        page: req.params.page,
        views: 0,
        clicks: 0,
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
        Analytics.find().lean(),
        Project.aggregate([
          {
            $group: {
              _id: null,
              totalViews: { $sum: '$views' },
            },
          },
        ]),
        Message.countDocuments(),
        Analytics.find().sort({ updatedAt: -1 }).limit(8).lean(),
      ]);

    const totals = analyticsDocs.reduce(
      (accumulator, item) => {
        const pageName = String(item.page || '').toLowerCase();
        accumulator.totalVisitors += item.views || 0;

        if (pageName.includes('ai') || pageName.includes('chat')) {
          accumulator.chatbotUsage += (item.views || 0) + (item.clicks || 0);
        }

        if (pageName.includes('game')) {
          accumulator.gamesUsage += (item.views || 0) + (item.clicks || 0);
        }

        return accumulator;
      },
      { totalVisitors: 0, chatbotUsage: 0, gamesUsage: 0 }
    );

    const projectViews = projectViewAggregate[0]?.totalViews || 0;

    return res.json({
      success: true,
      item: {
        totalVisitors: totals.totalVisitors,
        chatbotUsage: totals.chatbotUsage,
        projectViews,
        gamesUsage: totals.gamesUsage,
        messageCount,
        recentActivity: recentActivity.map((entry) => ({
          page: entry.page,
          views: entry.views || 0,
          clicks: entry.clicks || 0,
          updatedAt: entry.updatedAt,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
};
