import Resume from '../models/Resume.js';
import {
  getCloudinarySecureUrl,
  isCloudinaryUrl,
  uploadFileBufferToCloudinary,
} from '../services/cloudinary.service.js';
import {
  ensureDefaultResumeSelection,
} from '../services/defaultResume.service.js';

const validateCloudinaryUrl = (value, fieldName = 'fileUrl') => {
  if (!value) {
    return;
  }

  if (!isCloudinaryUrl(value)) {
    const error = new Error(`Only Cloudinary URLs are allowed for ${fieldName}`);
    error.statusCode = 400;
    throw error;
  }
};

const uploadResumeFile = async (file) => {
  const uploaded = await uploadFileBufferToCloudinary(file, 'portfolio/resumes');
  return uploaded.url;
};

const toAdminResumeItem = (resume) => {
  const safeCloudinaryUrl = getCloudinarySecureUrl(resume?.fileUrl || '');
  return {
    ...resume.toObject(),
    fileUrl: safeCloudinaryUrl || resume.fileUrl || '',
    isCloudinaryFile: Boolean(safeCloudinaryUrl),
  };
};

export const listAdminResumes = async (req, res, next) => {
  try {
    await ensureDefaultResumeSelection();
    const items = await Resume.find().sort({ createdAt: -1 });
    const normalizedItems = items.map(toAdminResumeItem);

    return res.json({
      success: true,
      items: normalizedItems,
      fallbackMessage: normalizedItems.length === 0 ? 'No resumes uploaded yet.' : null,
    });
  } catch (error) {
    return next(error);
  }
};

export const createAdminResume = async (req, res, next) => {
  try {
    const payload = req.validated.body;
    let fileUrl = getCloudinarySecureUrl((payload.fileUrl || '').trim()) || (payload.fileUrl || '').trim();

    validateCloudinaryUrl(fileUrl);

    if (req.file) {
      fileUrl = await uploadResumeFile(req.file);
    }

    if (!fileUrl) {
      res.status(400);
      throw new Error('Resume file is required');
    }

    const createdItem = await Resume.create({
      title: payload.title,
      category: payload.category,
      fileUrl,
      fileName: req.file?.originalname || '',
      storageProvider: 'cloudinary',
    });

    await ensureDefaultResumeSelection();
    const item = await Resume.findById(createdItem._id);

    return res.status(201).json({ success: true, item, storageProvider: 'cloudinary' });
  } catch (error) {
    if (error?.statusCode && res.statusCode === 200) {
      res.status(error.statusCode);
    }

    return next(error);
  }
};

export const updateAdminResume = async (req, res, next) => {
  try {
    const payload = req.validated.body;
    let fileUrl = getCloudinarySecureUrl((payload.fileUrl || '').trim()) || (payload.fileUrl || '').trim();

    validateCloudinaryUrl(fileUrl);

    if (req.file) {
      fileUrl = await uploadResumeFile(req.file);
    }

    const updatedItem = await Resume.findByIdAndUpdate(
      req.validated?.params?.id || req.params.id,
      {
        ...payload,
        ...(fileUrl ? { fileUrl } : {}),
        ...(fileUrl ? { storageProvider: 'cloudinary' } : {}),
        ...(req.file ? { fileName: req.file.originalname } : {}),
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedItem) {
      res.status(404);
      throw new Error('Resume not found');
    }

    await ensureDefaultResumeSelection();
    const item = await Resume.findById(updatedItem._id);

    return res.json({ success: true, item });
  } catch (error) {
    if (error?.statusCode && res.statusCode === 200) {
      res.status(error.statusCode);
    }

    return next(error);
  }
};

export const deleteAdminResume = async (req, res, next) => {
  try {
    const item = await Resume.findByIdAndDelete(req.validated?.params?.id || req.params.id);

    if (!item) {
      res.status(404);
      throw new Error('Resume not found');
    }

    await ensureDefaultResumeSelection();

    return res.json({ success: true, message: 'Resume deleted successfully' });
  } catch (error) {
    return next(error);
  }
};
