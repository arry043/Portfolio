import { z } from 'zod';
import { validateRequest } from './validateRequest.js';

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
  body: z.object({
    token: z.string().min(1, 'Clerk token is required'),
    email: z.string().trim().email('Valid email is required').optional(),
    name: z.string().trim().min(2).optional(),
  }),
  query: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
});

export { validateRequest };
