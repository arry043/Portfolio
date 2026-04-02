import Project from '../models/Project.js';
import Experience from '../models/Experience.js';
import Certificate from '../models/Certificate.js';
import { resumeData } from '../data/resume.data.js';
import { ensureSeedData } from './seedData.service.js';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'you', 'your', 'are', 'was', 'were',
  'from', 'into', 'has', 'have', 'had', 'will', 'can', 'not', 'but', 'our', 'their',
  'about', 'them', 'they', 'its', 'also', 'more', 'than', 'when', 'where', 'what',
  'which', 'how', 'while', 'over', 'under', 'just', 'some', 'such', 'using', 'built', 'build'
]);

const normalizeText = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const tokenize = (value) =>
  normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

const formatDate = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toISOString().slice(0, 10);
};

const getSkillsContext = (keywords) => {
  const { skills } = resumeData;
  if (!skills) return '';

  const matchedCategories = [];
  const keywordSet = new Set(keywords);

  for (const [category, skillList] of Object.entries(skills)) {
    const hasMatch = skillList.some(skill => 
      tokenize(skill).some(t => keywordSet.has(t))
    ) || keywords.includes(category);

    if (hasMatch || keywords.length === 0) {
      matchedCategories.push(`${category}: ${skillList.join(', ')}`);
    }
  }

  // If no direct keywords matched, return all skills (to be safe and context-rich)
  if (matchedCategories.length === 0) {
    for (const [category, skillList] of Object.entries(skills)) {
      matchedCategories.push(`${category}: ${skillList.join(', ')}`);
    }
  }

  return matchedCategories.length > 0 ? `Skills:\n${matchedCategories.join('\n')}` : '';
};

export const getWebsiteContext = async (query) => {
  await ensureSeedData();

  const keywords = tokenize(query);
  const regexList = keywords.map((keyword) => new RegExp(keyword, 'i'));

  let projQuery = {};
  let expQuery = {};
  let certQuery = {};

  if (regexList.length > 0) {
    projQuery = {
      $or: [
        { title: { $in: regexList } },
        { description: { $in: regexList } },
        { tags: { $in: regexList } },
      ],
    };
    expQuery = {
      $or: [
        { company: { $in: regexList } },
        { role: { $in: regexList } },
        { description: { $in: regexList } },
      ],
    };
    certQuery = { $or: [{ title: { $in: regexList } }, { issuer: { $in: regexList } }] };
  }

  const fetchItems = async (Model, matchQuery, sortFields, limit) => {
    let items = await Model.find(matchQuery).sort(sortFields).limit(limit).lean();
    if (items.length === 0 && regexList.length > 0) {
      items = await Model.find({}).sort(sortFields).limit(limit).lean();
    }
    return items;
  };

  const [projects, experiences, certificates] = await Promise.all([
    fetchItems(Project, projQuery, { createdAt: -1 }, 6),
    fetchItems(Experience, expQuery, { startDate: -1 }, 6),
    fetchItems(Certificate, certQuery, { issueDate: -1, createdAt: -1 }, 4),
  ]);

  const skillsContext = getSkillsContext(keywords);

  let formattedContext = '';

  if (resumeData.profile?.name || resumeData.profile?.summary || resumeData.profile?.location) {
    const profileRows = [];
    if (resumeData.profile?.name) {
      profileRows.push(`- Name: ${normalizeText(resumeData.profile.name)}`);
    }
    if (resumeData.profile?.summary) {
      profileRows.push(`- Summary: ${normalizeText(resumeData.profile.summary)}`);
    }
    if (resumeData.profile?.location) {
      profileRows.push(`- Location: ${normalizeText(resumeData.profile.location)}`);
    }
    formattedContext += `Profile:\n${profileRows.join('\n')}\n\n`;
  }

  if (projects.length > 0) {
    formattedContext += `Projects:\n${projects
      .map((project) =>
        `- ${normalizeText(project.title)}: ${normalizeText(project.description)} (Tags: ${(
          project.tags || []
        ).join(', ')})`
      )
      .join('\n')}\n\n`;
  }

  if (experiences.length > 0) {
    formattedContext += `Experience:\n${experiences
      .map((experience) => {
        const startDate = formatDate(experience.startDate);
        const endDate = formatDate(experience.endDate);
        const dateRange = startDate || endDate ? `${startDate || '?'} to ${endDate || 'Present'}` : '';
        const duration = normalizeText(experience.duration);

        return `- ${normalizeText(experience.role)} at ${normalizeText(
          experience.company
        )}${dateRange ? ` (${dateRange})` : duration ? ` (${duration})` : ''}: ${normalizeText(
          experience.description
        )}`;
      })
      .join('\n')}\n\n`;
  }

  if (skillsContext) {
    formattedContext += `${skillsContext}\n\n`;
  }

  if (certificates.length > 0) {
    formattedContext += `Certificates:\n${certificates
      .map((certificate) => {
        const issuer = normalizeText(certificate.issuer || certificate.organization);
        const issueDate = formatDate(certificate.issueDate || certificate.issuedDate);
        return `- ${normalizeText(certificate.title)} from ${issuer}${issueDate ? ` (${issueDate})` : ''}`;
      })
      .join('\n')}\n\n`;
  }

  if (Array.isArray(resumeData.achievements) && resumeData.achievements.length > 0) {
    formattedContext += `Achievements:\n${resumeData.achievements
      .map((item) => `- ${normalizeText(item)}`)
      .join('\n')}\n\n`;
  }

  return formattedContext.trim();
};

export const mergeContext = (resumeContextRows, websiteContext) => {
  let finalContext = '';
  
  // Combine resume contexts
  const resumeContextStr = (resumeContextRows || []).join('\n\n');
  
  if (resumeContextStr) {
    finalContext += `--- RESUME HIGHLIGHTS ---\n${resumeContextStr}\n\n`;
  }
  
  if (websiteContext) {
    finalContext += `--- WEBSITE DATA ---\n${websiteContext}`;
  }

  return finalContext.trim();
};
