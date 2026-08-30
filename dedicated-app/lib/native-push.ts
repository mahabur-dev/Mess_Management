'use client'

import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { LocalNotifications, type ActionPerformed as LocalActionPerformed } from '@capacitor/local-notifications'
import type { PluginListenerHandle } from '@capacitor/core'
import { PushNotifications, type ActionPerformed, type PushNotificationSchema } from '@capacitor/push-notifications'
import { api } from './api'

const APP_VERSION = '0.1.0'
const PUSH_ACTION_EVENT = 'messzen:native-push-action'
const PUSH_RECEIVED_EVENT = 'messzen:native-push-received'
const NOTIFICATION_CHANNEL_ID = 'messzen_notifications'
// Firebase is optional for an APK build. CI builds without a Firebase config
// must not call the native register API because the Capacitor plugin will
// otherwise throw when the default Firebase app does not exist.
const NATIVE_PUSH_ENABLED = process.env.NEXT_PUBLIC_NATIVE_PUSH_ENABLED === 'true'

let activeUserId: string | null = null
let activeFcmToken: string | null = null
let startupPromise: Promise<void> | null = null
let listeners: PluginListenerHandle[] = []

type PushPayload = {
  url?: string
  data?: Record<string, unknown>
}

export type NativePushCopy = {
  fallbackTitle: string
  fallbackBody: string
  channelName: string
  channelDescription: string
}

let activeCopy: NativePushCopy | null = null

export type NativePushActionDetail = PushPayload

function toData(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function pushPayloadFromNotification(notification: PushNotificationSchema): PushPayload {
  const data = toData(notification.data)
  return {
    url: typeof data.url === 'string' ? data.url : '/',
    data,
  }
}

function dispatchPushAction(payload: PushPayload) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<NativePushActionDetail>(PUSH_ACTION_EVENT, { detail: payload }))
}

function dispatchPushReceived(payload: PushPayload) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent<NativePushActionDetail>(PUSH_RECEIVED_EVENT, { detail: payload }))
}

async function registerToken(token: string) {
  if (!activeUserId || !token || token === activeFcmToken) return
  const previousToken = activeFcmToken
  try {
    await api.registerFcmDevice(token, APP_VERSION)
    if (previousToken) await api.unregisterFcmDevice(previousToken).catch(() => undefined)
    activeFcmToken = token
  } catch {
    // Registration retries on the next token refresh or app resume.
  }
}

async function showForegroundNotification(notification: PushNotificationSchema) {
  const payload = pushPayloadFromNotification(notification)
  await LocalNotifications.schedule({
    notifications: [
      {
        id: Math.floor(Date.now() % 2_000_000_000),
        title: notification.title || activeCopy?.fallbackTitle || 'Messzen',
        body: notification.body || activeCopy?.fallbackBody || '',
        channelId: NOTIFICATION_CHANNEL_ID,
        extra: payload,
      },
    ],
  })
}

async function addListeners() {
  listeners = await Promise.all([
    PushNotifications.addListener('registration', ({ value }: { value: string }) => {
      void registerToken(value)
    }),
    PushNotifications.addListener('registrationError', () => undefined),
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      dispatchPushReceived(pushPayloadFromNotification(notification))
      void showForegroundNotification(notification).catch(() => undefined)
    }),
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      dispatchPushAction(pushPayloadFromNotification(action.notification))
    }),
    LocalNotifications.addListener('localNotificationActionPerformed', (action: LocalActionPerformed) => {
      const extra = action.notification.extra as PushPayload | undefined
      dispatchPushAction(extra ?? { url: '/' })
    }),
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && activeUserId) void PushNotifications.register()
    }),
  ])
}

export function nativePushActionEventName() {
  return PUSH_ACTION_EVENT
}

export function nativePushReceivedEventName() {
  return PUSH_RECEIVED_EVENT
}

export async function initializeNativePush(userId: string, copy: NativePushCopy) {
  if (!Capacitor.isNativePlatform() || !NATIVE_PUSH_ENABLED) return
  activeCopy = copy
  if (activeUserId === userId && startupPromise) return startupPromise

  await shutdownNativePush()
  activeUserId = userId
  startupPromise = (async () => {
    await addListeners()
    await LocalNotifications.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: activeCopy?.channelName || 'Messzen',
      description: activeCopy?.channelDescription || '',
      importance: 5,
      sound: 'default',
      vibration: true,
    }).catch(() => undefined)

    const pushPermissions = await PushNotifications.checkPermissions()
    const pushPermission =
      pushPermissions.receive === 'prompt' || pushPermissions.receive === 'prompt-with-rationale'
        ? await PushNotifications.requestPermissions()
        : pushPermissions
    if (pushPermission.receive !== 'granted') return

    await LocalNotifications.requestPermissions().catch(() => undefined)
    await PushNotifications.register()
  })()

  try {
    await startupPromise
  } catch {
    // A denied or unavailable native permission must not block app startup.
  }
}

export async function shutdownNativePush() {
  if (!Capacitor.isNativePlatform()) return

  const token = activeFcmToken
  activeUserId = null
  activeFcmToken = null
  startupPromise = null

  if (token) await api.unregisterFcmDevice(token).catch(() => undefined)
  await Promise.all(listeners.map((listener) => listener.remove().catch(() => undefined)))
  listeners = []
}
