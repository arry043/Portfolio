import { z } from 'zod';

export const MODE_VALUES = ['fullstack', 'backend', 'ai'];
export const modeSchema = z.enum(MODE_VALUES);
export const DEFAULT_MODE = MODE_VALUES[0];

export const HERO_CONTENT = Object.freeze({
  name: 'Mohd Arif Ansari',
  tagline: 'Advanced Developer Portfolio',
  summary:
    'Designing resilient products with clean architecture, measurable performance, and production-ready delivery.',
});

export const MODE_OPTIONS = Object.freeze([
  { value: 'fullstack', label: 'Full Stack' },
  { value: 'backend', label: 'Backend' },
  { value: 'ai', label: 'AI' },
]);

export const MODE_ROLES = Object.freeze({
  fullstack: [
    'Full Stack Developer',
    'MERN Engineer',
    'Scalable System Builder',
  ],
  backend: ['Backend Engineer', 'API Developer', 'Database Optimizer'],
  ai: ['AI Developer', 'LLM Integrator', 'RAG System Builder'],
});

export const MODE_HIGHLIGHTS = Object.freeze({
  fullstack: [
    'Realtime interfaces paired with fault-tolerant APIs.',
    'Typed contracts from UI events to persistence.',
    'Deployments optimized for maintainability at scale.',
  ],
  backend: [
    'Low-latency API design with strict validation layers.',
    'Schema-aware data modeling and query optimization.',
    'Observability-first services with safe rollout patterns.',
  ],
  ai: [
    'Production LLM integrations with monitoring guardrails.',
    'Context-aware retrieval pipelines for grounded output.',
    'Evaluation loops focused on reliability and quality.',
  ],
});

export const HERO_SOCIAL_LINKS = Object.freeze([
  {
    name: 'LinkedIn',
    icon: 'Linkedin',
    url: 'https://www.linkedin.com/in/arryquerry/', // Replace with actual or placeholder
    priority: 1,
  },
  {
    name: 'GitHub',
    icon: 'Github',
    url: 'https://github.com/arry043', // Replace with actual or placeholder
    priority: 2,
  },
  {
    name: 'LeetCode',
    icon: 'Code',
    url: 'https://leetcode.com/u/arry03/', // Replace with actual or placeholder
    priority: 3,
  },
  {
    name: 'GeeksForGeeks',
    icon: 'GFG',
    url: 'https://www.geeksforgeeks.org/profile/arifqurn60?tab=activity', // Replace with actual or placeholder
    priority: 4,
  },
]);

export const HERO_CTA_CONFIG = Object.freeze({
  primary: {
    label: 'Hire Me',
    action: 'scroll_to_contact',
  },
  secondary: {
    label: 'Download Resume',
    action: 'download_resume',
    url: '/resume.pdf', // Placeholder
  },
});

export const getValidatedMode = (candidateMode) => {
  const parsedMode = modeSchema.safeParse(candidateMode);
  return parsedMode.success ? parsedMode.data : DEFAULT_MODE;
};

export const getModeRoles = (candidateMode) => {
  const validatedMode = getValidatedMode(candidateMode);
  const roles = MODE_ROLES[validatedMode];
  return Array.isArray(roles) && roles.length > 0
    ? roles
    : MODE_ROLES[DEFAULT_MODE];
};

export const getModeHighlights = (candidateMode) => {
  const validatedMode = getValidatedMode(candidateMode);
  const highlights = MODE_HIGHLIGHTS[validatedMode];
  return Array.isArray(highlights) && highlights.length > 0
    ? highlights
    : MODE_HIGHLIGHTS[DEFAULT_MODE];
};
