'use client'

import { useEffect, useRef, useState } from 'react'
import { BellOff, BellRing, CheckCircle2, Loader2, ShieldCheck, Smartphone, X } from 'lucide-react'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type PushSubscriptionStatus } from '@/lib/api-client'
import { EnterpriseButton } from '@/components/ui/enterprise-button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  getPushPermissionState,
  hasCurrentDevicePushSubscription,
  isPushNotificationSupported,
  registerPushNotifications,
  shouldShowPushPermissionPrompt,
} from '@/lib/push-notifications'
import { localizedErrorMessage, useLocale, useTranslations } from '@/lib/i18n'

export function PushNotificationPermissionModal() {
  const { user, isAuthenticated } = useAuth()
  const { locale } = useLocale()
  const t = useTranslations('dashboard')
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const [subscriptionStatus, setSubscriptionStatus] = useState<PushSubscriptionStatus | null>(null)
  const [isCurrentDeviceSubscribed, setIsCurrentDeviceSubscribed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const localeRef = useRef(locale)
  const translationsRef = useRef(t)

  useEffect(() => {
    localeRef.current = locale
    translationsRef.current = t
  }, [locale, t])

  useEffect(() => {
    let cancelled = false
    let promptTimer: number | undefined

    async function evaluatePushPermission() {
      if (!isAuthenticated || !user?.id || !isPushNotificationSupported()) {
        setOpen(false)
        setSubscriptionStatus(null)
        setIsCurrentDeviceSubscribed(false)
        setPermissionState('unsupported')
        setIsCheckingStatus(false)
        return
      }

      setIsCheckingStatus(true)
      setError(null)

      try {
        const currentPermission = getPushPermissionState()
        if (cancelled) return

        setPermissionState(currentPermission)

        const [response, currentDeviceSubscribed] = await Promise.all([
          apiClient.getPushSubscriptionStatus(),
          hasCurrentDevicePushSubscription(),
        ])
        if (cancelled) return

        setSubscriptionStatus(response.data)
        setIsCurrentDeviceSubscribed(currentDeviceSubscribed)

        if (currentPermission === 'granted') {
          if (!response.data.hasActiveSubscription || !currentDeviceSubscribed) {
            try {
              setIsSaving(true)
              await registerPushNotifications({ promptForPermission: false })
              setSubscriptionStatus((current) =>
                current
                  ? {
                      ...current,
                      hasActiveSubscription: true,
                      activeSubscriptionCount: Math.max(1, current.activeSubscriptionCount),
                    }
                  : current,
              )
              setIsCurrentDeviceSubscribed(true)
            } catch (syncError) {
              if (!cancelled) {
                setError(localizedErrorMessage(
                  syncError,
                  localeRef.current,
                  translationsRef.current('push.syncError'),
                ))
              }
            } finally {
              if (!cancelled) setIsSaving(false)
            }
          }

          setOpen(false)
          return
        }

        if (shouldShowPushPermissionPrompt(currentPermission)) {
          promptTimer = window.setTimeout(() => {
            if (!cancelled) setOpen(true)
          }, 400)
        }
      } catch {
        if (!cancelled && shouldShowPushPermissionPrompt(getPushPermissionState())) {
          promptTimer = window.setTimeout(() => setOpen(true), 400)
        }
      } finally {
        if (!cancelled) setIsCheckingStatus(false)
      }
    }

    void evaluatePushPermission()

    return () => {
      cancelled = true
      if (promptTimer) window.clearTimeout(promptTimer)
    }
  }, [isAuthenticated, user?.id])

  const closeForNow = () => {
    setOpen(false)
  }

  const enableNotifications = async () => {
    setIsSaving(true)
    setError(null)

    try {
      await registerPushNotifications()
      setPermissionState('granted')
      setSubscriptionStatus((current) => current ? { ...current, hasActiveSubscription: true, activeSubscriptionCount: Math.max(1, current.activeSubscriptionCount) } : current)
      setIsCurrentDeviceSubscribed(true)
      setOpen(false)
    } catch (err) {
      setError(localizedErrorMessage(err, locale, t('push.enableError')))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) closeForNow()
      else setOpen(true)
    }}>
      <DialogContent
        showCloseButton={false}
        className="w-[calc(100%-2rem)] max-w-md gap-0 overflow-hidden rounded-[1.5rem] border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] p-0 "
      >
        <div className="relative overflow-hidden border-b border-[var(--dashboard-line)] px-5 pb-5 pt-6 sm:px-6">
          <button
            type="button"
            onClick={closeForNow}
            disabled={isSaving}
            className="absolute right-4 top-4 z-10 grid size-9 place-items-center rounded-xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface)] text-muted-foreground  transition hover:border-[var(--brand-border)] hover:bg-[var(--dashboard-hover)] hover:text-[var(--dashboard-ink)] disabled:opacity-50"
            aria-label={t('push.close')}
          >
            <X className="size-4" />
          </button>

          <DialogHeader className="relative pr-10 text-left">
            <div className="mb-3 flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-[var(--brand)] text-primary-foreground ">
                <BellRing className="size-5" />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand)]">{t('push.eyebrow')}</p>
                <p className="mt-1 text-xs font-semibold text-muted-foreground">{t('push.security')}</p>
              </div>
            </div>
            <DialogTitle className="text-[1.35rem] font-semibold leading-tight tracking-[-0.025em] text-[var(--dashboard-ink)] sm:text-2xl">
              {permissionState === 'denied' ? t('push.blockedTitle') : t('push.title')}
            </DialogTitle>
            <DialogDescription className="max-w-sm text-sm font-medium leading-6 text-muted-foreground">
              {permissionState === 'denied'
                ? t('push.blockedDescription')
                : t('push.description')}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-3 px-5 py-5 sm:px-6">
          {error && (
            <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold leading-5 text-destructive dark:border-destructive/30 dark:bg-destructive/10 dark:text-destructive">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 rounded-2xl border border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)] p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--dashboard-surface)] text-[var(--brand)] ">
              {isCheckingStatus ? <Loader2 className="size-4 animate-spin" /> : <Smartphone className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--dashboard-ink)]">{t('push.browser')}</p>
              <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                {isCheckingStatus
                  ? t('push.checking')
                  : permissionState === 'denied'
                    ? t('push.permissionBlocked')
                    : subscriptionStatus?.hasActiveSubscription
                      ? t('push.anotherDevice')
                      : t('push.ready')}
              </p>
            </div>
            {!isCheckingStatus && (
              <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] ${permissionState === 'denied' ? 'border-primary/30 bg-primary/10 text-primary dark:border-primary/30 dark:bg-primary/10 dark:text-primary' : 'border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-dark)]'}`}>
                {permissionState === 'denied' ? t('push.actionNeeded') : t('push.notConnected')}
              </span>
            )}
          </div>

          <div className="flex items-start gap-2.5 px-1 text-xs font-medium leading-5 text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--brand)]" />
            <span>{t('push.controlNotice')}</span>
          </div>
        </div>

        <DialogFooter className="grid grid-cols-1 gap-2 border-t border-[var(--dashboard-line)] bg-[var(--dashboard-surface-subtle)]/60 px-5 py-4 sm:grid-cols-2 sm:px-6">
          <EnterpriseButton tone="secondary" fullWidth onClick={closeForNow} disabled={isSaving}>
            <BellOff className="size-4" />
            {t('push.notNow')}
          </EnterpriseButton>
          <EnterpriseButton fullWidth onClick={enableNotifications} disabled={isSaving || isCheckingStatus}>
            {isSaving ? <Loader2 className="size-4 animate-spin" /> : permissionState === 'denied' ? <CheckCircle2 className="size-4" /> : <BellRing className="size-4" />}
            {isSaving ? t('push.connecting') : permissionState === 'denied' ? t('push.retry') : t('push.allow')}
          </EnterpriseButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
