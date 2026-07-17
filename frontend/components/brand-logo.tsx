import { cn } from '@/lib/utils'

const LOGO_SRC = ''
const LOGO_ALT = 'Messzen logo'

type BrandLogoProps = {
  className?: string
  imageClassName?: string
  subtitle?: string
  subtitleClassName?: string
}

export function BrandLogo({ className, imageClassName, subtitle, subtitleClassName }: BrandLogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        aria-hidden="true"
        className={cn('relative flex h-9 w-9 shrink-0 items-center justify-center text-[#008b80]', imageClassName)}
      >
        <svg viewBox="0 0 42 42" className="h-full w-full" fill="none">
          <path
            d="M21 2.8 35.7 11.2v19.6L21 39.2 6.3 30.8V11.2L21 2.8Z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M13.2 29V14.3h3.3l4.5 6.2 4.5-6.2h3.3V29h-3.5v-9.2l-4.3 5.8-4.3-5.8V29h-3.5Z"
            fill="currentColor"
          />
        </svg>
      </span>
      <span className="text-2xl font-black tracking-tight text-[#008b80]">messzen</span>
      {subtitle && (
        <span className={cn('text-[10px] font-bold uppercase tracking-[0.18em] text-[#6b7a99]', subtitleClassName)}>
          {subtitle}
        </span>
      )}
    </span>
  )
}

export { LOGO_SRC, LOGO_ALT }
