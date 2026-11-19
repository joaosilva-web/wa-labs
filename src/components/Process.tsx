import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
} from 'react'
import { process, processSection as copy, sections } from '../data/content'
import { scrollToY } from '../lenis'
import { REDUCED_MOTION, useMediaQuery } from '../hooks/useMediaQuery'
import { useScrollProgress } from '../hooks/useScrollProgress'
import { useViewProgress } from '../hooks/useViewProgress'
import { useCardTilt } from '../hooks/useCardTilt'
import { LiquidGlass } from './LiquidGlass'
import { GlassCard } from './GlassCard'
import { SectionMeta } from './SectionMeta'
import styles from './Process.module.css'

const pad = (n: number) => String(n).padStart(2, '0')
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/** O trilho chega ao fim em 94% do trajeto: o último trecho segura a última etapa inteira na tela. */
const HOLD = 0.94

/** Medidas do trilho (no mount e no resize; nunca por frame). */
type Layout = {
  /** Quanto o trilho anda: largura dele menos a da tela (px). */
  travel: number
  /** Centro de cada etapa em relação à tela com o trilho em p = 0 (px). */
  centers: number[]
  /** Valor de p em que cada etapa fica mais perto do centro (posição dos marcadores). */
  stops: number[]
  half: number
}

/* -----------------------------------------------------------------------
 * StepItem — uma etapa do processo, com vidro líquido na etapa ativa.
 *
 * Desktop (pinned): apenas a etapa ativa recebe LiquidGlass + GlassCard.
 * Mobile (!pinned): todas as etapas recebem LiquidGlass fosco (sem tilt).
 *
 * O tilt 3D (useCardTilt) ativa só na etapa ativa do desktop (fine pointer).
 * --------------------------------------------------------------------- */
interface StepItemProps {
  item: (typeof process)[0]
  index: number
  active: number
  pinned: boolean
  glassRefraction: boolean
}

function StepItem({ item, index, active, pinned, glassRefraction }: StepItemProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const isActive = index === active
  const showGlass = isActive || !pinned

  /* tilt + glare: só na etapa ativa do desktop com fine pointer */
  const fine = useCardTilt(cardRef, { enabled: pinned && isActive })

  return (
    <li
      className={styles.step}
      data-active={!pinned || isActive || undefined}
    >
      <div ref={cardRef} className={styles.stepCard}>
        {/* número gigante: fica na camada inferior (z-index auto),
            o LiquidGlass (z-index: 1) fica na frente — vidro vê o bg da página */}
        <span className={styles.number} aria-hidden="true">
          {item.step}
        </span>

        {/* vidro: fosco no mobile, refração na etapa ativa do desktop parado */}
        {showGlass && (
          <LiquidGlass
            className={styles.stepGlass}
            refraction={pinned && isActive && glassRefraction}
            blur={2}
            saturate={1.1}
            brightness={1.0}
            fallbackBlur={8}
            fallbackSaturate={1.6}
            bevel={16}
            scale={24}
          />
        )}

        {/* conteúdo acima do vidro */}
        <div className={styles.stepContent}>
          <div className={styles.kanjiRow}>
            <span className={styles.pill} aria-hidden="true">
              <span className={styles.kanji}>{item.kanji}</span>
            </span>
            <span className={styles.reading}>
              <span lang="ja-Latn">{item.reading}</span> · {item.meaning}
            </span>
          </div>

          <div className={styles.body}>
            <div>
              <h3 className={styles.stepTitle}>
                <span className={styles.srOnly}>{item.step}. </span>
                {item.title}
              </h3>
              <p className={styles.description}>{item.description}</p>
            </div>
            <ul className={styles.deliverables}>
              {item.deliverables.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* rim + reflexo líquido: só com fine pointer na etapa ativa */}
        {showGlass && fine && (
          <GlassCard className={styles.stepGlassOverlay} />
        )}
      </div>
    </li>
  )
}

/**
 * (02) Processo — fundo claro. No desktop a seção prende na tela e o scroll vertical
 * move as etapas na horizontal (linha do tempo). Progresso em --p (0 → 1) no sticky;
 * o React só re-renderiza quando a etapa ativa troca.
 * Mobile e reduced motion: lista vertical com uma linha que se desenha com o scroll.
 */
export function Process() {
  const wide = useMediaQuery('(min-width: 861px)')
  const reduced = useMediaQuery(REDUCED_MOTION)
  const pinned = wide && !reduced

  const wrapperRef = useRef<HTMLElement>(null)
  const stickyRef = useRef<HTMLDivElement>(null)
  const railRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const layout = useRef<Layout>({ travel: 0, centers: [], stops: [], half: 0 })
  const progress = useRef(0)
  const activeRef = useRef(0)
  const [active, setActive] = useState(0)

  /* refração do vidro: desliga enquanto o scroll está em movimento (desempenho),
     religar 150ms depois de parar — o backdrop-filter volta suavemente via transition */
  const [glassRefraction, setGlassRefraction] = useState(true)
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>(0)
  const isScrollingRef = useRef(false)

  const total = process.length

  const pickActive = useCallback((p: number) => {
    const { travel, centers, half } = layout.current
    if (!centers.length) return
    // etapa cujo centro está mais perto do centro da tela
    let best = 0
    let bestDist = Infinity
    centers.forEach((c, i) => {
      const d = Math.abs(c - p * travel - half)
      if (d < bestDist) {
        bestDist = d
        best = i
      }
    })
    if (best !== activeRef.current) {
      activeRef.current = best
      setActive(best)
    }
  }, [])

  // medição: --travel e a posição dos marcadores
  const measure = useCallback(() => {
    const sticky = stickyRef.current
    const rail = railRef.current
    const list = listRef.current
    if (!sticky || !rail || !list) return
    const width = sticky.clientWidth
    const travel = Math.max(0, rail.scrollWidth - width)
    const railRect = rail.getBoundingClientRect()
    // left do trilho em p = 0 (desfaz o translate atual)
    const base = railRect.left - sticky.getBoundingClientRect().left + progress.current * travel
    const half = width / 2
    const centers = [...list.children].map((li) => {
      const r = li.getBoundingClientRect()
      return base + (r.left - railRect.left) + r.width / 2
    })
    const stops = centers.map((c) => (travel > 0 ? clamp01((c - half) / travel) : 0))
    layout.current = { travel, centers, stops, half }

    sticky.style.setProperty('--travel', `${travel}px`)
    stops.forEach((s, i) => sticky.style.setProperty(`--stop-${i}`, s.toFixed(4)))
    pickActive(progress.current)
  }, [pickActive])

  useEffect(() => {
    if (!pinned) return
    measure()
    const ro = new ResizeObserver(measure)
    if (stickyRef.current) ro.observe(stickyRef.current)
    if (railRef.current) ro.observe(railRef.current)
    document.fonts?.ready.then(measure)
    return () => ro.disconnect()
  }, [pinned, measure])

  useScrollProgress(
    wrapperRef,
    (raw) => {
      const sticky = stickyRef.current
      if (!sticky) return
      const p = clamp01(raw / HOLD)
      progress.current = p
      sticky.style.setProperty('--p', p.toFixed(4))
      pickActive(p)

      /* desempenho: fosco durante o scroll, refração depois de parar */
      if (!isScrollingRef.current) {
        isScrollingRef.current = true
        setGlassRefraction(false)
      }
      clearTimeout(scrollTimer.current)
      scrollTimer.current = window.setTimeout(() => {
        isScrollingRef.current = false
        setGlassRefraction(true)
      }, 150)
    },
    { pinnedRef: stickyRef, enabled: pinned },
  )

  // sem pin: limpa o que foi escrito fora do React e volta pra primeira etapa
  useEffect(() => {
    if (pinned) return
    const sticky = stickyRef.current
    sticky?.style.removeProperty('--p')
    sticky?.style.removeProperty('--travel')
    progress.current = 0
    activeRef.current = 0
    setActive(0)
  }, [pinned])

  // cleanup do timer ao desmontar
  useEffect(() => () => clearTimeout(scrollTimer.current), [])

  // mobile / reduced motion: a linha vertical se desenha com a lista (fica inteira no reduced)
  useViewProgress(listRef, { varName: '--line', start: 0.8, end: 0.6 })

  // teclado: um focável fora da tela leva a página até a etapa dele
  const onFocus = (e: FocusEvent<HTMLOListElement>) => {
    if (!pinned) return
    const wrapper = wrapperRef.current
    const sticky = stickyRef.current
    const list = listRef.current
    if (!wrapper || !sticky || !list) return
    const index = [...list.children].findIndex((li) => li.contains(e.target))
    if (index < 0) return
    sticky.scrollLeft = 0 // o navegador não pode rolar o sticky por conta própria
    const pinTravel = wrapper.offsetHeight - sticky.offsetHeight
    const top = wrapper.getBoundingClientRect().top + window.scrollY
    scrollToY(top + layout.current.stops[index] * HOLD * pinTravel)
  }

  const counter = (
    <span className={styles.counter} aria-live="polite">
      <span aria-hidden="true">
        {pad(active + 1)} / {pad(total)}
      </span>
      <span className={styles.srOnly}>{copy.counterSr(active + 1, total)}</span>
    </span>
  )

  return (
    <section
      ref={wrapperRef}
      id="processo"
      className={styles.process}
      data-pinned={pinned || undefined}
      style={{ '--panels': total + 1 } as CSSProperties}
    >
      <div ref={stickyRef} className={styles.sticky}>
        <div className={`container-wide ${styles.meta}`}>
          <SectionMeta
            index={sections.processo}
            label={copy.label}
            aside={pinned ? counter : `${pad(total)} ${copy.countLabel}`}
            tone="light"
          />
        </div>

        <div className={styles.stage}>
          <div ref={railRef} className={styles.rail}>
            <div className={styles.opening}>
              <h2 className={styles.title}>
                <span className={styles.light}>{copy.title[0]}</span>{' '}
                <span className={styles.heavy}>{copy.title[1]}</span>
              </h2>
              {pinned && (
                <p className={styles.hint} aria-hidden="true">
                  <span className={styles.hintArrow}>→</span> {copy.scrollHint}
                </p>
              )}
            </div>

            <ol ref={listRef} className={styles.steps} onFocus={onFocus}>
              {process.map((item, i) => (
                <StepItem
                  key={item.step}
                  item={item}
                  index={i}
                  active={active}
                  pinned={pinned}
                  glassRefraction={glassRefraction}
                />
              ))}
            </ol>
          </div>
        </div>

        {pinned && (
          <div className={`container-wide ${styles.bar}`} aria-hidden="true">
            <span className={styles.barFill} />
            {process.map((item, i) => (
              <span
                key={item.step}
                className={styles.marker}
                style={{ '--at': `var(--stop-${i}, ${i / (total - 1)})` } as CSSProperties}
                data-done={i <= active || undefined}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
