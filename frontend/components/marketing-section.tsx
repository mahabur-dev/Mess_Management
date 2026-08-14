import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type SectionHeadingProps = {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = 'center',
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'max-w-2xl',
        align === 'center' ? 'mx-auto text-center' : 'text-left',
        className,
      )}
    >
      {eyebrow && <p className="marketing-eyebrow">{eyebrow}</p>}
      <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-foreground sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-sm font-medium leading-7 text-muted-foreground sm:text-base">
          {description}
        </p>
      )}
    </div>
  )
}
