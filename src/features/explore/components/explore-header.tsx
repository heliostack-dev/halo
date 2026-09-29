import type { ReactNode } from 'react'
import shell from '#/features/shell/shell.module.css'
import { SearchForm } from './search-form.tsx'
import styles from './explore.module.css'

/** Explore's sticky chrome: the search field takes the title bar; tabs sit underneath. */
export function ExploreHeader({ q, tab, tabs }: { q: string; tab?: 'people'; tabs?: ReactNode }) {
  return (
    <div className={shell.pageHeader}>
      <h1 className="visually-hidden">Explore</h1>
      <div className={styles.bar}>
        <SearchForm q={q} tab={tab} />
      </div>
      {tabs}
    </div>
  )
}
