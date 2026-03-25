import { z } from 'zod';
import { validateNoFutureDate } from '../services/date.service.js';

const urlOrEmpty = z.union([z.string().url('Must be a valid URL'), z.literal('')]);
const cloudinaryUrlOrEmpty = z
  .string()
  .trim()
  .optional()
  .default('')
  .refine((value) => {
    if (!value) {
      return true;
    }

    try {
      const parsed = new URL(value);
      return parsed.protocol === 'https:' && parsed.hostname.endsWith('cloudinary.com');
    } catch {
      return false;
    }
  }, 'Image must be a valid Cloudinary URL');

const projectDateSchema = z
  .string()
  .trim()
  .regex(
    /^(ongoing|[A-Za-z]{3,9}-\d{4})$/i,
    'Date must be in Month-YYYY format or "ongoing"'
  );

const optionalProjectTimelineDateSchema = z.preprocess(
  (value) => {
    if (value === undefined) {
      return undefined;
    }

    if (value === null || value === '') {
      return null;
    }

    return value instanceof Date ? value : new Date(value);
  },
  z
    .union([z.date(), z.null(), z.undefined()])
    .refine(
      (value) => value === null || value === undefined || !Number.isNaN(value.getTime()),
      'Project date must be a valid date'
    )
    .refine(
      (value) => value === null || value === undefined || validateNoFutureDate(value),
      'Project date cannot be in the future'
    )
);

const tagsSchema = z.union([
  z.array(z.string().trim().min(1)).max(20),
  z
    .string()
    .trim()
    .transform((value) =>
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
    ),
]);

const baseProjectBodySchema = z.object({
  title: z.string().trim().min(3, 'Title is required').max(120).optional(),
  name: z.string().trim().min(3, 'Name is required').max(120).optional(),
  description: z.string().trim().min(12, 'Description is too short').max(2000),
  tags: tagsSchema.default([]),
  category: z.enum(['MERN', 'Django', 'AI']),
  image: cloudinaryUrlOrEmpty,
  github: urlOrEmpty.default(''),
  live: urlOrEmpty.default(''),
  date: projectDateSchema.optional().or(z.literal('')).default(''),
  projectDate: optionalProjectTimelineDateSchema,
  views: z.number().int().min(0).optional(),
});

const createProjectBodySchema = baseProjectBodySchema.superRefine((value, ctx) => {
  if (!value.title && !value.name) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['title'],
      message: 'Project name is required',
    });
  }
});

export const createProjectSchema = z.object({
  body: createProjectBodySchema,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateProjectSchema = z.object({
  body: baseProjectBodySchema.partial(),
  query: z.object({}).passthrough(),
  params: z.object({
    id: z.string().min(1, 'Project id is required'),
  }),
});

export const listProjectsQuerySchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({
    category: z.enum(['MERN', 'Django', 'AI']).optional(),
    q: z.string().trim().max(80).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
    page: z.coerce.number().int().min(1).optional(),
  }),
  params: z.object({}).passthrough(),
});
