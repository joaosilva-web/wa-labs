import { useEffect, type RefObject } from 'react'

type Options = {
  enabled: boolean
  /** Fração do caminho até o mouse que o elemento anda por frame. */
  lerp?: number
}

/** Quanto de atraso (px entre o elemento e o mouse) já conta como "esticado ao máximo". */
const STRETCH_AT = 260
/** Esticado ao máximo: 1.10 no eixo do movimento, 0.92 no outro. */
const STRETCH_MAIN = 0.1
const STRETCH_CROSS = 0.08
/** Spring da deformação, por frame de 60fps: rigidez e amortecimento (subamortecido → sobra de gota). */
const SPRING_K = 0.1
const SPRING_DAMP = 0.9
const FRAME = 1000 / 60

/**
 * Faz um elemento `position: fixed` perseguir o mouse enquanto ele está sobre `trackRef`.
 * - posição na propriedade `translate` (fica fora do `transform`, que é da deformação)
 * - material líquido: a velocidade (target − pos) vira um esticão na direção do
 *   movimento, escrito como --sx / --sy / --angle; volta a 1 por um spring, com sobra
 * - tudo num loop de rAF que só roda enquanto há movimento ou o spring não assentou
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
    let stretch = 0 // 0 = gota parada, 1 = esticada ao máximo (passa de 0 no spring)
    let stretchVel = 0
    let angle = 0
    let raf = 0
    let last = 0

    const writePos = () => {
      el.style.translate = `${pos.x}px ${pos.y}px`
    }

    const writeShape = () => {
      // o spring passa de 1 no pico; o limite fica só no que é desenhado (máx. 1.10 / 0.92)
      const s = Math.min(stretch, 1)
      el.style.setProperty('--sx', (1 + s * STRETCH_MAIN).toFixed(4))
      el.style.setProperty('--sy', (1 - s * STRETCH_CROSS).toFixed(4))
      el.style.setProperty('--angle', `${angle.toFixed(2)}deg`)
    }

    const tick = (now: number) => {
      // passo em "frames de 60fps": mesma física em 60, 120 ou 144Hz
      const f = last ? Math.min((now - last) / FRAME, 4) : 1
      last = now

      const vx = target.x - pos.x
      const vy = target.y - pos.y
      const speed = Math.hypot(vx, vy)

      const follow = 1 - Math.pow(1 - lerp, f)
      pos.x += vx * follow
      pos.y += vy * follow

      // direção só quando há movimento de verdade (parado, o ângulo fica onde estava)
      if (speed > 2) angle = (Math.atan2(vy, vx) * 180) / Math.PI

      // spring: persegue o esticão pedido pela velocidade e passa um pouco ao voltar
      const goal = Math.min(speed / STRETCH_AT, 1)
      stretchVel = (stretchVel + (goal - stretch) * SPRING_K * f) * Math.pow(SPRING_DAMP, f)
      stretch += stretchVel * f

      const settled =
        speed < 0.1 && Math.abs(stretch) < 0.001 && Math.abs(stretchVel) < 0.001
      if (settled) {
        pos.x = target.x
        pos.y = target.y
        stretch = 0
        stretchVel = 0
      }
      writePos()
      writeShape()
      raf = settled ? 0 : requestAnimationFrame(tick)
      if (!raf) last = 0
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      target.x = e.clientX
      target.y = e.clientY
      if (!raf) {
        last = 0
        raf = requestAnimationFrame(tick)
      }
    }

    const onEnter = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      if (!el.hasAttribute('data-visible')) {
        pos.x = target.x = e.clientX
        pos.y = target.y = e.clientY
        stretch = stretchVel = 0
        writePos()
        writeShape()
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
      el.style.removeProperty('translate')
      el.style.removeProperty('--sx')
      el.style.removeProperty('--sy')
      el.style.removeProperty('--angle')
    }
  }, [elRef, trackRef, enabled, lerp])
}
