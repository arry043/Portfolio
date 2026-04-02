import express from 'express';
import cors from 'cors';
import env from './src/config/env.js';
import connectDB from './src/config/db.js';
import { notFound, errorHandler } from './src/middlewares/errorMiddleware.js';
import logger from './src/utils/logger.js';

const app = express();
const PORT = env.PORT;

// Connect to database
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

logger.info(`[BOOT] Running in ${env.NODE_ENV} mode.`);
logger.info(`[BOOT] CLIENT_URL is set to: ${env.CLIENT_URL}`);

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`[CORS DEBUG] Rejected origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log(`[REQ DEBUG] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Default Route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Healthcheck
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is healthy', 
    timestamp: new Date().toISOString() 
  });
});

import authRoutes from './src/routes/auth.routes.js';
import projectRoutes from './src/routes/project.routes.js';
import certificateRoutes from './src/routes/certificate.routes.js';
import contactRoutes from './src/routes/contact.routes.js';
import analyticsRoutes from './src/routes/analytics.routes.js';
import aiRoutes from './src/routes/ai.routes.js';
import resumeRoutes from './src/routes/resume.routes.js';
import gameRoutes from './src/routes/game.routes.js';
import adminResumeRoutes from './src/routes/admin.resume.routes.js';
import adminUserRoutes from './src/routes/admin.user.routes.js';
import adminExperienceRoutes from './src/routes/admin.experience.routes.js';
import { downloadDefaultResume } from './src/controllers/resume.controller.js';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/certificates', certificateRoutes);
app.use('/api/v1/contact', contactRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/resume', resumeRoutes);
app.get('/api/v1/download-resume', downloadDefaultResume);
app.use('/api/v1/games', gameRoutes);
app.use('/api/v1/admin/resumes', adminResumeRoutes);
app.use('/api/v1/admin/users', adminUserRoutes);
app.use('/api/v1/admin/experiences', adminExperienceRoutes);

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`[BOOT] Server running on port ${PORT}`);
});
