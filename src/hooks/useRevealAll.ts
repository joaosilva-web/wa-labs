import { useEffect } from 'react'
import { useLoader } from '../context/LoaderContext'

const REDUCED = '(prefers-reduced-motion: reduce)'

/**
 * Sistema único de animações de entrada e saída.
 *
 * - `data-reveal`      — anima entrada e saída (bi-direcional)
 * - `data-reveal-once` — revela uma vez, sem saída (comportamento legado)
 * - `data-exit="top"`  — estado de saída animada pelo topo
 *
 * Lógica do IntersectionObserver (-15% topo / -8% rodapé):
 *   · entrou na faixa → data-revealed (entrada, 900ms)
 *   · saiu pelo topo → remove data-revealed, adiciona data-exit="top" (saída, 500ms)
 *   · saiu pelo rodapé (rolando pra cima) → oculta instantaneamente, sem animação
 *
 * Elementos já visíveis quando o loader termina revelam sem animação.
 * `firstCb` previne que o callback inicial do IO dispare saída para esses elementos.
 */
export function useRevealAll() {
  const { isDone } = useLoader()

  useEffect(() => {
    if (!isDone) return

    const reduced = window.matchMedia(REDUCED).matches

    if (reduced) {
      document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
        el.style.transition = 'none'
        el.setAttribute('data-revealed', '')
        void el.getBoundingClientRect()
        el.style.transition = ''
      })
      return
    }

    const inViewport = (el: HTMLElement) => {
      const r = el.getBoundingClientRect()
      return r.top < window.innerHeight && r.bottom > 0
    }

    const hideInstant = (el: HTMLElement) => {
      el.style.transition = 'none'
      el.removeAttribute('data-revealed')
      el.removeAttribute('data-exit')
      void el.getBoundingClientRect()
      el.style.transition = ''
    }

    // Elementos revelados ao startup (inViewport) ficam com firstCb até o primeiro
    // callback do IO, evitando disparar saída falsa antes de qualquer scroll.
    const firstCb = new Set<HTMLElement>()

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement
          const once = el.hasAttribute('data-reveal-once')
          const isFirst = firstCb.has(el)
          if (isFirst) firstCb.delete(el)

          if (entry.isIntersecting) {
            el.removeAttribute('data-exit')
            el.setAttribute('data-revealed', '')
            if (once) io.unobserve(el)
          } else if (!isFirst && !once && el.hasAttribute('data-revealed')) {
            const rootBounds = entry.rootBounds
            const rect = entry.boundingClientRect
            if (rootBounds && rect.top < rootBounds.top) {
              // Saiu pelo topo — anima saída
              el.removeAttribute('data-revealed')
              el.setAttribute('data-exit', 'top')
            } else {
              // Saiu pelo rodapé (usuário rolou pra cima) — oculta sem animação,
              // pronto para entrar de novo quando rolar pra baixo
              hideInstant(el)
            }
          }
        })
      },
      { threshold: 0, rootMargin: '-15% 0px -8% 0px' },
    )

    const register = (el: HTMLElement) => {
      if (el.hasAttribute('data-revealed') || el.hasAttribute('data-exit')) return
      if (inViewport(el)) {
        el.style.transition = 'none'
        el.setAttribute('data-revealed', '')
        void el.getBoundingClientRect()
        el.style.transition = ''
      }
      firstCb.add(el)
      io.observe(el)
    }

    document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(register)

    const mo = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return
          if (node instanceof HTMLElement && node.hasAttribute('data-reveal')) register(node)
          node.querySelectorAll<HTMLElement>('[data-reveal]').forEach(register)
        })
      })
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
      firstCb.clear()
    }
  }, [isDone])
}
