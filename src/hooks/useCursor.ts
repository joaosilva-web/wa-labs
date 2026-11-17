import { useEffect, type RefObject } from 'react'

const HOVER_TARGETS = 'a, button, [data-cursor="hover"]'

/**
 * Faz o elemento seguir o mouse com lerp (rAF) e marca `data-state`:
 * "hover" sobre links/botões, "hidden" antes do primeiro movimento e fora da janela.
 */
export function useCursor(ref: RefObject<HTMLElement | null>, enabled: boolean, lerp = 0.2) {
  useEffect(() => {
    const el = ref.current
    if (!enabled || !el) return

    const target = { x: 0, y: 0 }
    const pos = { x: 0, y: 0 }
    let frame = 0
    let seen = false

    const tick = () => {
      pos.x += (target.x - pos.x) * lerp
      pos.y += (target.y - pos.y) * lerp
      const settled = Math.abs(target.x - pos.x) < 0.1 && Math.abs(target.y - pos.y) < 0.1
      if (settled) {
        pos.x = target.x
        pos.y = target.y
      }
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`
      frame = settled ? 0 : requestAnimationFrame(tick)
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return
      target.x = e.clientX
      target.y = e.clientY
      if (!seen) {
        // primeira aparição: nasce no lugar, sem "voar" do canto
        seen = true
        pos.x = target.x
        pos.y = target.y
      }
      const hovering = (e.target as Element | null)?.closest?.(HOVER_TARGETS)
      el.dataset.state = hovering ? 'hover' : 'idle'
      if (!frame) frame = requestAnimationFrame(tick)
    }
    const onLeave = () => {
      el.dataset.state = 'hidden'
    }

    el.dataset.state = 'hidden'
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
    }
  }, [ref, enabled, lerp])
}
