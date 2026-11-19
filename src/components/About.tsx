import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { about, sections } from '../data/content'
import { REDUCED_MOTION, useMediaQuery, usePointerEffects } from '../hooks/useMediaQuery'
import { useCardTilt } from '../hooks/useCardTilt'
import { useProximityWeight } from '../hooks/useProximityWeight'
import { useViewProgress } from '../hooks/useViewProgress'
import { KanjiStrokes, type KanjiStrokesHandle } from './KanjiStrokes'
import { CardLens, type CardLensHandle } from './CardLens'
import { SectionMeta } from './SectionMeta'
import styles from './About.module.css'

/* ---------------------------------------------------------------
 * Espiral de Arquimedes: r = maxR * (1 - t), θ = t * turns * 2π
 * Gerada de fora pra dentro — o path começa no raio máximo e
 * termina no centro, onde fica o kanji 和.
 * ------------------------------------------------------------- */
const SPIRAL_CX = 50
const SPIRAL_CY = 50
const SPIRAL_MAX_R = 54   // ultrapassa ligeiramente os 50 de raio → transborda pro texto
const SPIRAL_TURNS = 5
const SPIRAL_POINTS = 480  // resolução do polígono

function buildSpiralPath(): string {
  const pts: string[] = []
  for (let i = 0; i <= SPIRAL_POINTS; i++) {
    const t = i / SPIRAL_POINTS
    const theta = t * SPIRAL_TURNS * 2 * Math.PI
    const r = SPIRAL_MAX_R * (1 - t)
    // começa no topo (offset -π/2) e gira no sentido horário
    const x = SPIRAL_CX + r * Math.cos(theta - Math.PI / 2)
    const y = SPIRAL_CY + r * Math.sin(theta - Math.PI / 2)
    pts.push(i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}` : `L ${x.toFixed(2)} ${y.toFixed(2)}`)
  }
  return pts.join(' ')
}

const SPIRAL_PATH = buildSpiralPath()

/* ---------------------------------------------------------------
 * Quebra o texto em spans individuais com data-wave e --i.
 * Usado para o efeito de peso variável (desktop: cursor proximity;
 * mobile: onda de scroll).
 * ------------------------------------------------------------- */
function letterSpans(text: string): ReactNode {
  return [...text].map((ch, i) => (
    <span key={i} data-wave="" style={{ '--i': i } as CSSProperties}>
      {ch === ' ' ? '\u00A0' : ch}
    </span>
  ))
}

/* Vidro da foto: força da refração do bisel parada → ondulando no máximo (mouse rápido). */
const LENS_SCALE = 75
const LENS_SCALE_RIPPLE = 95

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

export function About() {
  const sectionRef = useRef<HTMLElement>(null)
  const photoColRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const whyAreaRef = useRef<HTMLDivElement>(null)
  const whyStickyRef = useRef<HTMLDivElement>(null)
  const whySvgRef = useRef<SVGSVGElement>(null)
  const [photoFailed, setPhotoFailed] = useState(false)
  const spiralPathRef = useRef<SVGPathElement>(null)
  const spiralGroupRef = useRef<SVGGElement>(null)
  const kanjiRef = useRef<KanjiStrokesHandle>(null)

  const reduced = useMediaQuery(REDUCED_MOTION)
  const hasPointer = usePointerEffects()
  /* foto como carta: tilt 3D no hover + vidro sempre visível (só com mouse);
     o bisel ondula com a velocidade do mouse (setScale direto no filtro, sem re-render) */
  const lensRef = useRef<CardLensHandle>(null)
  const cardTilt = useCardTilt(photoColRef, {
    onRipple: (a) => lensRef.current?.setScale(LENS_SCALE + (LENS_SCALE_RIPPLE - LENS_SCALE) * a),
  })

  /* --- 1. Curva de entrada: --enter (0→1) enquanto o topo da seção
            vai do fundo da viewport até 30% do topo. -------------------- */
  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    if (reduced) {
      section.style.setProperty('--enter', '1')
      return () => section.style.removeProperty('--enter')
    }
    let frame = 0
    const update = () => {
      frame = 0
      const top = section.getBoundingClientRect().top
      const vh = window.innerHeight
      // 0 quando topo na borda inferior, 1 quando topo a 30% da tela
      const p = clamp01((vh - top) / (0.7 * vh))
      section.style.setProperty('--enter', p.toFixed(4))
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      section.style.removeProperty('--enter')
    }
  }, [reduced])

  /* --- 2. Progresso geral da seção para o parallax da foto ----------- */
  useViewProgress(sectionRef, { varName: '--section-p', start: 1.0, end: 0.0 })

  /* --- 3. Reveal: feito pelo sistema global (data-reveal nos elementos) ---------- */

  /* --- 4. Título: peso variável por proximidade (desktop) ------------ */
  useProximityWeight(titleRef, {
    selector: '[data-wave]',
    min: 200,
    max: 900,
    active: hasPointer,
  })

  /* --- 5. Título: onda de peso por scroll (mobile) ------------------- */
  useViewProgress(titleRef, { varName: '--title-p', start: 1.0, end: 0.4 })
  useEffect(() => {
    if (hasPointer || reduced) return
    const title = titleRef.current
    if (!title) return
    const spans = [...title.querySelectorAll<HTMLElement>('[data-wave]')]
    const n = spans.length
    if (n === 0) return
    let frame = 0
    const update = () => {
      frame = 0
      const p = parseFloat(title.style.getPropertyValue('--title-p') || '0')
      spans.forEach((el, i) => {
        // onda triangular: pico quando p * n ≈ i
        const dist = Math.abs(p * n - i)
        const f = Math.max(0, 1 - dist / 4)
        const w = Math.round(200 + 500 * f)
        el.style.fontVariationSettings = `'wght' ${w}`
      })
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      spans.forEach((el) => { el.style.fontVariationSettings = '' })
    }
  }, [hasPointer, reduced])

  /* --- 6. Fatos: bordas via data-reveal no sistema global ------------ */

  /* --- 7. Espiral: comprimento em px (recalcula no resize) -----------
     Com vector-effect: non-scaling-stroke, strokeDasharray e --spiral-len
     devem estar em pixels de tela, não em unidades do viewBox.           */
  useEffect(() => {
    const path = spiralPathRef.current
    const svg = whySvgRef.current
    if (!path || !svg) return
    const measure = () => {
      const userLen = path.getTotalLength()
      const r = svg.getBoundingClientRect()
      const vb = svg.viewBox.baseVal
      const scale = vb && vb.width > 0 ? r.width / vb.width : 1
      const lenPx = (userLen * scale).toFixed(2)
      path.style.setProperty('--spiral-len', lenPx)
      path.style.strokeDasharray = `${lenPx}px`
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  /* --- 8. Por que Wa?: --why, kanji e pulso em um único rAF ----------
     Desktop: --why é mapeado exatamente à fase presa do sticky.
       why=0 quando whyArea.top = stickyTop (conteúdo acabou de travar)
       why=1 quando whyArea.bottom < stickyTop + stickyHeight (prestes a soltar)
     Mobile: passagem normal (topo a 85% → fundo a 45% da viewport).
     Tudo (kanji, texto, pulso) é completo em --why ≈ 0.90, deixando
     ≈10% de folga onde o bloco fica pronto antes de soltar.             */
  useEffect(() => {
    const whyArea = whyAreaRef.current
    const whySticky = whyStickyRef.current
    const kanji = kanjiRef.current
    if (!whyArea || !whySticky || !kanji) return

    if (reduced) {
      whyArea.style.setProperty('--why', '1')
      kanji.drawTo(1)
      return () => whyArea.style.removeProperty('--why')
    }

    kanji.init('full')
    let frame = 0
    let pulsed = false
    let last = ''

    const update = () => {
      frame = 0
      const rArea = whyArea.getBoundingClientRect()
      const vh = window.innerHeight
      let why: number

      if (window.innerWidth <= 860) {
        // Mobile: sem sticky, usa passagem normal
        const travel = (0.85 - 0.45) * vh + rArea.height
        why = travel > 0 ? clamp01((0.85 * vh - rArea.top) / travel) : 1
      } else {
        // Desktop: fase presa do sticky
        // top do sticky vem de getComputedStyle (browsers resolvem calc() para px)
        const stickyTop = parseFloat(getComputedStyle(whySticky).top) || 104
        const H = whySticky.offsetHeight
        const C = rArea.height
        const travel = C - H  // scroll percorrido enquanto o bloco está preso
        why = travel > 0 ? clamp01((stickyTop - rArea.top) / travel) : 1
      }

      const val = why.toFixed(4)
      if (val !== last) {
        last = val
        whyArea.style.setProperty('--why', val)
      }

      // Kanji: 0.50 → 0.85 (completo antes de --why = 0.9)
      kanji.drawTo(clamp01((why - 0.50) / 0.35))

      // Pulso: threshold 0.92 → 8% de folga antes de soltar
      if (!pulsed && why >= 0.92) {
        pulsed = true
        whyArea.setAttribute('data-pulsed', '')
      } else if (pulsed && why < 0.88) {
        pulsed = false
        whyArea.removeAttribute('data-pulsed')
      }
    }

    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      whyArea.style.removeProperty('--why')
    }
  }, [reduced])

  return (
    <section ref={sectionRef} id="sobre" className={styles.about} data-tone="dark">
      <div className={`container-wide ${styles.inner}`}>
        <SectionMeta
          index={sections.sobre}
          label={about.label}
          aside={about.aside}
          tone="dark"
        />

        <div className={styles.body}>
          {/* ---- Coluna da foto ---- */}
          <div ref={photoColRef} className={styles.photoCol}>
            {/* sombra fora do clip-path da pílula: inclina junto e se desloca com o tilt */}
            {cardTilt && <div className={styles.photoShadow} aria-hidden="true" />}
            <div className={styles.photoWrap}>
              {photoFailed ? (
                /* Fallback: 和 kanji sobre fundo verde (só se a foto não carregar) */
                <div className={styles.photoFallback} aria-hidden="true">
                  和
                </div>
              ) : (
                <img
                  src={about.photo.src}
                  alt={about.photo.alt}
                  width={about.photo.width}
                  height={about.photo.height}
                  loading="lazy"
                  decoding="async"
                  className={styles.photo}
                  onError={() => setPhotoFailed(true)}
                />
              )}
              {/* vidro (sempre visível): lente que refrata o bisel com blur graduado (o rosto fica
                  nítido no miolo), borda de luz e reflexo líquido que segue o cursor */}
              {cardTilt && (
                <>
                  {!photoFailed && (
                    <CardLens
                      ref={lensRef}
                      src={about.photo.src}
                      className={styles.photoLens}
                      imgClassName={styles.photo}
                      bevel={48}
                      scale={LENS_SCALE}
                      chromatic
                    />
                  )}
                  <div className={styles.photoRim} aria-hidden="true" />
                  <div className={styles.photoGlare} aria-hidden="true" />
                </>
              )}
            </div>
          </div>

          {/* ---- Coluna de texto ---- */}
          <div className={styles.textCol}>
            {/* seção 3 espelhada: título da direita, texto da esquerda */}
            <h2 ref={titleRef} className={styles.title} data-reveal="right" data-reveal-title="">
              {/* Span leve: letras individuais com data-wave para o efeito de peso */}
              <span className={styles.light} aria-hidden="true">
                {letterSpans(about.title[0].text)}
              </span>
              {/* Fallback acessível: escondido visualmente mas lido por SR */}
              <span className={styles.srOnly}>{about.title[0].text}</span>
              <span className={styles.heavy}>{about.title[1].text}</span>
            </h2>

            {about.paragraphs.map((p, i) => (
              <p
                key={i}
                className={styles.paragraph}
                data-reveal="left"
                style={{ '--reveal-delay': `${i * 90}ms` } as CSSProperties}
              >
                {p}
              </p>
            ))}

            <dl className={styles.facts}>
              {about.facts.map((fact, i) => (
                <div
                  key={fact.label}
                  className={styles.fact}
                  data-reveal="up"
                  style={{ '--i-fact': i, '--reveal-delay': `${i * 90}ms` } as CSSProperties}
                >
                  <dt className={styles.factLabel}>{fact.label}</dt>
                  <dd className={styles.factValue}>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* ---- Bloco "Por que Wa?" — área tall com sticky ---- */}
        <div ref={whyAreaRef} className={styles.whyArea}>
          <div ref={whyStickyRef} className={styles.whySticky}>

            {/* SVG combinado: espiral (atrás) + traços do kanji (na frente) */}
            <div className={styles.kanjiContainer}>
              <svg
                ref={whySvgRef}
                className={styles.whySvg}
                viewBox="0 0 100 100"
                overflow="visible"
                aria-hidden="true"
                focusable="false"
              >
                {/* Espiral de Arquimedes — anima de fora pra dentro com --why */}
                <g ref={spiralGroupRef} className={styles.spiralGroup}>
                  <path
                    ref={spiralPathRef}
                    d={SPIRAL_PATH}
                    className={styles.spiralPath}
                    fill="none"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </g>
              </svg>
              <svg
                viewBox="0 0 100 100"
                className={styles.kanjiSvg}
                aria-hidden="true"
                focusable="false"
              >
                <KanjiStrokes ref={kanjiRef} className={styles.kanjiStrokes} />
              </svg>
              <span className={styles.whyReading}>{about.why.kanjiReading}</span>
            </div>

            {/* Texto: título + parágrafo */}
            <div className={styles.whyRight}>
              <h3 className={styles.whyTitle}>{about.why.title}</h3>
              <p className={styles.whyText}>{about.why.text}</p>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}
