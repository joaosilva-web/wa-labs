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
 * Dois IntersectionObservers:
 *   io      (-15% topo / -8% rodapé) — detecta entrada e saída pelo topo
 *   ioBottom (0px, viewport real)    — detecta quando o elemento saiu
 *                                      completamente por baixo da tela
 *
 * Lógica:
 *   · entrou na faixa (io)                      → data-revealed (900ms)
 *   · saiu pelo topo (io)                       → data-exit="top" (500ms)
 *   · saiu totalmente por baixo (ioBottom)      → oculta instantâneo
 *
 * Elementos já visíveis quando o loader termina revelam sem animação.
 * `firstCb` previne que o callback inicial do io dispare saída falsa.
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
    // callback do io, evitando disparar saída falsa antes de qualquer scroll.
    const firstCb = new Set<HTMLElement>()

    // ioBottom: viewport sem margens. Oculta instantaneamente quando o elemento
    // sai completamente por baixo da tela (usuário rolando pra cima).
    const ioBottom = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) return
          const el = entry.target as HTMLElement
          if (el.hasAttribute('data-reveal-once')) return
          if (!el.hasAttribute('data-revealed')) return
          const rootBounds = entry.rootBounds
          const rect = entry.boundingClientRect
          // Só age quando o elemento está completamente abaixo da tela
          if (rootBounds && rect.top >= rootBounds.bottom) {
            hideInstant(el)
          }
        })
      },
      { threshold: 0, rootMargin: '0px' },
    )

    // io: faixa central. Detecta entrada (revela) e saída pelo topo (anima saída).
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
            if (once) {
              io.unobserve(el)
              ioBottom.unobserve(el)
            }
          } else if (!isFirst && !once && el.hasAttribute('data-revealed')) {
            const rootBounds = entry.rootBounds
            const rect = entry.boundingClientRect
            if (rootBounds && rect.top < rootBounds.top) {
              // Saiu pelo topo — anima saída
              el.removeAttribute('data-revealed')
              el.setAttribute('data-exit', 'top')
            }
            // Saiu pelo rodapé da faixa (ainda visível): ioBottom cuida
            // de esconder quando sair totalmente da tela
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
      ioBottom.observe(el)
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
      ioBottom.disconnect()
      mo.disconnect()
      firstCb.clear()
    }
  }, [isDone])
}
