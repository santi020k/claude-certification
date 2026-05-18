'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export function useClientRateLimit(limit: number, windowMs: number) {
  const timestamps = useRef<number[]>([])
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [remaining, setRemaining] = useState(limit)

  const recompute = useCallback(() => {
    const now = Date.now()

    timestamps.current = timestamps.current.filter(t => now - t < windowMs)

    const used = timestamps.current.length
    const left = Math.max(0, limit - used)

    setRemaining(left)

    if (left === 0 && timestamps.current.length > 0) {
      const oldest = timestamps.current[0]
      const secs = Math.ceil((oldest + windowMs - now) / 1000)

      setCooldownSeconds(Math.max(0, secs))
    } else {
      setCooldownSeconds(0)
    }
  }, [limit, windowMs])

  useEffect(() => {
    const id = setInterval(recompute, 1_000)

    return () => {
      clearInterval(id)
    }
  }, [recompute])

  const recordRequest = useCallback(() => {
    timestamps.current.push(Date.now())

    recompute()
  }, [recompute])

  return {
    cooldownSeconds,
    isLimited: remaining === 0,
    recordRequest,
    remaining
  }
}
