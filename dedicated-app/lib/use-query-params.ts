'use client'

import { useEffect, useState } from 'react'

export function useQueryParams() {
  const [params, setParams] = useState(() => new URLSearchParams())

  useEffect(() => {
    setParams(new URLSearchParams(window.location.search))
  }, [])

  return params
}
