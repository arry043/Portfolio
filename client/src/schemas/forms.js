import { z } from 'zod';

export const chatbotQuerySchema = z.object({
  query: z
    .string()
    .trim()
    .min(3, 'Please enter at least 3 characters')
    .max(500, 'Query is too long'),
});

export const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  email: z.string().trim().email('Enter a valid email').max(120),
  message: z.string().trim().min(10, 'Message is too short').max(2000),
});

export const projectCategorySchema = z.enum(['All', 'MERN', 'Django', 'AI']);
