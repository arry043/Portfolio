import Resume from '../models/Resume.js';
import {
  isCloudinaryUrl,
  uploadFileBufferToCloudinary,
} from '../services/cloudinary.service.js';

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

export const listAdminResumes = async (req, res, next) => {
  try {
    const items = await Resume.find().sort({ createdAt: -1 });

    return res.json({
      success: true,
      items,
      fallbackMessage: items.length === 0 ? 'No resumes uploaded yet.' : null,
    });
  } catch (error) {
    return next(error);
  }
};

export const createAdminResume = async (req, res, next) => {
  try {
    const payload = req.validated.body;
    let fileUrl = (payload.fileUrl || '').trim();

    validateCloudinaryUrl(fileUrl);

    if (req.file) {
      fileUrl = await uploadResumeFile(req.file);
    }

    if (!fileUrl) {
      res.status(400);
      throw new Error('Resume file is required');
    }

    const item = await Resume.create({
      title: payload.title,
      category: payload.category,
      fileUrl,
      fileName: req.file?.originalname || '',
      storageProvider: 'cloudinary',
    });

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
    let fileUrl = (payload.fileUrl || '').trim();

    validateCloudinaryUrl(fileUrl);

    if (req.file) {
      fileUrl = await uploadResumeFile(req.file);
    }

    const item = await Resume.findByIdAndUpdate(
      req.params.id,
      {
        ...payload,
        ...(fileUrl ? { fileUrl } : {}),
        ...(fileUrl ? { storageProvider: 'cloudinary' } : {}),
        ...(req.file ? { fileName: req.file.originalname } : {}),
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!item) {
      res.status(404);
      throw new Error('Resume not found');
    }

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
    const item = await Resume.findByIdAndDelete(req.params.id);

    if (!item) {
      res.status(404);
      throw new Error('Resume not found');
    }

    return res.json({ success: true, message: 'Resume deleted successfully' });
  } catch (error) {
    return next(error);
  }
};
