// Post text → segments. Pure and shared by server and client rendering.

export type Segment =
  | { type: 'text'; value: string }
  | { type: 'mention'; value: string; handle: string }
  | { type: 'hashtag'; value: string; tag: string }
  | { type: 'url'; value: string; href: string }

const TOKEN = /(@[A-Za-z0-9_]{3,15})|(#[\p{L}\p{N}_]{1,50})|(https?:\/\/[^\s<]+[^\s<.,:;"')\]!?])/gu

export function segment(text: string): Segment[] {
  const out: Segment[] = []
  let last = 0
  for (const match of text.matchAll(TOKEN)) {
    const index = match.index
    // Only treat @/# as tokens at a word boundary (so emails and URLs with fragments stay text).
    const prev = text[index - 1]
    if ((match[1] || match[2]) && prev && /[\p{L}\p{N}_]/u.test(prev)) continue
    if (index > last) out.push({ type: 'text', value: text.slice(last, index) })
    const [value] = match
    if (match[1]) out.push({ type: 'mention', value, handle: value.slice(1) })
    else if (match[2]) out.push({ type: 'hashtag', value, tag: value.slice(1).toLowerCase() })
    else out.push({ type: 'url', value, href: value })
    last = index + value.length
  }
  if (last < text.length) out.push({ type: 'text', value: text.slice(last) })
  return out
}

export function extractMentions(text: string): string[] {
  return [...new Set(segment(text).flatMap((s) => (s.type === 'mention' ? [s.handle.toLowerCase()] : [])))]
}

export function extractHashtags(text: string): string[] {
  return [...new Set(segment(text).flatMap((s) => (s.type === 'hashtag' ? [s.tag] : [])))]
}
