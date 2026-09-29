import { test } from 'node:test'
import assert from 'node:assert/strict'
import { extractHashtags, extractMentions, segment } from './text.ts'

test('segments mentions, hashtags and urls', () => {
  assert.deepEqual(segment('hi @ada see #Halo https://x.io/a.'), [
    { type: 'text', value: 'hi ' },
    { type: 'mention', value: '@ada', handle: 'ada' },
    { type: 'text', value: ' see ' },
    { type: 'hashtag', value: '#Halo', tag: 'halo' },
    { type: 'text', value: ' ' },
    { type: 'url', value: 'https://x.io/a', href: 'https://x.io/a' },
    { type: 'text', value: '.' },
  ])
})

test('ignores @ inside emails and # inside words', () => {
  assert.deepEqual(segment('mail a@b.io c#d'), [{ type: 'text', value: 'mail a@b.io c#d' }])
})

test('supports unicode hashtags and dedupes', () => {
  assert.deepEqual(extractHashtags('#한글 #Next #next'), ['한글', 'next'])
  assert.deepEqual(extractMentions('@Ada @ada @bob'), ['ada', 'bob'])
})
