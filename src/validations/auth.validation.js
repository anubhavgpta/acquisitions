import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(2).max(255).trim(),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(6).max(128),
  role: z.enum(['user', 'admin']).default('user'),
});

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});