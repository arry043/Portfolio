import express from 'express';
import {
  listMessages,
  submitMessage,
} from '../controllers/contact.controller.js';
import { createMessageSchema } from '../validations/contact.validation.js';
import { validateRequest } from '../validations/validateRequest.js';
import { admin, protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/', validateRequest(createMessageSchema), submitMessage);
router.get('/', protect, admin, listMessages);

export default router;
