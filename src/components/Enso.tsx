import { memo, useEffect, useRef } from 'react'
import { BRUSH_WIDTH, ENSO_SPINE, ENSO_STRANDS, SIZE } from '../assets/ensoBrush'
import styles from './Enso.module.css'

/*
 * Ensō (円相) — o círculo zen de uma pincelada só, propositalmente aberto.
 * O traço vem de src/assets/ensoBrush.ts: centenas de "cerdas" (paths finos)
 * revelados por uma <mask> com a linha central animada por stroke-dashoffset ← var(--enso).
 */

// ~1300 paths estáticos: montados uma vez só, fora do ciclo de render.
// O scroll só muda CSS variables — o React nunca reconcilia isto de novo.
const STRANDS = (
  <g className={styles.strands}>
    {ENSO_STRANDS.map(({ d, width, opacity }, i) => (
      <path key={i} d={d} strokeWidth={width} opacity={opacity} />
    ))}
  </g>
)

export const Enso = memo(function Enso({ className = '' }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const spineRef = useRef<SVGPathElement>(null)

  useEffect(() => {
    const svg = svgRef.current
    const spine = spineRef.current
    if (!svg || !spine) return
    const len = spine.getTotalLength()
    svg.style.setProperty('--len', String(len))
    spine.style.strokeDasharray = `${len} ${len}`
  }, [])

  return (
    <svg
      ref={svgRef}
      className={`${styles.enso} ${className}`}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <mask id="enso-reveal" maskUnits="userSpaceOnUse" x="0" y="0" width={SIZE} height={SIZE}>
          {/* 1.5× a largura do pincel: cobre as cerdas que se abrem no fim */}
          <path
            ref={spineRef}
            d={ENSO_SPINE}
            className={styles.spine}
            strokeWidth={BRUSH_WIDTH * 1.5}
          />
        </mask>
      </defs>

      <g mask="url(#enso-reveal)">{STRANDS}</g>
    </svg>
  )
})
