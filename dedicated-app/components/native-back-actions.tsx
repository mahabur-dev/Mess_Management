'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react'

type NativeBackAction = () => boolean | void

type NativeBackActionsContextValue = {
  registerAction: (action: NativeBackAction) => () => void
  runLatestAction: () => boolean
}

const NativeBackActionsContext = createContext<NativeBackActionsContextValue | null>(null)

export function NativeBackActionsProvider({ children }: { children: ReactNode }) {
  const actionsRef = useRef<Array<{ id: number; action: NativeBackAction }>>([])
  const nextIdRef = useRef(1)

  const registerAction = useCallback((action: NativeBackAction) => {
    const id = nextIdRef.current
    nextIdRef.current += 1
    actionsRef.current = [...actionsRef.current, { id, action }]

    return () => {
      actionsRef.current = actionsRef.current.filter((entry) => entry.id !== id)
    }
  }, [])

  const runLatestAction = useCallback(() => {
    const actions = [...actionsRef.current].reverse()

    for (const entry of actions) {
      const handled = entry.action()
      if (handled !== false) return true
    }

    return false
  }, [])

  const value = useMemo(() => ({ registerAction, runLatestAction }), [registerAction, runLatestAction])

  return <NativeBackActionsContext.Provider value={value}>{children}</NativeBackActionsContext.Provider>
}

export function useNativeBackActions() {
  const context = useContext(NativeBackActionsContext)
  return context
}

export function useNativeBackAction(active: boolean, onBack: NativeBackAction) {
  const context = useNativeBackActions()
  const onBackRef = useRef(onBack)

  useEffect(() => {
    onBackRef.current = onBack
  }, [onBack])

  useEffect(() => {
    if (!active || !context) return
    return context.registerAction(() => onBackRef.current())
  }, [active, context])
}
