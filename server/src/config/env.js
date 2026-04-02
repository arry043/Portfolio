import dotenv from 'dotenv';
import path from 'path';

// Local development might need to load from the root .env
dotenv.config();

const requiredEnvVars = [
  'JWT_SECRET',
  'MONGO_URI'
];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('FATAL ERROR: Missing required environment variables:');
  missingEnvVars.forEach((envVar) => {
    console.error(` - ${envVar}`);
  });
  console.error('The server will now exit.');
  process.exit(1);
}

export const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5001', 10),
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
};

export default config;
