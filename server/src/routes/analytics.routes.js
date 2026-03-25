import express from 'express';
import {
  getAnalyticsForPage,
  getAnalyticsSummary,
  trackAnalyticsEvent,
} from '../controllers/analytics.controller.js';
import {
  analyticsEventSchema,
  analyticsPageSchema,
} from '../validations/analytics.validation.js';
import { validateRequest } from '../validations/validateRequest.js';
import { admin, protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/event', validateRequest(analyticsEventSchema), trackAnalyticsEvent);
router.get('/summary', protect, admin, getAnalyticsSummary);
router.get('/:page', validateRequest(analyticsPageSchema), getAnalyticsForPage);

export default router;
