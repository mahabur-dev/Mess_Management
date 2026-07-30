'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import type { AuthUser } from '@/lib/auth'

export type ActiveMess = {
  id: string
  name: string
}

export type ActiveMessStatus = 'idle' | 'loading' | 'connected' | 'disconnected' | 'error'

type MessLookup = {
  attempt: number
  error: Error | null
  mess: ActiveMess | null
  user: AuthUser
}

function toActiveMess(value: unknown): ActiveMess | null {
  if (!value || typeof value !== 'object') return null

  const candidate = value as { id?: unknown; name?: unknown }
  if (typeof candidate.id !== 'string' || !candidate.id) return null

  return {
    id: candidate.id,
    name: typeof candidate.name === 'string' && candidate.name.trim() ? candidate.name : 'Mess',
  }
}

function getMessFromProfile(user: AuthUser | null): ActiveMess | null {
  const membership = user?.memberships?.find(
    (item) => item.is_active !== false && Boolean(item.mess?.id)
  )

  return toActiveMess(membership?.mess)
}

function getFirstMess(value: unknown): ActiveMess | null {
  if (!Array.isArray(value)) return null

  for (const item of value) {
    const mess = toActiveMess(item)
    if (mess) return mess
  }

  return null
}

function toError(value: unknown) {
  return value instanceof Error ? value : new Error('Failed to check mess workspace.')
}

/**
 * Resolves the current user's mess without ever treating an in-flight or failed
 * lookup as a confirmed "no mess" result.
 */
export function useActiveMess(user: AuthUser | null) {
  const profileMess = useMemo(() => getMessFromProfile(user), [user])
  const [attempt, setAttempt] = useState(0)
  const [lookup, setLookup] = useState<MessLookup | null>(null)

  useEffect(() => {
    if (!user || profileMess) return

    let cancelled = false

    api
      .getMesses()
      .then((response) => {
        if (!cancelled) {
          setLookup({ attempt, error: null, mess: getFirstMess(response.data), user })
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLookup({ attempt, error: toError(error), mess: null, user })
        }
      })

    return () => {
      cancelled = true
    }
  }, [attempt, profileMess, user])

  const retry = useCallback(() => {
    setAttempt((current) => current + 1)
  }, [])

  if (!user) {
    return { activeMess: null, error: null, isLoading: false, retry, status: 'idle' as const }
  }

  if (profileMess) {
    return { activeMess: profileMess, error: null, isLoading: false, retry, status: 'connected' as const }
  }

  const hasCurrentLookup = lookup?.user === user && lookup.attempt === attempt
  if (!hasCurrentLookup) {
    return { activeMess: null, error: null, isLoading: true, retry, status: 'loading' as const }
  }

  if (lookup.error) {
    return { activeMess: null, error: lookup.error, isLoading: false, retry, status: 'error' as const }
  }

  return lookup.mess
    ? { activeMess: lookup.mess, error: null, isLoading: false, retry, status: 'connected' as const }
    : { activeMess: null, error: null, isLoading: false, retry, status: 'disconnected' as const }
}
