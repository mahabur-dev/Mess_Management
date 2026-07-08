'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

type ActionLinkProps = {
  href: string
  label: string
  icon: ReactNode
  tone?: 'primary' | 'subtle'
}

export function ActionLink({ href, label, icon, tone = 'subtle' }: ActionLinkProps) {
  return (
    <Link
      href={href}
      className={`inline-flex h-10 items-center gap-2 rounded-2xl px-3 text-sm font-bold transition ${
        tone === 'primary'
          ? 'bg-[#fc782d] text-white shadow-[0_10px_24px_rgba(252,120,45,0.24)]'
          : 'bg-[#fff1e6] text-[#fc782d]'
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
      href={href}
      aria-label={label}
      title={label}
      className={`grid h-10 w-10 place-items-center rounded-2xl transition ${
        tone === 'primary'
          ? 'bg-[#fc782d] text-white shadow-[0_10px_24px_rgba(252,120,45,0.24)]'
          : 'bg-[#fff1e6] text-[#fc782d]'
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
      ? 'bg-emerald-50 text-emerald-600'
      : tone === 'warning'
        ? 'bg-amber-50 text-amber-600'
        : tone === 'danger'
          ? 'bg-rose-50 text-rose-500'
          : 'bg-slate-100 text-slate-600'

  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-black ${toneClass}`}>{label}</span>
}
