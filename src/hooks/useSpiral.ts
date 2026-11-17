import { useEffect, useRef, type RefObject } from 'react'

type SpiralOptions = {
  /** Elemento que recebe os eventos de ponteiro (o canvas tem pointer-events: none). */
  trackRef?: RefObject<HTMLElement | null>
  /** Reage ao mouse (ponteiro fino). Sem isso: menos braços, espaçamento maior, só rotação. */
  interactive: boolean
  /** false = reduced motion: desenha uma vez, parada, sem loop. */
  animate: boolean
  /** false = fade-out do scroll terminou: para de desenhar. */
  active: boolean
}

const TAU = Math.PI * 2
const STEP = 6 // px entre pontos ao longo da linha
const TURN_SECONDS = 60 // rotação de repouso: 1 volta / 60s
const FOLLOW = 0.06 // lerp do centro por frame (60fps)
const TIGHTEN = 0.3 // o espaçamento diminui até 30% com o mouse rápido
const SPEED_MAX = 2200 // px/s que contam como "energia" máxima
const PUSH_RADIUS = 180
const PUSH_MAX = 12
const ACCENT_RADIUS = 150 // trecho perto do centro que usa --color-primary
const LINE_ALPHA = 0.08
const ACCENT_ALPHA = 0.25

/** Lerp "por frame a 60fps" independente do frame rate real. */
const lerpFactor = (perFrame: number, dt: number) => 1 - Math.pow(1 - perFrame, dt * 60)

/**
 * Espirais de Arquimedes entrelaçadas num canvas 2D.
 * O centro persegue o mouse, a velocidade do mouse gira e aperta a espiral,
 * e as linhas desviam do cursor. Todo o estado vive fora do React.
 */
export function useSpiral(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  { trackRef, interactive, animate, active }: SpiralOptions,
) {
  const activeRef = useRef(active)
  const syncRef = useRef<() => void>(() => {})

  useEffect(() => {
    activeRef.current = active
    syncRef.current()
  }, [active])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const arms = interactive ? 6 : 4
    const baseGap = interactive ? 28 : 40 // distância entre linhas vizinhas

    let w = 0
    let h = 0
    let dpr = 1
    let textColor = ''
    let accentColor = ''

    // centro atual e ponteiro (coordenadas do canvas)
    let cx = 0
    let cy = 0
    let px = 0
    let py = 0
    let inside = false
    let influence = 0 // 0..1, liga/desliga a deformação suavemente
    let rawSpeed = 0 // px/s
    let energy = 0 // 0..1, com easing
    let lastMove = 0
    let rot = 0

    let rect = canvas.getBoundingClientRect()
    let raf = 0
    let last = 0
    let inView = true
    let pageVisible = !document.hidden
    let sized = false

    const readColors = () => {
      const cs = getComputedStyle(canvas)
      textColor = cs.getPropertyValue('--color-text').trim() || 'currentColor'
      accentColor = cs.getPropertyValue('--color-primary').trim() || textColor
    }

    const draw = () => {
      if (!w || !h) return
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const gap = baseGap * (1 - TIGHTEN * energy)
      const b = (gap * arms) / TAU // r = b·θ; braços vizinhos ficam a `gap` px
      const rMax = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) + PUSH_MAX
      const thetaMax = rMax / b
      const push = influence > 0.001
      const r2 = PUSH_RADIUS * PUSH_RADIUS
      const pad = 8
      const main = new Path2D()
      const accent = new Path2D()

      for (let a = 0; a < arms; a++) {
        const offset = rot + (a * TAU) / arms
        // dois braços opostos começam com o detalhe na cor primária
        let path = a === 0 || a === arms / 2 ? accent : main
        let pen = false
        let theta = 0

        while (theta <= thetaMax) {
          const r = b * theta
          const ang = theta + offset
          let x = cx + r * Math.cos(ang)
          let y = cy + r * Math.sin(ang)

          if (push) {
            const dx = x - px
            const dy = y - py
            const d2 = dx * dx + dy * dy
            if (d2 < r2 && d2 > 0.01) {
              const d = Math.sqrt(d2)
              const f = 1 - d / PUSH_RADIUS
              const k = (f * f * (3 - 2 * f) * PUSH_MAX * influence) / d
              x += dx * k
              y += dy * k
            }
          }

          // fora da tela: levanta a caneta (não gasta stroke com o invisível)
          if (x < -pad || x > w + pad || y < -pad || y > h + pad) pen = false
          else if (pen) path.lineTo(x, y)
          else {
            path.moveTo(x, y)
            pen = true
          }

          if (path === accent && r > ACCENT_RADIUS) {
            path = main
            if (pen) main.moveTo(x, y)
          }

          theta += STEP / Math.sqrt(r * r + b * b)
        }
      }

      ctx.lineWidth = 1
      ctx.globalAlpha = LINE_ALPHA
      ctx.strokeStyle = textColor
      ctx.stroke(main)
      ctx.globalAlpha = ACCENT_ALPHA
      ctx.strokeStyle = accentColor
      ctx.stroke(accent)
      ctx.globalAlpha = 1
    }

    const update = (dt: number) => {
      // sem eventos de movimento, a velocidade bruta morre rápido; a energia volta com easing
      if (performance.now() - lastMove > 50) rawSpeed *= Math.exp(-dt * 12)
      const targetEnergy = Math.min(1, rawSpeed / SPEED_MAX)
      energy += (targetEnergy - energy) * lerpFactor(targetEnergy > energy ? 0.12 : 0.04, dt)

      rot += dt * (TAU / TURN_SECONDS) * (1 + energy * 14)

      const tx = inside ? px : w / 2
      const ty = inside ? py : h / 2
      const follow = lerpFactor(inside ? FOLLOW : FOLLOW * 0.5, dt)
      cx += (tx - cx) * follow
      cy += (ty - cy) * follow

      influence += ((inside ? 1 : 0) - influence) * lerpFactor(0.1, dt)
    }

    const tick = (t: number) => {
      const dt = last ? Math.min(0.05, (t - last) / 1000) : 1 / 60
      last = t
      update(dt)
      draw()
      raf = requestAnimationFrame(tick)
    }

    const sync = () => {
      const run = animate && activeRef.current && inView && pageVisible && sized
      if (run && !raf) {
        last = 0
        raf = requestAnimationFrame(tick)
      } else if (!run && raf) {
        cancelAnimationFrame(raf)
        raf = 0
      }
    }
    syncRef.current = sync

    const resize = () => {
      const nw = canvas.clientWidth
      const nh = canvas.clientHeight
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(nw * dpr)
      canvas.height = Math.round(nh * dpr)
      if (!sized || !inside) {
        // primeiro tamanho (ou sem mouse): centro no meio da hero
        cx = sized ? cx + (nw - w) / 2 : nw / 2
        cy = sized ? cy + (nh - h) / 2 : nh / 2
      }
      w = nw
      h = nh
      sized = w > 0 && h > 0
      rect = canvas.getBoundingClientRect()
      readColors()
      draw() // mudar o tamanho limpa o canvas: redesenha já, mesmo pausado
      sync()
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      sync()
    })
    io.observe(canvas)

    const onVisibility = () => {
      pageVisible = !document.hidden
      sync()
    }
    document.addEventListener('visibilitychange', onVisibility)

    // ----- mouse (só com ponteiro fino e movimento liberado) -----
    const track = trackRef?.current
    const listen = interactive && animate && track
    const updateRect = () => {
      rect = canvas.getBoundingClientRect()
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const now = e.timeStamp || performance.now()
      if (inside && lastMove) {
        const dtMs = Math.max(8, now - lastMove)
        const inst = (Math.hypot(x - px, y - py) / dtMs) * 1000
        rawSpeed += (inst - rawSpeed) * 0.5
      }
      px = x
      py = y
      lastMove = now
      inside = true
    }
    const onEnter = (e: PointerEvent) => {
      updateRect()
      lastMove = 0
      onMove(e)
    }
    const onLeave = () => {
      inside = false
    }

    if (listen) {
      track.addEventListener('pointerenter', onEnter)
      track.addEventListener('pointermove', onMove, { passive: true })
      track.addEventListener('pointerleave', onLeave)
      window.addEventListener('scroll', updateRect, { passive: true })
    }

    return () => {
      cancelAnimationFrame(raf)
      raf = 0
      syncRef.current = () => {}
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      if (listen) {
        track.removeEventListener('pointerenter', onEnter)
        track.removeEventListener('pointermove', onMove)
        track.removeEventListener('pointerleave', onLeave)
        window.removeEventListener('scroll', updateRect)
      }
    }
  }, [canvasRef, trackRef, interactive, animate])
}
