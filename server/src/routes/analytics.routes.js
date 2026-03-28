import express from 'express';
import {
  getAnalyticsForPage,
  getAnalyticsSummary,
  trackChatbotUsage,
  trackPageVisit,
  trackProjectView,
  trackAnalyticsEvent,
  getAnalyticsDaily,
  getAnalyticsMonthly,
  getAnalyticsYearly,
} from '../controllers/analytics.controller.js';
import {
  analyticsChatbotSchema,
  analyticsEventSchema,
  analyticsProjectSchema,
  analyticsPageSchema,
  analyticsVisitSchema,
} from '../validations/analytics.validation.js';
import { validateRequest } from '../validations/validateRequest.js';
import { admin, protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/event', validateRequest(analyticsEventSchema), trackAnalyticsEvent);
router.post('/visit', validateRequest(analyticsVisitSchema), trackPageVisit);
router.post('/chatbot', validateRequest(analyticsChatbotSchema), trackChatbotUsage);
router.post('/project', validateRequest(analyticsProjectSchema), trackProjectView);
router.get('/summary', protect, admin, getAnalyticsSummary);
router.get('/daily', protect, admin, getAnalyticsDaily);
router.get('/monthly', protect, admin, getAnalyticsMonthly);
router.get('/yearly', protect, admin, getAnalyticsYearly);
router.get('/:page', validateRequest(analyticsPageSchema), getAnalyticsForPage);

export default router;
