import Link from 'next/link'
import { Suspense } from 'react'
import { Avatar } from '#/ui/avatar.tsx'
import { Icon } from '#/ui/icon.tsx'
import { buttonStyles } from '#/ui/button.tsx'
import { iconButtonStyles } from '#/ui/icon-button.tsx'
import { PostText } from '#/features/posts/components/post-text.tsx'
import { compactNumber } from '#/lib/time.ts'
import type { Profile } from '../server/repo.ts'
import { getRelationship } from '../server/queries.ts'
import { FollowButton } from './follow-button.tsx'
import styles from './profile-header.module.css'

/**
 * Profile hero. Everything here comes from the cached public profile; the only per-viewer parts
 * (follow state, "Follows you") stream in behind their own small Suspense boundaries.
 */
export function ProfileHeader({ profile }: { profile: Profile }) {
  const joined = new Date(profile.createdAt).toLocaleDateString('en', { month: 'long', year: 'numeric', timeZone: 'UTC' })
  return (
    <section className={styles.header} aria-label={`${profile.displayName}’s profile`}>
      <div className={styles.banner} style={{ '--_hue': profile.avatarHue } as React.CSSProperties} aria-hidden="true" />
      <div className={styles.body}>
        <div className={styles.topRow}>
          <Avatar name={profile.displayName} hue={profile.avatarHue} size="xl" className={styles.avatar} />
          <div className={styles.actions}>
            <Suspense fallback={<span className={styles.actionsPlaceholder} />}>
              <ProfileActions profile={profile} />
            </Suspense>
          </div>
        </div>

        <div className={styles.identity}>
          <h2 className={styles.name}>
            {profile.displayName}
            {profile.verified ? <Icon name="verified" size={20} label="Verified" className={styles.verified} /> : null}
          </h2>
          <p className={styles.handle}>
            @{profile.handle}
            <Suspense>
              <FollowsYou userId={profile.id} />
            </Suspense>
          </p>
        </div>

        {profile.bio ? <PostText body={profile.bio} className={styles.bio} /> : null}

        <ul className={styles.meta} role="list">
          {profile.location ? (
            <li><Icon name="map-pin" size={16} />{profile.location}</li>
          ) : null}
          {profile.website ? (
            <li>
              <Icon name="link" size={16} />
              <a href={profile.website} target="_blank" rel="noopener noreferrer nofollow" className={styles.link}>
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            </li>
          ) : null}
          <li><Icon name="calendar" size={16} />Joined {joined}</li>
        </ul>

        <div className={styles.counts}>
          <Link href={`/${profile.handle}/following`} className={styles.count}>
            <strong>{compactNumber(profile.followingCount)}</strong> Following
          </Link>
          <Link href={`/${profile.handle}/followers`} className={styles.count}>
            <strong>{compactNumber(profile.followersCount)}</strong> {profile.followersCount === 1 ? 'Follower' : 'Followers'}
          </Link>
        </div>
      </div>
    </section>
  )
}

async function ProfileActions({ profile }: { profile: Profile }) {
  const rel = await getRelationship(profile.id)
  if (rel.viewerId === profile.id) {
    return <Link href="/settings" className={buttonStyles({ variant: 'outline' })}>Edit profile</Link>
  }
  return (
    <>
      {rel.viewerId ? (
        <Link
          href={`/messages/new?to=${profile.handle}` as never}
          className={iconButtonStyles({ variant: 'outline' })}
          aria-label={`Message @${profile.handle}`}
          title="Message"
        >
          <Icon name="mail" size={18} />
        </Link>
      ) : null}
      <FollowButton userId={profile.id} handle={profile.handle} following={rel.followedByViewer} signedIn={rel.viewerId !== null} size="md" />
    </>
  )
}

async function FollowsYou({ userId }: { userId: string }) {
  const rel = await getRelationship(userId)
  return rel.followsViewer ? <span className={styles.chip}>Follows you</span> : null
}

export function ProfileHeaderSkeleton() {
  return (
    <div className={styles.header} aria-busy="true" aria-label="Loading profile">
      <div className={styles.banner} style={{ '--_hue': 240 } as React.CSSProperties} />
      <div className={styles.body}>
        <div className={styles.topRow}>
          <span className={styles.avatarPlaceholder} />
        </div>
      </div>
    </div>
  )
}
