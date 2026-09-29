import type { ComponentProps } from 'react'
import { cx } from './cx.ts'
import { Icon, type IconName } from './icon.tsx'
import styles from './icon-button.module.css'

type IconButtonProps = Omit<ComponentProps<'button'>, 'children'> & {
  icon: IconName
  /** Required: icon-only buttons need an accessible name. Also shown as a tooltip. */
  label: string
  size?: 'sm' | 'md' | 'lg'
  tone?: 'neutral' | 'primary' | 'like' | 'repost'
  active?: boolean
  filled?: boolean
  count?: number | string
}

export function iconButtonStyles({ size = 'md', tone = 'neutral', active, className }: Pick<IconButtonProps, 'size' | 'tone' | 'active' | 'className'> = {}) {
  return cx(styles.root, styles[size], styles[tone], active && styles.active, className)
}

export function IconButton({ icon, label, size = 'md', tone = 'neutral', active, filled, count, className, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={count === undefined ? label : `${label} (${count})`}
      title={label}
      aria-pressed={active === undefined ? undefined : active}
      className={iconButtonStyles({ size, tone, active, className })}
      {...rest}
    >
      <span className={styles.bubble}>
        <Icon name={icon} size={size === 'lg' ? 24 : size === 'sm' ? 16 : 18} filled={filled ?? active} />
      </span>
      {count !== undefined ? <span className={styles.count}>{count}</span> : null}
    </button>
  )
}
