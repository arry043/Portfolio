import { z } from 'zod';

export const analyticsEventSchema = z.object({
  body: z.object({
    page: z.string().trim().min(1, 'Page is required').max(100),
    type: z.enum(['view', 'click']),
    delta: z.number().int().min(1).max(20).default(1),
  }),
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
