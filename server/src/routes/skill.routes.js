import express from 'express';
import {
  createSkill,
  deleteSkill,
  getSkillById,
  listAllSkills,
  listSkills,
  updateSkill,
} from '../controllers/skill.controller.js';
import {
  createSkillSchema,
  deleteSkillSchema,
  getSkillSchema,
  updateSkillSchema,
} from '../validations/skill.validation.js';
import { validateRequest } from '../validations/validateRequest.js';
import { admin, protect } from '../middlewares/auth.middleware.js';
import {
  handleUploadError,
  imageUpload,
} from '../middlewares/upload.middleware.js';

const router = express.Router();

router.get('/', listSkills);

router.get('/all', protect, admin, listAllSkills);

router.get(
  '/:id',
  protect,
  admin,
  validateRequest(getSkillSchema),
  getSkillById
);

router.post(
  '/',
  protect,
  admin,
  (req, res, next) => imageUpload.single('logo')(req, res, (err) => handleUploadError(err, req, res, next)),
  validateRequest(createSkillSchema),
  createSkill
);

router.patch(
  '/:id',
  protect,
  admin,
  (req, res, next) => imageUpload.single('logo')(req, res, (err) => handleUploadError(err, req, res, next)),
  validateRequest(updateSkillSchema),
  updateSkill
);

router.delete(
  '/:id',
  protect,
  admin,
  validateRequest(deleteSkillSchema),
  deleteSkill
);

export default router;
