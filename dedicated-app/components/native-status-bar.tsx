'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { usePathname } from 'next/navigation'
import {
  applyNativeStatusBarTone,
  nativeStatusBarToneForPath,
  type NativeStatusBarTone,
} from '@/lib/native-status-bar'

type StatusBarOverride = {
  id: symbol
  tone: NativeStatusBarTone
}

type NativeStatusBarContextValue = {
  setOverride: (id: symbol, tone: NativeStatusBarTone | null) => void
}

const NativeStatusBarContext = createContext<NativeStatusBarContextValue | null>(null)

export function NativeStatusBarProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [overrides, setOverrides] = useState<StatusBarOverride[]>([])

  const setOverride = useCallback((id: symbol, tone: NativeStatusBarTone | null) => {
    setOverrides((current) => {
      const withoutCurrent = current.filter((entry) => entry.id !== id)
      return tone ? [...withoutCurrent, { id, tone }] : withoutCurrent
    })
  }, [])

  const routeTone = nativeStatusBarToneForPath(pathname)
  const effectiveTone = overrides.at(-1)?.tone ?? routeTone

  useEffect(() => {
    void applyNativeStatusBarTone(effectiveTone)
  }, [effectiveTone])

  const value = useMemo(() => ({ setOverride }), [setOverride])

  return (
    <NativeStatusBarContext.Provider value={value}>
      {children}
    </NativeStatusBarContext.Provider>
  )
}

/**
 * Temporarily overrides the route-level status-bar tone for overlays such as
 * the light More drawer. The previous route tone is restored on close/unmount.
 */
export function useNativeStatusBarOverride(tone: NativeStatusBarTone, active = true) {
  const context = useContext(NativeStatusBarContext)
  const overrideId = useRef(Symbol('native-status-bar-override'))

  useEffect(() => {
    if (!context || !active) return
    const id = overrideId.current
    context.setOverride(id, tone)
    return () => context.setOverride(id, null)
  }, [active, context, tone])
}
