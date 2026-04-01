import * as React from 'react'
import { Icon } from '@iconify/react'
import { cn } from '@/lib/utils'

export type SectionHeaderProps = {
  variant: 'center' | 'left' | 'split'
  eyebrowText?: string
  /**
   * `center` only: show the icon row when `eyebrowText` is empty (property carousel default).
   * Default true.
   */
  centerShowIconWhenEmpty?: boolean
  title?: string | null
  subtitle?: string | null
  /** `split` only — e.g. header CTA */
  trailing?: React.ReactNode
  titleClassName?: string
  subtitleClassName?: string
  /** `left` / `split` eyebrow row: e.g. `gap-2.5` */
  eyebrowRowClassName?: string
  className?: string
}

const titleCenter =
  'text-40 lg:text-52 font-medium text-black dark:text-white text-center tracking-tight leading-11 mb-2'
const subtitleCenter = 'text-xm font-normal text-black/50 dark:text-white/50 text-center'

const titleLeft = 'lg:text-52 text-40 leading-[1.2] font-medium text-dark dark:text-white'
const subtitleLeft = 'text-dark/50 dark:text-white/50'

const titleSplit = 'lg:text-52 text-40 font-medium dark:text-white'
const subtitleSplit = 'text-dark/50 dark:text-white/50 text-xm'

export function SectionHeader({
  variant,
  eyebrowText,
  centerShowIconWhenEmpty = true,
  title,
  subtitle,
  trailing,
  titleClassName,
  subtitleClassName,
  eyebrowRowClassName,
  className,
}: SectionHeaderProps) {
  const t = title?.trim()
  const s = subtitle?.trim()
  const e = eyebrowText?.trim()

  if (variant === 'center') {
    const showEyebrowRow = centerShowIconWhenEmpty || Boolean(e)
    if (!showEyebrowRow && !t && !s) return null

    return (
      <div className={cn('mb-16 flex flex-col gap-3', className)}>
        {showEyebrowRow ? (
          <div className="flex gap-2.5 items-center justify-center">
            <span>
              <Icon icon="ph:house-simple-fill" width={20} height={20} className="text-primary" />
            </span>
            {e ? <p className="text-base font-semibold text-dark/75 dark:text-white/75">{e}</p> : null}
          </div>
        ) : null}
        {t ? <h2 className={cn(titleCenter, titleClassName)}>{title}</h2> : null}
        {s ? <p className={cn(subtitleCenter, subtitleClassName)}>{subtitle}</p> : null}
      </div>
    )
  }

  if (variant === 'left') {
    if (!e && !t && !s) return null

    return (
      <div className={cn('min-w-0', className)}>
        {e ? (
          <p
            className={cn(
              'text-dark/75 dark:text-white/75 text-base font-semibold flex gap-2 min-w-0',
              eyebrowRowClassName,
            )}
          >
            <Icon icon="ph:house-simple-fill" className="text-2xl text-primary shrink-0" />
            {e}
          </p>
        ) : null}
        {t ? <h2 className={cn(titleLeft, titleClassName)}>{title}</h2> : null}
        {s ? <p className={cn(subtitleLeft, subtitleClassName)}>{subtitle}</p> : null}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex justify-between md:items-end items-start mb-10 md:flex-row flex-col',
        className,
      )}
    >
      <div className="min-w-0">
        {e ? (
          <p
            className={cn(
              'text-dark/75 dark:text-white/75 text-base font-semibold flex gap-2',
              eyebrowRowClassName,
            )}
          >
            <Icon
              icon="ph:house-simple-fill"
              className="text-2xl text-primary"
              aria-label="Home icon"
            />
            {e}
          </p>
        ) : null}
        {t ? <h2 className={cn(titleSplit, titleClassName)}>{title}</h2> : null}
        {s ? <p className={cn(subtitleSplit, subtitleClassName)}>{subtitle}</p> : null}
      </div>
      {trailing}
    </div>
  )
}
