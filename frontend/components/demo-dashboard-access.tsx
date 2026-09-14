'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Download, LoaderCircle, MonitorPlay, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/app/context/auth-context'
import { localizedErrorMessage, useLocale, useTranslations } from '@/lib/i18n'

const DEMO_EMAIL = 'demo@gmail.com'
const DEMO_PASSWORD = '1234567'

export function DemoDashboardAccess() {
  const router = useRouter()
  const { login, isSubmitting } = useAuth()
  const { locale } = useLocale()
  const t = useTranslations('marketing')
  const [error, setError] = useState<unknown>(null)

  const openDemo = async () => {
    setError(null)
    try {
      await login(DEMO_EMAIL, DEMO_PASSWORD)
      router.push('/dashboard')
    } catch (nextError) {
      setError(nextError)
    }
  }

  return (
    <section className="px-4 py-6 sm:px-6 lg:px-8" aria-labelledby="demo-dashboard-title">
      <div className="marketing-container">
        <div className="grid items-center gap-4 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-softer)] p-4 sm:p-5 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-5">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand)]">
            <MonitorPlay size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--brand)]">{t('hero.demoEyebrow')}</p>
            <h2 id="demo-dashboard-title" className="mt-1 text-base font-semibold text-foreground">{t('hero.demoTitle')}</h2>
            <p className="mt-1 text-sm font-medium leading-6 text-muted-foreground">{t('hero.demoDescription')}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold">
              <span className="text-[var(--brand)]">{t('hero.demoCredentials')}</span>
              <span className="rounded-md border border-[var(--brand-border-subtle)] bg-[var(--marketing-surface)] px-2.5 py-1 text-foreground">{t('hero.demoEmail')}: {DEMO_EMAIL}</span>
              <span className="rounded-md border border-[var(--brand-border-subtle)] bg-[var(--marketing-surface)] px-2.5 py-1 text-foreground">{t('hero.demoPassword')}: {DEMO_PASSWORD}</span>
            </div>
            {error ? (
              <p className="mt-2 text-xs font-semibold text-destructive" role="alert">
                {localizedErrorMessage(error, locale, t('hero.demoError'))}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2 lg:items-stretch">
            <div className="flex flex-col gap-2 sm:flex-row">
              <a href="/Messzen-test-63.apk" download="Messzen-test-63.apk" className="ghost-button h-11 w-full whitespace-nowrap px-5 sm:w-auto">
                <Download className="size-4" />
                {t('hero.downloadApk')}
              </a>
              <button type="button" onClick={() => void openDemo()} disabled={isSubmitting} className="brand-button h-11 w-full whitespace-nowrap px-5 sm:w-auto disabled:cursor-not-allowed disabled:opacity-70">
                {isSubmitting ? <LoaderCircle className="size-4 animate-spin" /> : <MonitorPlay className="size-4" />}
                {isSubmitting ? t('hero.demoLoading') : t('hero.demoAction')}
                {!isSubmitting ? <ArrowRight className="size-4" /> : null}
              </button>
            </div>
            <span className="inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
              <ShieldCheck className="size-3.5 text-[var(--brand)]" />
              {t('hero.demoNote')}
            </span>
          </div>
        </div>
        <div className="flex justify-center pt-5">
          <a href="https://peerpush.com/p/messzen" target="_blank" rel="noopener">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="https://peerpush.com/p/messzen/badge.png" alt={t('hero.peerPushAlt')} className="h-auto max-w-full" style={{ width: '230px' }} />
          </a>
        </div>
      </div>
    </section>
  )
}
