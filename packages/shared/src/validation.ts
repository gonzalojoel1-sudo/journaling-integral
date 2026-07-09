import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export const createHabitSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  strategyDetails: z.string(),
});

export const updateLevelSchema = z.object({
  level: z.number().int().min(1).max(3),
});
