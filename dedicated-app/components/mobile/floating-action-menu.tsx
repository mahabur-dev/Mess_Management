'use client'

import Link from 'next/link'
import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { appHref } from '@/lib/routes'

export type FloatingActionMenuItem = {
  href: string
  label: string
  icon: ReactNode
}

export function FloatingActionMenu({
  label,
  items,
  icon = <Plus size={24} strokeWidth={2.4} />,
}: {
  label: string
  items: FloatingActionMenuItem[]
  icon?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const menuId = useId()

  useEffect(() => {
    if (!open) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  return (
    <div className="floating-action-menu" data-open={open ? 'true' : 'false'}>
      {open ? (
        <button
          type="button"
          className="floating-action-menu__backdrop"
          aria-label="Close quick actions"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div id={menuId} className="floating-action-menu__items" aria-hidden={!open}>
        {items.map((item, index) => (
          <Link
            key={item.href}
            href={appHref(item.href)}
            className="floating-action-menu__item"
            tabIndex={open ? 0 : -1}
            style={{ '--action-index': index } as CSSProperties}
            onClick={() => setOpen(false)}
          >
            <span>{item.label}</span>
            <span className="floating-action-menu__item-icon" aria-hidden="true">
              {item.icon}
            </span>
          </Link>
        ))}
      </div>

      <button
        type="button"
        className="floating-action-link floating-action-menu__trigger"
        aria-label={open ? `Close ${label}` : label}
        title={label}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((current) => !current)}
      >
        <span aria-hidden="true">{icon}</span>
      </button>
    </div>
  )
}
