import express from 'express';
import {
  deleteAdminUser,
  getAdminUserById,
  listAdminUsers,
  updateAdminUserRole,
} from '../controllers/adminUser.controller.js';
import { admin, protect } from '../middlewares/auth.middleware.js';
import {
  updateUserRoleSchema,
  userIdParamSchema,
} from '../validations/adminUser.validation.js';
import { validateRequest } from '../validations/validateRequest.js';

const router = express.Router();

router.use(protect, admin);

router.get('/', listAdminUsers);
router.get('/:id', validateRequest(userIdParamSchema), getAdminUserById);
router.patch('/:id/role', validateRequest(updateUserRoleSchema), updateAdminUserRole);
router.delete('/:id', validateRequest(userIdParamSchema), deleteAdminUser);

export default router;
