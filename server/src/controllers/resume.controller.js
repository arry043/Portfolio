import { resumeData } from '../data/resume.data.js';
import Experience from '../models/Experience.js';
import { ensureSeedData } from '../services/seedData.service.js';
import { formatExperiencePeriod } from '../services/date.service.js';
import {
  buildTimelineSortStages,
  hideTimelineSortFieldStage,
} from '../services/timelineSort.service.js';

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
