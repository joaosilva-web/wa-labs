import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'
import { about, sections } from '../data/content'
import { REDUCED_MOTION, useMediaQuery, usePointerEffects } from '../hooks/useMediaQuery'
import { useProximityWeight } from '../hooks/useProximityWeight'
import { useViewProgress } from '../hooks/useViewProgress'
import { KanjiStrokes, type KanjiStrokesHandle } from './KanjiStrokes'
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

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

export function About() {
  const sectionRef = useRef<HTMLElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const photoColRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const factsRef = useRef<HTMLDListElement>(null)
  const whyAreaRef = useRef<HTMLDivElement>(null)
  const spiralPathRef = useRef<SVGPathElement>(null)
  const spiralGroupRef = useRef<SVGGElement>(null)
  const kanjiRef = useRef<KanjiStrokesHandle>(null)

  const reduced = useMediaQuery(REDUCED_MOTION)
  const hasPointer = usePointerEffects()

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

  /* --- 2. Progresso geral da seção para parallax e duotone ----------- */
  useViewProgress(sectionRef, { varName: '--section-p', start: 1.0, end: 0.0 })

  /* --- 3. Reveal do body: IntersectionObserver (uma vez) ------------- */
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    if (reduced) { el.setAttribute('data-revealed', ''); return }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        el.setAttribute('data-revealed', '')
        io.disconnect()
      },
      { rootMargin: '0px 0px -10% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

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

  /* --- 6. Fatos: scaleX das bordas + fade dos textos (uma vez) ------- */
  useEffect(() => {
    const el = factsRef.current
    if (!el) return
    if (reduced) { el.setAttribute('data-revealed', ''); return }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        el.setAttribute('data-revealed', '')
        io.disconnect()
      },
      { rootMargin: '0px 0px -20% 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reduced])

  /* --- 7. Bloco "Por que Wa?": --why (0→1) no whyArea --------------- */
  useViewProgress(whyAreaRef, { varName: '--why', start: 1.0, end: 0.0 })

  /* --- 8. Espiral: comprimento para stroke-dasharray/offset via CSS -- */
  useEffect(() => {
    const path = spiralPathRef.current
    if (!path) return
    const len = path.getTotalLength()
    path.style.setProperty('--spiral-len', String(len))
    path.style.strokeDasharray = `${len}`
  }, [])

  /* --- 9. Kanji "Por que Wa?": desenha conforme --why vai de 0.55→0.95 */
  useEffect(() => {
    const kanji = kanjiRef.current
    const whyArea = whyAreaRef.current
    if (!kanji || !whyArea) return
    if (reduced) { kanji.drawTo(1); return }
    kanji.init('full')
    let frame = 0
    const update = () => {
      frame = 0
      // lê --why diretamente do elemento para evitar condição de corrida com useViewProgress
      const r = whyArea.getBoundingClientRect()
      const vh = window.innerHeight
      const travel = vh + r.height  // start=1.0, end=0.0
      const why = travel > 0 ? clamp01((vh - r.top) / travel) : 1
      kanji.drawTo(clamp01((why - 0.55) / 0.4))
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
    }
  }, [reduced])

  /* --- 10. Pulso ao completar (--why ≥ 0.98) ------------------------- */
  useEffect(() => {
    const whyArea = whyAreaRef.current
    if (!whyArea || reduced) return
    let pulsed = false
    let frame = 0
    const update = () => {
      frame = 0
      const r = whyArea.getBoundingClientRect()
      const vh = window.innerHeight
      const travel = vh + r.height
      const why = travel > 0 ? clamp01((vh - r.top) / travel) : 1
      if (!pulsed && why >= 0.98) {
        pulsed = true
        whyArea.setAttribute('data-pulsed', '')
      } else if (pulsed && why < 0.93) {
        pulsed = false
        whyArea.removeAttribute('data-pulsed')
      }
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', schedule, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
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

        <div ref={bodyRef} className={styles.body}>
          {/* ---- Coluna da foto ---- */}
          <div ref={photoColRef} className={styles.photoCol}>
            <div className={styles.photoWrap}>
              <img
                src={about.photo.src}
                alt={about.photo.alt}
                width={about.photo.width}
                height={about.photo.height}
                loading="lazy"
                decoding="async"
                className={styles.photo}
                onError={(e) => {
                  const img = e.currentTarget
                  img.style.display = 'none'
                  const fallback = img.nextElementSibling as HTMLElement | null
                  if (fallback) fallback.removeAttribute('hidden')
                }}
              />
              {/* Fallback: 和 kanji sobre fundo verde */}
              <div className={styles.photoFallback} hidden aria-hidden="true">
                和
              </div>
            </div>
          </div>

          {/* ---- Coluna de texto ---- */}
          <div className={styles.textCol}>
            <h2 ref={titleRef} className={styles.title} style={{ '--i': 1 } as CSSProperties}>
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
                style={{ '--i': i + 2 } as CSSProperties}
              >
                {p}
              </p>
            ))}

            <dl
              ref={factsRef}
              className={styles.facts}
            >
              {about.facts.map((fact, i) => (
                <div key={fact.label} className={styles.fact} style={{ '--i-fact': i } as CSSProperties}>
                  <dt className={styles.factLabel}>{fact.label}</dt>
                  <dd className={styles.factValue}>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* ---- Bloco "Por que Wa?" — área tall com sticky ---- */}
        <div ref={whyAreaRef} className={styles.whyArea}>
          <div className={styles.whySticky}>

            {/* SVG combinado: espiral (atrás) + traços do kanji (na frente) */}
            <div className={styles.kanjiContainer}>
              <svg
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
