import { z } from 'zod';

export const resumeChatSchema = z.object({
  body: z.object({
    query: z
      .string()
      .trim()
      .min(3, 'Query must be at least 3 characters long')
      .max(500, 'Query is too long'),
    history: z
      .array(
        z.object({
          role: z.enum(['user', 'assistant']),
          content: z.string().max(2000),
        })
      )
      .max(20)
      .optional()
      .default([]),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});
