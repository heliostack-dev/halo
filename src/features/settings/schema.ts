import * as z from 'zod'

export const ProfileInput = z.object({
  displayName: z.string().trim().min(1, 'Tell people your name').max(50, 'Keep it under 50 characters'),
  bio: z.string().trim().max(160, 'Keep your bio under 160 characters'),
  location: z.string().trim().max(30, 'Keep it under 30 characters'),
  website: z.union([z.literal(''), z.url('Enter a full URL, like https://example.com').max(100, 'Keep it under 100 characters')]),
})
export type ProfileInput = z.infer<typeof ProfileInput>
