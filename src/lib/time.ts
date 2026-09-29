// Time formatting. Pure: pass `now` explicitly so server, client and tests agree.

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export function relativeTime(date: Date | string, now: number, locale = 'en'): string {
  const then = new Date(date).getTime()
  const diff = Math.max(0, now - then)
  if (diff < MINUTE) return `${Math.max(1, Math.floor(diff / 1000))}s`
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m`
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h`
  const d = new Date(then)
  const sameYear = d.getUTCFullYear() === new Date(now).getUTCFullYear()
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', ...(sameYear ? {} : { year: 'numeric' }), timeZone: 'UTC' })
}

export function fullDate(date: Date | string, locale = 'en'): string {
  return new Date(date).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })
}

export function compactNumber(n: number, locale = 'en'): string {
  return n < 1000 ? String(n) : new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(n)
}
