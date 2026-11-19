import { useEffect } from 'react'
import { useLoader } from '../context/LoaderContext'

const REDUCED = '(prefers-reduced-motion: reduce)'

/**
 * Sistema único de animações de entrada.
 *
 * Observa todos os elementos com `data-reveal` e adiciona `data-revealed` quando
 * entram no viewport (~15% visível, rootMargin -8% inferior).
 *
 * - Começa apenas depois que o preloader termina (isDone).
 * - Elementos já no viewport ao iniciar revelam imediatamente, sem transição.
 * - MutationObserver cobre elementos que montam depois.
 * - Reduced-motion: data-revealed é adicionado imediatamente em todos.
 * - will-change é removido via transitionend.
 */
export function useRevealAll() {
  const { isDone } = useLoader()

  useEffect(() => {
    if (!isDone) return

    const reduced = window.matchMedia(REDUCED).matches

    const revealEl = (el: HTMLElement, animate: boolean) => {
      if (!animate || reduced) {
        el.style.transition = 'none'
        el.setAttribute('data-revealed', '')
        // força reflow pra o override de transition ser aplicado antes do próximo paint
        void el.getBoundingClientRect()
        el.style.transition = ''
      } else {
        el.setAttribute('data-revealed', '')
      }
    }

    const inViewport = (el: HTMLElement) => {
      const r = el.getBoundingClientRect()
      return r.top < window.innerHeight && r.bottom > 0
    }

    if (reduced) {
      document.querySelectorAll<HTMLElement>('[data-reveal]').forEach(el => revealEl(el, false))
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          io.unobserve(entry.target)
          revealEl(entry.target as HTMLElement, true)
        })
      },
      { threshold: 0, rootMargin: '0px 0px -8% 0px' },
    )

    const register = (el: HTMLElement) => {
      if (el.hasAttribute('data-revealed')) return
      if (inViewport(el)) {
        revealEl(el, false)
      } else {
        io.observe(el)
      }
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
    }
  }, [isDone])
}
