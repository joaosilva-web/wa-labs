import { useEffect, useRef } from 'react'
import styles from './Enso.module.css'

/*
 * Ensō (円相) — o círculo zen de uma pincelada só, propositalmente aberto.
 * O traço é um path PREENCHIDO gerado por código (raio levemente irregular,
 * espessura grossa no início afinando no fim) e é revelado por uma <mask>
 * com um traço central grosso animado por stroke-dashoffset ← var(--enso).
 */

// ---------- parâmetros (viewBox 1000 × 1000) ----------
const SIZE = 1000
const CX = 500
const CY = 500
const RADIUS = 390
/** Início do traço, em graus (0 = direita, sentido horário na tela). */
const START_DEG = 62 // baixo-direita: início grosso, abertura e pontinho ficam no lado visível
/** Quanto do círculo o pincel percorre — < 360 pra ficar aberto. */
const SWEEP_DEG = 322
/** Irregularidade do raio: [amplitude relativa, frequência, fase]. */
const WOBBLE: [number, number, number][] = [
  [0.022, 2, 0.6],
  [0.012, 5, 1.9],
  [0.006, 9, 0.3],
]
/** O fim do traço "entra" um pouco, como o pincel perdendo carga. */
const INWARD_DRIFT = 0.035
const WIDTH_START = 78
const WIDTH_END = 5
/** Curva do afinamento (maior = afina mais cedo). */
const TAPER = 1.35
/** Pulsação de pressão ao longo do traço. */
const PRESSURE = 0.12
const SAMPLES = 260
/** Folga da máscara além das pontas (rad), pra não cortar as tampas arredondadas. */
const MASK_OVERRUN = 0.16

const rad = (deg: number) => (deg * Math.PI) / 180
const theta0 = rad(START_DEG)
const sweep = rad(SWEEP_DEG)

const radiusAt = (theta: number, t: number) => {
  let k = 1
  for (const [amp, freq, phase] of WOBBLE) k += amp * Math.sin(freq * theta + phase)
  return RADIUS * k * (1 - INWARD_DRIFT * t * t)
}

const widthAt = (t: number) =>
  (WIDTH_END + (WIDTH_START - WIDTH_END) * Math.pow(1 - t, TAPER)) *
  (1 + PRESSURE * Math.sin(t * 11 + 0.5) * (1 - t))

const point = (theta: number, r: number) =>
  [CX + r * Math.cos(theta), CY + r * Math.sin(theta)] as const

const f = (n: number) => n.toFixed(1)

function buildBrush() {
  const outer: string[] = []
  const inner: string[] = []
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES
    const theta = theta0 + sweep * t
    const r = radiusAt(theta, t)
    const w = widthAt(t)
    const [ox, oy] = point(theta, r + w / 2)
    const [ix, iy] = point(theta, r - w / 2)
    outer.push(`${f(ox)} ${f(oy)}`)
    inner.push(`${f(ix)} ${f(iy)}`)
  }
  const wEnd = widthAt(1) / 2
  const wStart = widthAt(0) / 2
  // tampas arredondadas: no fim (para frente) e no início (para trás)
  return (
    `M ${outer[0]} L ${outer.slice(1).join(' L ')} ` +
    `A ${f(wEnd)} ${f(wEnd)} 0 0 1 ${inner[SAMPLES]} ` +
    `L ${inner.slice(0, -1).reverse().join(' L ')} ` +
    `A ${f(wStart)} ${f(wStart)} 0 0 1 ${outer[0]} Z`
  )
}

function buildSpine() {
  const pts: string[] = []
  const from = theta0 - MASK_OVERRUN
  const to = theta0 + sweep + MASK_OVERRUN
  for (let i = 0; i <= SAMPLES; i++) {
    const theta = from + ((to - from) * i) / SAMPLES
    const t = Math.min(1, Math.max(0, (theta - theta0) / sweep))
    const [x, y] = point(theta, radiusAt(theta, t))
    pts.push(`${f(x)} ${f(y)}`)
  }
  return `M ${pts.join(' L ')}`
}

const BRUSH = buildBrush()
const SPINE = buildSpine()
/** Ponto onde o pincel sai do papel (um pouco além do fim do traço). */
const TIP = point(theta0 + sweep + 0.07, radiusAt(theta0 + sweep, 1) * 0.985)

export function Enso({ className = '' }: { className?: string }) {
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
        {/* textura de pincel: bordas levemente irregulares */}
        <filter id="enso-brush" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="9" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <mask id="enso-reveal" maskUnits="userSpaceOnUse" x="0" y="0" width={SIZE} height={SIZE}>
          <path
            ref={spineRef}
            d={SPINE}
            className={styles.spine}
            strokeWidth={WIDTH_START + 40}
          />
        </mask>
      </defs>

      <g mask="url(#enso-reveal)">
        <path d={BRUSH} className={styles.brush} filter="url(#enso-brush)" />
      </g>
      <circle cx={f(TIP[0])} cy={f(TIP[1])} r="7" className={styles.tip} />
    </svg>
  )
}
