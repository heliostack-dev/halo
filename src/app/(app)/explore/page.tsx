import type { Metadata } from 'next'
import { Suspense } from 'react'
import * as z from 'zod'
import { EmptyState } from '#/ui/empty-state.tsx'
import { Skeleton } from '#/ui/skeleton.tsx'
import { FeedSection } from '#/features/posts/components/feed-section.tsx'
import { FeedSkeleton } from '#/features/posts/components/feed-skeleton.tsx'
import { ExploreHeader } from '#/features/explore/components/explore-header.tsx'
import { SearchTabs } from '#/features/explore/components/search-tabs.tsx'
import { TrendList } from '#/features/explore/components/trend-list.tsx'
import { PeopleResults, SuggestedPeople } from '#/features/explore/components/people-list.tsx'
import styles from '#/features/explore/components/explore.module.css'

export const metadata: Metadata = { title: 'Explore' }

const Params = z.object({
  q: z.string().trim().max(100).catch('').default(''),
  tab: z.enum(['top', 'people']).catch('top').default('top'),
})

export default function ExplorePage({ searchParams }: PageProps<'/explore'>) {
  return (
    <Suspense fallback={<><ExploreHeader q="" /><FeedSkeleton /></>}>
      {searchParams.then((raw) => {
        const { q, tab } = Params.parse({ q: first(raw.q), tab: first(raw.tab) })
        return q ? <Results q={q} tab={tab} /> : <Discover />
      })}
    </Suspense>
  )
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

/** No query: trending hashtags (cached, instant) and people to follow (personalised, streamed). */
function Discover() {
  return (
    <>
      <ExploreHeader q="" />
      <section className={styles.section} aria-labelledby="explore-trends">
        <h2 id="explore-trends" className={styles.sectionTitle}>Trending now</h2>
        <TrendList />
      </section>
      <section aria-labelledby="explore-people">
        <h2 id="explore-people" className={styles.sectionTitle}>Who to follow</h2>
        <Suspense fallback={<PeopleSkeleton />}>
          <SuggestedPeople />
        </Suspense>
      </section>
    </>
  )
}

function Results({ q, tab }: { q: string; tab: 'top' | 'people' }) {
  return (
    <>
      <ExploreHeader q={q} tab={tab === 'people' ? 'people' : undefined} tabs={<SearchTabs q={q} tab={tab} />} />
      {tab === 'people' ? (
        <Suspense key={`people:${q}`} fallback={<PeopleSkeleton />}>
          <PeopleResults q={q} />
        </Suspense>
      ) : (
        <Suspense key={`top:${q}`} fallback={<FeedSkeleton />}>
          <FeedSection
            feedKey={{ kind: 'search', q }}
            empty={<EmptyState title={`No results for “${q}”`}>Try different words, or search for #hashtags and @people.</EmptyState>}
          />
        </Suspense>
      )}
    </>
  )
}

function PeopleSkeleton() {
  return (
    <div className={styles.skeleton} aria-busy="true" aria-label="Loading people">
      <Skeleton height="2.5rem" />
      <Skeleton height="2.5rem" />
      <Skeleton height="2.5rem" />
    </div>
  )
}
