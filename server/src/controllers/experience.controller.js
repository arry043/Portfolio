import Experience from '../models/Experience.js';
import { formatExperiencePeriod } from '../services/date.service.js';
import {
  buildTimelineSortStages,
  hideTimelineSortFieldStage,
} from '../services/timelineSort.service.js';

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
    const sortAlias = '__timelineSortDate';
    const items = await Experience.aggregate([
      ...buildTimelineSortStages(['startDate'], { alias: sortAlias }),
      hideTimelineSortFieldStage(sortAlias),
    ]);

    return res.json({
      success: true,
      items,
      fallbackMessage: items.length === 0 ? 'No Experience Found!' : null,
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

    const computedDuration = formatExperiencePeriod({
      startDate: normalizedPayload.startDate,
      endDate: normalizedPayload.endDate,
      isCurrentlyWorking: normalizedPayload.isCurrentlyWorking,
      duration: normalizedPayload.duration,
    });

    const item = await Experience.create({
      ...normalizedPayload,
      duration: computedDuration,
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

    const nextDuration = shouldRegenerateDuration
      ? formatExperiencePeriod({
          startDate: mergedStartDate,
          endDate: mergedEndDate,
          isCurrentlyWorking: mergedIsCurrentlyWorking,
          duration: existingItem.duration,
        })
      : payload.duration?.trim();

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
