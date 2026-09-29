import Link from 'next/link'
import tabStyles from '#/ui/tab-nav.module.css'

/** Top / People tabs. Server-rendered links that keep the query in the URL. */
export function SearchTabs({ q, tab }: { q: string; tab: 'top' | 'people' }) {
  const query = encodeURIComponent(q)
  return (
    <nav aria-label="Search results" className={tabStyles.nav}>
      <Link href={`/explore?q=${query}`} aria-current={tab === 'top' ? 'page' : undefined} className={tabStyles.tab} scroll={false}>
        <span className={tabStyles.label}>Top</span>
      </Link>
      <Link href={`/explore?q=${query}&tab=people`} aria-current={tab === 'people' ? 'page' : undefined} className={tabStyles.tab} scroll={false}>
        <span className={tabStyles.label}>People</span>
      </Link>
    </nav>
  )
}
