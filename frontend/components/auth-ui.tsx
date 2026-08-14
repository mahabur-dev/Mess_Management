import Link from 'next/link'
import type { ReactNode } from 'react'
import { CheckCircle2, Home } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

type AuthShellProps = {
  title: string
  description: string
  children: ReactNode
  footer: ReactNode
  maxWidth?: string
}

export const authInputClass =
  'h-12 w-full rounded-xl border border-[var(--marketing-line)] bg-[var(--marketing-surface)] px-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground transition focus:border-[var(--brand)] focus:ring-4 focus:ring-[var(--brand-ring)]'

export const authInputWithIconClass = cn(authInputClass, 'pl-11')

export const authPasswordInputClass = cn(authInputClass, 'pr-12')

export const authFieldIconClass =
  'absolute left-4 top-1/2 -translate-y-1/2 text-[var(--brand)]'

export const authPasswordToggleClass =
  'absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition hover:bg-[var(--brand-soft)] hover:text-[var(--brand)]'

export const authPrimaryButtonClass =
  'inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[var(--brand-dark)] to-[var(--brand)] px-6 text-sm font-black text-white shadow-[0_14px_30px_var(--brand-shadow)] transition hover:from-[var(--brand-darker)] hover:to-[var(--brand-dark)] hover:shadow-[0_18px_36px_rgba(0,107,99,0.28)] disabled:opacity-70'

export const authSecondaryButtonClass =
  'flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[var(--marketing-line)] bg-[var(--marketing-surface)] px-4 text-sm font-bold text-[var(--brand)] transition hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)] disabled:opacity-70'

export const authLinkClass =
  'font-bold text-[var(--brand)] underline-offset-4 transition hover:text-[var(--brand-dark)] hover:underline'

export function AuthMessage({ children, success }: { children: ReactNode; success?: boolean }) {
  return (
    <div
      className={cn(
        'mb-5 rounded-md border px-4 py-3 text-sm font-bold',
        success
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200'
          : 'border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
      )}
    >
      {children}
    </div>
  )
}

export function AuthShell({ title, description, children, footer, maxWidth = 'max-w-[440px]' }: AuthShellProps) {
  return (
    <main className="auth-page marketing-page fixed inset-0 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-8 sm:px-6 lg:px-8">
      <ThemeToggle className="absolute right-4 top-4 sm:right-6 sm:top-6" />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full items-center gap-8 lg:grid-cols-[1fr_440px]">
          <aside className="hidden lg:block">
            <BrandLogo subtitle="secure access" />
            <h1 className="mt-10 max-w-xl text-5xl font-black leading-tight tracking-tight text-foreground">
              Manage your mess with a calmer sign-in flow.
            </h1>
            <p className="mt-5 max-w-lg text-base font-medium leading-8 text-muted-foreground">
              A clean, protected gateway for managers and members across billing, meals,
              notices, and daily operations.
            </p>
            <div className="mt-8 grid max-w-xl gap-4 sm:grid-cols-3">
              {['Protected access', 'Member ready', 'Manager tools'].map((item) => (
                <div key={item} className="border-l border-[#9edbd6] pl-4">
                  <CheckCircle2 size={18} className="text-[#008b80]" />
                  <p className="mt-2 text-sm font-black text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </aside>

          <section className={cn('w-full justify-self-center lg:justify-self-end', maxWidth)}>
            <div className="marketing-card rounded-2xl p-6 sm:p-8">
              <div className="mb-7 text-center lg:hidden">
                <BrandLogo className="justify-center" subtitle="secure access" />
              </div>

              <div className="mb-7 border-b border-[var(--marketing-line)] pb-5">
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--brand)]">
                  Account Access
                </span>
                <h2 className="mt-3 text-2xl font-black tracking-tight text-foreground">{title}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-muted-foreground">{description}</p>
              </div>

              {children}

              <div className="mt-6 space-y-3 text-center">{footer}</div>
            </div>

            <Link
              href="/"
              className="mx-auto mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-[var(--brand)]"
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
