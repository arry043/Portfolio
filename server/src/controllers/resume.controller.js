import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { resumeData } from '../data/resume.data.js';
import Experience from '../models/Experience.js';
import { ensureSeedData } from '../services/seedData.service.js';
import {
  ensureDefaultResumeSelection,
  setDefaultResumeById,
} from '../services/defaultResume.service.js';
import { getCloudinarySecureUrl } from '../services/cloudinary.service.js';
import { mapTimelineExperiences } from '../services/experienceTimeline.service.js';

const DEFAULT_DOWNLOAD_API_PATH = '/download-resume';
const DEFAULT_DOWNLOAD_BASE_NAME = 'Arif_Ansari_Resume';
const DEFAULT_DOWNLOAD_EXTENSION = 'pdf';

const MIME_BY_EXTENSION = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain; charset=utf-8',
  rtf: 'application/rtf',
};

const EXTENSION_BY_MIME = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'text/plain; charset=utf-8': 'txt',
  'application/rtf': 'rtf',
};

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
    downloadApiUrl: DEFAULT_DOWNLOAD_API_PATH,
    url: fileUrl,
    fileName: resume.fileName,
    storageProvider: resume.storageProvider,
    isDefault: Boolean(resume.isDefault),
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
  };
};

const sanitizeFileName = (value = '') =>
  String(value || '')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '');

const extractExtension = (value = '') => {
  const matched = String(value || '').match(/\.([a-zA-Z0-9]{2,8})(?:$|\?)/);
  return matched?.[1]?.toLowerCase() || '';
};

const inferExtension = ({ fileName = '', fileUrl = '', contentType = '' }) => {
  const fromFileName = extractExtension(fileName);
  if (fromFileName) {
    return fromFileName;
  }

  const normalizedType = String(contentType || '').toLowerCase().split(';')[0].trim();
  if (EXTENSION_BY_MIME[normalizedType]) {
    return EXTENSION_BY_MIME[normalizedType];
  }

  const fromUrl = extractExtension(fileUrl);
  if (fromUrl) {
    return fromUrl;
  }

  return DEFAULT_DOWNLOAD_EXTENSION;
};

const inferContentType = ({ fileName = '', fileUrl = '', contentType = '' }) => {
  const normalizedType = String(contentType || '').toLowerCase().split(';')[0].trim();
  if (normalizedType) {
    return normalizedType;
  }

  const extension = inferExtension({ fileName, fileUrl, contentType: normalizedType });
  return MIME_BY_EXTENSION[extension] || 'application/octet-stream';
};

const toAttachmentFileName = ({ resume, contentType = '', fileUrl = '' }) => {
  const rawFileName = sanitizeFileName(resume?.fileName || '');
  const fileExtension = inferExtension({
    fileName: rawFileName,
    fileUrl,
    contentType,
  });
  const baseFromFileName = rawFileName
    ? rawFileName.replace(/\.[^.]+$/, '')
    : sanitizeFileName(resume?.title || '') || DEFAULT_DOWNLOAD_BASE_NAME;

  const base = baseFromFileName || DEFAULT_DOWNLOAD_BASE_NAME;
  return `${base}.${fileExtension}`;
};

const getCloudinaryReadableResponse = async (cloudinaryUrl) => {
  const upstream = await fetch(cloudinaryUrl);

  if (!upstream.ok) {
    const error = new Error('Failed to download resume from Cloudinary');
    error.statusCode = upstream.status === 404 ? 404 : 502;
    throw error;
  }

  if (!upstream.body) {
    const error = new Error('Resume stream is unavailable');
    error.statusCode = 502;
    throw error;
  }

  return upstream;
};

export const getResumeContent = async (req, res, next) => {
  try {
    await ensureSeedData();

    const experienceItems = await Experience.find().lean();
    const timelineItems = mapTimelineExperiences(experienceItems);
    const dynamicExperience = timelineItems.map((item) => ({
      role: item.role,
      company: item.company,
      duration: item.duration || '—',
      dateRange: item.dateRange || item.period || '—',
      period: item.dateRange || item.period || '—',
      startDate: item.startDate || null,
      endDate: item.endDate || null,
      isCurrentlyWorking: Boolean(item.isCurrentlyWorking),
      isPresent: Boolean(item.isPresent),
      description: item.description || '',
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

export const downloadDefaultResume = async (req, res, next) => {
  try {
    const item = await ensureDefaultResumeSelection();
    const mapped = item ? mapDefaultResumeResponse(item) : null;

    if (!mapped?.fileUrl) {
      return res.status(404).json({
        success: false,
        message: 'No default resume available for download',
      });
    }

    const cloudinaryDownloadUrl = buildDownloadUrl(mapped.fileUrl);
    const upstream = await getCloudinaryReadableResponse(cloudinaryDownloadUrl);
    const upstreamContentType = upstream.headers.get('content-type') || '';
    const fileName = toAttachmentFileName({
      resume: mapped,
      contentType: upstreamContentType,
      fileUrl: cloudinaryDownloadUrl,
    });
    const contentType = inferContentType({
      fileName,
      fileUrl: cloudinaryDownloadUrl,
      contentType: upstreamContentType,
    });
    const contentLength = upstream.headers.get('content-length');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-store');

    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    await pipeline(Readable.fromWeb(upstream.body), res);
    return undefined;
  } catch (error) {
    if (error?.statusCode && res.statusCode === 200) {
      res.status(error.statusCode);
    }

    if (!res.headersSent) {
      return next(error);
    }

    res.destroy(error);
    return undefined;
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
        downloadApiUrl: mapped.downloadApiUrl,
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
        downloadApiUrl: mapped.downloadApiUrl,
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
