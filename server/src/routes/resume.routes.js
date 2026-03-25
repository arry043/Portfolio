import express from 'express';
import { getResumeContent } from '../controllers/resume.controller.js';

const router = express.Router();

router.get('/', getResumeContent);

export default router;
