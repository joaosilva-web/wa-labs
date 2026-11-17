import { useEffect, useState } from 'react'
import { REDUCED_MOTION, useMediaQuery } from './useMediaQuery'

/**
 * Índice que avança a cada `interval` ms (corte seco).
 * Pausa com a aba oculta e com `paused` (mantém o item atual);
 * com prefers-reduced-motion fica parado no primeiro item.
 */
export function useReel(count: number, interval = 1200, paused = false) {
  const reduced = useMediaQuery(REDUCED_MOTION)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (reduced || count < 2) {
      setIndex(0)
      return
    }
    if (paused) return

    let id = 0
    const start = () => {
      if (!id) id = window.setInterval(() => setIndex((i) => (i + 1) % count), interval)
    }
    const stop = () => {
      window.clearInterval(id)
      id = 0
    }
    const onVisibility = () => (document.hidden ? stop() : start())

    if (!document.hidden) start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [count, interval, reduced, paused])

  return index
}
