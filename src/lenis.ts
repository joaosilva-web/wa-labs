/**
 * Singleton do Lenis — criado uma vez, antes de qualquer componente montar.
 * Null quando o usuário prefere movimento reduzido (rolagem nativa).
 *
 * `anchors: { offset: HEADER_OFFSET }` intercepta todos os links `href="#..."`
 * da página automaticamente, sem onClick em cada componente.
 */
import Lenis from 'lenis'

/** Header: TOP (16) + HEIGHT (64) = 80px */
const HEADER_OFFSET = -80

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const lenis = reduced
  ? null
  : new Lenis({
      lerp: 0.09,
      wheelMultiplier: 0.9,
      smoothWheel: true,
      syncTouch: false,                       // celular: rolagem nativa
      anchors: { offset: HEADER_OFFSET },     // intercepta <a href="#..."> globalmente
    })

/** Rola até o topo da página. */
export function scrollToTop() {
  if (lenis) {
    lenis.scrollTo(0)
  } else {
    window.scrollTo({ top: 0, behavior: 'auto' })
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
