import { Capacitor } from '@capacitor/core'
import { StatusBar, Style } from '@capacitor/status-bar'
import { isAuthPath, normalizePathname } from './auth'

export type NativeStatusBarTone = 'light-content' | 'dark-content'

/**
 * Light app surfaces need dark system icons. Branded app headers need white
 * system icons. Keep this route policy centralized so new screens inherit the
 * correct native treatment without page-level imperative calls.
 */
export function nativeStatusBarToneForPath(pathname: string): NativeStatusBarTone {
  const normalizedPathname = normalizePathname(pathname)
  if (isAuthPath(normalizedPathname)) return 'dark-content'
  return 'light-content'
}

let lastRequestedTone: NativeStatusBarTone | null = null
let pendingUpdate = Promise.resolve()

export function applyNativeStatusBarTone(tone: NativeStatusBarTone) {
  if (!Capacitor.isNativePlatform() || !Capacitor.isPluginAvailable('StatusBar')) return Promise.resolve()
  if (lastRequestedTone === tone) return pendingUpdate

  lastRequestedTone = tone
  pendingUpdate = pendingUpdate
    .then(() => StatusBar.setStyle({
      // Capacitor's enum describes the background appearance: Dark produces
      // light content, while Light produces dark content.
      style: tone === 'light-content' ? Style.Dark : Style.Light,
    }))
    .catch(() => {
      if (lastRequestedTone === tone) lastRequestedTone = null
    })

  return pendingUpdate
}
