'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { useAuth } from '@/app/context/auth-context'
import { apiClient, type PushSubscriptionStatus } from '@/lib/api-client'
import { Button } from '@/components/ui/button'
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

export function PushNotificationPermissionModal() {
  const { user, isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)
  const [permissionState, setPermissionState] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const [subscriptionStatus, setSubscriptionStatus] = useState<PushSubscriptionStatus | null>(null)
  const [isCurrentDeviceSubscribed, setIsCurrentDeviceSubscribed] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
                setError(syncError instanceof Error ? syncError.message : 'Unable to sync push subscription.')
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
      setError(err instanceof Error ? err.message : 'Unable to enable notifications.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!nextOpen) closeForNow()
      else setOpen(true)
    }}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-lg border-border bg-card p-0">
        <div className="border-b border-border bg-[#2F80ED] px-5 py-4 text-white">
          <DialogHeader className="space-y-2 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
              <Bell className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-bold text-white">
              Enable push notifications?
            </DialogTitle>
            <DialogDescription className="text-sm text-white/80">
              {permissionState === 'denied'
                ? 'Your browser has blocked notifications. Please allow them from browser settings to get mess updates.'
                : 'Get mess updates, payment reminders, meal changes, and notices even when the dashboard is not open.'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-3 px-5 py-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {isCheckingStatus && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              Checking notification status...
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {permissionState === 'granted' && isCurrentDeviceSubscribed
              ? 'This device is already connected for notifications. No further action is needed.'
              : subscriptionStatus?.hasActiveSubscription
                ? 'Your account has notifications enabled on another device. Allow this browser too for updates here.'
              : 'Allow notifications from your browser to keep this device connected for instant updates.'}
          </p>
        </div>

        <DialogFooter className="grid grid-cols-1 gap-2 border-t border-border px-5 py-4 sm:grid-cols-2">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={closeForNow}
            disabled={isSaving}
          >
            <BellOff className="mr-2 h-4 w-4" />
            Not now
          </Button>
          <Button
            type="button"
            className="w-full bg-[#2F80ED] text-white hover:bg-[#2770d6]"
            onClick={enableNotifications}
            disabled={isSaving}
          >
            {isSaving ? 'Enabling...' : 'Allow notifications'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
