const CACHE_NAME = 'portfolio-default-resume-v1';
const CACHE_PATH = '/__portfolio-cache__/default-resume';
const ACTIVE_RESUME_KEY = 'portfolio_cached_default_resume';

let inFlightCacheTask = null;

const canUseCacheStorage = () =>
  typeof window !== 'undefined' &&
  typeof window.caches !== 'undefined' &&
  typeof window.fetch === 'function';

const getResumeVersion = (resume) =>
  [resume?._id || 'resume', resume?.updatedAt || resume?.fileUrl || 'current'].join(':');

const getCacheRequest = (resume) => {
  const version = encodeURIComponent(getResumeVersion(resume));
  return new Request(`${window.location.origin}${CACHE_PATH}?version=${version}`);
};

const sanitizeFileName = (value = '') =>
  String(value || '')
    .trim()
    .replace(/[^a-z0-9._-]+/gi, '_')
    .replace(/^_+|_+$/g, '');

const getResumeFileName = (resume) => {
  const fileName = sanitizeFileName(resume?.fileName || '');
  if (fileName) {
    return /\.[a-z0-9]{2,8}$/i.test(fileName) ? fileName : `${fileName}.pdf`;
  }

  return `${sanitizeFileName(resume?.title || 'resume') || 'resume'}.pdf`;
};

const getSourceUrl = (resume) => {
  const value = String(resume?.downloadUrl || resume?.fileUrl || '').trim();

  try {
    const url = new URL(value);
    const isCloudinaryHost =
      url.hostname === 'cloudinary.com' || url.hostname.endsWith('.cloudinary.com');
    if (url.protocol !== 'https:' || !isCloudinaryHost) {
      return '';
    }

    if (url.pathname.includes('/upload/') && !url.pathname.includes('/upload/fl_attachment')) {
      url.pathname = url.pathname.replace('/upload/', '/upload/fl_attachment/');
    }

    return url.toString();
  } catch {
    return '';
  }
};

export const clearCachedDefaultResume = async () => {
  if (!canUseCacheStorage()) {
    return;
  }

  await window.caches.delete(CACHE_NAME);
  window.localStorage.removeItem(ACTIVE_RESUME_KEY);
};

export const cacheDefaultResume = async (resume, { force = false } = {}) => {
  if (!canUseCacheStorage() || !resume) {
    return null;
  }

  const sourceUrl = getSourceUrl(resume);
  if (!sourceUrl) {
    return null;
  }

  const version = getResumeVersion(resume);
  const activeVersion = window.localStorage.getItem(ACTIVE_RESUME_KEY);
  const cache = await window.caches.open(CACHE_NAME);
  const request = getCacheRequest(resume);

  if (!force && activeVersion === version) {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
  }

  if (inFlightCacheTask?.version === version) {
    return inFlightCacheTask.task;
  }

  const task = (async () => {
    if (activeVersion !== version) {
      await window.caches.delete(CACHE_NAME);
    }

    const response = await window.fetch(sourceUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      cache: 'force-cache',
    });

    if (!response.ok) {
      throw new Error('Unable to cache the default resume.');
    }

    const blob = await response.blob();
    if (!blob.size) {
      throw new Error('The default resume file is empty.');
    }

    const nextCache = await window.caches.open(CACHE_NAME);
    const cachedResponse = new Response(blob, {
      headers: {
        'Content-Type': blob.type || 'application/octet-stream',
        'X-Resume-File-Name': getResumeFileName(resume),
        'X-Resume-Version': version,
      },
    });

    await nextCache.put(request, cachedResponse.clone());
    window.localStorage.setItem(ACTIVE_RESUME_KEY, version);
    return cachedResponse;
  })();

  inFlightCacheTask = { version, task };

  try {
    return await task;
  } finally {
    if (inFlightCacheTask?.task === task) {
      inFlightCacheTask = null;
    }
  }
};

export const getCachedDefaultResume = async (resume) => {
  if (!canUseCacheStorage() || !resume) {
    return null;
  }

  const version = getResumeVersion(resume);
  if (window.localStorage.getItem(ACTIVE_RESUME_KEY) !== version) {
    return null;
  }

  const cache = await window.caches.open(CACHE_NAME);
  return cache.match(getCacheRequest(resume));
};

export const warmDefaultResumeCache = (resume) => {
  cacheDefaultResume(resume).catch(() => {
    // Download keeps the existing server fallback when browser/CDN caching is unavailable.
  });
};
