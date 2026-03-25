import express from 'express';
import {
  askResume,
  getResumeStatus,
  uploadResume,
} from '../controllers/ai.controller.js';
import { resumeChatSchema } from '../validations/ai.validation.js';
import { validateRequest } from '../validations/validateRequest.js';
import { admin, protect } from '../middlewares/auth.middleware.js';
import {
  handleUploadError,
  resumeUpload,
} from '../middlewares/upload.middleware.js';

const router = express.Router();

router.get('/status', getResumeStatus);
router.post('/chat', validateRequest(resumeChatSchema), askResume);
router.post(
  '/resume/upload',
  protect,
  admin,
  (req, res, next) => resumeUpload.single('resume')(req, res, (err) => handleUploadError(err, req, res, next)),
  uploadResume
);

export default router;
