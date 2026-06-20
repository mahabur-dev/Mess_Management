import { cn } from '@/lib/utils'

const LOGO_SRC = '/messzen2_logo.png'
const LOGO_ALT = 'Mess logo'

type BrandLogoProps = {
  className?: string
  imageClassName?: string
  subtitle?: string
  subtitleClassName?: string
}

export function BrandLogo({ className, imageClassName, subtitle, subtitleClassName }: BrandLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <img
        src={LOGO_SRC}
        alt={LOGO_ALT}
        className={cn('h-10 w-auto shrink-0 object-contain', imageClassName)}
      />
      {subtitle && (
        <span className={cn('text-[10px] font-bold uppercase tracking-[0.18em] text-[#6b7a99]', subtitleClassName)}>
          {subtitle}
        </span>
      )}
    </span>
  )
}

export { LOGO_SRC, LOGO_ALT }
