import { useEffect, useRef, type RefObject } from 'react'

type Options = {
  /** Elemento sticky dentro do wrapper; o trajeto do pin é a altura do wrapper menos a dele. */
  pinnedRef: RefObject<HTMLElement | null>
  enabled?: boolean
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/**
 * Progresso (0 → 1) do scroll atravessando um wrapper alto com conteúdo sticky.
 * Listener passivo + rAF: no máximo uma leitura de layout por frame, e o callback
 * só dispara quando o valor muda. Não causa re-render: quem chama decide o que fazer
 * com o valor (normalmente escrever uma CSS variable).
 */
export function useScrollProgress(
  wrapperRef: RefObject<HTMLElement | null>,
  onProgress: (p: number) => void,
  { pinnedRef, enabled = true }: Options,
) {
  const callback = useRef(onProgress)
  callback.current = onProgress

  useEffect(() => {
    const wrapper = wrapperRef.current
    const pinned = pinnedRef.current
    if (!enabled || !wrapper || !pinned) return

    let frame = 0
    let last = -1

    const update = () => {
      frame = 0
      const travel = wrapper.offsetHeight - pinned.offsetHeight
      const top = wrapper.getBoundingClientRect().top
      const p = travel > 0 ? clamp01(-top / travel) : 0
      if (p !== last) {
        last = p
        callback.current(p)
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
    }
  }, [wrapperRef, pinnedRef, enabled])
}
