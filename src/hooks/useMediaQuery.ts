import { useCallback, useSyncExternalStore } from 'react'

/** Mouse/trackpad de verdade — no touch, os efeitos de cursor ficam desligados. */
export const FINE_POINTER = '(hover: hover) and (pointer: fine)'
export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

/** true/false para uma media query, reagindo a mudanças em tempo real. */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    [query],
  )
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  )
}

/** Efeitos que dependem do mouse: precisam de ponteiro fino e de movimento liberado. */
export function usePointerEffects() {
  const fine = useMediaQuery(FINE_POINTER)
  const reduced = useMediaQuery(REDUCED_MOTION)
  return fine && !reduced
}
