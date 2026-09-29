import * as z from 'zod'

/** Database ids are bigint in Postgres and decimal strings in TypeScript. */
export const Id = z.string().regex(/^[1-9]\d{0,18}$/, 'Invalid id')
export type Id = z.infer<typeof Id>

export const Handle = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_]{3,15}$/, 'Use 3–15 letters, numbers or underscores')

/** Opaque pagination cursor: the last seen id. */
export const Cursor = Id.optional()
