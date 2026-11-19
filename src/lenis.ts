/**
 * Singleton do Lenis — criado uma vez, antes de qualquer componente montar.
 * Null quando o usuário prefere movimento reduzido (rolagem nativa).
 *
 * Outros módulos importam `lenis` para chamar scrollTo, stop e start.
 */
import Lenis from 'lenis'

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const lenis = reduced
  ? null
  : new Lenis({
      lerp: 0.09,
      wheelMultiplier: 0.9,
      smoothWheel: true,
      syncTouch: false,   // celular: rolagem nativa
    })

/** Header: TOP (16) + HEIGHT (64) = 80px */
const HEADER_OFFSET = -80

/**
 * Rola suavemente até um id de seção (`#servicos`, `#contato`, etc.),
 * atualiza o hash sem pulo nativo e aplica o offset do header.
 */
export function scrollToSection(hash: string) {
  history.pushState(null, '', hash)
  if (lenis) {
    lenis.scrollTo(hash, { offset: HEADER_OFFSET })
  } else {
    const el = document.querySelector(hash)
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY + HEADER_OFFSET
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' })
    }
  }
}

/** Rola até o topo da página. */
export function scrollToTop() {
  if (lenis) {
    lenis.scrollTo(0)
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

/** Rola até uma posição absoluta (px), usado no foco por teclado no Processo. */
export function scrollToY(y: number) {
  if (lenis) {
    lenis.scrollTo(y)
  } else {
    window.scrollTo({ top: y, behavior: 'auto' })
  }
}
