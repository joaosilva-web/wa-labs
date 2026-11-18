/*
 * Gerador do ensō (円相) com textura de pincel de verdade.
 *
 * Em vez de um único path preenchido (que parece marca-texto), o traço é feito de
 * dezenas de "fios" (as cerdas do pincel) seguindo a mesma curva:
 *  - no começo os fios são largos e se sobrepõem → tinta cheia, sólida
 *  - ao longo do traço eles afinam e se separam → aparecem as falhas (kasure, 掠れ)
 *  - os fios das bordas e os "secos" acabam antes → o fim se desfia sozinho
 *
 * Tudo é determinístico (PRNG com semente fixa): o desenho é sempre o mesmo.
 * viewBox 1000 × 1000.
 */

// ---------- parâmetros ----------
export const SIZE = 1000
const CX = 500
const CY = 500
/** Raio médio do círculo. */
const RADIUS = 380
/** Início do traço em graus (0 = direita, sentido horário na tela). 100 ≈ embaixo, levemente à esquerda. */
const START_DEG = 100
/** Quanto do círculo o pincel percorre (< 360 = ensō aberto). */
const SWEEP_DEG = 318
/** Irregularidade do raio: [amplitude relativa, frequência, fase]. */
const WOBBLE: [number, number, number][] = [
  [0.02, 2, 0.6],
  [0.01, 5, 1.9],
]
/** O fim do traço "entra" um pouco, como o pincel perdendo carga. */
const INWARD_DRIFT = 0.04
/** Largura máxima do pincel. */
export const BRUSH_WIDTH = 92
/** Quantidade de cerdas. Menos = mais leve, mais falhado. */
const STRANDS = 90
/** Resolução ao longo do traço. */
const SAMPLES = 480
/** Pontos por segmento (cada segmento tem sua própria espessura). */
const SEGMENT = 24
/** Semente do PRNG: troque pra gerar outra pincelada. */
const SEED = 11

// ---------- utilitários ----------
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rad = (deg: number) => (deg * Math.PI) / 180
const theta0 = rad(START_DEG)
const sweep = rad(SWEEP_DEG)
const f = (n: number) => n.toFixed(1)

const radiusAt = (theta: number, t: number) => {
  let k = 1
  for (const [amp, freq, phase] of WOBBLE) k += amp * Math.sin(freq * theta + phase)
  return RADIUS * k * (1 - INWARD_DRIFT * t * t)
}

/** Pressão do pincel: pousa rápido, segura e afina até o fim. */
const widthAt = (t: number) => {
  const attack = Math.min(1, t / 0.06)
  const landing = 1 - Math.pow(1 - attack, 3)
  const taper = Math.pow(1 - t, 1.1)
  return BRUSH_WIDTH * (0.75 + 0.25 * landing) * (0.22 + 0.78 * taper)
}

export type BrushSegment = { d: string; width: number; opacity: number }

// ---------- cerdas ----------
function buildStrands(): BrushSegment[] {
  const rnd = mulberry32(SEED)
  const out: BrushSegment[] = []

  for (let k = 0; k < STRANDS; k++) {
    const u = (k + rnd() * 0.8) / STRANDS - 0.5 // posição lateral: -0.5 (fora) … 0.5 (dentro)
    const edge = Math.abs(u) * 2 // 0 no centro, 1 na borda
    const ink = rnd() // quanta tinta essa cerda carrega

    // cerdas da borda e mais secas acabam antes; as do centro vão até o fim
    const tEnd = Math.min(1, (1 - edge * 0.55) * (0.62 + 0.38 * Math.sqrt(ink)) + 0.08)
    // entrada arredondada: as cerdas da borda tocam o papel um pouco depois
    const tStart = 0.03 * (1 - Math.sqrt(Math.max(0, 1 - edge * edge))) + 0.004 * rnd()

    // falhas (kasure): começam na segunda metade e ficam mais frequentes conforme a tinta acaba
    const gaps: [number, number][] = []
    let s = 0.42 + rnd() * 0.12
    while (s < tEnd) {
      const chance = (s - 0.38) * 1.6 * (0.5 + edge) * (1.2 - ink)
      if (rnd() < chance) {
        const len = 0.01 + rnd() * 0.07 * s
        gaps.push([s, s + len])
        s += len
      }
      s += 0.03 + rnd() * 0.06
    }

    const jitter = rnd() * 1000
    const amp = 0.4 + rnd() * 1.0
    const opacity = (0.7 + 0.3 * ink) * (1 - edge * 0.25)
    const thickness = 0.8 + rnd() * 0.5

    let pts: [number, number, number][] = []
    const flush = () => {
      if (pts.length > 1) {
        const t = pts[Math.floor(pts.length / 2)][2]
        // começo: cerdas largas que se sobrepõem (sólido); fim: finas e separadas (seco)
        const overlap = 2.6 - 1.8 * Math.pow(t, 0.8)
        out.push({
          d: 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L'),
          width: +((widthAt(t) / STRANDS) * overlap * thickness).toFixed(2),
          opacity: +opacity.toFixed(2),
        })
      }
      pts = pts.slice(-1)
    }

    for (let i = 0; i <= SAMPLES; i++) {
      const t = i / SAMPLES
      if (t < tStart || t > tEnd || gaps.some(([a, b]) => t > a && t < b)) {
        flush()
        pts = []
        continue
      }
      const theta = theta0 + sweep * t
      const r =
        radiusAt(theta, t) +
        u * widthAt(t) +
        amp * Math.sin(t * 37 + jitter) * (0.3 + 1.6 * t * t) + // tremor da cerda
        u * BRUSH_WIDTH * 0.12 * t * t // no fim as cerdas se abrem
      pts.push([CX + r * Math.cos(theta), CY + r * Math.sin(theta), t])
      if (pts.length >= SEGMENT) flush()
    }
    flush()
  }
  return out
}

/** Linha central usada na máscara que revela o traço (stroke-dashoffset). */
function buildSpine(overrun = 0.06) {
  const pts: string[] = []
  const from = theta0 - overrun
  const to = theta0 + sweep + overrun
  for (let i = 0; i <= 260; i++) {
    const theta = from + ((to - from) * i) / 260
    const t = Math.min(1, Math.max(0, (theta - theta0) / sweep))
    const r = radiusAt(theta, t)
    pts.push(`${f(CX + r * Math.cos(theta))} ${f(CY + r * Math.sin(theta))}`)
  }
  return `M ${pts.join(' L ')}`
}

export const ENSO_STRANDS = buildStrands()
export const ENSO_SPINE = buildSpine()
