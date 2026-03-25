import Project from '../models/Project.js';
import Certificate from '../models/Certificate.js';
import Experience from '../models/Experience.js';
import { resumeData } from '../data/resume.data.js';

let seedLoaded = false;

const parseYearFromPeriod = (value, matchIndex = 0) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const yearMatches = value.match(/(19|20)\d{2}/g);
  if (!yearMatches || !yearMatches[matchIndex]) {
    return null;
  }

  return Number.parseInt(yearMatches[matchIndex], 10);
};

export const ensureSeedData = async () => {
  if (seedLoaded) {
    return;
  }

  const [projectCount, certificateCount, experienceCount] = await Promise.all([
    Project.countDocuments(),
    Certificate.countDocuments(),
    Experience.countDocuments(),
  ]);

  if (projectCount === 0 && Array.isArray(resumeData.projects)) {
    await Project.insertMany(resumeData.projects);
  }

  if (certificateCount === 0 && Array.isArray(resumeData.certifications)) {
    await Certificate.insertMany(resumeData.certifications);
  }

  if (experienceCount === 0 && Array.isArray(resumeData.experience)) {
    await Experience.insertMany(
      resumeData.experience.map((item) => {
        const startYear = parseYearFromPeriod(item.period, 0) || new Date().getUTCFullYear();
        const endYear = parseYearFromPeriod(item.period, 1);
        const isCurrentlyWorking = /present/i.test(item.period || '');

        return {
          startDate: new Date(Date.UTC(startYear, 0, 1)),
          endDate: isCurrentlyWorking || !endYear ? null : new Date(Date.UTC(endYear, 11, 1)),
          isCurrentlyWorking,
          company: item.company || 'Unknown Company',
          role: item.role || 'Unknown Role',
          duration: item.period || 'Unknown Duration',
          description: Array.isArray(item.highlights)
            ? item.highlights.join(' ')
            : item.highlights || item.description || '',
        };
      })
    );
  }

  seedLoaded = true;
};
