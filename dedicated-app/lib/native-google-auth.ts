'use client'

import { Capacitor } from '@capacitor/core'

export const googleAuthEnabled =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true'

export function isGoogleSignInCancelled(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return /cancel|canceled|cancelled|12501/i.test(message)
}

export async function signInWithNativeGoogle() {
  if (!googleAuthEnabled) {
    throw new Error('Google authentication is disabled for this build')
  }
  if (!Capacitor.isNativePlatform()) {
    throw new Error('Google authentication is available in the Android app')
  }

  const { FirebaseAuthentication } = await import(
    '@capacitor-firebase/authentication'
  )
  const signIn = await FirebaseAuthentication.signInWithGoogle()
  if (!signIn.user) throw new Error('Google authentication did not return a user')

  const token = await FirebaseAuthentication.getIdToken({ forceRefresh: true })
  if (!token.token) throw new Error('Google authentication did not return a token')
  return token.token
}

export async function signOutNativeGoogle() {
  if (!googleAuthEnabled || !Capacitor.isNativePlatform()) return
  const { FirebaseAuthentication } = await import(
    '@capacitor-firebase/authentication'
  )
  await FirebaseAuthentication.signOut()
}
