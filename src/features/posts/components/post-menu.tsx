'use client'

import { startTransition } from 'react'
import { Menu, MenuItem, MenuLink } from '#/ui/menu.tsx'
import { useToast } from '#/ui/toast.tsx'
import { deletePostAction } from '../actions.ts'
import type { PostView } from '../types.ts'
import styles from './post-card.module.css'

export function PostMenu({ post, signedIn }: { post: PostView; signedIn: boolean }) {
  const toast = useToast()
  if (!signedIn) return null
  return (
    <div className={styles.menu}>
      <Menu label="More">
        {post.viewer.isAuthor ? (
          <MenuItem
            icon="trash"
            tone="danger"
            onSelect={() =>
              startTransition(async () => {
                if (!confirm('Delete this post? This can’t be undone.')) return
                const result = await deletePostAction(post.id)
                toast(result.status === 'success' ? (result.message ?? 'Deleted') : 'Could not delete the post', {
                  tone: result.status === 'success' ? 'default' : 'danger',
                })
              })
            }
          >
            Delete
          </MenuItem>
        ) : null}
        <MenuLink icon="user" href={`/${post.author.handle}`}>View @{post.author.handle}</MenuLink>
        <MenuLink icon="mail" href={`/messages/new?to=${post.author.handle}`}>Message @{post.author.handle}</MenuLink>
      </Menu>
    </div>
  )
}
