import express from 'express';
import {
  createProject,
  deleteProject,
  getProjectById,
  incrementProjectViews,
  listProjects,
  updateProject,
} from '../controllers/project.controller.js';
import {
  createProjectSchema,
  listProjectsQuerySchema,
  updateProjectSchema,
} from '../validations/project.validation.js';
import { validateRequest } from '../validations/validateRequest.js';
import { admin, protect } from '../middlewares/auth.middleware.js';
import {
  handleUploadError,
  imageUpload,
} from '../middlewares/upload.middleware.js';

const router = express.Router();

router.get('/', validateRequest(listProjectsQuerySchema), listProjects);
router.get('/:id', getProjectById);
router.post('/:id/view', incrementProjectViews);

router.post(
  '/',
  protect,
  admin,
  (req, res, next) => imageUpload.single('image')(req, res, (err) => handleUploadError(err, req, res, next)),
  validateRequest(createProjectSchema),
  createProject
);

router.patch(
  '/:id',
  protect,
  admin,
  (req, res, next) => imageUpload.single('image')(req, res, (err) => handleUploadError(err, req, res, next)),
  validateRequest(updateProjectSchema),
  updateProject
);

router.delete('/:id', protect, admin, deleteProject);

export default router;
