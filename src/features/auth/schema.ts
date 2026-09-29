import * as z from 'zod'
import { Handle } from '#/lib/ids.ts'

export const SignupInput = z.object({
  displayName: z.string().trim().min(1, 'Tell us your name').max(50),
  handle: Handle,
  email: z.email('Enter a valid email').max(200),
  password: z.string().min(8, 'Use at least 8 characters').max(200),
})

export const LoginInput = z.object({
  identifier: z.string().trim().min(1, 'Enter your email or @handle').max(200),
  password: z.string().min(1, 'Enter your password').max(200),
  next: z.string().regex(/^\/(?!\/)/).optional().catch(undefined),
})
