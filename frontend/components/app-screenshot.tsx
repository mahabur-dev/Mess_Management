import Image from 'next/image'
import { cn } from '@/lib/utils'

type AppScreenshotProps = {
  src: string
  alt: string
  className?: string
  imageClassName?: string
  priority?: boolean
  sizes?: string
}

export function AppScreenshot({
  src,
  alt,
  className,
  imageClassName,
  priority = false,
  sizes = '(max-width: 640px) 70vw, 280px',
}: AppScreenshotProps) {
  return (
    <div
      className={cn(
        'relative aspect-[9/20] overflow-hidden rounded-[2rem] border-[6px] border-[var(--brand-dark)] bg-[var(--marketing-surface)] ring-1 ring-[var(--brand-border)]',
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        quality={92}
        sizes={sizes}
        className={cn('object-cover object-top', imageClassName)}
      />
      <div className="pointer-events-none absolute inset-0 rounded-[1.6rem] ring-1 ring-inset ring-black/5" />
    </div>
  )
}
