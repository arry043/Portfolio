import express from 'express';
import {
  createExperience,
  deleteExperience,
  listExperiences,
  updateExperience,
} from '../controllers/experience.controller.js';
import { admin, protect } from '../middlewares/auth.middleware.js';
import {
  createExperienceSchema,
  deleteExperienceSchema,
  updateExperienceSchema,
} from '../validations/experience.validation.js';
import { validateRequest } from '../validations/validateRequest.js';

const router = express.Router();

router.use(protect, admin);

router.get('/', listExperiences);
router.post('/', validateRequest(createExperienceSchema), createExperience);
router.patch('/:id', validateRequest(updateExperienceSchema), updateExperience);
router.delete('/:id', validateRequest(deleteExperienceSchema), deleteExperience);

export default router;
