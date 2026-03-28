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

export const getResumeDownloadFileName = (resume) => {
  const fromFileName = sanitizeFileName(resume?.fileName || '');
  if (fromFileName) {
    return fromFileName.toLowerCase().endsWith('.pdf') ? fromFileName : `${fromFileName}.pdf`;
  }

  const fromTitle = sanitizeFileName(resume?.title || '');
  if (fromTitle) {
    return `${fromTitle}.pdf`;
  }

  return 'resume.pdf';
};

export const triggerResumeDownload = ({ url, fileName }) => {
  const downloadUrl = buildResumeDownloadUrl(url);

  if (!downloadUrl) {
    return false;
  }

  try {
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = fileName || 'resume.pdf';
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    return true;
  } catch {
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    return false;
  }
};
