import { useState, useEffect, useRef } from 'react'

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

// Apple-style deceleration curve for smooth chart morphs.
function appleEase(t) {
  return 1 - Math.pow(1 - t, 4)
}

// Two-phase interpolation for numeric counters:
//   Phase 1 (75% of duration) — easeOutExpo races from `from` to within SLOW_ZONE of `to`
//   Phase 2 (25% of duration) — linear crawl over the final SLOW_ZONE units
const SLOW_ZONE = 10 // absolute units; irrelevant for small-range values (Sharpe, %)
const P1 = 0.5    // 450ms fast / 450ms slow, total 900ms

function twoPhaseValue(t, from, to) {
  const range = to - from
  const absRange = Math.abs(range)

  // Range smaller than the slow zone: just linear the whole way
  if (absRange <= SLOW_ZONE) return from + range * t

  const sign = range >= 0 ? 1 : -1
  const nearTarget = to - sign * SLOW_ZONE

  if (t <= P1) {
    return from + (nearTarget - from) * easeOutExpo(t / P1)
  }
  return nearTarget + (to - nearTarget) * ((t - P1) / (1 - P1))
}

/**
 * Smoothly interpolates a numeric value from its previous to its new target.
 * Returns the current animated value on every animation frame.
 */
export function useAnimatedValue(target, duration = 900) {
  const [current, setCurrent] = useState(target ?? 0)
  // Tracks the live animated value so interrupted animations resume
  // from the current visual position, not the stale pre-animation snapshot.
  const liveRef = useRef(target ?? 0)
  const rafRef = useRef(null)

  useEffect(() => {
    if (target == null) {
      cancelAnimationFrame(rafRef.current)
      liveRef.current = 0
      setCurrent(0)
      return
    }

    const from = liveRef.current
    const to = target
    if (from === to) return

    cancelAnimationFrame(rafRef.current)
    const startTime = performance.now()

    function tick(now) {
      const t = Math.min((now - startTime) / duration, 1)
      const v = twoPhaseValue(t, from, to)
      liveRef.current = v
      setCurrent(v)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return current
}

/**
 * Smoothly interpolates all numeric values in an object (keyed by string).
 * Keys that appear in the new target but not the old animate from 0.
 * Keys that disappear animate to 0 and are removed once they reach it.
 * Returns the current animated object.
 */
export function useAnimatedObject(target, duration = 700) {
  const [current, setCurrent] = useState(target ?? {})
  // Tracks the live animated object so interrupted animations resume
  // from the current visual position, not the stale pre-animation snapshot.
  const liveRef = useRef(target ?? {})
  const rafRef = useRef(null)
  // Stabilize object reference so effect doesn't re-run on identical data
  const targetKeyRef = useRef('')
  const stableTarget = useRef(target)
  const key = target ? JSON.stringify(target) : ''
  if (key !== targetKeyRef.current) {
    targetKeyRef.current = key
    stableTarget.current = target
  }
  const resolvedTarget = stableTarget.current

  useEffect(() => {
    if (!resolvedTarget) {
      cancelAnimationFrame(rafRef.current)
      liveRef.current = {}
      setCurrent({})
      return
    }

    const from = liveRef.current
    // Merge all keys (old + new) so disappearing keys animate to 0
    const allKeys = new Set([...Object.keys(from), ...Object.keys(resolvedTarget)])
    const toMap = {}
    const fromMap = {}
    for (const k of allKeys) {
      fromMap[k] = from[k] ?? 0
      toMap[k] = resolvedTarget[k] ?? 0
    }

    // Skip animation if nothing changed
    const hasDiff = [...allKeys].some((k) => fromMap[k] !== toMap[k])
    if (!hasDiff) return

    cancelAnimationFrame(rafRef.current)
    const startTime = performance.now()

    function tick(now) {
      const t = Math.min((now - startTime) / duration, 1)
      const eased = appleEase(t)
      const frame = {}
      for (const k of allKeys) {
        const v = fromMap[k] + (toMap[k] - fromMap[k]) * eased
        if (v > 0.001 || toMap[k] > 0) {
          frame[k] = v
        }
      }
      liveRef.current = frame
      setCurrent(frame)

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        // Animation done: only keep keys that exist in target
        const fin = {}
        for (const k of Object.keys(resolvedTarget)) {
          fin[k] = resolvedTarget[k]
        }
        liveRef.current = fin
        setCurrent(fin)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [resolvedTarget, duration])

  return current
}
