'use client'

import type { ComponentType, InputHTMLAttributes } from 'react'
import type { LucideProps } from 'lucide-react'

type IconInputProps = InputHTMLAttributes<HTMLInputElement> & {
  icon: ComponentType<LucideProps>
  iconLabel?: string
}

export function IconInput({ icon: Icon, iconLabel, className = '', ...props }: IconInputProps) {
  return (
    <div className="relative">
      <span className="field-icon field-icon--leading" aria-hidden={!iconLabel}>
        <Icon size={18} strokeWidth={2.2} />
        {iconLabel ? <span className="sr-only">{iconLabel}</span> : null}
      </span>
      <input className={`field field--leading-icon ${className}`} {...props} />
    </div>
  )
}
