'use client'

import Image from 'next/image'

export function BrandBuildingArt({ placement = 'auth' }: { placement?: 'auth' | 'onboarding' }) {
  return (
    <div className="brand-building-art" data-placement={placement} aria-hidden="true">
      <Image src="/login-side-art.png" alt="" width={852} height={1920} priority={placement === 'onboarding'} />
    </div>
  )
}
