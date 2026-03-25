import express from 'express';
import {
  createAdminResume,
  deleteAdminResume,
  listAdminResumes,
  updateAdminResume,
} from '../controllers/adminResume.controller.js';
import { admin, protect } from '../middlewares/auth.middleware.js';
import {
  createAdminResumeSchema,
  deleteAdminResumeSchema,
  updateAdminResumeSchema,
} from '../validations/adminResume.validation.js';
import { validateRequest } from '../validations/validateRequest.js';
import {
  handleUploadError,
  resumeUpload,
} from '../middlewares/upload.middleware.js';

const router = express.Router();

router.use(protect, admin);

router.get('/', listAdminResumes);

router.post(
  '/',
  (req, res, next) => resumeUpload.single('file')(req, res, (err) => handleUploadError(err, req, res, next)),
  validateRequest(createAdminResumeSchema),
  createAdminResume
);

router.patch(
  '/:id',
  (req, res, next) => resumeUpload.single('file')(req, res, (err) => handleUploadError(err, req, res, next)),
  validateRequest(updateAdminResumeSchema),
  updateAdminResume
);

router.delete('/:id', validateRequest(deleteAdminResumeSchema), deleteAdminResume);

export default router;
