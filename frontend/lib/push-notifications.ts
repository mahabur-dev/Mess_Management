import { apiClient, type PushSubscriptionPayload } from '@/lib/api-client'

const SERVICE_WORKER_PATH = '/push-notification-sw.js'

export function isPushNotificationSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

export function getPushPermissionState() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported' as const
  }

  return Notification.permission
}

export function shouldShowPushPermissionPrompt(permission: NotificationPermission | 'unsupported') {
  return permission !== 'granted' && permission !== 'unsupported'
}

export async function hasCurrentDevicePushSubscription() {
  if (!isPushNotificationSupported()) return false

  const registration = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_PATH)
  if (!registration) return false

  const subscription = await registration.pushManager.getSubscription()
  return Boolean(subscription)
}

export async function registerPushNotifications(options: { promptForPermission?: boolean } = {}) {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported in this browser.')
  }

  const promptForPermission = options.promptForPermission ?? true
  if (promptForPermission) {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      throw new Error('Notification permission was not granted.')
    }
  } else if (Notification.permission !== 'granted') {
    throw new Error('Notification permission is not granted.')
  }

  const [{ data }, registration] = await Promise.all([
    apiClient.getPushPublicKey(),
    navigator.serviceWorker.register(SERVICE_WORKER_PATH),
  ])

  const existingSubscription = await registration.pushManager.getSubscription()
  const subscription =
    existingSubscription ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey),
    }))

  const payload = toPushSubscriptionPayload(subscription)
  await apiClient.savePushSubscription(payload)

  return payload
}

function toPushSubscriptionPayload(subscription: PushSubscription): PushSubscriptionPayload {
  const json = subscription.toJSON()
  if (!json.endpoint || !json.keys?.p256dh || !json.keys.auth) {
    throw new Error('Browser returned an invalid push subscription.')
  }

  return {
    endpoint: json.endpoint,
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
    userAgent: navigator.userAgent,
  }
}

function urlBase64ToUint8Array(value: string) {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = `${value}${padding}`.replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const output = new Uint8Array(rawData.length)

  for (let index = 0; index < rawData.length; index += 1) {
    output[index] = rawData.charCodeAt(index)
  }

  return output
}
