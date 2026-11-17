import { useEffect, type RefObject } from 'react'
import { usePointerEffects } from './useMediaQuery'

type Options = {
  /** Seletor das letras que reagem (dentro do escopo). */
  selector?: string
  min?: number
  max?: number
  /** Raio de influência em múltiplos da altura da fonte. */
  radius?: number
  /** Fração do caminho até o peso-alvo que cada letra anda por frame. */
  lerp?: number
  /** Liga/desliga por fora (ex.: só com a hero em repouso). */
  active?: boolean
}

type Letter = { el: HTMLElement; x: number; y: number; weight: number; written: number }

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

/**
 * Peso variável por proximidade: cada letra engrossa conforme o cursor chega perto.
 * - centros das letras em cache (recalculados em resize/scroll, ao entrar na área e quando tudo assenta)
 * - o loop de rAF só roda enquanto alguma letra está mudando
 * - desligado no touch e com prefers-reduced-motion
 */
export function useProximityWeight(
  scopeRef: RefObject<HTMLElement | null>,
  {
    selector = '[data-proximity]',
    min = 200,
    max = 900,
    radius = 1.2,
    lerp = 0.15,
    active = true,
  }: Options = {},
) {
  const enabled = usePointerEffects() && active

  useEffect(() => {
    const scope = scopeRef.current
    if (!scope) return

    const letters: Letter[] = [...scope.querySelectorAll<HTMLElement>(selector)].map((el) => ({
      el,
      x: 0,
      y: 0,
      weight: min,
      written: min,
    }))
    const reset = () => letters.forEach(({ el }) => (el.style.fontVariationSettings = ''))

    if (!enabled || letters.length === 0) {
      reset() // volta ao repouso definido no CSS
      return
    }

    let pointer: { x: number; y: number } | null = null
    let reach = 100
    let dirty = true
    let frame = 0

    const measure = () => {
      for (const l of letters) {
        const r = l.el.getBoundingClientRect()
        l.x = r.left + r.width / 2
        l.y = r.top + r.height / 2
      }
      reach = parseFloat(getComputedStyle(letters[0].el).fontSize) * radius
      dirty = false
    }

    const tick = () => {
      frame = 0
      if (dirty) measure()

      let moving = false
      for (const l of letters) {
        let target = min
        if (pointer) {
          const d = Math.hypot(pointer.x - l.x, pointer.y - l.y)
          if (d < reach) target = min + (max - min) * easeOutCubic(1 - d / reach)
        }
        l.weight += (target - l.weight) * lerp
        if (Math.abs(target - l.weight) < 0.5) l.weight = target
        else moving = true

        const rounded = Math.round(l.weight)
        if (rounded !== l.written) {
          l.written = rounded
          l.el.style.fontVariationSettings = `"wght" ${rounded}`
        }
      }

      if (moving) frame = requestAnimationFrame(tick)
      // as letras mudam de largura com o peso: remede quando tudo assenta
      else dirty = true
    }

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(tick)
    }
    const invalidate = () => {
      dirty = true
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return
      pointer = { x: e.clientX, y: e.clientY }
      wake()
    }
    const onLeave = () => {
      pointer = null
      wake()
    }

    scope.addEventListener('pointerenter', invalidate)
    scope.addEventListener('pointermove', onMove)
    scope.addEventListener('pointerleave', onLeave)
    window.addEventListener('scroll', invalidate, { passive: true })
    window.addEventListener('resize', invalidate)
    document.fonts?.ready.then(invalidate)

    return () => {
      cancelAnimationFrame(frame)
      scope.removeEventListener('pointerenter', invalidate)
      scope.removeEventListener('pointermove', onMove)
      scope.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('scroll', invalidate)
      window.removeEventListener('resize', invalidate)
      reset()
    }
  }, [scopeRef, enabled, selector, min, max, radius, lerp])
}
