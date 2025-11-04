// ============================================
// lib/validations/auth.ts
// ============================================
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const profileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  avatar_url: z.string().url('Invalid URL').optional().or(z.literal('')),
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>

export const createUserSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  mobileNo: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid mobile number')
    .optional()
    .or(z.literal('')),
  dateOfBirth: z.string()
    .refine((val) => !isNaN(Date.parse(val)), { message: 'Invalid date of birth' })
    .optional()
    .or(z.literal('')),
  role: z.enum(['admin', 'user']),
})

export type CreateUserInput = z.infer<typeof createUserSchema>