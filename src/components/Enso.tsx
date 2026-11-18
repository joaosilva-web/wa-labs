import { memo, type ReactNode, useEffect, useRef, useState } from 'react'
import { BRUSH_WIDTH, ENSO_SPINE, SIZE, getEnsoStrands } from '../assets/ensoBrush'
import styles from './Enso.module.css'

/*
 * Ensō (円相) — o círculo zen de uma pincelada só, propositalmente aberto.
 * O traço vem de src/assets/ensoBrush.ts: centenas de "cerdas" (paths finos)
 * revelados por uma <mask> com a linha central animada por stroke-dashoffset ← var(--enso).
 *
 * As cerdas são geradas uma só vez em requestIdleCallback (ou setTimeout como fallback)
 * para não bloquear o thread principal durante o carregamento da página.
 * Após montados, o React nunca reconcilia os paths novamente — o scroll só muda
 * CSS variables via useViewProgress.
 */

export const Enso = memo(function Enso({ className = '' }: { className?: string }) {
  const svgRef = useRef<SVGSVGElement>(null)
  const spineRef = useRef<SVGPathElement>(null)
  const [strands, setStrands] = useState<ReactNode>(null)

  // Gera os ~1 300 paths em idle para não bloquear o carregamento inicial.
  // Uma vez montados, o estado nunca muda — o React não reconcilia no scroll.
  useEffect(() => {
    const run = () => {
      setStrands(
        <g className={styles.strands}>
          {getEnsoStrands().map(({ d, width, opacity }, i) => (
            <path key={i} d={d} strokeWidth={width} opacity={opacity} />
          ))}
        </g>,
      )
    }
    if (typeof requestIdleCallback !== 'undefined') {
      const id = requestIdleCallback(run)
      return () => cancelIdleCallback(id)
    }
    const id = setTimeout(run, 1)
    return () => clearTimeout(id)
  }, [])

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

      <g mask="url(#enso-reveal)">{strands}</g>
    </svg>
  )
})
