import { Icon } from '#/ui/icon.tsx'
import styles from './explore.module.css'

/** Plain GET form: the URL is the search state, so results are shareable and back-button friendly. */
export function SearchForm({ q, tab }: { q: string; tab?: 'people' }) {
  return (
    <form action="/explore" role="search" className={styles.search}>
      <Icon name="search" size={18} />
      <label htmlFor="explore-search" className="visually-hidden">Search Halo</label>
      <input
        id="explore-search"
        name="q"
        type="search"
        placeholder="Search posts and people"
        autoComplete="off"
        defaultValue={q}
        autoFocus={q === ''}
        maxLength={100}
      />
      {tab ? <input type="hidden" name="tab" value={tab} /> : null}
    </form>
  )
}
