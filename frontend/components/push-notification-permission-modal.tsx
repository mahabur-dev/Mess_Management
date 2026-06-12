'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { useAuth } from '@/app/context/auth-context'
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
  getPushPromptStorageKey,
  isPushNotificationSupported,
  registerPushNotifications,
} from '@/lib/push-notifications'

export function PushNotificationPermissionModal() {
  const { user, isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const storageKey = useMemo(
    () => (user?.id ? getPushPromptStorageKey(user.id) : null),
    [user?.id],
  )

  useEffect(() => {
    if (!isAuthenticated || !user?.id || !storageKey) return
    if (!isPushNotificationSupported()) return
    if (Notification.permission !== 'default') return
    if (localStorage.getItem(storageKey) === 'dismissed') return

    const timer = window.setTimeout(() => setOpen(true), 400)
    return () => window.clearTimeout(timer)
  }, [isAuthenticated, storageKey, user?.id])

  const closeForNow = () => {
    if (storageKey) localStorage.setItem(storageKey, 'dismissed')
    setOpen(false)
  }

  const enableNotifications = async () => {
    setIsSaving(true)
    setError(null)

    try {
      await registerPushNotifications()
      if (storageKey) localStorage.setItem(storageKey, 'enabled')
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
              Get mess updates, payment reminders, meal changes, and notices even when the dashboard is not open.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-3 px-5 py-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            You can allow or block permission from your browser. We only store this device subscription for your account.
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
