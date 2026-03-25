import Project from '../models/Project.js';
import Experience from '../models/Experience.js';
import Certificate from '../models/Certificate.js';
import { resumeData } from '../data/resume.data.js';

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'you', 'your', 'are', 'was', 'were',
  'from', 'into', 'has', 'have', 'had', 'will', 'can', 'not', 'but', 'our', 'their',
  'about', 'them', 'they', 'its', 'also', 'more', 'than', 'when', 'where', 'what',
  'which', 'how', 'while', 'over', 'under', 'just', 'some', 'such', 'using', 'built', 'build'
]);

const tokenize = (value) =>
  String(value)
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

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
  const keywords = tokenize(query);
  const regexList = keywords.map(k => new RegExp(k, 'i'));

  let projQuery = {};
  let expQuery = {};
  let certQuery = {};

  if (regexList.length > 0) {
    projQuery = { $or: [{ title: { $in: regexList } }, { description: { $in: regexList } }, { tags: { $in: regexList } }] };
    expQuery = { $or: [{ company: { $in: regexList } }, { role: { $in: regexList } }, { description: { $in: regexList } }] };
    certQuery = { $or: [{ title: { $in: regexList } }, { issuer: { $in: regexList } }] };
  }

  const fetchItems = async (Model, matchQuery, sortFields, limit) => {
     let items = await Model.find(matchQuery).sort(sortFields).limit(limit).lean();
     if (items.length === 0 && regexList.length > 0) {
         // Fallback to recent if query didn't match anything specific (e.g. general query)
         items = await Model.find({}).sort(sortFields).limit(limit).lean();
     }
     return items;
  };

  const [projects, experiences, certificates] = await Promise.all([
    fetchItems(Project, projQuery, { createdAt: -1 }, 3),
    fetchItems(Experience, expQuery, { startDate: -1 }, 3),
    fetchItems(Certificate, certQuery, { issueDate: -1, createdAt: -1 }, 2),
  ]);

  const skillsContext = getSkillsContext(keywords);

  let formattedContext = '';

  if (projects.length > 0) {
    formattedContext += `Projects:\n${projects.map(p => `- ${p.title}: ${p.description} (Tags: ${p.tags.join(', ')})`).join('\n')}\n\n`;
  }

  if (experiences.length > 0) {
    formattedContext += `Experience:\n${experiences.map(e => `- ${e.role} at ${e.company} (${e.duration}): ${e.description}`).join('\n')}\n\n`;
  }

  if (skillsContext) {
    formattedContext += `${skillsContext}\n\n`;
  }

  if (certificates.length > 0) {
    formattedContext += `Certificates:\n${certificates.map(c => `- ${c.title} from ${c.issuer || c.organization}`).join('\n')}\n\n`;
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
