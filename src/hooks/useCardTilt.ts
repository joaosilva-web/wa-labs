import { useEffect, useRef, type RefObject } from 'react'
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

/* ---------------------------------------------------------------
 * Reflexo líquido (arco de luz dentro do vidro):
 *   GLARE_LERP     persegue o cursor mais devagar que o tilt → "flui" dentro do vidro
 *   STRETCH_AT     atraso (px entre o arco e o cursor) que já conta como esticado ao máximo
 *   STRETCH_MAX    esticão máximo na direção do movimento (scaleX 1 → 1.25)
 *   GLARE_SPRING_* spring do esticão, o mesmo do useFollowPointer (volta com sobra)
 * ------------------------------------------------------------- */
const GLARE_LERP = 0.08
const STRETCH_AT = 240
const STRETCH_MAX = 0.25
const GLARE_SPRING_K = 0.1
const GLARE_SPRING_DAMP = 0.9
/*
 * Ondulação do bisel: 0 → 1 pela velocidade (mesmo atraso do arco), com spring
 * mais amortecido (não pode passar de 0 pra baixo de 75 de forma visível).
 *   RIPPLE_AT     atraso (px) que já conta como ondulação máxima
 *   RIPPLE_EVERY  avisa a cada N frames (mudar o filtro da foto inteira custa caro)
 */
const RIPPLE_AT = 200
const RIPPLE_SPRING_K = 0.08
const RIPPLE_SPRING_DAMP = 0.8
const RIPPLE_EVERY = 2

type Options = {
  /**
   * Ondulação do vidro, 0 → 1 (velocidade do mouse, com spring).
   * Chamado no máximo a cada RIPPLE_EVERY frames, só enquanto muda; termina sempre em 0.
   */
  onRipple?: (amount: number) => void
  /** false desativa todos os listeners (ex.: etapa inativa no Processo). Padrão: true. */
  enabled?: boolean
}

/**
 * Inclina um cartão como se fosse segurado na mão, seguindo o cursor sobre `ref`.
 * Escreve no próprio elemento, sem re-render do React:
 *   --rx, --ry  rotação em graus (número puro; o CSS multiplica por 1deg)
 *   --tilt      intensidade do hover, 0 → 1
 *   data-tilt   presente enquanto --tilt > 0 (o CSS pode desligar camadas caras fora do hover)
 * O canto mais perto do cursor afunda: cursor à direita → rotateY positivo; embaixo → rotateX negativo.
 *
 * Reflexo líquido, no mesmo rAF:
 *   --gx, --gy  posição do arco de luz (0 → 1 na caixa), com atraso (GLARE_LERP)
 *   --gsx       esticão do arco na direção do movimento (1 → 1 + STRETCH_MAX)
 *   --gangle    direção do movimento
 *
 * Só com mouse/trackpad. Com reduced motion não inclina: --tilt vai a 1/0 na hora.
 * Mede a caixa do próprio `ref` (sem transform): ponha a rotação num filho, não nele.
 */
export function useCardTilt(ref: RefObject<HTMLElement | null>, { onRipple, enabled = true }: Options = {}) {
  const fine = useMediaQuery(FINE_POINTER)
  const reduced = useMediaQuery(REDUCED_MOTION)
  // callback numa ref: trocar a função não reinicia o efeito
  const rippleRef = useRef(onRipple)
  useEffect(() => {
    rippleRef.current = onRipple
  })

  useEffect(() => {
    const el = ref.current
    if (!fine || !el || !enabled) return

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

    // arco de luz: posição 0 → 1 na caixa, com atraso; esticão e ondulação com spring
    const gTarget = { x: 0.5, y: 0.5 }
    const g = { x: 0.5, y: 0.5 }
    const box = { w: 1, h: 1 }
    let stretch = 0
    let stretchVel = 0
    let angle = 0
    let ripple = 0
    let rippleVel = 0
    let rippleSent = 0
    let frames = 0

    const writeGlare = () => {
      el.style.setProperty('--gx', g.x.toFixed(4))
      el.style.setProperty('--gy', g.y.toFixed(4))
      el.style.setProperty('--gsx', (1 + Math.min(Math.max(stretch, 0), 1) * STRETCH_MAX).toFixed(4))
      el.style.setProperty('--gangle', `${angle.toFixed(2)}deg`)
    }

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

      // arco: persegue o cursor devagar; o atraso (em px) é a "velocidade"
      const lx = (gTarget.x - g.x) * box.w
      const ly = (gTarget.y - g.y) * box.h
      const lag = Math.hypot(lx, ly)
      const follow = 1 - Math.pow(1 - GLARE_LERP, f)
      g.x += (gTarget.x - g.x) * follow
      g.y += (gTarget.y - g.y) * follow
      if (lag > 2) angle = (Math.atan2(ly, lx) * 180) / Math.PI
      const sGoal = hovering ? Math.min(lag / STRETCH_AT, 1) : 0
      stretchVel = (stretchVel + (sGoal - stretch) * GLARE_SPRING_K * f) * Math.pow(GLARE_SPRING_DAMP, f)
      stretch += stretchVel * f
      const rGoal = hovering ? Math.min(lag / RIPPLE_AT, 1) : 0
      rippleVel = (rippleVel + (rGoal - ripple) * RIPPLE_SPRING_K * f) * Math.pow(RIPPLE_SPRING_DAMP, f)
      ripple += rippleVel * f

      const glareSettled =
        lag < 0.1 &&
        Math.abs(stretch) < 0.001 &&
        Math.abs(stretchVel) < 0.001 &&
        Math.abs(ripple) < 0.002 &&
        Math.abs(rippleVel) < 0.002
      if (glareSettled) {
        g.x = gTarget.x
        g.y = gTarget.y
        stretch = stretchVel = ripple = rippleVel = 0
      }
      writeGlare()

      // ondulação: só a cada RIPPLE_EVERY frames e só se mudou; o 0 final sempre sai
      const rOut = Math.max(0, ripple)
      frames++
      if (rippleRef.current && rOut !== rippleSent && (frames % RIPPLE_EVERY === 0 || rOut === 0)) {
        if (Math.abs(rOut - rippleSent) > 0.005 || rOut === 0) {
          rippleSent = rOut
          rippleRef.current(rOut)
        }
      }

      const settled =
        glareSettled &&
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
      gTarget.x = (nx + 1) / 2
      gTarget.y = (ny + 1) / 2
      box.w = r.width
      box.h = r.height
      // entrando com o vidro apagado: o arco nasce sob o cursor em vez de viajar até ele
      if (tilt === 0 && !hovering) {
        g.x = gTarget.x
        g.y = gTarget.y
        stretch = stretchVel = 0
      }
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
      if (rippleSent) rippleRef.current?.(0)
    }
  }, [ref, fine, reduced, enabled])

  return fine
}

function clear(el: HTMLElement) {
  el.style.removeProperty('--rx')
  el.style.removeProperty('--ry')
  el.style.removeProperty('--tilt')
  for (const v of ['--gx', '--gy', '--gsx', '--gangle']) el.style.removeProperty(v)
  el.removeAttribute('data-tilt')
}
