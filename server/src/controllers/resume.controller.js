import { resumeData } from '../data/resume.data.js';
import Experience from '../models/Experience.js';
import { ensureSeedData } from '../services/seedData.service.js';
import { formatExperiencePeriod } from '../services/date.service.js';
import {
  buildTimelineSortStages,
  hideTimelineSortFieldStage,
} from '../services/timelineSort.service.js';
import {
  ensureDefaultResumeSelection,
  setDefaultResumeById,
} from '../services/defaultResume.service.js';
import { getCloudinarySecureUrl } from '../services/cloudinary.service.js';

const buildDownloadUrl = (fileUrl = '') => {
  if (!fileUrl.includes('res.cloudinary.com')) {
    return '';
  }

  if (!fileUrl.includes('/upload/') || fileUrl.includes('/upload/fl_attachment')) {
    return fileUrl;
  }

  return fileUrl.replace('/upload/', '/upload/fl_attachment/');
};

const mapDefaultResumeResponse = (resume) => {
  const fileUrl = getCloudinarySecureUrl(resume.fileUrl);

  if (!fileUrl) {
    return null;
  }

  const downloadUrl = buildDownloadUrl(fileUrl);
  return {
    _id: resume._id,
    title: resume.title,
    category: resume.category,
    fileUrl,
    downloadUrl,
    url: fileUrl,
    fileName: resume.fileName,
    storageProvider: resume.storageProvider,
    isDefault: Boolean(resume.isDefault),
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  };
};

export const getResumeContent = async (req, res, next) => {
  try {
    await ensureSeedData();

    const sortAlias = '__timelineSortDate';
    const experienceItems = await Experience.aggregate([
      ...buildTimelineSortStages(['startDate'], { alias: sortAlias }),
      hideTimelineSortFieldStage(sortAlias),
    ]);
    const dynamicExperience = experienceItems.map((item) => ({
      role: item.role,
      company: item.company,
      period: formatExperiencePeriod(item),
      startDate: item.startDate || null,
      endDate: item.endDate || null,
      isCurrentlyWorking: Boolean(item.isCurrentlyWorking),
      highlights: item.description ? [item.description] : [],
    }));

    return res.json({
      success: true,
      item: {
        ...resumeData,
        experience: dynamicExperience.length > 0 ? dynamicExperience : resumeData.experience,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getDefaultResume = async (req, res, next) => {
  try {
    const item = await ensureDefaultResumeSelection();
    const mapped = item ? mapDefaultResumeResponse(item) : null;

    if (!mapped) {
      return res.status(404).json({
        success: false,
        item: null,
        resume: null,
        message: 'No Cloudinary resume uploaded yet',
      });
    }

    return res.json({
      success: true,
      item: mapped,
      resume: {
        url: mapped.fileUrl,
        downloadUrl: mapped.downloadUrl,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const setDefaultResume = async (req, res, next) => {
  try {
    const item = await setDefaultResumeById(req.validated?.params?.id || req.params.id);

    if (!item) {
      res.status(404);
      throw new Error('Resume not found');
    }

    const mapped = mapDefaultResumeResponse(item);
    if (!mapped) {
      res.status(400);
      throw new Error('Default resume must use a valid Cloudinary URL');
    }

    return res.json({
      success: true,
      item: mapped,
      resume: {
        url: mapped.fileUrl,
        downloadUrl: mapped.downloadUrl,
      },
      message: 'Default resume updated successfully',
    });
  } catch (error) {
    if (error?.statusCode && res.statusCode === 200) {
      res.status(error.statusCode);
    }
    return next(error);
  }
};
