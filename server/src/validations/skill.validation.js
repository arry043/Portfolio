import { z } from 'zod';

const skillNameSchema = z.string().trim().min(1, 'Skill name is required').max(100);

const percentageSchema = z.preprocess(
  (value) => (value === '' || value === undefined ? undefined : Number(value)),
  z
    .number({ required_error: 'Percentage is required', invalid_type_error: 'Percentage must be a number' })
    .int('Percentage must be a whole number')
    .min(0, 'Percentage must be at least 0')
    .max(100, 'Percentage must be at most 100')
);

const optionalPercentageSchema = z.preprocess(
  (value) => (value === '' || value === undefined ? undefined : Number(value)),
  z
    .number({ invalid_type_error: 'Percentage must be a number' })
    .int('Percentage must be a whole number')
    .min(0, 'Percentage must be at least 0')
    .max(100, 'Percentage must be at most 100')
    .optional()
);

const displayOrderSchema = z.preprocess(
  (value) => (value === '' || value === undefined ? undefined : Number(value)),
  z.number({ invalid_type_error: 'Display order must be a number' }).int().min(0).optional()
);

const booleanishSchema = z.preprocess(
  (value) => {
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return value;
  },
  z.boolean().optional()
);

const logoUrlSchema = z
  .string()
  .url('Logo must be a valid URL')
  .refine((value) => value.includes('cloudinary.com'), {
    message: 'Logo must be a Cloudinary URL',
  })
  .optional();

const baseSkillBodySchema = z.object({
  skill: skillNameSchema.optional(),
  percentage: optionalPercentageSchema,
  category: z.string().trim().max(80).optional(),
  displayOrder: displayOrderSchema,
  featured: booleanishSchema,
  isActive: booleanishSchema,
  logo: logoUrlSchema,
});

const createSkillBodySchema = baseSkillBodySchema
  .refine((value) => Boolean(value.skill), {
    message: 'Skill name is required',
    path: ['skill'],
  })
  .refine((value) => value.percentage !== undefined, {
    message: 'Percentage is required',
    path: ['percentage'],
  });

export const createSkillSchema = z.object({
  body: createSkillBodySchema,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateSkillSchema = z.object({
  body: baseSkillBodySchema,
  query: z.object({}).passthrough(),
  params: z.object({
    id: z.string().min(1, 'Skill id is required'),
  }),
});

export const deleteSkillSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({
    id: z.string().min(1, 'Skill id is required'),
  }),
});

export const getSkillSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({
    id: z.string().min(1, 'Skill id is required'),
  }),
});
