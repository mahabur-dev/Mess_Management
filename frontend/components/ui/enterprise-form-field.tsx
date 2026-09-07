'use client'

import type { ReactNode } from 'react'

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from '@/components/ui/field'
import { useTranslations } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface EnterpriseFormFieldProps {
  children: ReactNode
  label: ReactNode
  htmlFor?: string
  description?: ReactNode
  error?: ReactNode
  required?: boolean
  className?: string
  labelClassName?: string
}

/** Standard label, help and validation composition for dashboard and auth forms. */
export function EnterpriseFormField({
  children,
  label,
  htmlFor,
  description,
  error,
  required = false,
  className,
  labelClassName,
}: EnterpriseFormFieldProps) {
  const common = useTranslations('common')

  return (
    <Field
      data-invalid={Boolean(error) || undefined}
      className={cn('gap-2', className)}
    >
      <FieldLabel htmlFor={htmlFor} className={cn('text-sm font-semibold text-foreground', labelClassName)}>
        {label}
        {required ? (
          <>
            <span className="text-destructive" aria-hidden="true">*</span>
            <span className="sr-only">({common('required')})</span>
          </>
        ) : null}
      </FieldLabel>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      {children}
      {error ? <FieldError>{error}</FieldError> : null}
    </Field>
  )
}
