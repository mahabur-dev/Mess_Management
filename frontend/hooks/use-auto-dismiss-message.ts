'use client'

import { useEffect } from 'react'

export function useAutoDismissMessage(
  message: string,
  messageType: 'success' | 'error',
  setMessage: (msg: string) => void,
  setMessageType: (type: 'success' | 'error') => void,
  duration = 4000,
) {
  useEffect(() => {
    if (!message) return

    const timer = setTimeout(() => {
      setMessage('')
      setMessageType('success')
    }, duration)

    return () => clearTimeout(timer)
  }, [message, messageType, setMessage, setMessageType, duration])
}