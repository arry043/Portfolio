import express from 'express';
import { registerUser, loginUser, googleAuth, syncUser } from '../controllers/auth.controller.js';
import {
  validateRequest,
  registerSchema,
  loginSchema,
  googleAuthSchema,
  syncUserSchema,
} from '../validations/auth.validation.js';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), registerUser);
router.post('/login', validateRequest(loginSchema), loginUser);
router.post('/google', validateRequest(googleAuthSchema), googleAuth);
router.post('/sync-user', validateRequest(syncUserSchema), syncUser);

export default router;
