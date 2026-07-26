'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { appHref } from '@/lib/routes'

type ActionLinkProps = {
  href: string
  label: string
  icon: ReactNode
  tone?: 'primary' | 'subtle'
}

export function ActionLink({ href, label, icon, tone = 'subtle' }: ActionLinkProps) {
  return (
    <Link
      href={appHref(href)}
      className={`inline-flex h-10 items-center gap-2 rounded-2xl px-3 text-label font-bold transition ${
        tone === 'primary'
          ? 'bg-[#008d8c] text-white shadow-[0_10px_24px_rgba(0,119,122,0.24)]'
          : 'bg-[#dff4f3] text-[#008d8c]'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}

type IconActionLinkProps = {
  href: string
  label: string
  icon: ReactNode
  tone?: 'primary' | 'subtle'
}

export function IconActionLink({ href, label, icon, tone = 'subtle' }: IconActionLinkProps) {
  return (
    <Link
      href={appHref(href)}
      aria-label={label}
      title={label}
      className={`grid h-10 w-10 place-items-center rounded-2xl transition ${
        tone === 'primary'
          ? 'bg-[#008d8c] text-white shadow-[0_10px_24px_rgba(0,119,122,0.24)]'
          : 'bg-[#dff4f3] text-[#008d8c]'
      }`}
    >
      {icon}
    </Link>
  )
}

type StatusPillProps = {
  label: string
  tone?: 'success' | 'warning' | 'danger' | 'neutral'
}

export function StatusPill({ label, tone = 'neutral' }: StatusPillProps) {
  const toneClass =
    tone === 'success'
      ? 'bg-[#dff4f3] text-[#008d8c]'
      : tone === 'warning'
        ? 'bg-[#edfafa] text-[#0aa0a0]'
        : tone === 'danger'
          ? 'bg-[#edfafa] text-[#00777a]'
          : 'bg-[#edfafa] text-[#65838b]'

  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-caption font-bold ${toneClass}`}>{label}</span>
}
