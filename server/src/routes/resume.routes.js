import express from 'express';
import {
  downloadDefaultResume,
  getDefaultResume,
  getResumeContent,
  setDefaultResume,
} from '../controllers/resume.controller.js';
import { admin, protect } from '../middlewares/auth.middleware.js';
import { setDefaultAdminResumeSchema } from '../validations/adminResume.validation.js';
import { validateRequest } from '../validations/validateRequest.js';

const router = express.Router();

router.get('/', getResumeContent);
router.get('/default', getDefaultResume);
router.get('/download', downloadDefaultResume);
router.get('/download-resume', downloadDefaultResume);
router.patch('/set-default/:id', protect, admin, validateRequest(setDefaultAdminResumeSchema), setDefaultResume);

export default router;
