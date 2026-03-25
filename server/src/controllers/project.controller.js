import Project from '../models/Project.js';
import { ensureSeedData } from '../services/seedData.service.js';
import {
  isCloudinaryUrl,
  uploadImageBufferToCloudinary,
} from '../services/cloudinary.service.js';
import { resolveProjectTimelineDate } from '../services/date.service.js';
import {
  buildTimelineSortStages,
  hideTimelineSortFieldStage,
} from '../services/timelineSort.service.js';

const normalizeTags = (tags) => {
  if (!tags) {
    return [];
  }

  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }

  return String(tags)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const validateCloudinaryImageUrl = (value) => {
  if (!value) {
    return;
  }

  if (!isCloudinaryUrl(value)) {
    const error = new Error('Only Cloudinary image URLs are allowed for project images');
    error.statusCode = 400;
    throw error;
  }
};

const resolveProjectImageUrl = async (file, imageUrl) => {
  const trimmedUrl = (imageUrl || '').trim();
  validateCloudinaryImageUrl(trimmedUrl);

  if (file) {
    const uploaded = await uploadImageBufferToCloudinary(file, 'portfolio/projects');
    return uploaded.url;
  }

  return trimmedUrl;
};

export const listProjects = async (req, res, next) => {
  try {
    await ensureSeedData();

    const { category, q, page = 1, limit = 12 } = req.validated.query;

    const query = {};

    if (category) {
      query.category = category;
    }

    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $elemMatch: { $regex: q, $options: 'i' } } },
      ];
    }

    const skip = (page - 1) * limit;
    const sortAlias = '__timelineSortDate';

    const [items, total] = await Promise.all([
      Project.aggregate([
        { $match: query },
        ...buildTimelineSortStages(['projectDate'], { alias: sortAlias }),
        { $skip: skip },
        { $limit: limit },
        hideTimelineSortFieldStage(sortAlias),
      ]),
      Project.countDocuments(query),
    ]);

    return res.json({
      success: true,
      items,
      meta: {
        total,
        page,
        limit,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
      fallbackMessage:
        items.length === 0
          ? 'No Projects Found!'
          : null,
    });
  } catch (error) {
    return next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    return res.json({ success: true, item: project });
  } catch (error) {
    return next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const payload = req.validated.body;
    const { image: payloadImage, projectDate, date, ...restPayload } = payload;
    const imageUrl = await resolveProjectImageUrl(req.file, payloadImage);
    const timelineDate = resolveProjectTimelineDate({
      projectDate,
      legacyDate: date,
    });

    if (!imageUrl) {
      res.status(400);
      throw new Error('Project image is required');
    }

    const createdProject = await Project.create({
      ...restPayload,
      title: restPayload.title || restPayload.name,
      tags: normalizeTags(restPayload.tags),
      image: imageUrl,
      ...(date !== undefined ? { date } : {}),
      ...(timelineDate ? { projectDate: timelineDate } : {}),
    });

    return res.status(201).json({ success: true, item: createdProject });
  } catch (error) {
    if (error?.statusCode && res.statusCode === 200) {
      res.status(error.statusCode);
    }

    return next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const payload = req.validated.body;
    const { image: payloadImage, projectDate, date, ...restPayload } = payload;
    const nextTitle = payload.title || payload.name;
    const imageUrl = await resolveProjectImageUrl(req.file, payloadImage);
    const hasProjectDate = Object.prototype.hasOwnProperty.call(req.body || {}, 'projectDate');
    const hasLegacyDate = Object.prototype.hasOwnProperty.call(req.body || {}, 'date');

    let nextProjectDate;
    if (hasProjectDate) {
      nextProjectDate =
        projectDate === null
          ? resolveProjectTimelineDate({ legacyDate: date })
          : resolveProjectTimelineDate({ projectDate, legacyDate: date });
    } else if (hasLegacyDate) {
      nextProjectDate = resolveProjectTimelineDate({ legacyDate: date });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      {
        ...restPayload,
        ...(hasLegacyDate ? { date } : {}),
        ...(nextTitle ? { title: nextTitle } : {}),
        ...(restPayload.tags ? { tags: normalizeTags(restPayload.tags) } : {}),
        ...(imageUrl ? { image: imageUrl } : {}),
        ...(hasProjectDate || hasLegacyDate
          ? { projectDate: nextProjectDate || null }
          : {}),
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedProject) {
      res.status(404);
      throw new Error('Project not found');
    }

    return res.json({ success: true, item: updatedProject });
  } catch (error) {
    if (error?.statusCode && res.statusCode === 200) {
      res.status(error.statusCode);
    }

    return next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const deletedProject = await Project.findByIdAndDelete(req.params.id);

    if (!deletedProject) {
      res.status(404);
      throw new Error('Project not found');
    }

    return res.json({ success: true, message: 'Project removed successfully' });
  } catch (error) {
    return next(error);
  }
};

export const incrementProjectViews = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { returnDocument: 'after' }
    );

    if (!project) {
      res.status(404);
      throw new Error('Project not found');
    }

    return res.json({ success: true, item: project });
  } catch (error) {
    return next(error);
  }
};
