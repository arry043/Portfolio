import { z } from 'zod';

const analyticsMetadataSchema = z
  .object({
    route: z.string().trim().min(1).max(200).optional(),
    timestamp: z.string().trim().min(1).max(60).optional(),
    userId: z.string().trim().min(1).max(120).optional(),
  })
  .passthrough();

const analyticsEventBodySchema = z.object({
  page: z.string().trim().min(1, 'Page is required').max(100),
  type: z.enum(['view', 'visit', 'click', 'chatbot', 'project', 'game']),
  delta: z.number().int().min(1).max(20).default(1),
  metadata: analyticsMetadataSchema.optional(),
});

const analyticsDirectBodySchema = z.object({
  page: z.string().trim().min(1, 'Page is required').max(100).optional(),
  delta: z.number().int().min(1).max(20).default(1),
  metadata: analyticsMetadataSchema.optional(),
});

export const analyticsEventSchema = z.object({
  body: analyticsEventBodySchema,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const analyticsVisitSchema = z.object({
  body: analyticsDirectBodySchema,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const analyticsChatbotSchema = z.object({
  body: analyticsDirectBodySchema,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const analyticsProjectSchema = z.object({
  body: analyticsDirectBodySchema,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const analyticsPageSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({
    page: z.string().trim().min(1, 'Page is required'),
  }),
});
