import Experience from '../models/Experience.js';
import {
  buildExperienceTimelineMeta,
  mapTimelineExperiences,
} from '../services/experienceTimeline.service.js';

const hasOwn = (target, key) => Object.prototype.hasOwnProperty.call(target || {}, key);

const createBadRequestError = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

const validateExperienceDates = ({ startDate, endDate, isCurrentlyWorking }) => {
  if (isCurrentlyWorking && endDate) {
    throw createBadRequestError('End date must be empty when currently working is enabled');
  }

  if (startDate && endDate && startDate > endDate) {
    throw createBadRequestError('End date must be greater than or equal to start date');
  }
};

export const listExperiences = async (req, res, next) => {
  try {
    const items = await Experience.find().lean();
    const timelineItems = mapTimelineExperiences(items);

    return res.json({
      success: true,
      items: timelineItems,
      fallbackMessage: timelineItems.length === 0 ? 'No Experience Found!' : null,
    });
  } catch (error) {
    return next(error);
  }
};

export const createExperience = async (req, res, next) => {
  try {
    const payload = req.validated.body;
    const normalizedPayload = {
      ...payload,
      endDate: payload.isCurrentlyWorking ? null : payload.endDate ?? null,
    };

    validateExperienceDates(normalizedPayload);

    const timelineMeta = buildExperienceTimelineMeta({
      startDate: normalizedPayload.startDate,
      endDate: normalizedPayload.endDate,
      isCurrentlyWorking: normalizedPayload.isCurrentlyWorking,
    });

    if (!timelineMeta) {
      throw createBadRequestError('Experience dates are invalid for timeline');
    }

    const item = await Experience.create({
      ...normalizedPayload,
      duration: timelineMeta.duration,
    });

    return res.status(201).json({ success: true, item });
  } catch (error) {
    if (error?.statusCode && res.statusCode === 200) {
      res.status(error.statusCode);
    }

    return next(error);
  }
};

export const updateExperience = async (req, res, next) => {
  try {
    const payload = req.validated.body;
    const existingItem = await Experience.findById(req.params.id);

    if (!existingItem) {
      res.status(404);
      throw new Error('Experience not found');
    }

    const hasStartDate = hasOwn(req.body, 'startDate');
    const hasEndDate = hasOwn(req.body, 'endDate');
    const hasCurrentlyWorking = hasOwn(req.body, 'isCurrentlyWorking');
    const hasDuration = hasOwn(req.body, 'duration');

    const mergedStartDate = hasStartDate ? payload.startDate : existingItem.startDate;
    const mergedIsCurrentlyWorking = hasCurrentlyWorking
      ? payload.isCurrentlyWorking
      : existingItem.isCurrentlyWorking;
    const mergedEndDate = mergedIsCurrentlyWorking
      ? null
      : hasEndDate
      ? payload.endDate
      : existingItem.endDate;

    validateExperienceDates({
      startDate: mergedStartDate,
      endDate: mergedEndDate,
      isCurrentlyWorking: mergedIsCurrentlyWorking,
    });

    const shouldRegenerateDuration =
      !hasDuration || (typeof payload.duration === 'string' && !payload.duration.trim());

    const timelineMeta = buildExperienceTimelineMeta({
      startDate: mergedStartDate,
      endDate: mergedEndDate,
      isCurrentlyWorking: mergedIsCurrentlyWorking,
    });

    if (!timelineMeta) {
      throw createBadRequestError('Experience dates are invalid for timeline');
    }

    const nextDuration = shouldRegenerateDuration ? timelineMeta.duration : payload.duration?.trim();

    const updatePayload = {
      ...payload,
      ...(hasCurrentlyWorking && payload.isCurrentlyWorking ? { endDate: null } : {}),
      ...(shouldRegenerateDuration ? { duration: nextDuration } : {}),
      ...(!shouldRegenerateDuration && hasDuration ? { duration: nextDuration || '' } : {}),
    };

    const item = await Experience.findByIdAndUpdate(req.params.id, updatePayload, {
      returnDocument: 'after',
      runValidators: true,
    });

    return res.json({ success: true, item });
  } catch (error) {
    if (error?.statusCode && res.statusCode === 200) {
      res.status(error.statusCode);
    }

    return next(error);
  }
};

export const deleteExperience = async (req, res, next) => {
  try {
    const item = await Experience.findByIdAndDelete(req.params.id);

    if (!item) {
      res.status(404);
      throw new Error('Experience not found');
    }

    return res.json({ success: true, message: 'Experience removed successfully' });
  } catch (error) {
    return next(error);
  }
};
