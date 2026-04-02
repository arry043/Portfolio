import { api } from './api';

const DEFAULT_DOWNLOAD_ENDPOINT = '/download-resume';
const DEFAULT_DOWNLOAD_FILE_NAME = 'Arif_Ansari_Resume.pdf';

const toAbsoluteUrl = (value = '') => {
  const normalizedValue = String(value || '').trim();
  if (!normalizedValue) {
    return '';
  }

  if (/^https?:\/\//i.test(normalizedValue)) {
    return normalizedValue;
  }

  if (normalizedValue.startsWith('/')) {
    return `${window.location.origin}${normalizedValue}`;
  }

  return `${window.location.origin}/${normalizedValue}`;
};

export const normalizeCloudinaryResumeUrl = (value = '') => {
  const absoluteUrl = toAbsoluteUrl(value);
  if (!absoluteUrl) {
    return '';
  }

  try {
    const parsedUrl = new URL(absoluteUrl);
    if (!parsedUrl.hostname.endsWith('cloudinary.com')) {
      return '';
    }

    parsedUrl.protocol = 'https:';
    return parsedUrl.toString();
  } catch {
    return '';
  }
};

export const isCloudinaryResumeUrl = (value = '') => {
  return Boolean(normalizeCloudinaryResumeUrl(value));
};

export const buildResumeDownloadUrl = (value = '') => {
  const cloudinaryUrl = normalizeCloudinaryResumeUrl(value);
  if (!cloudinaryUrl) {
    return '';
  }

  if (!cloudinaryUrl.includes('/upload/') || cloudinaryUrl.includes('/upload/fl_attachment')) {
    return cloudinaryUrl;
  }

  return cloudinaryUrl.replace('/upload/', '/upload/fl_attachment/');
};

export const buildResumePreviewUrl = (value = '') => {
  const cloudinaryUrl = normalizeCloudinaryResumeUrl(value);
  if (!cloudinaryUrl) {
    return '';
  }

  return cloudinaryUrl.includes('#') ? cloudinaryUrl : `${cloudinaryUrl}#toolbar=0`;
};

const sanitizeFileName = (value = '') =>
  String(value || '')
    .trim()
    .replace(/[^a-z0-9._-]+/gi, '_')
    .replace(/^_+|_+$/g, '');

const hasFileExtension = (value = '') => /\.[a-z0-9]{2,8}$/i.test(String(value || ''));

const extractFileNameFromDisposition = (headerValue = '') => {
  const normalized = String(headerValue || '').trim();
  if (!normalized) {
    return '';
  }

  const utf8Match = normalized.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return sanitizeFileName(decodeURIComponent(utf8Match[1]));
    } catch {
      return sanitizeFileName(utf8Match[1]);
    }
  }

  const fallbackMatch = normalized.match(/filename\s*=\s*"?(?<name>[^";]+)"?/i);
  return sanitizeFileName(fallbackMatch?.groups?.name || '');
};

const triggerBrowserDownload = ({ objectUrl, fileName }) => {
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName || DEFAULT_DOWNLOAD_FILE_NAME;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
};

export const getResumeDownloadFileName = (resume) => {
  const fromFileName = sanitizeFileName(resume?.fileName || '');
  if (fromFileName) {
    return hasFileExtension(fromFileName) ? fromFileName : `${fromFileName}.pdf`;
  }

  const fromTitle = sanitizeFileName(resume?.title || '');
  if (fromTitle) {
    return `${fromTitle}.pdf`;
  }

  return 'resume.pdf';
};

export const triggerResumeDownload = async ({
  endpoint = DEFAULT_DOWNLOAD_ENDPOINT,
  fileName = DEFAULT_DOWNLOAD_FILE_NAME,
} = {}) => {
  try {
    const response = await api.get(endpoint, {
      responseType: 'blob',
      timeout: 45_000,
    });
    const responseBlob = response?.data;
    const downloadBlob =
      responseBlob instanceof Blob
        ? responseBlob
        : new Blob([responseBlob], {
            type: response?.headers?.['content-type'] || 'application/octet-stream',
          });

    if (!downloadBlob || downloadBlob.size === 0) {
      throw new Error('Resume download returned an empty file.');
    }

    const headerFileName = extractFileNameFromDisposition(
      response?.headers?.['content-disposition']
    );
    const safeFallback = sanitizeFileName(fileName || '') || DEFAULT_DOWNLOAD_FILE_NAME;
    const resolvedFileName = headerFileName || safeFallback;
    const objectUrl = window.URL.createObjectURL(downloadBlob);

    try {
      triggerBrowserDownload({ objectUrl, fileName: resolvedFileName });
    } finally {
      window.setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl);
      }, 0);
    }

    return { ok: true, fileName: resolvedFileName };
  } catch (error) {
    return { ok: false, error };
  }
};
