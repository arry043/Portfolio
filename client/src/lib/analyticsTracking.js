const SESSION_TRACK_TTL_MS = 30 * 60 * 1000;

const getStoredUserId = () => {
  try {
    const raw = localStorage.getItem('portfolio_user');
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return parsed?._id || parsed?.id || null;
  } catch {
    return null;
  }
};

export const buildTrackingMetadata = (route) => ({
  route: route || (typeof window !== 'undefined' ? window.location.pathname : '/'),
  timestamp: new Date().toISOString(),
  userId: getStoredUserId(),
});

export const shouldTrackOncePerSession = (key, ttlMs = SESSION_TRACK_TTL_MS) => {
  if (typeof window === 'undefined' || !key) {
    return true;
  }

  try {
    const now = Date.now();
    const raw = window.sessionStorage.getItem(key);
    const previous = raw ? Number(raw) : NaN;

    if (Number.isFinite(previous) && now - previous < ttlMs) {
      return false;
    }

    window.sessionStorage.setItem(key, String(now));
    return true;
  } catch {
    return true;
  }
};
