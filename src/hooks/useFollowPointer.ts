import { useEffect, type RefObject } from 'react'

type Options = {
  enabled: boolean
  /** Fração do caminho até o mouse que o elemento anda por frame. */
  lerp?: number
}

/**
 * Faz um elemento `position: fixed` perseguir o mouse enquanto ele está sobre `trackRef`.
 * - posição escrita direto no style (translate3d) num loop de rAF que só roda enquanto há movimento
 * - `data-visible` no elemento quando o mouse está dentro da área (a entrada/saída é CSS)
 * - ao entrar, o elemento "nasce" sob o cursor em vez de viajar de onde parou
 */
export function useFollowPointer(
  elRef: RefObject<HTMLElement | null>,
  trackRef: RefObject<HTMLElement | null>,
  { enabled, lerp = 0.12 }: Options,
) {
  useEffect(() => {
    const el = elRef.current
    const track = trackRef.current
    if (!enabled || !el || !track) return

    const target = { x: 0, y: 0 }
    const pos = { x: 0, y: 0 }
    let raf = 0

    const write = () => {
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
    }

    const tick = () => {
      pos.x += (target.x - pos.x) * lerp
      pos.y += (target.y - pos.y) * lerp
      const settled = Math.abs(target.x - pos.x) < 0.1 && Math.abs(target.y - pos.y) < 0.1
      if (settled) {
        pos.x = target.x
        pos.y = target.y
      }
      write()
      raf = settled ? 0 : requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      target.x = e.clientX
      target.y = e.clientY
      if (!raf) raf = requestAnimationFrame(tick)
    }

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      if (!el.hasAttribute('data-visible')) {
        pos.x = target.x = e.clientX
        pos.y = target.y = e.clientY
        write()
      }
      el.setAttribute('data-visible', '')
    }

    const onLeave = () => el.removeAttribute('data-visible')

    track.addEventListener('pointerenter', onEnter)
    track.addEventListener('pointermove', onMove, { passive: true })
    track.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      track.removeEventListener('pointerenter', onEnter)
      track.removeEventListener('pointermove', onMove)
      track.removeEventListener('pointerleave', onLeave)
      el.removeAttribute('data-visible')
      el.style.removeProperty('transform')
    }
  }, [elRef, trackRef, enabled, lerp])
}
