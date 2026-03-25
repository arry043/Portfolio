import { z } from 'zod';
import { validateNoFutureDate } from '../services/date.service.js';

const optionalCertificateDateSchema = z.preprocess(
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
      'Issue date must be a valid date'
    )
    .refine(
      (value) => value === null || value === undefined || validateNoFutureDate(value),
      'Issue date cannot be in the future'
    )
);

const baseCertificateBodySchema = z.object({
  title: z.string().trim().min(3, 'Title is required').max(140).optional(),
  organization: z.string().trim().min(2, 'Organization is required').max(100).optional(),
  issuer: z.string().trim().min(2, 'Issuer is required').max(100).optional(),
  issuedDate: optionalCertificateDateSchema,
  issueDate: optionalCertificateDateSchema,
  image: z
    .string()
    .url('Image must be a valid URL')
    .refine((value) => value.includes('cloudinary.com'), {
      message: 'Image must be a Cloudinary URL',
    })
    .optional(),
});

const createCertificateBodySchema = baseCertificateBodySchema
  .refine((value) => Boolean(value.title), {
    message: 'Title is required',
    path: ['title'],
  })
  .superRefine((value, ctx) => {
    if (!value.organization && !value.issuer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['organization'],
        message: 'Organization is required',
      });
    }
  });

export const createCertificateSchema = z.object({
  body: createCertificateBodySchema,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const updateCertificateSchema = z.object({
  body: baseCertificateBodySchema,
  query: z.object({}).passthrough(),
  params: z.object({
    id: z.string().min(1, 'Certificate id is required'),
  }),
});

export const deleteCertificateSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({
    id: z.string().min(1, 'Certificate id is required'),
  }),
});
