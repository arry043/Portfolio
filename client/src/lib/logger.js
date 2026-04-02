const isDev = import.meta.env.DEV;

const sanitizePayload = (data) => {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };
  const sensitiveKeys = ['password', 'token', 'accessToken', 'refreshToken', 'secret', 'key'];

  sensitiveKeys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      sanitized[key] = '***';
    }
  });

  return sanitized;
};

const logger = {
  info: (message, data) => {
    if (!isDev) return;
    console.log(`[INFO] ${message}`, data ? sanitizePayload(data) : '');
  },
  warn: (message, data) => {
    console.warn(`[WARN] ${message}`, data ? sanitizePayload(data) : '');
  },
  error: (message, error) => {
    console.error(`[ERROR] ${message}`, error || '');
  },
  debug: (message, data) => {
    if (!isDev) return;
    console.debug(`[DEBUG] ${message}`, data ? sanitizePayload(data) : '');
  }
};

export default logger;
