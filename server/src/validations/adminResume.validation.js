import { z } from 'zod';
import { objectIdSchema } from './validateRequest.js';

const resumeCategorySchema = z.enum([
  'fullstack',
  'backend',
  'frontend',
  'python',
  'ai',
]);

const resumeBodySchema = z.object({
  title: z.string().trim().min(2, 'Title is required').max(140),
  category: resumeCategorySchema,
  fileUrl: z
    .string()
    .trim()
    .url('File URL must be valid')
    .refine((value) => value.includes('cloudinary.com'), {
      message: 'File URL must be a Cloudinary URL',
    })
    .optional(),
});

export const createAdminResumeSchema = z.object({
  body: resumeBodySchema,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateAdminResumeSchema = z.object({
  body: resumeBodySchema.partial(),
  query: z.object({}).passthrough(),
  params: z.object({
    id: z.string().min(1, 'Resume id is required'),
  }),
});

export const deleteAdminResumeSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({
    id: z.string().min(1, 'Resume id is required'),
  }),
});

export const setDefaultAdminResumeSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({
    id: objectIdSchema,
  }),
});
