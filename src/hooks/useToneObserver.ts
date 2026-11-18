import { useEffect, type RefObject } from 'react'

type Tone = 'light' | 'dark' | 'primary'

const DEFAULT_TONE: Tone = 'light'

type Options = {
  /** Distância do topo da tela até o começo da faixa (px). Ignorada se bandBottom estiver definida. */
  bandTop?: number
  /** Distância do fundo da tela até o começo da faixa (px). Calculada dinamicamente no resize. */
  bandBottom?: number
  /** Altura da faixa observada (px). */
  bandHeight: number
}

/**
 * Generalização do useHeaderTone: observa uma faixa em qualquer posição da tela
 * e escreve `data-tone` no elemento alvo conforme a seção marcada sob a faixa.
 *
 * - `bandTop` fixa a faixa a partir do topo (igual ao useHeaderTone).
 * - `bandBottom` ancora a faixa a partir do fundo — útil pra elementos fixed no rodapé
 *   (o valor é recalculado a cada resize).
 * - Nenhuma seção marcada: `data-tone = 'light'`.
 */
export function useToneObserver(
  ref: RefObject<HTMLElement | null>,
  { bandTop, bandBottom, bandHeight }: Options,
) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const targets = [...document.querySelectorAll<HTMLElement>('[data-tone]')].filter(
      (t) => t !== el && !el.contains(t),
    )
    const inBand = new Set<HTMLElement>()

    const resolve = () => {
      const candidates = [...inBand]
      const leaves = candidates.filter((c) => !candidates.some((o) => o !== c && c.contains(o)))
      const bt = bandBottom != null
        ? window.innerHeight - bandBottom - bandHeight
        : (bandTop ?? 0)
      const mid = bt + bandHeight / 2
      let best: HTMLElement | undefined
      let bestDist = Infinity
      for (const leaf of leaves) {
        const r = leaf.getBoundingClientRect()
        const dist = mid < r.top ? r.top - mid : mid > r.bottom ? mid - r.bottom : 0
        if (dist < bestDist) { bestDist = dist; best = leaf }
      }
      const tone = best?.dataset.tone ?? DEFAULT_TONE
      if (el.dataset.tone !== tone) el.dataset.tone = tone
    }

    let io: IntersectionObserver | undefined
    const observe = () => {
      io?.disconnect()
      inBand.clear()
      const bt = bandBottom != null
        ? window.innerHeight - bandBottom - bandHeight
        : (bandTop ?? 0)
      const bottom = Math.max(0, window.innerHeight - bt - bandHeight)
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const t = entry.target as HTMLElement
            if (entry.isIntersecting) inBand.add(t)
            else inBand.delete(t)
          }
          resolve()
        },
        { rootMargin: `-${bt}px 0px -${bottom}px 0px` },
      )
      targets.forEach((t) => io!.observe(t))
    }

    let timer = 0
    const onResize = () => {
      clearTimeout(timer)
      timer = window.setTimeout(observe, 150)
    }

    const mo = new MutationObserver(resolve)
    targets.forEach((t) => mo.observe(t, { attributes: true, attributeFilter: ['data-tone'] }))

    observe()
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(timer)
      io?.disconnect()
      mo.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [ref, bandTop, bandBottom, bandHeight])
}
