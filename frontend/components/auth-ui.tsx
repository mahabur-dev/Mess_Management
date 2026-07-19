import Link from 'next/link'
import type { ReactNode } from 'react'
import { CheckCircle2, Home } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { cn } from '@/lib/utils'

type AuthShellProps = {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
  maxWidth?: string
}

export const authInputClass =
  'h-12 w-full rounded-md border border-[#d8e8e7] bg-white px-4 text-sm font-semibold text-[#071821] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] outline-none placeholder:text-[#64748b] transition focus:border-[#008b80]/60 focus:ring-4 focus:ring-[#008b80]/10'

export const authInputWithIconClass = cn(authInputClass, 'pl-11')

export const authPasswordInputClass = cn(authInputClass, 'pr-12')

export const authFieldIconClass =
  'absolute left-4 top-1/2 -translate-y-1/2 text-[#008b80]'

export const authPasswordToggleClass =
  'absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#64748b] transition hover:bg-[#e7f7f5] hover:text-[#008b80]'

export const authPrimaryButtonClass =
  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[#006b63] to-[#008b80] px-6 text-sm font-black text-white shadow-[0_14px_30px_rgba(0,107,99,0.24)] transition hover:from-[#00574f] hover:to-[#006b63] hover:shadow-[0_18px_36px_rgba(0,107,99,0.28)] disabled:opacity-70'

export const authSecondaryButtonClass =
  'flex h-12 w-full items-center justify-center gap-2 rounded-md border border-[#d8e8e7] bg-white px-4 text-sm font-bold text-[#008b80] transition hover:border-[#9edbd6] hover:bg-[#e7f7f5] disabled:opacity-70'

export const authLinkClass =
  'font-bold text-[#008b80] underline-offset-4 transition hover:text-[#006b63] hover:underline'

export function AuthMessage({ children, success }: { children: ReactNode; success?: boolean }) {
  return (
    <div
      className={cn(
        'mb-5 rounded-md border px-4 py-3 text-sm font-bold',
        success
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-red-200 bg-red-50 text-red-600',
      )}
    >
      {children}
    </div>
  )
}

export function AuthShell({ title, description, children, footer, maxWidth = 'max-w-[440px]' }: AuthShellProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f6fbfb] px-4 py-8 text-[#071821] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1fr_440px]">
          <aside className="hidden lg:block">
            <BrandLogo subtitle="secure access" />
            <h1 className="mt-10 max-w-xl text-5xl font-black leading-tight tracking-tight text-[#071821]">
              Manage your mess with a calmer sign-in flow.
            </h1>
            <p className="mt-5 max-w-lg text-base font-medium leading-8 text-[#334155]">
              A clean, protected gateway for managers and members across billing, meals,
              notices, and daily operations.
            </p>
            <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-3">
              {['Protected access', 'Member ready', 'Manager tools'].map((item) => (
                <div key={item} className="border-l border-[#9edbd6] pl-4">
                  <CheckCircle2 size={18} className="text-[#008b80]" />
                  <p className="mt-2 text-sm font-black text-[#071821]">{item}</p>
                </div>
              ))}
            </div>
          </aside>

          <section className={cn('w-full justify-self-center lg:justify-self-end', maxWidth)}>
            <div className="rounded-lg border border-[#d8e8e7] bg-white/95 p-6 shadow-[0_22px_55px_rgba(0,107,99,0.10)] sm:p-8">
              <div className="mb-7 text-center lg:hidden">
                <BrandLogo className="justify-center" subtitle="secure access" />
              </div>

              <div className="mb-7 border-b border-[#d8e8e7] pb-5">
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[#008b80]">
                  Account Access
                </span>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-[#071821]">{title}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#64748b]">{description}</p>
              </div>

              {children}

              <div className="mt-6 space-y-3 text-center">{footer}</div>
            </div>

            <Link
              href="/"
              className="mx-auto mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748b] transition hover:text-[#008b80]"
            >
              <Home size={13} />
              Back to home
            </Link>
          </section>
        </div>
      </div>
    </main>
  )
}
