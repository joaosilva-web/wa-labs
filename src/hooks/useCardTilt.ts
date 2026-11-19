import { useEffect, type RefObject } from 'react'
import { FINE_POINTER, REDUCED_MOTION, useMediaQuery } from './useMediaQuery'

/** Inclinação máxima (graus): cursor na borda direita → rotateY +10°, no topo → rotateX +8°. */
const MAX_RY = 10
const MAX_RX = 8
/** Fração do caminho até o alvo por frame de 60fps (persegue o cursor). */
const LERP = 0.12
/** Intensidade do hover (--tilt): ~300ms pra chegar em 1 ou voltar a 0. */
const TILT_LERP = 0.15
/**
 * Volta a 0° ao sair: mesma rigidez do spring do useFollowPointer (0.1), mas mais amortecido.
 * Com o 0.9 de lá, a carta passava ~65% do outro lado e balançava por mais de 1s
 * (no useFollowPointer isso não aparece porque o esticão desenhado é limitado a 1).
 * 0.72 → sobra de ~10–15%, uma ida e volta.
 */
const SPRING_K = 0.1
const SPRING_DAMP = 0.72
const FRAME = 1000 / 60

/**
 * Inclina um cartão como se fosse segurado na mão, seguindo o cursor sobre `ref`.
 * Escreve no próprio elemento, sem re-render do React:
 *   --rx, --ry  rotação em graus (número puro; o CSS multiplica por 1deg)
 *   --tilt      intensidade do hover, 0 → 1
 *   data-tilt   presente enquanto --tilt > 0 (o CSS pode desligar camadas caras fora do hover)
 * O canto mais perto do cursor afunda: cursor à direita → rotateY positivo; embaixo → rotateX negativo.
 *
 * Só com mouse/trackpad. Com reduced motion não inclina: --tilt vai a 1/0 na hora.
 * Mede a caixa do próprio `ref` (sem transform): ponha a rotação num filho, não nele.
 */
export function useCardTilt(ref: RefObject<HTMLElement | null>) {
  const fine = useMediaQuery(FINE_POINTER)
  const reduced = useMediaQuery(REDUCED_MOTION)

  useEffect(() => {
    const el = ref.current
    if (!fine || !el) return

    const write = (rx: number, ry: number, tilt: number) => {
      el.style.setProperty('--rx', rx.toFixed(3))
      el.style.setProperty('--ry', ry.toFixed(3))
      el.style.setProperty('--tilt', tilt.toFixed(4))
      el.toggleAttribute('data-tilt', tilt > 0)
    }

    if (reduced) {
      const on = () => write(0, 0, 1)
      const off = () => write(0, 0, 0)
      el.addEventListener('pointerenter', on)
      el.addEventListener('pointerleave', off)
      return () => {
        el.removeEventListener('pointerenter', on)
        el.removeEventListener('pointerleave', off)
        clear(el)
      }
    }

    const target = { rx: 0, ry: 0 }
    const cur = { rx: 0, ry: 0 }
    const vel = { rx: 0, ry: 0 }
    let hovering = false
    let tilt = 0
    let raf = 0
    let last = 0

    const tick = (now: number) => {
      const f = last ? Math.min((now - last) / FRAME, 4) : 1
      last = now

      for (const k of ['rx', 'ry'] as const) {
        if (hovering) {
          // persegue o cursor; guarda a velocidade pro spring continuar sem tranco ao sair
          const step = (target[k] - cur[k]) * (1 - Math.pow(1 - LERP, f))
          vel[k] = step / f
          cur[k] += step
        } else {
          vel[k] = (vel[k] + (0 - cur[k]) * SPRING_K * f) * Math.pow(SPRING_DAMP, f)
          cur[k] += vel[k] * f
        }
      }
      tilt += ((hovering ? 1 : 0) - tilt) * (1 - Math.pow(1 - TILT_LERP, f))

      const settled =
        Math.abs(target.rx - cur.rx) < 0.01 &&
        Math.abs(target.ry - cur.ry) < 0.01 &&
        Math.abs(vel.rx) < 0.01 &&
        Math.abs(vel.ry) < 0.01 &&
        Math.abs((hovering ? 1 : 0) - tilt) < 0.002
      if (settled) {
        cur.rx = target.rx
        cur.ry = target.ry
        vel.rx = vel.ry = 0
        tilt = hovering ? 1 : 0
      }
      write(cur.rx, cur.ry, tilt)
      raf = settled ? 0 : requestAnimationFrame(tick)
      if (!raf) last = 0
    }

    const start = () => {
      if (!raf) {
        last = 0
        raf = requestAnimationFrame(tick)
      }
    }

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const r = el.getBoundingClientRect()
      // -1 → 1 em cada eixo, a partir do centro
      const nx = Math.min(1, Math.max(-1, ((e.clientX - r.left) / r.width) * 2 - 1))
      const ny = Math.min(1, Math.max(-1, ((e.clientY - r.top) / r.height) * 2 - 1))
      target.ry = nx * MAX_RY
      target.rx = -ny * MAX_RX
      hovering = true
      start()
    }

    const onLeave = () => {
      hovering = false
      target.rx = target.ry = 0
      start()
    }

    el.addEventListener('pointerenter', onMove)
    el.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('pointerenter', onMove)
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
      clear(el)
    }
  }, [ref, fine, reduced])

  return fine
}

function clear(el: HTMLElement) {
  el.style.removeProperty('--rx')
  el.style.removeProperty('--ry')
  el.style.removeProperty('--tilt')
  el.removeAttribute('data-tilt')
}
