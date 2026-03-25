import { z } from 'zod';

export const userIdParamSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
  params: z.object({
    id: z.string().min(1, 'User id is required'),
  }),
});

export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(['user', 'admin']),
  }),
  query: z.object({}).passthrough(),
  params: z.object({
    id: z.string().min(1, 'User id is required'),
  }),
});
