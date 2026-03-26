import Analytics from '../models/Analytics.js';
import Project from '../models/Project.js';
import Message from '../models/Message.js';

export const trackAnalyticsEvent = async (req, res, next) => {
  try {
    const { page, type, delta } = req.validated.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const incrementAmount = delta || 1;
    let increment = {};

    if (type === 'view') {
      increment = { views: incrementAmount };
    } else if (type === 'chatbot') {
      increment = { chatbotUsage: incrementAmount };
    } else if (type === 'game') {
      increment = { gameUsage: incrementAmount };
    } else {
      increment = { clicks: incrementAmount };
    }

    const item = await Analytics.findOneAndUpdate(
      { page, date: today },
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
    // Aggregates across all dates for a specific page
    const stats = await Analytics.aggregate([
      { $match: { page: req.params.page } },
      { $group: { _id: null, views: { $sum: '$views' }, clicks: { $sum: '$clicks' } } }
    ]);

    return res.json({
      success: true,
      item: stats[0] || { page: req.params.page, views: 0, clicks: 0 },
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
          { $group: { _id: '$page', views: { $sum: '$views' }, clicks: { $sum: '$clicks' }, chatbotUsage: { $sum: '$chatbotUsage' }, gameUsage: { $sum: '$gameUsage' } } }
        ]),
        Project.aggregate([
          { $group: { _id: null, totalViews: { $sum: '$views' } } },
        ]),
        Message.countDocuments(),
        Analytics.aggregate([
          { $group: { _id: '$page', views: { $sum: '$views' }, clicks: { $sum: '$clicks' }, updatedAt: { $max: '$updatedAt' } } },
          { $sort: { updatedAt: -1 } },
          { $limit: 8 }
        ]),
      ]);

    const totals = analyticsDocs.reduce(
      (acc, item) => {
        const pageName = String(item._id || '').toLowerCase();
        acc.totalVisitors += item.views || 0;
        acc.chatbotUsage += (item.chatbotUsage || 0);
        acc.gamesUsage += (item.gameUsage || 0);

        // Fallback backward compatibility 
        if (pageName.includes('ai') || pageName.includes('chat')) acc.chatbotUsage += (item.views || 0) + (item.clicks || 0);
        if (pageName.includes('game')) acc.gamesUsage += (item.views || 0) + (item.clicks || 0);

        return acc;
      },
      { totalVisitors: 0, chatbotUsage: 0, gamesUsage: 0 }
    );

    return res.json({
      success: true,
      item: {
        totalVisitors: totals.totalVisitors,
        chatbotUsage: totals.chatbotUsage,
        projectViews: projectViewAggregate[0]?.totalViews || 0,
        gamesUsage: totals.gamesUsage,
        messageCount,
        recentActivity: recentActivity.map((entry) => ({
          page: entry._id,
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

export const getAnalyticsDaily = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - days);
    
    const data = await Analytics.aggregate([
      { $match: { date: { $gte: pastDate } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }, totalViews: { $sum: '$views' } } },
      { $sort: { _id: 1 } }
    ]);
    res.json({ success: true, items: data });
  } catch (error) { next(error); }
};

export const getAnalyticsMonthly = async (req, res, next) => {
  try {
    // 12 months
    const oneYearAgo = new Date();
    oneYearAgo.setMonth(oneYearAgo.getMonth() - 12);

    const data = await Analytics.aggregate([
      { $match: { date: { $gte: oneYearAgo } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$date" } }, totalViews: { $sum: '$views' } } },
      { $sort: { _id: 1 } }
    ]);
    res.json({ success: true, items: data });
  } catch (error) { next(error); }
};

export const getAnalyticsYearly = async (req, res, next) => {
  try {
    const data = await Analytics.aggregate([
      { $group: { _id: { $dateToString: { format: "%Y", date: "$date" } }, totalViews: { $sum: '$views' } } },
      { $sort: { _id: 1 } }
    ]);
    res.json({ success: true, items: data });
  } catch (error) { next(error); }
};
