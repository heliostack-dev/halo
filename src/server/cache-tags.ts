// Every cache tag in the app is built here, so invalidation and caching can never drift apart.
// Tags are stored in plain text: use stable public identifiers, never secrets or emails.
export const tags = {
  user: (handle: string) => `user:${handle.toLowerCase()}`,
  trends: () => 'trends',
  suggestions: () => 'suggestions',
} as const
