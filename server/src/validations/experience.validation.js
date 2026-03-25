import { z } from 'zod';
import { validateNoFutureDate } from '../services/date.service.js';

const optionalExperienceDateSchema = z.preprocess(
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
      'Date must be a valid date'
    )
    .refine(
      (value) => value === null || value === undefined || validateNoFutureDate(value),
      'Date cannot be in the future'
    )
);

const requiredStartDateSchema = z.any().transform((value, ctx) => {
  if (value === null || value === undefined || value === '') {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Start date is required',
    });
    return z.NEVER;
  }

  const parsed = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Start date must be a valid date',
    });
    return z.NEVER;
  }

  if (!validateNoFutureDate(parsed)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Start date cannot be in the future',
    });
    return z.NEVER;
  }

  return parsed;
});

const booleanInputSchema = z.preprocess((value) => {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return value;
}, z.boolean());

const withDateValidation = (schema) =>
  schema.superRefine((value, ctx) => {
    if (value.isCurrentlyWorking && value.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date must be empty when currently working is enabled',
      });
    }

    if (value.startDate && value.endDate && value.startDate > value.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'End date must be greater than or equal to start date',
      });
    }
  });

const experienceBodySchema = withDateValidation(
  z.object({
    company: z.string().trim().min(2, 'Company is required').max(140),
    role: z.string().trim().min(2, 'Role is required').max(140),
    duration: z.string().trim().max(80).optional(),
    description: z.string().trim().min(8, 'Description is too short').max(2000),
    startDate: requiredStartDateSchema,
    endDate: optionalExperienceDateSchema,
    isCurrentlyWorking: booleanInputSchema.optional().default(false),
  })
);

const updateExperienceBodySchema = withDateValidation(
  z.object({
    company: z.string().trim().min(2, 'Company is required').max(140).optional(),
    role: z.string().trim().min(2, 'Role is required').max(140).optional(),
    duration: z.string().trim().max(80).optional(),
    description: z.string().trim().min(8, 'Description is too short').max(2000).optional(),
    startDate: optionalExperienceDateSchema,
    endDate: optionalExperienceDateSchema,
    isCurrentlyWorking: booleanInputSchema.optional(),
  })
);

export const createExperienceSchema = z.object({
  body: experienceBodySchema,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateExperienceSchema = z.object({
  body: updateExperienceBodySchema,
  query: z.object({}).passthrough(),
  params: z.object({
    id: z.string().min(1, 'Experience id is required'),
  }),
});

export const deleteExperienceSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({
    id: z.string().min(1, 'Experience id is required'),
  }),
});

export const listExperienceQuerySchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});
