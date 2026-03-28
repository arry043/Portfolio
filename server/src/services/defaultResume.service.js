import Resume from '../models/Resume.js';
import { getCloudinarySecureUrl } from './cloudinary.service.js';

const CLOUDINARY_URL_REGEX = /cloudinary\.com/i;
const VALID_CLOUDINARY_FILTER = { $regex: CLOUDINARY_URL_REGEX };

const findPrimaryCandidate = () =>
  Resume.findOne({ fileUrl: VALID_CLOUDINARY_FILTER }).sort({ createdAt: -1 });

const normalizeResumeCloudinaryUrl = async (resume) => {
  if (!resume?.fileUrl) {
    return '';
  }

  const normalized = getCloudinarySecureUrl(resume.fileUrl);
  if (!normalized) {
    return '';
  }

  if (resume.fileUrl !== normalized || resume.storageProvider !== 'cloudinary') {
    resume.fileUrl = normalized;
    resume.storageProvider = 'cloudinary';
    await resume.save();
  }

  return normalized;
};

export const ensureDefaultResumeSelection = async () => {
  await Resume.updateMany(
    {
      isDefault: true,
      fileUrl: { $not: VALID_CLOUDINARY_FILTER },
    },
    { $set: { isDefault: false } }
  );

  const defaults = await Resume.find({
    isDefault: true,
    fileUrl: VALID_CLOUDINARY_FILTER,
  }).sort({ createdAt: -1 });

  if (defaults.length > 1) {
    const [keep, ...rest] = defaults;
    if (rest.length > 0) {
      await Resume.updateMany(
        { _id: { $in: rest.map((item) => item._id) } },
        { $set: { isDefault: false } }
      );
    }
    await normalizeResumeCloudinaryUrl(keep);
    return keep;
  }

  if (defaults.length === 1) {
    await normalizeResumeCloudinaryUrl(defaults[0]);
    return defaults[0];
  }

  const fallback = await findPrimaryCandidate();
  if (!fallback) {
    return null;
  }

  await normalizeResumeCloudinaryUrl(fallback);
  await Resume.findByIdAndUpdate(
    fallback._id,
    { $set: { isDefault: true } },
    { returnDocument: 'after' }
  );
  return Resume.findById(fallback._id);
};

export const setDefaultResumeById = async (id) => {
  const target = await Resume.findById(id);
  if (!target) {
    return null;
  }

  const normalizedTargetUrl = await normalizeResumeCloudinaryUrl(target);
  if (!normalizedTargetUrl) {
    const error = new Error('Default resume must use a valid Cloudinary URL');
    error.statusCode = 400;
    throw error;
  }

  await Resume.updateMany(
    { _id: { $ne: target._id }, isDefault: true },
    { $set: { isDefault: false } }
  );

  if (!target.isDefault) {
    target.isDefault = true;
    await target.save();
  }

  return target;
};
