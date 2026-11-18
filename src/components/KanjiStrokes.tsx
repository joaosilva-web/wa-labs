import { forwardRef, useImperativeHandle, useRef } from 'react'
import { KANJI_STROKES } from '../assets/logoStrokes'

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

export interface KanjiStrokesHandle {
  /** Measure stroke lengths and set initial visual state. Call once after mount. */
  init(mode: 'full' | 'quick'): void
  /** Draw all strokes based on progress 0 → 1 (each stroke gets an equal slice). */
  drawTo(progress: number): void
}

/**
 * Os 8 traços do 和 como paths SVG animáveis.
 * Expõe `init()` e `drawTo()` via ref para controle imperativo.
 * Reutilizado no Preloader e no bloco "Por que Wa?" da seção Sobre.
 */
export const KanjiStrokes = forwardRef<KanjiStrokesHandle, { className?: string }>(
  function KanjiStrokes({ className }, ref) {
    const pathRefs = useRef<(SVGPathElement | null)[]>([])
    const lengths = useRef<number[]>([])

    useImperativeHandle(ref, () => ({
      init(mode) {
        const paths = pathRefs.current.filter(Boolean) as SVGPathElement[]
        lengths.current = paths.map((p) => p.getTotalLength())
        const hidden = mode === 'full'
        paths.forEach((p, i) => {
          p.style.strokeDasharray = `${lengths.current[i]}`
          p.style.strokeDashoffset = hidden ? `${lengths.current[i]}` : '0'
          p.style.opacity = hidden ? '0' : '1'
        })
      },
      drawTo(progress) {
        const n = KANJI_STROKES.length
        if (n === 0) return
        const slice = 1 / n
        pathRefs.current.forEach((p, i) => {
          if (!p || lengths.current[i] === undefined) return
          const f = clamp01((progress - i * slice) / slice)
          p.style.strokeDashoffset = `${lengths.current[i] * (1 - f)}`
          p.style.opacity = f > 0 ? '1' : '0'
        })
      },
    }))

    return (
      <g className={className}>
        {KANJI_STROKES.map((d, i) => (
          <path
            key={i}
            d={d}
            data-stroke={i + 1}
            data-closed={/z\s*$/i.test(d) || undefined}
            ref={(el) => {
              pathRefs.current[i] = el
            }}
          />
        ))}
      </g>
    )
  },
)
