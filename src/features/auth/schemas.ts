import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Required field'),
})

export const serverLoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const signupSchema = z.object({
  name: z.string().min(1, 'Required field'),
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^[A-Z]/, 'Password must start with an uppercase letter')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least 1 special character')
})

export const serverSignupSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Required field'),
  email: z.string().email('Invalid email address').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^[A-Z]/, 'Password must start with an uppercase letter')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least 1 special character')
    .optional(),
  image: z
    .union([
      z.instanceof(File),
      z.string().transform((value) => (value === '' ? '' : value)),
    ])
    .optional(),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^[A-Z]/, 'Password must start with an uppercase letter')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least 1 special character')
    .optional(),
})

export const serverUpdateProfileSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  password: z.string().optional(),
  image: z
    .union([
      z.instanceof(File),
      z.string().transform((value) => (value === '' ? '' : value)),
    ])
    .optional(),
  newPassword: z.string().optional(),
})
