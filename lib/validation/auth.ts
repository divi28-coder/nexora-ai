import { z } from 'zod';
export const registerInput = z.object({ name: z.string().trim().min(1).max(80), email: z.string().trim().toLowerCase().email().max(200), password: z.string().min(10, 'Use at least 10 characters.').max(200) });
export const loginInput = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1).max(200) });
