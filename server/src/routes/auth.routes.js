import express from 'express';
import { registerUser, loginUser, googleAuth } from '../controllers/auth.controller.js';
import {
  validateRequest,
  registerSchema,
  loginSchema,
  googleAuthSchema,
} from '../validations/auth.validation.js';

const router = express.Router();

router.post('/register', validateRequest(registerSchema), registerUser);
router.post('/login', validateRequest(loginSchema), loginUser);
router.post('/google', validateRequest(googleAuthSchema), googleAuth);

export default router;
