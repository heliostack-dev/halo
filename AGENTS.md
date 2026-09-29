<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Halo — agent notes

Halo is the reference app for the [Heliostack skills](https://github.com/heliostack/skills). Before any task, load the `heliostack` skill (or read its SKILL.md) and follow the skill it routes you to. The short version:

- **Stack**: Next.js 16.3 (Cache Components, Partial Prefetching, typed routes) · React 19.3 · Postgres via `postgres` (postgres.js, raw tagged SQL) · `zod` · TypeScript 7. Runtime deps are exactly: next, react, react-dom, postgres, zod. Ask before adding any other.
- **Layout**: routes in `src/app` stay thin; features in `src/features/<f>/{types.ts,server/repo.ts,server/queries.ts,actions.ts,components/}`; infrastructure in `src/server`; pure utils in `src/lib`; design system in `src/ui` (read `src/ui/CATALOG.md` first).
- **Imports**: relative imports use `.ts`/`.tsx` extensions; `#/…` maps to `src/…` (package.json `imports`).
- **Data**: repos are pure `(db, …)` functions tested against real Postgres (PGlite) — `pnpm test`. Authorise in SQL; `requireViewer()` first in every Server Action.
- **Rendering**: layouts never await request data; every cookie/uncached read sits inside `<Suspense>` as deep as possible; shared data uses `'use cache'` + `cacheLife` + `cacheTag(tags.…)` from `src/server/cache-tags.ts`.
- **UI**: tokens only (`node design/check-tokens.mjs`), every CSS file starts with `@layer reset, tokens, base, components, utilities;`, verify screens with screenshots (desktop/mobile, dark/light) against the quality bar in the `ds-component` skill.
- **Done means**: `pnpm verify` (typecheck → ds:check → test → build) passes and changed screens were looked at.

## Local setup

```bash
pnpm install
cp .env.example .env.local     # set SESSION_SECRET
pnpm dev:db                    # Postgres (PGlite) on :5432, no Docker
pnpm db:migrate && pnpm db:seed
pnpm dev                       # sign in as @demo / halo-demo
```
