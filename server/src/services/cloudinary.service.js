import { v2 as cloudinary } from 'cloudinary';

let cloudinaryRuntimeConfigured = false;

const getCloudinaryEnvConfig = () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
});

export const isCloudinaryConfigured = () => {
  const config = getCloudinaryEnvConfig();
  return Boolean(config.cloudName && config.apiKey && config.apiSecret);
};

const configureCloudinaryIfNeeded = () => {
  if (cloudinaryRuntimeConfigured) {
    return;
  }

  if (!isCloudinaryConfigured()) {
    return;
  }

  const config = getCloudinaryEnvConfig();
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret,
  });
  cloudinaryRuntimeConfigured = true;
};

export const isCloudinaryUrl = (value) => {
  return Boolean(getCloudinarySecureUrl(value));
};

export const getCloudinarySecureUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  try {
    const parsedUrl = new URL(value);
    if (!parsedUrl.hostname.endsWith('cloudinary.com')) {
      return '';
    }

    parsedUrl.protocol = 'https:';
    return parsedUrl.toString();
  } catch {
    return '';
  }
};

class CloudinaryUploadError extends Error {
  constructor(message, statusCode = 502) {
    super(message);
    this.name = 'CloudinaryUploadError';
    this.statusCode = statusCode;
  }
}

const ensureCloudinaryConfiguration = () => {
  configureCloudinaryIfNeeded();

  if (!isCloudinaryConfigured()) {
    throw new CloudinaryUploadError(
      'Cloudinary configuration is missing. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.',
      500
    );
  }
};

const toDataUri = (file) => {
  if (!file?.buffer || !file?.mimetype) {
    throw new CloudinaryUploadError('Uploaded file payload is invalid', 400);
  }

  return `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
};

const sanitizePublicId = (value) =>
  String(value || 'file')
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

const uploadWithCloudinary = async (file, options) => {
  ensureCloudinaryConfiguration();

  try {
    const response = await cloudinary.uploader.upload(toDataUri(file), {
      timeout: 30_000,
      ...options,
    });

    return {
      url: response.secure_url,
      publicId: response.public_id,
      provider: 'cloudinary',
    };
  } catch (error) {
    const likelyNetworkError = ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN'].includes(
      error?.code
    );
    const message = likelyNetworkError
      ? 'Unable to reach Cloudinary right now. Please try again.'
      : 'Cloudinary upload failed. Please retry.';

    throw new CloudinaryUploadError(message, 502);
  }
};

export const uploadImageBufferToCloudinary = async (file, folder = 'portfolio') => {
  return uploadWithCloudinary(file, {
    folder,
    resource_type: 'image',
  });
};

export const uploadFileBufferToCloudinary = async (file, folder = 'portfolio/files') => {
  return uploadWithCloudinary(file, {
    folder,
    resource_type: 'raw',
    public_id: `${Date.now()}-${sanitizePublicId(file?.originalname)}`,
  });
};
