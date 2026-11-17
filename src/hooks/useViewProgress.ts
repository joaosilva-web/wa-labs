import { useEffect, type RefObject } from 'react'
import { REDUCED_MOTION, useMediaQuery } from './useMediaQuery'

type Options = {
  /** p = 0 quando o TOPO do elemento chega a esta fração da altura da tela. */
  start?: number
  /** p = 1 quando o FUNDO do elemento chega a esta fração da altura da tela. */
  end?: number
  /** CSS variable escrita no elemento. */
  varName?: string
  /** Escreve a variável em outro elemento (o progresso continua sendo do `ref`). */
  targetRef?: RefObject<HTMLElement | null>
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/**
 * Progresso (0 → 1) de um elemento atravessando a viewport, escrito direto como
 * CSS variable no elemento. Listener passivo + rAF, uma leitura de layout por frame,
 * sem re-render. Com prefers-reduced-motion fica fixo em 1 (tudo no estado final).
 */
export function useViewProgress(
  ref: RefObject<HTMLElement | null>,
  { start = 0.85, end = 0.45, varName = '--p', targetRef }: Options = {},
) {
  const reduced = useMediaQuery(REDUCED_MOTION)

  useEffect(() => {
    const el = ref.current
    const target = targetRef ? targetRef.current : el
    if (!el || !target) return

    if (reduced) {
      target.style.setProperty(varName, '1')
      return () => target.style.removeProperty(varName)
    }

    let frame = 0
    let last = ''

    const update = () => {
      frame = 0
      const vh = window.innerHeight
      const r = el.getBoundingClientRect()
      // topo em start·vh → 0 · fundo em end·vh → 1
      const travel = (start - end) * vh + r.height
      const p = travel > 0 ? clamp01((start * vh - r.top) / travel) : 1
      const value = p.toFixed(4)
      if (value !== last) {
        last = value
        target.style.setProperty(varName, value)
      }
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      target.style.removeProperty(varName)
    }
  }, [ref, targetRef, start, end, varName, reduced])
}
