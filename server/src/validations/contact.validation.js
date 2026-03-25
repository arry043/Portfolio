import { z } from 'zod';

export const createMessageSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name is required').max(80),
    email: z.string().trim().email('Invalid email').max(120),
    message: z.string().trim().min(10, 'Message is too short').max(2000),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});
