import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compactNumber, relativeTime } from './time.ts'

const now = Date.parse('2026-09-29T12:00:00Z')

test('relative time buckets', () => {
  assert.equal(relativeTime('2026-09-29T11:59:30Z', now), '30s')
  assert.equal(relativeTime('2026-09-29T11:15:00Z', now), '45m')
  assert.equal(relativeTime('2026-09-29T02:00:00Z', now), '10h')
  assert.equal(relativeTime('2026-09-01T00:00:00Z', now), 'Sep 1')
  assert.equal(relativeTime('2025-09-01T00:00:00Z', now), 'Sep 1, 2025')
})

test('compact numbers', () => {
  assert.equal(compactNumber(999), '999')
  assert.equal(compactNumber(1540), '1.5K')
})
