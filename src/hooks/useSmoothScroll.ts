import { useEffect } from 'react'
import { lenis } from '../lenis'

/**
 * Inicia o loop `requestAnimationFrame` do Lenis.
 * Deve ser chamado uma vez, no componente raiz (App).
 * Não faz nada se Lenis não foi criado (prefers-reduced-motion).
 */
export function useSmoothScroll() {
  useEffect(() => {
    if (!lenis) return

    let raf = 0
    const tick = (time: number) => {
      lenis!.raf(time)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
    }
  }, [])
}
