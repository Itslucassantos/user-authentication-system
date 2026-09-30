import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must be at most 128 characters long')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one digit');

export function assertStrongPassword(password: string): void {
  const result = passwordSchema.safeParse(password);
  if (!result.success) {
    throw new Error(result.error.issues[0]!.message);
  }
}
