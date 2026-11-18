import { useEffect, type RefObject } from 'react'

export type Tone = 'light' | 'dark' | 'primary'

/** Tom quando nenhuma seção com data-tone está sob o header. */
const DEFAULT_TONE: Tone = 'light'

type Options = {
  /** Distância do topo da tela até o começo da faixa observada (px). */
  bandTop: number
  /** Altura da faixa (px). */
  bandHeight: number
}

/**
 * Descobre o tom (`data-tone`) da seção que está sob o header e escreve no próprio header.
 *
 * - IntersectionObserver com rootMargin reduzindo a viewport a uma faixa no topo da tela
 * - a cada mudança: entre as seções na faixa, ganha a mais interna (a faixa verde dentro de
 *   Serviços, a caixa verde dentro de Contato) que cobre o meio da faixa
 * - MutationObserver: seções que trocam de tom sozinhas (o fim da hero escurece) também valem
 * - nenhuma seção marcada na faixa: tom 'light'
 * Nada roda por frame: só nos cruzamentos.
 */
export function useHeaderTone(
  headerRef: RefObject<HTMLElement | null>,
  { bandTop, bandHeight }: Options,
) {
  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    const targets = [...document.querySelectorAll<HTMLElement>('[data-tone]')].filter(
      (el) => el !== header && !header.contains(el),
    )
    const inBand = new Set<HTMLElement>()
    const mid = bandTop + bandHeight / 2

    const resolve = () => {
      const candidates = [...inBand]
      // a mais interna: descarta quem contém outra candidata
      const leaves = candidates.filter((el) => !candidates.some((o) => o !== el && el.contains(o)))
      let best: HTMLElement | undefined
      let bestDist = Infinity
      for (const el of leaves) {
        const r = el.getBoundingClientRect()
        const dist = mid < r.top ? r.top - mid : mid > r.bottom ? mid - r.bottom : 0
        if (dist < bestDist) {
          bestDist = dist
          best = el
        }
      }
      // nenhuma seção marcada sob o header: tom padrão
      const tone = best?.dataset.tone ?? DEFAULT_TONE
      if (header.dataset.tone !== tone) header.dataset.tone = tone
    }

    let io: IntersectionObserver | undefined
    const observe = () => {
      io?.disconnect()
      inBand.clear()
      const bottom = Math.max(0, window.innerHeight - bandTop - bandHeight)
      io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            const el = entry.target as HTMLElement
            if (entry.isIntersecting) inBand.add(el)
            else inBand.delete(el)
          }
          resolve()
        },
        { rootMargin: `-${bandTop}px 0px -${bottom}px 0px` },
      )
      targets.forEach((el) => io!.observe(el))
    }

    // a margem de baixo depende da altura da tela: refaz o observer no resize (com debounce)
    let timer = 0
    const onResize = () => {
      clearTimeout(timer)
      timer = window.setTimeout(observe, 150)
    }

    const mo = new MutationObserver(resolve)
    targets.forEach((el) => mo.observe(el, { attributes: true, attributeFilter: ['data-tone'] }))

    observe()
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(timer)
      io?.disconnect()
      mo.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [headerRef, bandTop, bandHeight])
}
