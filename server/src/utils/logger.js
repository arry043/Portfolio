import env from '../config/env.js';

const sanitizePayload = (data) => {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };
  const sensitiveKeys = ['password', 'token', 'accessToken', 'refreshToken', 'secret', 'key'];

  sensitiveKeys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      sanitized[key] = '***';
    }
  });

  // Partially mask emails
  if (sanitized.email && typeof sanitized.email === 'string') {
    const [name, domain] = sanitized.email.split('@');
    if (name && domain) {
      sanitized.email = `${name[0]}${'*'.repeat(Math.max(0, name.length - 1))}@${domain}`;
    }
  }

  return sanitized;
};

const logger = {
  info: (message, data) => {
    if (env.isProduction && !message.includes('[BOOT]')) return; // Minimal info in prod
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data ? sanitizePayload(data) : '');
  },
  warn: (message, data) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data ? sanitizePayload(data) : '');
  },
  error: (message, error) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '');
  },
  debug: (message, data) => {
    if (!env.isDevelopment) return;
    console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, data ? sanitizePayload(data) : '');
  }
};

export default logger;
