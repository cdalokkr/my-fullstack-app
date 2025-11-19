import * as z from "zod"

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required.")
    .email("Please enter a valid email."),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters.")
})

export type LoginInput = z.infer<typeof loginSchema>

// Authentication error types for granular error handling
export type AuthErrorType = 'both' | 'email' | 'password' | 'network' | 'unknown'

export interface AuthValidationResult {
  isValid: boolean
  errorType?: AuthErrorType
  fieldErrors?: {
    email?: string
    password?: string
  }
  generalError?: string
}

export const profileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  avatar_url: z.string().url('Invalid URL').optional().or(z.literal('')),
})

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>

// Password strength validation
const validatePasswordStrength = (password: string) => {
  const criteria = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  }
  
  const strength = Object.values(criteria).filter(Boolean).length
  let level: 'weak' | 'fair' | 'good' | 'strong' = 'weak'
  
  if (strength >= 4 && criteria.length && criteria.uppercase && criteria.lowercase) {
    level = 'strong'
  } else if (strength >= 3 && criteria.length) {
    level = 'good'
  } else if (strength >= 2 && criteria.length) {
    level = 'fair'
  }
  
  return {
    isValid: criteria.length && strength >= 3,
    criteria,
    strength,
    level,
  }
}

export const createUserSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .refine((password) => {
      const { isValid } = validatePasswordStrength(password)
      return isValid
    }, {
      message: 'Password must be at least 8 characters and meet at least 3 of the following criteria: uppercase letter, lowercase letter, number, special character',
    }),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  middleName: z.string().max(50, 'Middle name too long').optional().or(z.literal('')),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  mobileNo: z.string()
    .regex(/^(\+?\d{1,3})?[-.\s]?(\(?\d{1,4}\)?)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{0,4}$/, 'Invalid mobile number format')
    .optional()
    .or(z.literal('')),
  dateOfBirth: z.string()
    .refine((val) => {
      if (!val) return true // optional field
      const date = new Date(val)
      const now = new Date()
      const age = now.getFullYear() - date.getFullYear()
      return date <= now && age >= 13 && age <= 120
    }, { message: 'Please enter a valid date of birth (13-120 years old)' })
    .optional()
    .or(z.literal('')),
  role: z.enum(['admin', 'user']),
  sex: z.enum(['Male', 'Female']),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

// Schema for editing existing users (without password requirement)
export const editUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  middleName: z.string().max(50, 'Middle name too long').optional().or(z.literal('')),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: z.string()
    .min(1, 'Email is required')
    .email('Invalid email address'),
  mobileNo: z.string()
    .regex(/^(\+?\d{1,3})?[-.\s]?(\(?\d{1,4}\)?)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{0,4}$/, 'Invalid mobile number format')
    .optional()
    .or(z.literal('')),
  dateOfBirth: z.string()
    .refine((val) => {
      if (!val) return true // optional field
      const date = new Date(val)
      const now = new Date()
      const age = now.getFullYear() - date.getFullYear()
      return date <= now && age >= 13 && age <= 120
    }, { message: 'Please enter a valid date of birth (13-120 years old)' })
    .optional()
    .or(z.literal('')),
  role: z.enum(['admin', 'user']),
  sex: z.enum(['Male', 'Female']),
})

export type EditUserInput = z.infer<typeof editUserSchema>

export type PasswordStrength = {
  isValid: boolean
  criteria: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    numbers: boolean
    special: boolean
  }
  strength: number
  level: 'weak' | 'fair' | 'good' | 'strong'
}

export const validatePasswordStrengthFn = (password: string): PasswordStrength => {
  return validatePasswordStrength(password)
}