import * as z from 'zod'

// Every environment variable the server reads is declared and validated here, once.
const Env = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.url(),
  // Direct (non-pooled) connection for LISTEN/NOTIFY. Neon's Vercel integration sets it.
  DATABASE_URL_UNPOOLED: z.url().optional(),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
})

export type Env = z.infer<typeof Env>

let cached: Env | undefined

export function env(): Env {
  cached ??= Env.parse(process.env)
  return cached
}
