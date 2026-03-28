import { z } from 'zod';
import { validateRequest } from './validateRequest.js';

const clerkSyncBodySchema = z.object({
  token: z.string().min(1, 'Clerk token is required'),
  email: z.string().trim().email('Valid email is required').optional(),
  name: z.string().trim().min(2, 'Name must be at least 2 characters').optional(),
  profileImage: z.string().trim().max(2048, 'Profile image is too long').optional(),
  provider: z.enum(['google']).optional(),
});

export const registerSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2, 'Name must be at least 2 characters long'),
      email: z.string().trim().email('Invalid email address'),
      password: z.string().min(6, 'Password must be at least 6 characters long'),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const googleAuthSchema = z.object({
  body: clerkSyncBodySchema,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export const syncUserSchema = z.object({
  body: clerkSyncBodySchema,
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export { validateRequest };
