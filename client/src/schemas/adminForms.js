import { z } from 'zod';

const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;
const allowedImageMimeTypes = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);
const toTimestamp = (value) => new Date(value).getTime();

const optionalDateInputSchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || !Number.isNaN(toTimestamp(value)), 'Date must be a valid date');

const maybeFile = z
  .custom((value) => value === undefined || value === null || value instanceof File, {
    message: 'Invalid file input',
  })
  .optional();

export const adminResumeSchema = z.object({
  title: z.string().trim().min(2, 'Title is required').max(140),
  category: z.enum(['fullstack', 'backend', 'frontend', 'python', 'ai']),
  file: maybeFile
    .refine((value) => !value || value.type === 'application/pdf', 'Only PDF files are allowed')
    .refine(
      (value) => !value || value.size <= MAX_UPLOAD_SIZE_BYTES,
      'PDF size must be 5MB or less'
    ),
});

export const adminCertificateSchema = z.object({
  title: z.string().trim().min(3, 'Title is required').max(140),
  organization: z.string().trim().min(2, 'Organization is required').max(100),
  issueDate: optionalDateInputSchema,
  imageFile: maybeFile
    .refine((value) => !value || allowedImageMimeTypes.has(value.type), 'Only JPG, PNG, or WEBP images are allowed')
    .refine(
      (value) => !value || value.size <= MAX_UPLOAD_SIZE_BYTES,
      'Image size must be 5MB or less'
    ),
});

export const adminProjectSchema = z.object({
  name: z.string().trim().min(3, 'Project name is required').max(120),
  description: z.string().trim().min(12, 'Description is too short').max(2000),
  category: z.enum(['MERN', 'Django', 'AI']),
  tags: z.string().trim().optional(),
  github: z.union([z.string().url('GitHub URL is invalid'), z.literal('')]).default(''),
  live: z.union([z.string().url('Live URL is invalid'), z.literal('')]).default(''),
  imageFile: maybeFile
    .refine((value) => !value || allowedImageMimeTypes.has(value.type), 'Only JPG, PNG, or WEBP images are allowed')
    .refine(
      (value) => !value || value.size <= MAX_UPLOAD_SIZE_BYTES,
      'Image size must be 5MB or less'
    ),
  projectDate: optionalDateInputSchema,
  date: z.string().trim().optional(),
});

export const adminExperienceSchema = z
  .object({
    company: z.string().trim().min(2, 'Company is required').max(140),
    role: z.string().trim().min(2, 'Role is required').max(140),
    duration: z.string().trim().max(80).optional(),
    description: z.string().trim().min(8, 'Description is too short').max(2000),
    startDate: z
      .string()
      .trim()
      .min(1, 'Start date is required')
      .refine((value) => !Number.isNaN(toTimestamp(value)), 'Start date must be a valid date'),
    endDate: optionalDateInputSchema,
    isCurrentlyWorking: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.isCurrentlyWorking && value.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date must be empty when currently working is enabled',
      });
    }

    if (value.endDate && toTimestamp(value.startDate) > toTimestamp(value.endDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date must be greater than or equal to start date',
      });
    }
  });

export const adminUserRoleSchema = z.object({
  role: z.enum(['user', 'admin']),
});
